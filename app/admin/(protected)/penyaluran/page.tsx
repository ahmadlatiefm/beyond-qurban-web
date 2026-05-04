export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranAdminClient from './PenyaluranAdminClient'

export default async function AdminPenyaluranPage() {
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
  })

  // Stats per location
  const stats = {
    INDONESIA: {
      total: donations.filter(d => d.campaign.location === 'INDONESIA').length,
      delivered: donations.filter(d => d.campaign.location === 'INDONESIA' && d.status === 'DELIVERED').length,
      processing: donations.filter(d => d.campaign.location === 'INDONESIA' && d.status !== 'DELIVERED' && d.status !== 'CANCELLED').length,
      nominal: donations.filter(d => d.campaign.location === 'INDONESIA').reduce((s, d) => s + d.totalAmount, 0),
    },
    AFRICA: {
      total: donations.filter(d => d.campaign.location === 'AFRICA').length,
      delivered: donations.filter(d => d.campaign.location === 'AFRICA' && d.status === 'DELIVERED').length,
      processing: donations.filter(d => d.campaign.location === 'AFRICA' && d.status !== 'DELIVERED' && d.status !== 'CANCELLED').length,
      nominal: donations.filter(d => d.campaign.location === 'AFRICA').reduce((s, d) => s + d.totalAmount, 0),
    },
    PALESTINE: {
      total: donations.filter(d => d.campaign.location === 'PALESTINE').length,
      delivered: donations.filter(d => d.campaign.location === 'PALESTINE' && d.status === 'DELIVERED').length,
      processing: donations.filter(d => d.campaign.location === 'PALESTINE' && d.status !== 'DELIVERED' && d.status !== 'CANCELLED').length,
      nominal: donations.filter(d => d.campaign.location === 'PALESTINE').reduce((s, d) => s + d.totalAmount, 0),
    },
  }

  return <PenyaluranAdminClient donations={donations} stats={stats} />
}
