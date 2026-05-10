import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const list = await prisma.laporanPenyaluran.findMany({
    orderBy: { tanggalKirim: 'desc' },
    include: { campaign: true },
  })
  return NextResponse.json({ items: list })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    campaignId?: string | null
    judul?: string
    tanggalKirim?: string
    lokasi?: string
    jumlahHewan?: number
    jumlahPenerima?: number | null
    deskripsi?: string
    fotoUrls?: string[]
    tandaTerima?: string | null
  } | null
  if (!body) return NextResponse.json({ error: 'Body invalid' }, { status: 400 })

  const judul = (body.judul ?? '').trim()
  const lokasi = (body.lokasi ?? '').trim()
  const deskripsi = (body.deskripsi ?? '').trim()
  const jumlahHewan = Number(body.jumlahHewan ?? 0)
  if (!judul || !lokasi || !deskripsi || !Number.isFinite(jumlahHewan) || jumlahHewan < 1) {
    return NextResponse.json({ error: 'Field wajib belum lengkap' }, { status: 400 })
  }

  const fotoUrls = Array.isArray(body.fotoUrls) ? body.fotoUrls.slice(0, 10).filter(u => typeof u === 'string') : []
  const tanggal = body.tanggalKirim ? new Date(body.tanggalKirim) : new Date()

  const created = await prisma.laporanPenyaluran.create({
    data: {
      campaignId: body.campaignId || null,
      judul,
      tanggalKirim: tanggal,
      lokasi,
      jumlahHewan,
      jumlahPenerima: body.jumlahPenerima != null ? Number(body.jumlahPenerima) : null,
      deskripsi,
      fotoUrls,
      tandaTerima: body.tandaTerima || null,
    },
  })
  return NextResponse.json({ item: created })
}
