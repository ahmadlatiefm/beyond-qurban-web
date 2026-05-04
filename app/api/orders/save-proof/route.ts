import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { orderNumber, proofUrl } = await req.json()
  if (!orderNumber || !proofUrl) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  // Try Order first
  const updated = await prisma.order.updateMany({
    where: { orderNumber },
    data: { paymentProofUrl: proofUrl },
  }).catch(() => ({ count: 0 }))

  if ((updated as { count: number }).count === 0) {
    // Fall back to Donation (store in tripayPaymentUrl as proof field)
    await prisma.donation.updateMany({
      where: { orderNumber },
      data: { tripayPaymentUrl: proofUrl },
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
