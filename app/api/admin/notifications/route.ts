import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export type NotifItem = {
  id: string
  kind: 'order_paid' | 'proof_uploaded' | 'donation_new'
  title: string
  subtitle: string
  href: string
  createdAt: string
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Orders with payment proof uploaded but still UNPAID — need verification
  const proofPending = await prisma.order.findMany({
    where: { paymentStatus: 'UNPAID', paymentProofUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // 2. Orders that just became PAID and are still PENDING/CONFIRMED — need processing
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID', status: { in: ['PENDING', 'CONFIRMED'] } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  // 3. New donations not yet confirmed
  const donationsNew = await prisma.donation.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
    take: 20,
  })

  const items: NotifItem[] = [
    ...proofPending.map(o => ({
      id: `proof-${o.id}`,
      kind: 'proof_uploaded' as const,
      title: `Bukti transfer dari ${o.customerName}`,
      subtitle: `${o.orderNumber} · Rp ${o.totalAmount.toLocaleString('id-ID')}`,
      href: '/admin/konfirmasi',
      createdAt: o.createdAt.toISOString(),
    })),
    ...paidOrders.map(o => ({
      id: `paid-${o.id}`,
      kind: 'order_paid' as const,
      title: `Pesanan dibayar: ${o.customerName}`,
      subtitle: `${o.orderNumber} · Rp ${o.totalAmount.toLocaleString('id-ID')}`,
      href: '/admin/pesanan',
      createdAt: o.createdAt.toISOString(),
    })),
    ...donationsNew.map(d => ({
      id: `don-${d.id}`,
      kind: 'donation_new' as const,
      title: `Donasi baru dari ${d.customerName}`,
      subtitle: `${d.campaign.title} · Rp ${d.totalAmount.toLocaleString('id-ID')}`,
      href: '/admin/penyaluran',
      createdAt: d.createdAt.toISOString(),
    })),
  ]
  // Sort newest first across all kinds
  items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  return NextResponse.json({
    count: items.length,
    items: items.slice(0, 15),
  })
}
