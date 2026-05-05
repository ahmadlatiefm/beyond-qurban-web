'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function saveSettings(settings: Record<string, string>) {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
  revalidatePath('/admin/pengaturan')
}

/** Validate a voucher code server-side and return discount amount */
export async function validateVoucherCode(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discountAmount: number; discountPct: number; error: string | null }> {
  if (!code.trim()) return { valid: false, discountAmount: 0, discountPct: 0, error: null }

  const row = await prisma.settings.findUnique({ where: { key: 'vouchers' } })
  let vouchers: { code: string; disc: number; minBuy: number; maxUse: number; used: number }[] = []
  try { vouchers = JSON.parse(row?.value ?? '[]') } catch {}

  const v = vouchers.find(x => x.code === code.toUpperCase().trim())
  if (!v) return { valid: false, discountAmount: 0, discountPct: 0, error: 'Kode voucher tidak ditemukan' }
  if (v.used >= v.maxUse) return { valid: false, discountAmount: 0, discountPct: 0, error: 'Voucher sudah habis digunakan' }
  if (subtotal < v.minBuy) return { valid: false, discountAmount: 0, discountPct: 0, error: `Minimum pembelian ${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(v.minBuy)}` }

  const discountAmount = Math.round(subtotal * (v.disc / 100))
  return { valid: true, discountAmount, discountPct: v.disc, error: null }
}
