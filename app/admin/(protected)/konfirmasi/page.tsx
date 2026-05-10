export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import KonfirmasiClient from './KonfirmasiClient'

const DEFAULT_FOLLOWUP_PRODUCT = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa pesanan kurban Anda *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n⏰ *Batas waktu: 24 jam sejak pemesanan*\n\nNominal tepat: *{{total}}*\n\nTerima kasih, semoga dimudahkan 🤲\n\n_Beyond Qurban_`

export default async function AdminKonfirmasiPage() {
  const [orders, tplRow] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: { in: ['UNPAID', 'PAID', 'EXPIRED'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.settings.findUnique({ where: { key: 'msg_followup' } }),
  ])

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    confirmed: orders.filter(o => o.paymentStatus === 'PAID').length,
    rejected: orders.filter(o => o.paymentStatus === 'EXPIRED').length,
  }

  const followupTemplate = tplRow?.value || DEFAULT_FOLLOWUP_PRODUCT
  return <KonfirmasiClient initialOrders={orders} stats={stats} followupTemplate={followupTemplate} />
}
