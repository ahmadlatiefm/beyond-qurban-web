export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PicClient from './PicClient'

export default async function AdminPicPage() {
  const items = await prisma.pICPengiriman.findMany({
    orderBy: [{ aktif: 'desc' }, { nama: 'asc' }],
  })
  return <PicClient initialItems={JSON.parse(JSON.stringify(items))} />
}
