import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLaporanDonaturPdf, saveLaporanPdfToDisk } from '@/lib/laporan-donatur/pdf'
import { toAbsoluteUrl } from '@/lib/onesender'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { donationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { pdfBuffer, filename } = await generateLaporanDonaturPdf(params.donationId)
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal membuat PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(_req: NextRequest, { params }: { params: { donationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { pdfBuffer } = await generateLaporanDonaturPdf(params.donationId)
    const publicUrl = await saveLaporanPdfToDisk(params.donationId, pdfBuffer)
    return NextResponse.json({
      success: true,
      url: publicUrl,
      absoluteUrl: toAbsoluteUrl(publicUrl),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal membuat PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
