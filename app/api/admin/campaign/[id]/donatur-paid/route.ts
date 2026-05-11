import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })

  const donatur = await prisma.donation.findMany({
    where: {
      campaignId: params.id,
      OR: [
        { paymentStatus: 'PAID' },
        { status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      whatsapp: true,
      qurbanName: true,
      qurbanNames: true,
      quantity: true,
      animalType: true,
    },
  })

  function resolveAtasNama(d: { qurbanNames: string | null; qurbanName: string | null; customerName: string }): string {
    if (d.qurbanNames) {
      try {
        const arr = JSON.parse(d.qurbanNames) as string[]
        const filtered = (Array.isArray(arr) ? arr : []).filter(n => !!(n && n.trim()))
        if (filtered.length > 0) return filtered.join(', ')
      } catch {}
    }
    return d.qurbanName || d.customerName
  }

  const out = donatur.map(d => ({
    id: d.id,
    orderNumber: d.orderNumber,
    nama: d.customerName,
    noWa: d.whatsapp,
    jumlah: d.quantity,
    atasNama: resolveAtasNama(d),
    animalType: d.animalType,
  }))

  const totalHewan = donatur.reduce((s, d) => s + d.quantity, 0)

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      location: campaign.location,
      animalType: campaign.animalType,
    },
    count: out.length,
    totalHewan,
    donatur: out,
  })
}
