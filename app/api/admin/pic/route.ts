import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Public-ish read: any authenticated admin OR a request from the lapangan
  // dropdown filtered by aktif=true. Keep it auth-protected for now to avoid
  // leaking PIC phone numbers; lapangan UI gets pic info via the pengiriman
  // record which is already gated by the lapangan code.
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const aktifOnly = url.searchParams.get('aktif') === 'true'

  const items = await prisma.pICPengiriman.findMany({
    where: aktifOnly ? { aktif: true } : undefined,
    orderBy: [{ aktif: 'desc' }, { nama: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const nama = String(body.nama || '').trim()
  const noTelepon = String(body.noTelepon || '').trim()
  if (!nama || !noTelepon) {
    return NextResponse.json({ error: 'Nama dan No Telepon wajib diisi' }, { status: 400 })
  }

  const created = await prisma.pICPengiriman.create({
    data: {
      nama,
      noTelepon,
      keterangan: body.keterangan?.trim() || null,
      aktif: body.aktif !== false,
    },
  })
  return NextResponse.json(created, { status: 201 })
}
