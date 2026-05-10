import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { resolvePdfImageSrc } from '@/lib/pdf/image-source'
import SertifikatQurban from '@/components/pdf/SertifikatQurban'
import { generateSertifikatPng, pngToPdfBuffer } from '@/lib/sertifikat/generate'
import { buildQurbanData } from '@/lib/sertifikat/build-data'
import type { SertifikatField } from '@/lib/sertifikat/types'
import React from 'react'

export const dynamic = 'force-dynamic'

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

async function nextSertifikatNumber(year: number): Promise<string> {
  const prefix = `BQ-SRT-${year}-`
  const latest = await prisma.donation.findMany({
    where: { nomorSertifikat: { startsWith: prefix } },
    orderBy: { nomorSertifikat: 'desc' },
    select: { nomorSertifikat: true },
    take: 1,
  })
  const latestNum = latest[0]?.nomorSertifikat
    ? parseInt(latest[0].nomorSertifikat.slice(prefix.length), 10) || 0
    : 0
  return `${prefix}${String(latestNum + 1).padStart(4, '0')}`
}

export async function GET(req: NextRequest, { params }: { params: { donationId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const donation = await prisma.donation.findUnique({
    where: { id: params.donationId },
    include: { campaign: true },
  })
  if (!donation) return NextResponse.json({ error: 'Donasi tidak ditemukan' }, { status: 404 })

  let certNumber = donation.nomorSertifikat
  if (!certNumber) {
    const year = new Date(donation.createdAt).getFullYear()
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const num = await nextSertifikatNumber(year)
        await prisma.donation.update({
          where: { id: donation.id },
          data: { nomorSertifikat: num },
        })
        certNumber = num
        break
      } catch {
        // retry on race
      }
    }
    if (!certNumber) {
      certNumber = `BQ-SRT-${new Date(donation.createdAt).getFullYear()}-${donation.id.slice(-4).toUpperCase()}`
    }
  }

  const filename = `sertifikat-qurban-${donation.orderNumber}.pdf`

  // Prefer admin-uploaded template if active
  const tpl = await prisma.templateSertifikat.findFirst({
    where: { tipe: 'qurban', aktif: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (tpl) {
    const fields = (tpl.fields as unknown as SertifikatField[]) || []
    const data = buildQurbanData({ ...donation, nomorSertifikat: certNumber })
    const { buffer, width, height } = await generateSertifikatPng({
      blankoUrl: tpl.blankoUrl,
      fields,
      data,
    })
    const pdf = await pngToPdfBuffer(buffer, width, height)
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  // Fallback: legacy react-pdf renderer
  const logoUrl = await resolvePdfImageSrc('/logo-gold.png')
  const element = React.createElement(SertifikatQurban, {
    data: {
      certificateNumber: certNumber,
      donorName: donation.customerName,
      qurbanName: donationAtasNama(donation),
      animalType: donation.campaign.animalType || 'Hewan Qurban',
      quantity: donation.quantity,
      campaignTitle: donation.campaign.title,
      campaignLocation: LOCATION_LABEL[donation.campaign.location] ?? donation.campaign.title,
      date: formatDate(donation.createdAt),
      logoUrl,
    },
  }) as unknown as Parameters<typeof renderToBuffer>[0]
  const buffer = await renderToBuffer(element)

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
