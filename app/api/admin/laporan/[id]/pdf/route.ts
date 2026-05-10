import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { resolvePdfImageSrc } from '@/lib/pdf/image-source'
import LaporanPenyaluran from '@/components/pdf/LaporanPenyaluran'
import React from 'react'

export const dynamic = 'force-dynamic'

const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Pelosok Indonesia',
  AFRICA:    'Afrika Sub-Sahara',
  PALESTINE: 'Palestina',
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const laporan = await prisma.laporanPenyaluran.findUnique({
    where: { id: params.id },
    include: { campaign: true },
  })
  if (!laporan) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const fotoUrlsRaw = (laporan.fotoUrls ?? []) as string[]
  const fotoUrls = await Promise.all(fotoUrlsRaw.map(u => resolvePdfImageSrc(u)))
  const tandaTerima = laporan.tandaTerima ? await resolvePdfImageSrc(laporan.tandaTerima) : null
  const logoUrl = await resolvePdfImageSrc('/logo-gold.png')

  const programLabel = laporan.campaign
    ? `${laporan.campaign.programType === 'qurban' ? 'Qurban' : 'Program'} ${LOCATION_LABEL[laporan.campaign.location] ?? ''} 1446 H`.trim()
    : 'Penyaluran 1446 H'

  const element = React.createElement(LaporanPenyaluran, {
    data: {
      judul: laporan.judul,
      programLabel,
      lokasi: laporan.lokasi,
      tanggalKirim: formatDate(laporan.tanggalKirim),
      jumlahHewan: laporan.jumlahHewan,
      jumlahPenerima: laporan.jumlahPenerima,
      deskripsi: laporan.deskripsi,
      fotoUrls,
      tandaTerima,
      logoUrl,
    },
  }) as unknown as Parameters<typeof renderToBuffer>[0]
  const buffer = await renderToBuffer(element)

  const safeJudul = laporan.judul.replace(/[^a-z0-9-]+/gi, '-').toLowerCase().slice(0, 60)
  const filename = `laporan-${safeJudul || laporan.id}.pdf`
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
