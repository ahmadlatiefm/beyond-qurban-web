export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PenyaluranAdminClient from './PenyaluranAdminClient'

const DEFAULT_FOLLOWUP_DONATION = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa donasi qurban Anda untuk program *{{campaign}}* dengan nomor *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n💰 Nominal: *{{total}}*\n⏰ Segera selesaikan pembayaran agar hewan kurban Anda bisa segera disiapkan.\n\nTerima kasih, semoga dimudahkan 🤲`

export default async function AdminPenyaluranPage() {
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
  })

  const tplRow = await prisma.settings.findUnique({ where: { key: 'wa_template_donation_followup' } })
  const followupTemplate = tplRow?.value || DEFAULT_FOLLOWUP_DONATION

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

  return <PenyaluranAdminClient donations={donations} stats={stats} followupTemplate={followupTemplate} />
}
