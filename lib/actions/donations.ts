'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { formatCurrency, generateOrderNumber } from '@/lib/utils'
import { sendWhatsApp, sendWhatsAppImage, toAbsoluteUrl, renderTemplate } from '@/lib/onesender'
import { resolvePaymentInfo } from '@/lib/payment-info'
import { sendCapiEvent } from '@/lib/meta-conversion'

const DEFAULT_FIRST_DONATION = `Halo Kak {{nama}}, 🤝\nJazakallah khairan telah berqurban melalui *Beyond Qurban* 🐑\n\nDetail donasi Anda:\n📋 No. Pesanan: *{{nomor_pesanan}}*\n🌍 Program: {{campaign}}\n🐑 Hewan: {{hewan}}\n👤 Atas Nama: {{atas_nama}}\n💰 Total: *{{total}}*\n💳 Metode: {{metode_bayar}}\n🏦 Rekening: {{rekening}}\n\nTim kami akan menghubungi setelah pembayaran dikonfirmasi. 🙏`

export async function createDonation(formData: FormData) {
  const campaignSlug = formData.get('campaignSlug') as string
  const customerName = formData.get('customerName') as string
  const whatsapp = formData.get('whatsapp') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const paymentMethod = formData.get('paymentMethod') as string
  const qurbanName = formData.get('qurbanName') as string
  const forWhom = formData.get('forWhom') as string
  const email = formData.get('email') as string
  const donationTypeRaw = (formData.get('donationType') as string | null) || ''

  const qurbanCount = parseInt(formData.get('qurbanCount') as string) || 0
  let qurbanNames: string[] | null = null
  if (qurbanCount > 1) {
    qurbanNames = Array.from({ length: qurbanCount }, (_, i) =>
      (formData.get(`qurbanName_${i}`) as string) || ''
    )
  }
  const shareType = formData.get('shareType') as string | null

  if (!campaignSlug || !customerName || !whatsapp) {
    throw new Error('Data tidak lengkap')
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } })
  if (!campaign) throw new Error('Campaign tidak ditemukan')

  // Use specific animal price if provided (from sidebar animal picker)
  const animalPriceRaw = formData.get('animalPrice') as string | null
  const fallbackPrice = campaign.price ?? 0
  const unitPrice = animalPriceRaw ? (parseInt(animalPriceRaw) || fallbackPrice) : fallbackPrice
  const totalAmount = unitPrice * quantity
  const orderNumber = generateOrderNumber()

  // Resolve donation type: 'sedekah' | 'qurban'.
  // Prefer the form value (lets "keduanya" campaigns capture the donor's choice),
  // otherwise derive from the campaign's programType.
  const donationType: 'qurban' | 'sedekah' =
    donationTypeRaw === 'sedekah' || donationTypeRaw === 'qurban'
      ? donationTypeRaw
      : campaign.programType === 'sedekah' ? 'sedekah' : 'qurban'

  const donation = await prisma.donation.create({
    data: {
      orderNumber,
      campaignId: campaign.id,
      customerName,
      phone: whatsapp,
      whatsapp,
      qurbanName: qurbanName || customerName,  // fallback ke nama donatur jika kosong
      forWhom: forWhom || 'self',
      email: email || null,
      quantity,
      totalAmount,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      qurbanNames: qurbanNames ? JSON.stringify(qurbanNames) : null,
      shareType: shareType || null,
      donationType,
    },
  })

  // Skip Tripay for manual transfers — they're handled by admin verification
  const isManual = paymentMethod === 'MANUAL_TRANSFER' || (paymentMethod?.startsWith('MANUAL_') ?? false)
  if (!isManual) {
    try {
      const { createTripayTransaction, getDemoPaymentData } = await import('@/lib/tripay')
      let tripayData = await createTripayTransaction({
        method: paymentMethod || 'BVAI',
        merchantRef: donation.orderNumber,
        amount: donation.totalAmount,
        customerName: donation.customerName,
        customerPhone: donation.whatsapp,
        productName: campaign.title,
      })
      if (!tripayData) {
        tripayData = getDemoPaymentData(paymentMethod || 'BVAI', donation.totalAmount, donation.orderNumber) as any
      }
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          tripayReference: tripayData?.pay_code ?? (tripayData as any)?.reference ?? null,
          tripayPaymentUrl: (tripayData as any)?.checkout_url ?? null,
        },
      })
    } catch (err) {
      console.error('[Donation] Tripay error (non-fatal):', err)
    }
  }

  // Fire WA "first message" — non-blocking on errors so checkout never fails
  // because of OneSender. Skipped silently if disabled in pengaturan.
  try {
    const atasNama = qurbanNames && qurbanNames.length > 0 ? qurbanNames.join(', ') : (qurbanName || customerName)
    const payInfo = await resolvePaymentInfo(paymentMethod || 'BANK_TRANSFER')
    const totalFmt = formatCurrency(donation.totalAmount)
    const appUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '')

    if (payInfo.isManualQris && payInfo.qrisImageUrl) {
      // Single image-with-caption — no separate text. The QR image *is* the message.
      const caption = `Halo Kak ${customerName}, 🤝\nJazakallah khairan telah berqurban melalui *Beyond Qurban* 🐑\n\nDetail donasi Anda:\n📋 No. Pesanan: *${donation.orderNumber}*\n🌍 Program: ${campaign.title}\n🐑 Hewan: ${campaign.animalType}\n👤 Atas Nama: ${atasNama}\n💰 Total: *${totalFmt}*\n\n🔲 *QR Code Pembayaran Beyond Qurban*\nScan QR di atas → masukkan nominal *${totalFmt}* → bayar\n\nSetelah bayar, upload bukti di:\n${appUrl}/penyaluran/pembayaran?order=${donation.orderNumber}\n\n_Beyond Qurban — Amanah & Berkualitas_`
      await sendWhatsAppImage(whatsapp, toAbsoluteUrl(payInfo.qrisImageUrl), caption)
    } else {
      const tplRow = await prisma.settings.findUnique({ where: { key: 'wa_template_donation_first' } })
      const tpl = tplRow?.value || DEFAULT_FIRST_DONATION
      const message = renderTemplate(tpl, {
        nama: customerName,
        nomor_pesanan: donation.orderNumber,
        campaign: campaign.title,
        hewan: campaign.animalType,
        atas_nama: atasNama,
        total: totalFmt,
        metode_bayar: payInfo.label,
        rekening: payInfo.account,
      })
      await sendWhatsApp(whatsapp, message)
    }
  } catch (err) {
    console.error('[Donation] OneSender first-message failed (non-fatal):', err)
  }

  try {
    await sendCapiEvent('Purchase', {
      eventId: donation.orderNumber,
      eventSourceUrl: `${process.env.NEXTAUTH_URL ?? ''}/terimakasih?order=${donation.orderNumber}&type=donation`,
      userData: { email: email || undefined, phone: whatsapp },
      customData: {
        currency: 'IDR',
        value: donation.totalAmount,
        content_ids: [campaign.slug],
        content_name: campaign.title,
        content_type: 'donation',
        num_items: quantity,
        order_id: donation.orderNumber,
      },
    })
  } catch (err) {
    console.error('[Donation] Meta CAPI Purchase failed (non-fatal):', err)
  }

  redirect(`/penyaluran/pembayaran?order=${donation.orderNumber}`)
}

const ALLOWED_DONATION_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED',
] as const

export async function updateDonationStatus(id: string, status: string) {
  if (!ALLOWED_DONATION_STATUSES.includes(status as typeof ALLOWED_DONATION_STATUSES[number])) {
    throw new Error('Status tidak valid')
  }
  await prisma.donation.update({
    where: { id },
    data: { status: status as any },
  })
  revalidatePath('/admin/penyaluran')
}

export async function confirmDonationPayment(id: string) {
  await prisma.donation.update({
    where: { id },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
  })
  revalidatePath('/admin/penyaluran')
}

export async function deleteDonations(ids: string[]): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true, count: 0 }
  try {
    const result = await prisma.donation.deleteMany({ where: { id: { in: ids } } })
    revalidatePath('/admin/penyaluran')
    revalidatePath('/admin/dashboard')
    return { success: true, count: result.count }
  } catch (err) {
    console.error('[deleteDonations] error:', err)
    return { success: false, error: 'Terjadi kesalahan saat menghapus donasi. Silakan coba lagi.' }
  }
}
