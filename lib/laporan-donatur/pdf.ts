import { renderToBuffer } from '@react-pdf/renderer'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { resolvePdfImageSrc } from '@/lib/pdf/image-source'
import LaporanDonatur from '@/components/pdf/LaporanDonatur'
import { toAbsoluteUrl } from '@/lib/onesender'
import { generateLaporanPdf } from '@/lib/laporan/generate'
import type { LaporanElement, FotoZoneKey } from '@/lib/laporan/types'

const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Pelosok Indonesia',
  AFRICA:    'Afrika Sub-Sahara',
  PALESTINE: 'Palestina',
}

function donationAtasNama(d: { qurbanNames?: string | null; qurbanName?: string | null; customerName: string }): string {
  if (d.qurbanNames) {
    try {
      const arr = JSON.parse(d.qurbanNames) as string[]
      const filtered = (Array.isArray(arr) ? arr : []).filter(n => !!(n && n.trim()))
      if (filtered.length > 0) return filtered.join(', ')
    } catch {}
  }
  return d.qurbanName || d.customerName
}

export type LaporanDonaturContext = {
  donation: {
    id: string
    orderNumber: string
    customerName: string
    whatsapp: string
    quantity: number
    campaign: { title: string; location: string; animalType: string | null }
  }
  pdfBuffer: Buffer
  filename: string
  atasNama: string
  jenisHewan: string
  lokasi: string
}

export async function generateLaporanDonaturPdf(donationId: string): Promise<LaporanDonaturContext> {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      campaign: true,
      laporanDonatur: { include: { laporan: true } },
    },
  })
  if (!donation) throw new Error('Donasi tidak ditemukan')

  const ld = donation.laporanDonatur
  const fotoPenyembelihanRaw = (ld?.fotoPenyembelihan as unknown as string[]) ?? []
  const namaPatungan = (ld?.namaPatungan as unknown as string[]) ?? []
  const fotoPenyembelihan = await Promise.all(fotoPenyembelihanRaw.map(u => resolvePdfImageSrc(u)))

  let penyaluranData: {
    judul: string
    lokasi: string
    jumlahPenerima: number | null
    deskripsi: string
    fotoUrls: string[]
    tandaTerima: string | null
  } | null = null
  if (ld?.laporan) {
    const fotoPenyaluranRaw = (ld.laporan.fotoUrls as unknown as string[]) ?? []
    const fotoPenyaluran = await Promise.all(fotoPenyaluranRaw.map(u => resolvePdfImageSrc(u)))
    const tandaTerima = ld.laporan.tandaTerima ? await resolvePdfImageSrc(ld.laporan.tandaTerima) : null
    penyaluranData = {
      judul: ld.laporan.judul,
      lokasi: ld.laporan.lokasi,
      jumlahPenerima: ld.laporan.jumlahPenerima,
      deskripsi: ld.laporan.deskripsi,
      fotoUrls: fotoPenyaluran,
      tandaTerima,
    }
  }

  const atasNama = donationAtasNama(donation)
  const jenisHewan = donation.campaign.animalType || 'Hewan Qurban'
  const lokasi = LOCATION_LABEL[donation.campaign.location] ?? donation.campaign.title
  const tanggal = formatDate(ld?.assignedAt ?? ld?.dikirimAt ?? donation.createdAt)

  // Try active template first (canvas-based blanko overlay)
  const activeTpl = await prisma.templateLaporan.findFirst({ where: { aktif: true } })
  if (activeTpl) {
    const fotoSembelih = (ld?.fotoPenyembelihan as unknown as string[]) ?? []
    const fotoDistribusi = (ld?.laporan?.fotoUrls as unknown as string[]) ?? []
    const photos: Record<FotoZoneKey, string[]> = {
      foto_sembelih: fotoSembelih,
      foto_distribusi: fotoDistribusi,
    }
    const data: Record<string, string> = {
      nomor_order: donation.orderNumber,
      nama_donatur: donation.customerName,
      atas_nama: atasNama,
      nomor_hewan: ld?.laporan?.judul || '',
      lokasi_distribusi: ld?.laporan?.lokasi || lokasi,
      tanggal_penyembelihan: tanggal,
      jenis_hewan: jenisHewan,
      jumlah_hewan: `${donation.quantity} ekor`,
    }
    const pdfBuffer = await generateLaporanPdf({
      blankoUrl: activeTpl.blankoUrl,
      elements: activeTpl.elements as unknown as LaporanElement[],
      data,
      photos,
    })
    return {
      donation: {
        id: donation.id,
        orderNumber: donation.orderNumber,
        customerName: donation.customerName,
        whatsapp: donation.whatsapp,
        quantity: donation.quantity,
        campaign: {
          title: donation.campaign.title,
          location: donation.campaign.location,
          animalType: donation.campaign.animalType,
        },
      },
      pdfBuffer,
      filename: `laporan-${donation.orderNumber}.pdf`,
      atasNama,
      jenisHewan,
      lokasi,
    }
  }

  // Fallback: legacy @react-pdf renderer
  const logoUrl = await resolvePdfImageSrc('/logo-gold.png')
  const siteLogoRow = await prisma.settings.findUnique({ where: { key: 'site_logo_url' } })
  const logoRightUrl = siteLogoRow?.value ? await resolvePdfImageSrc(siteLogoRow.value) : null

  const element = React.createElement(LaporanDonatur, {
    data: {
      orderNumber: donation.orderNumber,
      customerName: donation.customerName,
      atasNama,
      jenisHewan,
      jumlahHewan: donation.quantity,
      tanggal,
      lokasi,
      campaignTitle: donation.campaign.title,
      isPatungan: ld?.isPatungan ?? false,
      namaPatungan,
      fotoPenyembelihan,
      penyaluran: penyaluranData,
      logoUrl,
      logoRightUrl,
    },
  }) as unknown as Parameters<typeof renderToBuffer>[0]
  const pdfBuffer = await renderToBuffer(element)

  return {
    donation: {
      id: donation.id,
      orderNumber: donation.orderNumber,
      customerName: donation.customerName,
      whatsapp: donation.whatsapp,
      quantity: donation.quantity,
      campaign: {
        title: donation.campaign.title,
        location: donation.campaign.location,
        animalType: donation.campaign.animalType,
      },
    },
    pdfBuffer: pdfBuffer as unknown as Buffer,
    filename: `laporan-${donation.orderNumber}.pdf`,
    atasNama,
    jenisHewan,
    lokasi,
  }
}

