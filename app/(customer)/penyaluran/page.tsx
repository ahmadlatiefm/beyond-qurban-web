export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranClient from './PenyaluranClient'
import { applyGlobalDiscount } from '@/lib/discount'

const LOCATION_ORDER: Record<string, number> = { INDONESIA: 0, AFRICA: 1, PALESTINE: 2 }

async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({ where: { isActive: true } })
  return campaigns.sort((a, b) => (LOCATION_ORDER[a.location] ?? 9) - (LOCATION_ORDER[b.location] ?? 9))
}

export default async function PenyaluranPage() {
  const [campaigns, settingsRows] = await Promise.all([
    getCampaigns(),
    prisma.settings.findMany({
      where: { key: { in: ['diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end',
        'penyaluran_harga_indonesia','penyaluran_disc_indonesia',
        'penyaluran_harga_africa','penyaluran_disc_africa',
        'penyaluran_harga_palestine','penyaluran_disc_palestine',
      ]}}
    }),
  ])
  const settingsMap: Record<string, string> = {}
  settingsRows.forEach(s => { settingsMap[s.key] = s.value })

  // Check if global discount is active
  const sampleDiscount = applyGlobalDiscount(1000000, settingsMap)
  const discountPct = sampleDiscount.discountAmount > 0 && settingsMap.diskon_type !== 'nominal'
    ? parseInt(settingsMap.diskon_value ?? '0') : 0

  return <PenyaluranClient campaigns={campaigns} settingsMap={settingsMap} discountPct={discountPct} />
}
