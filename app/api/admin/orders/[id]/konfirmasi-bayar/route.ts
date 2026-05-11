import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPengirimanFromPaidOrder } from '@/lib/order-to-pengiriman'
import { buildPengirimanLink } from '@/lib/pengiriman'

export const dynamic = 'force-dynamic'

interface Body {
  buktiUrl?: string | null
  jumlahBayar?: number
  tanggalBayar?: string
  metodeBayar?: string
  catatan?: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await req.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: 'Body invalid' }, { status: 400 })

  const jumlahBayar = Number(body.jumlahBayar)
  if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
    return NextResponse.json({ error: 'jumlahBayar wajib > 0' }, { status: 400 })
  }
  const tanggalBayar = body.tanggalBayar ? new Date(body.tanggalBayar) : new Date()
  if (isNaN(tanggalBayar.getTime())) {
    return NextResponse.json({ error: 'tanggalBayar tidak valid' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })

  const notes = body.catatan?.trim()
    ? `${order.notes ? order.notes + '\n' : ''}[Konfirmasi bayar] ${body.catatan.trim()}`
    : order.notes

  await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paymentProofUrl: body.buktiUrl?.trim() || order.paymentProofUrl,
      paymentMethod: body.metodeBayar?.trim() || order.paymentMethod,
      sisaPembayaran: 0,
      notes,
    },
  })

  await createPengirimanFromPaidOrder(id, { skipDeliveryFilter: true })

  const pengiriman = await prisma.pengiriman.findFirst({
    where: { orderId: id },
    select: { token: true },
  })
  const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://beyondqurban.com').replace(/\/+$/, '')
  const linkForm = pengiriman ? buildPengirimanLink(pengiriman.token, baseUrl) : null

  return NextResponse.json({ success: true, linkForm })
}
