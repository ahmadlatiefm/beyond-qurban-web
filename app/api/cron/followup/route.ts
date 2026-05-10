import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { sendWhatsApp, renderTemplate } from '@/lib/onesender'

export const dynamic = 'force-dynamic'

const DEFAULT_FOLLOWUP_PRODUCT  = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa pesanan kurban Anda *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n⏰ *Batas waktu: 24 jam sejak pemesanan*\n\nNominal tepat: *{{total}}*\n\nTerima kasih, semoga dimudahkan 🤲\n\n_Beyond Qurban_`
const DEFAULT_FOLLOWUP_DONATION = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa donasi qurban Anda untuk program *{{campaign}}* dengan nomor *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n💰 Nominal: *{{total}}*\n⏰ Segera selesaikan pembayaran agar hewan kurban Anda bisa segera disiapkan.\n\nTerima kasih, semoga dimudahkan 🤲`

function parseIdList(value: string | undefined | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(s => typeof s === 'string') : []
  } catch { return [] }
}

async function readSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.settings.findMany({ where: { key: { in: keys } } })
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })
  return map
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

async function authorize(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized — set CRON_SECRET env and pass Authorization: Bearer <secret>' }, { status: 401 })
  }

  const s = await readSettings([
    'followup_enabled', 'followup_minutes', 'followup_hours',
    'msg_followup', 'wa_template_donation_followup',
    'followup_sent_orders', 'followup_sent_donations',
  ])

  if (s.followup_enabled === 'false') {
    return NextResponse.json({ skipped: true, reason: 'followup disabled in pengaturan' })
  }

  const minutes = s.followup_minutes !== undefined
    ? parseInt(s.followup_minutes) || 0
    : (parseInt(s.followup_hours ?? '6') || 6) * 60
  if (minutes <= 0) {
    return NextResponse.json({ skipped: true, reason: 'followup_minutes <= 0' })
  }

  const cutoff = new Date(Date.now() - minutes * 60_000)
  const tplOrder    = s.msg_followup || DEFAULT_FOLLOWUP_PRODUCT
  const tplDonation = s.wa_template_donation_followup || DEFAULT_FOLLOWUP_DONATION
  const sentOrderIds    = new Set(parseIdList(s.followup_sent_orders))
  const sentDonationIds = new Set(parseIdList(s.followup_sent_donations))

  // ── Orders ────────────────────────────────────────────────────────────
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'UNPAID', createdAt: { lte: cutoff } },
    take: 100,
  })
  const newOrderIds: string[] = []
  let orderSent = 0, orderFailed = 0
  for (const o of orders) {
    if (sentOrderIds.has(o.id)) continue
    const message = renderTemplate(tplOrder, {
      nama: o.customerName,
      nomor_pesanan: o.orderNumber,
      total: formatCurrency(o.totalAmount),
    })
    const r = await sendWhatsApp(o.whatsapp, message)
    if (r.success) {
      orderSent++
      newOrderIds.push(o.id)
    } else {
      orderFailed++
      console.error('[cron/followup] order send failed', o.orderNumber, r.error)
    }
  }

  // ── Donations ─────────────────────────────────────────────────────────
  const donations = await prisma.donation.findMany({
    where: { paymentStatus: 'UNPAID', createdAt: { lte: cutoff } },
    include: { campaign: true },
    take: 100,
  })
  const newDonationIds: string[] = []
  let donationSent = 0, donationFailed = 0
  for (const d of donations) {
    if (sentDonationIds.has(d.id)) continue
    const message = renderTemplate(tplDonation, {
      nama: d.customerName,
      nomor_pesanan: d.orderNumber,
      campaign: d.campaign.title,
      total: formatCurrency(d.totalAmount),
    })
    const r = await sendWhatsApp(d.whatsapp, message)
    if (r.success) {
      donationSent++
      newDonationIds.push(d.id)
    } else {
      donationFailed++
      console.error('[cron/followup] donation send failed', d.orderNumber, r.error)
    }
  }

  // Persist sent IDs so the same record isn't followed up twice. Trim to the
  // last 1000 entries to bound growth.
  if (newOrderIds.length > 0) {
    const updated = Array.from(sentOrderIds).concat(newOrderIds).slice(-1000)
    await writeSetting('followup_sent_orders', JSON.stringify(updated))
  }
  if (newDonationIds.length > 0) {
    const updated = Array.from(sentDonationIds).concat(newDonationIds).slice(-1000)
    await writeSetting('followup_sent_donations', JSON.stringify(updated))
  }

  return NextResponse.json({
    cutoff: cutoff.toISOString(),
    orders:    { eligible: orders.length,    sent: orderSent,    failed: orderFailed },
    donations: { eligible: donations.length, sent: donationSent, failed: donationFailed },
  })
}
