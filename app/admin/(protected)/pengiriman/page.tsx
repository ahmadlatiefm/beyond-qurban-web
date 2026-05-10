export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PengirimanClient from './PengirimanClient'

export default async function AdminPengirimanPage() {
  const [items, pics] = await Promise.all([
    prisma.pengiriman.findMany({ orderBy: { createdAt: 'desc' }, include: { pic: true } }),
    prisma.pICPengiriman.findMany({ orderBy: [{ aktif: 'desc' }, { nama: 'asc' }] }),
  ])
  return (
    <PengirimanClient
      initialItems={JSON.parse(JSON.stringify(items))}
      initialPics={JSON.parse(JSON.stringify(pics))}
    />
  )
}
