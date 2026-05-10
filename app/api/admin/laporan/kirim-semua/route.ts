import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/onesender'
import { formatDate } from '@/lib/utils'
import {
  generateLaporanDonaturPdf,
  saveLaporanPdfToDisk,
  buildLaporanWaMessage,
} from '@/lib/laporan-donatur/pdf'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

type KirimSemuaBody = {
  campaignId: string
  laporanId?: string | null
}

type SendError = { donaturNama: string; donationId: string; reason: string }

/**
 * POST /api/admin/laporan/kirim-semua
 * Body: { campaignId, laporanId? }
 *
 * Loop semua donatur campaign yang sudah punya foto penyembelihan
 * dan belum sudahDikirim. Jangan stop bila satu gagal.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: KirimSemuaBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }
  if (!body.campaignId) {
    return NextResponse.json({ error: 'campaignId wajib' }, { status: 400 })
  }

  // Pull donations that have photos and haven't been sent yet.
  const ldFilter: { sudahDikirim: false; laporanId?: string } = { sudahDikirim: false }
  if (body.laporanId) ldFilter.laporanId = body.laporanId
  const donations = await prisma.donation.findMany({
    where: {
      campaignId: body.campaignId,
      laporanDonatur: { is: ldFilter },
    },
    include: { laporanDonatur: true },
  })

  const ready = donations.filter(d => {
    const arr = (d.laporanDonatur?.fotoPenyembelihan as unknown as string[]) ?? []
    return arr.length > 0
  })

  let berhasil = 0
  let gagal = 0
  const errors: SendError[] = []

  for (const d of ready) {
    try {
      const ctx = await generateLaporanDonaturPdf(d.id)
      const publicUrl = await saveLaporanPdfToDisk(d.id, ctx.pdfBuffer)
      const tanggal = formatDate(d.laporanDonatur?.assignedAt ?? new Date())
      const message = buildLaporanWaMessage({
        customerName: d.customerName,
        quantity: d.quantity,
        jenisHewan: ctx.jenisHewan,
        atasNama: ctx.atasNama,
        lokasi: ctx.lokasi,
        tanggal,
        pdfUrl: publicUrl,
      })
      const wa = await sendWhatsApp(d.whatsapp, message)
      if (!wa.success) {
        gagal++
        errors.push({ donaturNama: d.customerName, donationId: d.id, reason: wa.error || 'WA gagal' })
        continue
      }
      await prisma.laporanDonatur.update({
        where: { donationId: d.id },
        data: { sudahDikirim: true, dikirimAt: new Date() },
      })
      berhasil++
    } catch (e) {
      gagal++
      errors.push({
        donaturNama: d.customerName,
        donationId: d.id,
        reason: e instanceof Error ? e.message : String(e),
      })
    }
  }

  revalidatePath('/admin/laporan/assign')
  return NextResponse.json({ berhasil, gagal, total: ready.length, errors })
}
