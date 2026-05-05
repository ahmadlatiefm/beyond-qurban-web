/**
 * Apply global discount from Settings to a price.
 * Returns { finalPrice, discountAmount, discountLabel }
 */
export function applyGlobalDiscount(
  price: number,
  settingsMap: Record<string, string>
): { finalPrice: number; discountAmount: number; discountLabel: string | null } {
  const enabled = settingsMap.diskon_global_enabled === 'true'
  if (!enabled) return { finalPrice: price, discountAmount: 0, discountLabel: null }

  // Check date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = settingsMap.diskon_start ? new Date(settingsMap.diskon_start) : null
  const end = settingsMap.diskon_end ? new Date(settingsMap.diskon_end) : null
  if (start && today < start) return { finalPrice: price, discountAmount: 0, discountLabel: null }
  if (end && today > end) return { finalPrice: price, discountAmount: 0, discountLabel: null }

  const type = settingsMap.diskon_type ?? 'persen'
  const value = parseInt(settingsMap.diskon_value ?? '0') || 0

  let discountAmount = 0
  if (type === 'nominal') {
    discountAmount = Math.min(value, price)
  } else {
    discountAmount = Math.round(price * (value / 100))
  }

  return {
    finalPrice: price - discountAmount,
    discountAmount,
    discountLabel: type === 'nominal' ? `Diskon Rp ${value.toLocaleString('id-ID')}` : `Diskon ${value}%`,
  }
}

/**
 * Validate and apply a voucher code from the vouchers JSON stored in Settings.
 * Returns discount amount or 0 if invalid.
 */
export function applyVoucher(
  vouchersJson: string | undefined,
  code: string,
  subtotal: number
): { discountAmount: number; error: string | null } {
  if (!code) return { discountAmount: 0, error: null }
  let vouchers: { code: string; disc: number; minBuy: number; maxUse: number; used: number }[] = []
  try { vouchers = JSON.parse(vouchersJson ?? '[]') } catch {}

  const v = vouchers.find(x => x.code === code.toUpperCase())
  if (!v) return { discountAmount: 0, error: 'Kode voucher tidak ditemukan' }
  if (v.used >= v.maxUse) return { discountAmount: 0, error: 'Voucher sudah habis digunakan' }
  if (subtotal < v.minBuy) return { discountAmount: 0, error: `Minimum pembelian Rp ${v.minBuy.toLocaleString('id-ID')}` }

  const discountAmount = Math.round(subtotal * (v.disc / 100))
  return { discountAmount, error: null }
}
