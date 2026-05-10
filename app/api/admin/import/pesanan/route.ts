import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import type { PesananImportRow, ImportResult, ImportFailure } from '@/lib/import/types'

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
  // Try ISO first, then dd/mm/yyyy and dd-mm-yyyy.
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

  const body = await req.json().catch(() => null) as { rows: PesananImportRow[] } | null
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'Body invalid: rows[] required' }, { status: 400 })
  }

  // Pre-load products for name resolution (cheap; small table).
  const products = await prisma.product.findMany({ select: { id: true, name: true } })
  const productByName = new Map(products.map(p => [p.name.toLowerCase().trim(), p.id]))
  const productIds = new Set(products.map(p => p.id))

  const failed: ImportFailure[] = []
  let successCount = 0

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i]
    const rowNum = i + 1
    try {
      const namaPembeli = (row.nama_pembeli || '').trim()
      const wa = normalizeWa(row.no_whatsapp || '')
      if (!namaPembeli) throw new Error('nama_pembeli kosong')
      if (!wa) throw new Error('no_whatsapp tidak valid')

      // Resolve product
      let productId = (row.produk_id || '').trim()
      if (productId && !productIds.has(productId)) {
        productId = ''
      }
      if (!productId && row.nama_produk) {
        const found = productByName.get(row.nama_produk.toLowerCase().trim())
        if (found) productId = found
      }
      if (!productId) throw new Error('produk tidak ditemukan (produk_id/nama_produk salah)')

      const jumlah = Math.max(1, parseInt0(row.jumlah))
      const totalAmount = parseInt0(row.total_harga)
      if (totalAmount <= 0) throw new Error('total_harga tidak valid')

      const paymentStatus = PAYMENT_STATUS_MAP[(row.status_bayar || '').toLowerCase().trim()] || 'UNPAID'

      const orderNumber = (row.nomor_order || '').trim() || generateOrderNumber()

      // Avoid duplicate orderNumber.
      const dup = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } })
      if (dup) throw new Error(`nomor_order "${orderNumber}" sudah ada`)

      await prisma.order.create({
        data: {
          orderNumber,
          customerName: namaPembeli,
          phone: wa,
          whatsapp: wa,
          deliveryMethod: 'ONE_UMMAH',
          qurbanLocation: 'INDONESIA',
          address: row.alamat?.trim() || null,
          sacrificeDate: parseDate(row.tanggal_pesan),
          notes: row.catatan?.trim() || row.atas_nama?.trim() || null,
          productId,
          quantity: jumlah,
          shippingCost: 0,
          totalAmount,
          paymentMethod: row.metode_bayar?.trim() || null,
          paymentStatus,
          createdAt: parseDate(row.tanggal_pesan),
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
