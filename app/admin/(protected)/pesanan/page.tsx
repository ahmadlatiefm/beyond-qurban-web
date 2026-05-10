export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PesananClient from './PesananClient'

const DEFAULT_FOLLOWUP_PRODUCT = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa pesanan kurban Anda *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n⏰ *Batas waktu: 24 jam sejak pemesanan*\n\nNominal tepat: *{{total}}*\n\nTerima kasih, semoga dimudahkan 🤲\n\n_Beyond Qurban_`

export default async function AdminPesananPage() {
  const [orders, tplRow] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true },
      take: 50,
    }),
    prisma.settings.findUnique({ where: { key: 'msg_followup' } }),
  ])
  const followupTemplate = tplRow?.value || DEFAULT_FOLLOWUP_PRODUCT
  return <PesananClient initialOrders={orders} followupTemplate={followupTemplate} />
}
