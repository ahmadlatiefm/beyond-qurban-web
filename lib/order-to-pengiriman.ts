import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/onesender'
import { buildPengirimanLink } from '@/lib/pengiriman'

interface CreatePengirimanOptions {
  /**
   * When true, create a Pengiriman record regardless of deliveryMethod.
   * Set this for flows where the admin explicitly wants pengiriman (e.g.
   * CSV/Excel import or manual konfirmasi-bayar), even for ONE_UMMAH orders.
   */
  skipDeliveryFilter?: boolean
}

/**
 * When an Order is confirmed (paymentStatus → PAID), create a Pengiriman
 * record (if one doesn't already exist for that orderId) and send the
 * customer a WhatsApp invite with the form link.
 *
 * Designed to never throw — caller can fire-and-forget. Logs failures.
 */
export async function createPengirimanFromPaidOrder(
  orderId: string,
  options: CreatePengirimanOptions = {},
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })
    if (!order) return

    // Default behaviour: only physical-delivery orders need a Pengiriman
    // record. ONE_UMMAH orders go to the campaign distribution flow. Callers
    // (import / manual konfirmasi) can override with skipDeliveryFilter.
    if (!options.skipDeliveryFilter && order.deliveryMethod !== 'HOME_DELIVERY') return

    const existing = await prisma.pengiriman.findFirst({ where: { orderId: order.id } })
    if (existing) return

    const created = await prisma.pengiriman.create({
      data: {
        sumber: 'online',
        orderId: order.id,
        namaPemesan: order.customerName,
        noWhatsapp: order.whatsapp,
        alamatLengkap: order.address ?? null,
        kecamatan: order.kecamatan ?? null,
        kota: order.city ?? null,
        catatan: order.deliveryNotes ?? null,
        jenisHewan: order.animalType || order.product.name,
        jumlahHewan: order.quantity,
        beratHewan: order.product.weight ? `${order.product.weight} kg` : null,
        totalHarga: order.totalAmount,
        statusBayar: 'lunas',
        metodeBayar: order.paymentMethod ?? null,
        tanggalBayar: new Date(),
        tanggalKirim: order.deliveryDate ?? null,
        statusKirim: 'belum_dijadwalkan',
        formDiisi: false,
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://beyondqurban.com').replace(/\/+$/, '')
    const link = buildPengirimanLink(created.token, baseUrl)
    const message =
      `Assalamu'alaikum Kak ${order.customerName},\n` +
      `pembayaran hewan qurban Anda sudah kami terima ✅\n\n` +
      `Mohon lengkapi data pengiriman melalui link berikut:\n${link}\n\n` +
      `Jazakallah khairan 🐑`

    const result = await sendWhatsApp(order.whatsapp, message)
    if (!result.success) {
      console.warn('[order-to-pengiriman] WA send failed', orderId, result.error)
    }
  } catch (err) {
    console.error('[order-to-pengiriman] failed', orderId, err)
  }
}

/**
 * Donation variant. Same idempotency + fire-and-forget semantics. Always
 * creates a Pengiriman (donations are always physical handling on our end).
 */
export async function createPengirimanFromPaidDonation(donationId: string): Promise<void> {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { campaign: true },
    })
    if (!donation) return

    const existing = await prisma.pengiriman.findFirst({ where: { orderId: donation.id } })
    if (existing) return

    const jenisHewan =
      donation.animalType || donation.campaign?.animalType || 'domba'
    const atasNama = donation.atasNama || donation.qurbanName || donation.customerName

    const created = await prisma.pengiriman.create({
      data: {
        sumber: 'online',
        orderId: donation.id,
        namaPemesan: donation.customerName,
        noWhatsapp: donation.whatsapp,
        catatan: null,
        jenisHewan,
        jumlahHewan: donation.quantity,
        atasNama,
        totalHarga: donation.totalAmount,
        statusBayar: 'lunas',
        metodeBayar: donation.paymentMethod ?? null,
        tanggalBayar: new Date(),
        statusKirim: 'belum_dijadwalkan',
        formDiisi: false,
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://beyondqurban.com').replace(/\/+$/, '')
    const link = buildPengirimanLink(created.token, baseUrl)
    const message =
      `Assalamu'alaikum Kak ${donation.customerName},\n` +
      `pembayaran qurban Anda sudah kami terima ✅\n\n` +
      `Mohon lengkapi data pengiriman melalui link berikut:\n${link}\n\n` +
      `Jazakallah khairan 🐑`

    const result = await sendWhatsApp(donation.whatsapp, message)
    if (!result.success) {
      console.warn('[order-to-pengiriman] WA send failed (donation)', donationId, result.error)
    }
  } catch (err) {
    console.error('[order-to-pengiriman] donation failed', donationId, err)
  }
}
