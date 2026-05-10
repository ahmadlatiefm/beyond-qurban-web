export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import AssignClient, { type AssignDonation, type AssignCampaign, type AssignLaporan } from './AssignClient'

export default async function AdminLaporanAssignPage() {
  const [campaigns, laporanList, donations] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.laporanPenyaluran.findMany({ orderBy: { tanggalKirim: 'desc' } }),
    prisma.donation.findMany({
      where: {
        OR: [
          { paymentStatus: 'PAID' },
          // Donations that admin manually moved past PENDING but never had
          // their payment status flipped — still eligible for laporan assign.
          { status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
        ],
      },
      include: {
        campaign: true,
        laporanDonatur: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const campaignsOut: AssignCampaign[] = campaigns.map(c => ({
    id: c.id,
    title: c.title,
    location: c.location,
    animalType: c.animalType,
  }))

  const laporanOut: AssignLaporan[] = laporanList.map(l => ({
    id: l.id,
    campaignId: l.campaignId,
    judul: l.judul,
    lokasi: l.lokasi,
    jumlahPenerima: l.jumlahPenerima,
    fotoCount: Array.isArray(l.fotoUrls) ? (l.fotoUrls as unknown as string[]).length : 0,
  }))

  const donationsOut: AssignDonation[] = donations.map(d => ({
    id: d.id,
    orderNumber: d.orderNumber,
    customerName: d.customerName,
    whatsapp: d.whatsapp,
    qurbanName: d.qurbanName,
    qurbanNames: d.qurbanNames,
    quantity: d.quantity,
    totalAmount: d.totalAmount,
    campaignId: d.campaignId,
    campaignTitle: d.campaign.title,
    campaignLocation: d.campaign.location,
    animalType: d.campaign.animalType,
    paymentStatus: d.paymentStatus,
    status: d.status,
    laporanDonatur: d.laporanDonatur ? {
      fotoPenyembelihan: (d.laporanDonatur.fotoPenyembelihan as unknown as string[]) ?? [],
      isPatungan: d.laporanDonatur.isPatungan,
      namaPatungan: (d.laporanDonatur.namaPatungan as unknown as string[]) ?? [],
      laporanId: d.laporanDonatur.laporanId,
      statusPenyembelihan: d.laporanDonatur.statusPenyembelihan,
      assignedAt: d.laporanDonatur.assignedAt?.toISOString() ?? null,
      sudahDikirim: d.laporanDonatur.sudahDikirim,
      dikirimAt: d.laporanDonatur.dikirimAt?.toISOString() ?? null,
    } : null,
  }))

  const settings = await prisma.settings.findUnique({ where: { key: 'store_whatsapp' } })

  return (
    <AssignClient
      campaigns={campaignsOut}
      laporanList={laporanOut}
      donations={donationsOut}
      adminWhatsapp={settings?.value ?? ''}
    />
  )
}
