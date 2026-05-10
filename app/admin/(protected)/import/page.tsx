export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import ImportClient from './ImportClient'

export default async function AdminImportPage() {
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.campaign.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  return <ImportClient products={products} campaigns={campaigns} />
}
