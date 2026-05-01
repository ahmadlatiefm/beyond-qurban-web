import { prisma } from '@/lib/prisma'

type NotifEvent =
  | 'order_created_customer'
  | 'order_created_admin'
  | 'payment_confirmed_customer'
  | 'payment_confirmed_admin'
  | 'status_updated_customer'
  | 'shipping_customer'
  | 'manual'

type NotifPayload = {
  customerName: string
  whatsapp: string
  orderNumber: string
  productName: string
  totalAmount: number
  status?: string
  paymentUrl?: string
}

const EVENT_TOGGLE_KEY: Record<NotifEvent, string | null> = {
  order_created_customer:     'notif_order_customer',
  order_created_admin:        'notif_order_admin',
  payment_confirmed_customer: 'notif_payment_customer',
  payment_confirmed_admin:    'notif_payment_admin',
  status_updated_customer:    'notif_status_customer',
  shipping_customer:          'notif_shipping_customer',
  manual:                     null,
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function buildMessage(event: NotifEvent, payload: NotifPayload): string {
  const { customerName, orderNumber, productName, totalAmount, status, paymentUrl } = payload

  switch (event) {
    case 'order_created_customer':
      return [
        `Assalamualaikum ${customerName} 👋`,
        ``,
        `Pesanan Anda telah kami terima! 🐑`,
        ``,
        `📋 *Detail Pesanan:*`,
        `No. Pesanan: ${orderNumber}`,
        `Produk: ${productName}`,
        `Total: ${formatRp(totalAmount)}`,
        ``,
        paymentUrl ? `💳 Lakukan pembayaran:\n${paymentUrl}` : '',
        ``,
        `Jazakallahu khairan 🙏`,
      ].filter(Boolean).join('\n')

    case 'order_created_admin':
      return [
        `🔔 *Pesanan Baru Masuk!*`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Nama: ${customerName}`,
        `Produk: ${productName}`,
        `Total: ${formatRp(totalAmount)}`,
        ``,
        `Segera proses dan konfirmasi pesanan.`,
      ].join('\n')

    case 'payment_confirmed_customer':
      return [
        `Alhamdulillah, ${customerName}! 🎉`,
        ``,
        `Pembayaran pesanan *${orderNumber}* telah diterima.`,
        `Produk: ${productName}`,
        `Total: ${formatRp(totalAmount)}`,
        ``,
        `Kami akan segera memproses kurban Anda. Semoga berkah! 🐑🌙`,
      ].join('\n')

    case 'payment_confirmed_admin':
      return [
        `✅ *Pembayaran Diterima!*`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Nama: ${customerName}`,
        `Produk: ${productName}`,
        `Total: ${formatRp(totalAmount)}`,
      ].join('\n')

    case 'status_updated_customer':
      return [
        `Update pesanan Anda, ${customerName}:`,
        ``,
        `No. Pesanan: ${orderNumber}`,
        `Status terbaru: *${status ?? '-'}*`,
        ``,
        `Terima kasih sudah memesan di Beyond Qurban 🐑`,
      ].join('\n')

    case 'shipping_customer':
      return [
        `📦 *Pesanan Sedang Dikirim!*`,
        ``,
        `Halo ${customerName},`,
        `Daging kurban (${productName}) sedang dalam perjalanan.`,
        `No. Pesanan: ${orderNumber}`,
        ``,
        `Mohon pastikan ada yang menerima di alamat tujuan 🙏`,
      ].join('\n')

    case 'manual':
      return [
        `Halo ${customerName},`,
        ``,
        `Update pesanan *${orderNumber}*:`,
        `Produk: ${productName}`,
        `Status: ${status ?? '-'}`,
        ``,
        `Terima kasih sudah mempercayai Beyond Qurban 🐑`,
      ].join('\n')
  }
}

async function getConfig() {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['onesender_api_key', 'onesender_sender_number', 'admin_whatsapp'] } },
  })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

async function isEnabled(toggleKey: string | null): Promise<boolean> {
  if (toggleKey === null) return true
  const row = await prisma.settings.findUnique({ where: { key: toggleKey } })
  return row?.value === 'true'
}

async function sendWA(to: string, message: string): Promise<void> {
  const config = await getConfig()
  if (!config.onesender_api_key || !config.onesender_sender_number) return

  const phone = to.replace(/\D/g, '')

  await fetch('https://api.onesender.id/send', {
    method: 'POST',
    headers: {
      Authorization: config.onesender_api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: config.onesender_sender_number,
      receiver: phone,
      message,
      type: 'text',
    }),
  }).catch(() => {
    console.error('[OneSender] Gagal kirim WA ke', phone)
  })
}

export async function sendOrderNotification(
  event: NotifEvent,
  payload: NotifPayload
): Promise<void> {
  const enabled = await isEnabled(EVENT_TOGGLE_KEY[event])
  if (!enabled) return

  const message = buildMessage(event, payload)

  if (event === 'order_created_admin' || event === 'payment_confirmed_admin') {
    const config = await getConfig()
    if (config.admin_whatsapp) await sendWA(config.admin_whatsapp, message)
  } else {
    await sendWA(payload.whatsapp, message)
  }
}
