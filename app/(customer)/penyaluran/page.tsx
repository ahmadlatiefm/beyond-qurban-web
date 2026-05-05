export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranClient from './PenyaluranClient'

const LOCATION_ORDER: Record<string, number> = { INDONESIA: 0, AFRICA: 1, PALESTINE: 2 }

async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({ where: { isActive: true } })
  return campaigns.sort((a, b) => (LOCATION_ORDER[a.location] ?? 9) - (LOCATION_ORDER[b.location] ?? 9))
}

export default async function PenyaluranPage() {
  const [campaigns, settingsRows] = await Promise.all([
    getCampaigns(),
    prisma.settings.findMany({
      where: {
        key: {
          in: [
            'penyaluran_harga_indonesia', 'penyaluran_disc_indonesia',
            'penyaluran_harga_africa',    'penyaluran_disc_africa',
            'penyaluran_harga_palestine', 'penyaluran_disc_palestine',
            'penyaluran_badge', 'penyaluran_hero_title_1', 'penyaluran_hero_title_2',
            'penyaluran_hero_desc', 'penyaluran_trust_1', 'penyaluran_trust_2', 'penyaluran_trust_3',
            'penyaluran_impact_stats', 'penyaluran_impact_title',
          ]
        }
      }
    }),
  ])
  const settingsMap: Record<string, string> = {}
  settingsRows.forEach(s => { settingsMap[s.key] = s.value })

  return <PenyaluranClient campaigns={campaigns} settingsMap={settingsMap} />
}
