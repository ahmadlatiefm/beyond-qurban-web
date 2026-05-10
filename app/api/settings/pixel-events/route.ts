import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KEYS = [
  'fb_event_campaign',
  'fb_event_checkout',
  'fb_event_payment',
  'fb_event_success',
] as const

export async function GET() {
  const rows = await prisma.settings.findMany({ where: { key: { in: [...KEYS] } } })
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })

  return NextResponse.json({
    page_campaign:   map.fb_event_campaign   ?? 'ViewContent',
    page_checkout:   map.fb_event_checkout   ?? 'InitiateCheckout',
    page_pembayaran: map.fb_event_payment    ?? 'AddToCart',
    page_sukses:     map.fb_event_success    ?? 'Purchase',
  })
}
