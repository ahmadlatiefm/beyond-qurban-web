import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import type { PenyaluranImportRow, ImportResult, ImportFailure } from '@/lib/import/types'

export const dynamic = 'force-dynamic'

const PAYMENT_STATUS_MAP: Record<string, 'PAID' | 'UNPAID' | 'EXPIRED' | 'REFUNDED'> = {
  paid: 'PAID', lunas: 'PAID',
  unpaid: 'UNPAID', belum: 'UNPAID', pending: 'UNPAID',
  expired: 'EXPIRED', kadaluarsa: 'EXPIRED',
  refunded: 'REFUNDED', dikembalikan: 'REFUNDED',
}

function normalizeWa(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

function parseDate(raw: string | undefined): Date {
  if (!raw) return new Date()
  const iso = new Date(raw)
  if (!isNaN(iso.getTime())) return iso
  const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return new Date(Number(y), Number(mo) - 1, Number(d))
  }
  return new Date()
}

function parseInt0(raw: string | number | undefined): number {
  if (raw == null) return 0
  if (typeof raw === 'number') return Math.floor(raw)
  const cleaned = String(raw).replace(/[^\d-]/g, '')
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { rows: PenyaluranImportRow[] } | null
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'Body invalid: rows[] required' }, { status: 400 })
  }

  const campaigns = await prisma.campaign.findMany({ select: { id: true, title: true } })
  const campaignByTitle = new Map(campaigns.map(c => [c.title.toLowerCase().trim(), c.id]))
  const campaignIds = new Set(campaigns.map(c => c.id))

  const failed: ImportFailure[] = []
  let successCount = 0

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i]
    const rowNum = i + 1
    try {
      const namaDonatur = (row.nama_donatur || '').trim()
      const wa = normalizeWa(row.no_whatsapp || '')
      if (!namaDonatur) throw new Error('nama_donatur kosong')
      if (!wa) throw new Error('no_whatsapp tidak valid')

      let campaignId = (row.campaign_id || '').trim()
      if (campaignId && !campaignIds.has(campaignId)) {
        campaignId = ''
      }
      if (!campaignId && row.nama_campaign) {
        const found = campaignByTitle.get(row.nama_campaign.toLowerCase().trim())
        if (found) campaignId = found
      }
      if (!campaignId) throw new Error('campaign tidak ditemukan (campaign_id/nama_campaign salah)')

      const totalAmount = parseInt0(row.jumlah_donasi)
      if (totalAmount <= 0) throw new Error('jumlah_donasi tidak valid')

      const quantity = Math.max(1, parseInt0(row.jumlah_hewan ?? 1))
      const paymentStatus = PAYMENT_STATUS_MAP[(row.status_bayar || '').toLowerCase().trim()] || 'UNPAID'
      const orderNumber = (row.nomor_donasi || '').trim() || generateOrderNumber()

      const dup = await prisma.donation.findUnique({ where: { orderNumber }, select: { id: true } })
      if (dup) throw new Error(`nomor_donasi "${orderNumber}" sudah ada`)

      await prisma.donation.create({
        data: {
          orderNumber,
          campaignId,
          customerName: namaDonatur,
          phone: wa,
          whatsapp: wa,
          qurbanName: row.atas_nama?.trim() || null,
          quantity,
          totalAmount,
          paymentMethod: row.metode_bayar?.trim() || null,
          paymentStatus,
          createdAt: parseDate(row.tanggal_donasi),
        },
      })
      successCount++
    } catch (e) {
      failed.push({ row: rowNum, reason: e instanceof Error ? e.message : 'Gagal' })
    }
  }

  const result: ImportResult = { success: successCount, failed }
  return NextResponse.json(result)
}
