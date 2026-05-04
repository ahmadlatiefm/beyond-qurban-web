export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranClient from './PenyaluranClient'

async function getCampaigns() {
  return prisma.campaign.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
}

export default async function PenyaluranPage() {
  const campaigns = await getCampaigns()
  return <PenyaluranClient campaigns={campaigns} />
}
