'use server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function createDonation(formData: FormData) {
  const campaignSlug = formData.get('campaignSlug') as string
  const customerName = formData.get('customerName') as string
  const whatsapp = formData.get('whatsapp') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const paymentMethod = formData.get('paymentMethod') as string
  const qurbanName = formData.get('qurbanName') as string
  const forWhom = formData.get('forWhom') as string
  const email = formData.get('email') as string

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
  const unitPrice = animalPriceRaw ? (parseInt(animalPriceRaw) || campaign.price) : campaign.price
  const totalAmount = unitPrice * quantity
  const orderNumber = generateOrderNumber()

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
    },
  })

  // Create Tripay transaction
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

  redirect(`/penyaluran/pembayaran?order=${donation.orderNumber}`)
}
