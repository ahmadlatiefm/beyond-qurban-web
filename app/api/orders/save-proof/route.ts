import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { normalizePhone } from '@/lib/onesender'

export async function POST(req: NextRequest) {
  let body: { orderNumber?: string; proofUrl?: string; whatsapp?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { orderNumber, proofUrl, whatsapp } = body
  if (!orderNumber || !proofUrl || !whatsapp) {
    return NextResponse.json(
      { error: 'orderNumber, proofUrl, dan whatsapp wajib diisi' },
      { status: 400 },
    )
  }

  const ip = clientIp(req)
  const rl = rateLimit(`save-proof:${ip}`, 3, 10 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSec / 60)} menit.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  const normalizedInput = normalizePhone(whatsapp)

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { whatsapp: true },
    })
    if (order) {
      if (normalizePhone(order.whatsapp) !== normalizedInput) {
        return NextResponse.json({ error: 'Nomor tidak sesuai' }, { status: 403 })
      }
      await prisma.order.update({
        where: { orderNumber },
        data: { paymentProofUrl: proofUrl },
      })
      return NextResponse.json({ success: true, type: 'order' })
    }

    const donation = await prisma.donation.findUnique({
      where: { orderNumber },
      select: { whatsapp: true },
    })
    if (donation) {
      if (normalizePhone(donation.whatsapp) !== normalizedInput) {
        return NextResponse.json({ error: 'Nomor tidak sesuai' }, { status: 403 })
      }
      await prisma.donation.update({
        where: { orderNumber },
        data: { paymentProofUrl: proofUrl },
      })
      return NextResponse.json({ success: true, type: 'donation' })
    }

    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
  } catch (err) {
    console.error('[save-proof] DB error:', err)
    return NextResponse.json({ error: 'Gagal menyimpan bukti ke database' }, { status: 500 })
  }
}
