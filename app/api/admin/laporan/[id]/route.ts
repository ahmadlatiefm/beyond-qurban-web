import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await prisma.laporanPenyaluran.findUnique({
    where: { id: params.id },
    include: { campaign: true },
  })
  if (!item) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Body invalid' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.campaignId === 'string' || body.campaignId === null) data.campaignId = body.campaignId || null
  if (typeof body.judul === 'string') data.judul = body.judul.trim()
  if (typeof body.lokasi === 'string') data.lokasi = body.lokasi.trim()
  if (typeof body.deskripsi === 'string') data.deskripsi = body.deskripsi.trim()
  if (typeof body.jumlahHewan === 'number') data.jumlahHewan = body.jumlahHewan
  if (body.jumlahPenerima === null || typeof body.jumlahPenerima === 'number') data.jumlahPenerima = body.jumlahPenerima
  if (typeof body.tanggalKirim === 'string') data.tanggalKirim = new Date(body.tanggalKirim)
  if (Array.isArray(body.fotoUrls)) data.fotoUrls = body.fotoUrls.slice(0, 10).filter(u => typeof u === 'string')
  if (typeof body.tandaTerima === 'string' || body.tandaTerima === null) data.tandaTerima = body.tandaTerima || null
  if (typeof body.pdfUrl === 'string' || body.pdfUrl === null) data.pdfUrl = body.pdfUrl || null

  const item = await prisma.laporanPenyaluran.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.laporanPenyaluran.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
