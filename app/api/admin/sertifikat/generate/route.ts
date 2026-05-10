import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSertifikatPng, pngToPdfBuffer } from '@/lib/sertifikat/generate'
import type { SertifikatField } from '@/lib/sertifikat/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as
    | { templateId: string; data: Record<string, string>; format?: 'pdf' | 'png'; filename?: string }
    | null
  if (!body || !body.templateId) {
    return NextResponse.json({ error: 'templateId wajib diisi' }, { status: 400 })
  }

  const tpl = await prisma.templateSertifikat.findUnique({ where: { id: body.templateId } })
  if (!tpl) return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })

  const fields = (tpl.fields as unknown as SertifikatField[]) || []
  const format = body.format === 'png' ? 'png' : 'pdf'
  const safeName = (body.filename || `sertifikat-${tpl.tipe}`).replace(/[^a-z0-9-_]/gi, '-')

  try {
    const { buffer, width, height } = await generateSertifikatPng({
      blankoUrl: tpl.blankoUrl,
      fields,
      data: body.data || {},
    })

    if (format === 'png') {
      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${safeName}.png"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const pdf = await pngToPdfBuffer(buffer, width, height)
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal generate sertifikat'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
