import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { resolvePdfImageSrc } from '@/lib/pdf/image-source'
import SertifikatPembelian from '@/components/pdf/SertifikatPembelian'
import { generateSertifikatPng, pngToPdfBuffer } from '@/lib/sertifikat/generate'
import { buildPembelianData } from '@/lib/sertifikat/build-data'
import type { SertifikatField } from '@/lib/sertifikat/types'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { product: true },
  })
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

  const filename = `sertifikat-pembelian-${order.orderNumber}.pdf`

  // Prefer admin-uploaded template if active
  const tpl = await prisma.templateSertifikat.findFirst({
    where: { tipe: 'pembelian', aktif: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (tpl) {
    const fields = (tpl.fields as unknown as SertifikatField[]) || []
    const data = buildPembelianData(order)
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
  const element = React.createElement(SertifikatPembelian, {
    data: {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      qurbanName: order.customerName,
      animalName: order.product.name,
      animalWeight: order.product.weight,
      totalAmount: formatCurrency(order.totalAmount),
      date: formatDate(order.createdAt),
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
