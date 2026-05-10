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

/**
 * POST /api/admin/laporan/donatur/[donationId]/kirim
 *
 * 1. Generate PDF (always regenerates so foto baru ikut)
 * 2. Save to disk → public URL
 * 3. Send WA via OneSender
 * 4. Mark sudahDikirim = true
 */
export async function POST(_req: NextRequest, { params }: { params: { donationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await generateLaporanDonaturPdf(params.donationId)
    const publicUrl = await saveLaporanPdfToDisk(params.donationId, ctx.pdfBuffer)

    const ld = await prisma.laporanDonatur.findUnique({ where: { donationId: params.donationId } })
    const tanggal = formatDate(ld?.assignedAt ?? new Date())
    const message = buildLaporanWaMessage({
      customerName: ctx.donation.customerName,
      quantity: ctx.donation.quantity,
      jenisHewan: ctx.jenisHewan,
      atasNama: ctx.atasNama,
      lokasi: ctx.lokasi,
      tanggal,
      pdfUrl: publicUrl,
    })

    const waResult = await sendWhatsApp(ctx.donation.whatsapp, message)
    if (!waResult.success) {
      return NextResponse.json(
        { success: false, error: waResult.error || 'Gagal kirim WhatsApp', pdfUrl: publicUrl },
        { status: 502 },
      )
    }

    await prisma.laporanDonatur.update({
      where: { donationId: params.donationId },
      data: { sudahDikirim: true, dikirimAt: new Date() },
    })
    revalidatePath('/admin/laporan/assign')

    return NextResponse.json({ success: true, pdfUrl: publicUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal kirim laporan'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
