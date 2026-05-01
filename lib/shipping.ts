export const BANDUNG_RAYA_CITIES = [
  'Kota Bandung',
  'Kabupaten Bandung',
  'Kabupaten Bandung Barat',
  'Kota Cimahi',
  'Kabupaten Sumedang',
] as const

export const SHIPPING_COST_OUTSIDE = 150_000

export function calculateShipping(city: string): number {
  const normalized = city.trim().toLowerCase()
  const isBandungRaya = BANDUNG_RAYA_CITIES.some((c) =>
    normalized.includes(c.toLowerCase().replace('kota ', '').replace('kabupaten ', ''))
  )
  return isBandungRaya ? 0 : SHIPPING_COST_OUTSIDE
}

export function formatShippingLabel(cost: number): string {
  return cost === 0
    ? '✅ Gratis ongkir Bandung Raya!'
    : `🚚 +Rp ${cost.toLocaleString('id-ID')} ongkir luar Bandung Raya`
}
