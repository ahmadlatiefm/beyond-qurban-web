export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import LaporanClient from './LaporanClient'

export default async function AdminLaporanPage() {
  const [items, campaigns] = await Promise.all([
    prisma.laporanPenyaluran.findMany({
      orderBy: { tanggalKirim: 'desc' },
      include: {
        campaign: true,
        laporanDonatur: {
          select: { id: true, fotoPenyembelihan: true },
        },
      },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, location: true, animalType: true },
    }),
  ])

  const itemsOut = items.map(it => {
    const linked = it.laporanDonatur ?? []
    const fotoCount = linked.filter(ld => {
      const arr = (ld.fotoPenyembelihan as unknown as string[]) ?? []
      return Array.isArray(arr) && arr.length > 0
    }).length
    const { laporanDonatur: _ld, ...rest } = it
    return {
      ...rest,
      donaturCount: linked.length,
      donaturWithFotoCount: fotoCount,
    }
  })

  return <LaporanClient initialItems={itemsOut} campaigns={campaigns} />
}
