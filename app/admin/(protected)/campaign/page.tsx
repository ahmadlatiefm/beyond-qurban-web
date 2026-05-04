export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import CampaignClient from './CampaignClient'

export default async function AdminCampaignPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'asc' } })
  return <CampaignClient initialCampaigns={campaigns} />
}
