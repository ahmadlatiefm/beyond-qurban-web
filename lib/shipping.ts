// Keywords — cek apakah input kota MENGANDUNG salah satu keyword ini
const BANDUNG_RAYA_KEYWORDS = [
  'bandung',   // kota bandung, kab bandung, bandung barat, dst.
  'cimahi',
  'sumedang',
]

export function calculateShipping(city: string): number {
  const normalized = city.toLowerCase().trim()
  const isBandungRaya = BANDUNG_RAYA_KEYWORDS.some(keyword => normalized.includes(keyword))
  return isBandungRaya ? 0 : 150000
}
