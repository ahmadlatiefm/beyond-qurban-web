export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PengirimanDetailClient from './PengirimanDetailClient'

export default async function AdminPengirimanDetailPage({ params }: { params: { id: string } }) {
  const item = await prisma.pengiriman.findUnique({ where: { id: params.id }, include: { pic: true } })
  if (!item) notFound()
  return <PengirimanDetailClient item={JSON.parse(JSON.stringify(item))} />
}
