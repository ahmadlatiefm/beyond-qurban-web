export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import KonfirmasiClient from './KonfirmasiClient'

export default async function AdminKonfirmasiPage() {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: { in: ['UNPAID', 'PAID', 'EXPIRED'] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    confirmed: orders.filter(o => o.paymentStatus === 'PAID').length,
    rejected: orders.filter(o => o.paymentStatus === 'EXPIRED').length,
  }

  return <KonfirmasiClient initialOrders={orders} stats={stats} />
}
