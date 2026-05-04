export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PesananClient from './PesananClient'

export default async function AdminPesananPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
    take: 50,
  })
  return <PesananClient initialOrders={orders} />
}
