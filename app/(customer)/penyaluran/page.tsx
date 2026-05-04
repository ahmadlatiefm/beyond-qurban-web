export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranClient from './PenyaluranClient'

const LOCATION_ORDER: Record<string, number> = { INDONESIA: 0, AFRICA: 1, PALESTINE: 2 }

async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({ where: { isActive: true } })
  return campaigns.sort((a, b) => (LOCATION_ORDER[a.location] ?? 9) - (LOCATION_ORDER[b.location] ?? 9))
}

export default async function PenyaluranPage() {
  const campaigns = await getCampaigns()
  return <PenyaluranClient campaigns={campaigns} />
}
