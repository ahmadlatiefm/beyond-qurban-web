import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (typeof body.nama === 'string') {
    const v = body.nama.trim()
    if (!v) return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    data.nama = v
  }
  if (typeof body.noTelepon === 'string') {
    const v = body.noTelepon.trim()
    if (!v) return NextResponse.json({ error: 'No Telepon tidak boleh kosong' }, { status: 400 })
    data.noTelepon = v
  }
  if (body.keterangan !== undefined) {
    data.keterangan = typeof body.keterangan === 'string' && body.keterangan.trim() ? body.keterangan.trim() : null
  }
  if (typeof body.aktif === 'boolean') data.aktif = body.aktif

  const updated = await prisma.pICPengiriman.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.pICPengiriman.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
