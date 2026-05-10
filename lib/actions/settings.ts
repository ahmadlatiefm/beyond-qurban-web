'use server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

/**
 * Change the currently signed-in admin's password. Verifies old password
 * with bcrypt.compare before storing the new bcrypt hash.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return { success: false, error: 'Sesi tidak ditemukan — silakan login ulang.' }

  if (!oldPassword || !newPassword) return { success: false, error: 'Password lama dan baru wajib diisi.' }
  if (newPassword.length < 8) return { success: false, error: 'Password baru minimal 8 karakter.' }
  if (oldPassword === newPassword) return { success: false, error: 'Password baru harus berbeda dari password lama.' }

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user) return { success: false, error: 'User tidak ditemukan.' }

  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) return { success: false, error: 'Password lama salah.' }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.adminUser.update({ where: { email }, data: { password: hash } })

  return { success: true }
}