/**
 * Persist a generated PDF buffer to public/uploads/laporan and update
 * LaporanDonatur.pdfUrl. Returns the public URL (relative path under /uploads).
 */
export async function saveLaporanPdfToDisk(donationId: string, buffer: Buffer): Promise<string> {
  const fileName = `laporan-${donationId}-${Date.now()}.pdf`
  const dir = path.join(process.cwd(), 'public', 'uploads', 'laporan')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, fileName), buffer)
  const publicUrl = `/uploads/laporan/${fileName}`
  await prisma.laporanDonatur.upsert({
    where: { donationId },
    create: { donationId, pdfUrl: publicUrl, pdfGeneratedAt: new Date() },
    update: { pdfUrl: publicUrl, pdfGeneratedAt: new Date() },
  })
  return publicUrl
}

/** Build the WA message body for laporan delivery. Always uses an absolute URL. */
export function buildLaporanWaMessage(input: {
  customerName: string
  quantity: number
  jenisHewan: string
  atasNama: string
  lokasi: string
  tanggal: string
  pdfUrl: string
}): string {
  const link = toAbsoluteUrl(input.pdfUrl)
  return [
    `Assalamu'alaikum Kak ${input.customerName} 🤲`,
    '',
    'Alhamdulillah, laporan qurban Anda sudah kami siapkan.',
    '',
    `🐑 *${input.quantity}x ${input.jenisHewan}* atas nama *${input.atasNama}*`,
    `📍 Lokasi: ${input.lokasi}`,
    `📅 Tanggal: ${input.tanggal}`,
    '',
    'Silakan unduh laporan lengkap di sini:',
    link,
    '',
    'Laporan berisi foto penyembelihan dan dokumentasi',
    'penyaluran kepada penerima manfaat.',
    '',
    'Jazakallah khairan atas kepercayaan Anda 🤲',
    '— Tim Beyond Qurban',
  ].join('\n')
}
