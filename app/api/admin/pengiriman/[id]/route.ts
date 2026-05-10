import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/pengiriman'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await prisma.pengiriman.findUnique({ where: { id: params.id }, include: { pic: true } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

const STRING_FIELDS = [
  'namaPemesan', 'noWhatsapp', 'alamatLengkap', 'kecamatan', 'kota', 'gmapsPin', 'catatan',
  'jenisHewan', 'beratHewan', 'atasNama', 'metodeBayar', 'buktiTransfer', 'jamKirim',
  'namaPengirim', 'noKendaraan', 'fotoSerahTerima', 'statusBayar', 'statusKirim', 'sumber', 'orderId',
  'picId', 'namaPenerima', 'noWaPenerima', 'keteranganSerahTerima',
] as const

const INT_FIELDS = ['jumlahHewan', 'totalHarga', 'jumlahDP', 'sisaPembayaran'] as const
const DATE_FIELDS = ['tanggalBayar', 'tanggalKirim'] as const

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) {
      const v = typeof body[f] === 'string' ? body[f].trim() : body[f]
      data[f] = v === '' ? null : v
    }
  }
  for (const f of INT_FIELDS) {
    if (body[f] !== undefined) {
      const v = body[f] === '' || body[f] === null ? null : Number(body[f])
      data[f] = v
    }
  }
  for (const f of DATE_FIELDS) {
    if (body[f] !== undefined) {
      data[f] = body[f] ? new Date(body[f]) : null
    }
  }
  if (body.nomorTagHewan !== undefined) {
    data.nomorTagHewan = parseTags(body.nomorTagHewan)
  }

  const updated = await prisma.pengiriman.update({
    where: { id: params.id },
    data,
    include: { pic: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.pengiriman.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
