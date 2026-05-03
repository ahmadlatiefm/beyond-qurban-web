const BANDUNG_RAYA = [
  'kota bandung',
  'kabupaten bandung',
  'kab. bandung',
  'kab bandung',
  'kabupaten bandung barat',
  'kab. bandung barat',
  'kab bandung barat',
  'cimahi',
  'sumedang',
]

export function calculateShipping(city: string): number {
  const normalized = city.toLowerCase().trim()
  const isBandungRaya = BANDUNG_RAYA.some(area => normalized.includes(area))
  return isBandungRaya ? 0 : 150000
}
