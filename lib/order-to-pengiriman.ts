import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/onesender'
import { buildPengirimanLink } from '@/lib/pengiriman'

/**
 * When a HOME_DELIVERY order is confirmed (paymentStatus → PAID), create a
 * Pengiriman record (if one doesn't already exist for that orderId) and send
 * the customer a WhatsApp invite with the form link.
 *
 * Designed to never throw — caller can fire-and-forget. Logs failures.
 */
export async function createPengirimanFromPaidOrder(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })
    if (!order) return

    // Only physical-delivery orders need a Pengiriman record. ONE_UMMAH orders
    // go to the campaign distribution flow instead.
    if (order.deliveryMethod !== 'HOME_DELIVERY') return

    // Idempotency: skip if a Pengiriman record already exists for this order.
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
        jenisHewan: order.product.name,
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

    // Send the consumer the form link via OneSender. Failures are logged but
    // don't block — admin can resend manually from the table action.
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
