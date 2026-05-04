export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import ProdukClient from './ProdukClient'

export default async function AdminProdukPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return <ProdukClient initialProducts={products} />
}
