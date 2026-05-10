import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  let body: { orderNumber?: string; proofUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { orderNumber, proofUrl } = body
  if (!orderNumber || !proofUrl) {
    return NextResponse.json({ error: 'orderNumber dan proofUrl wajib diisi' }, { status: 400 })
  }

  try {
    const orderUpdate = await prisma.order.updateMany({
      where: { orderNumber },
      data: { paymentProofUrl: proofUrl },
    })
    if (orderUpdate.count > 0) {
      return NextResponse.json({ success: true, type: 'order' })
    }
    const donationUpdate = await prisma.donation.updateMany({
      where: { orderNumber },
      data: { paymentProofUrl: proofUrl },
    })
    if (donationUpdate.count > 0) {
      return NextResponse.json({ success: true, type: 'donation' })
    }
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
  } catch (err) {
    console.error('[save-proof] DB error:', err)
    return NextResponse.json({ error: 'Gagal menyimpan bukti ke database' }, { status: 500 })
  }
}
