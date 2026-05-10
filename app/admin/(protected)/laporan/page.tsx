export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import LaporanClient from './LaporanClient'

export default async function AdminLaporanPage() {
  const [items, campaigns] = await Promise.all([
    prisma.laporanPenyaluran.findMany({
      orderBy: { tanggalKirim: 'desc' },
      include: { campaign: true },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, location: true },
    }),
  ])

  return <LaporanClient initialItems={items} campaigns={campaigns} />
}
