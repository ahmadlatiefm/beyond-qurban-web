export const STATUS_BAYAR = ['belum_bayar', 'dp', 'lunas'] as const
export const STATUS_KIRIM = [
  'menunggu_data',
  'belum_dijadwalkan',
  'dijadwalkan',
  'dalam_perjalanan',
  'terkirim',
] as const

export type StatusBayar = typeof STATUS_BAYAR[number]
export type StatusKirim = typeof STATUS_KIRIM[number]

export const STATUS_BAYAR_LABEL: Record<StatusBayar, string> = {
  belum_bayar: 'Belum Bayar',
  dp: 'DP',
  lunas: 'Lunas',
}

export const STATUS_BAYAR_CLS: Record<StatusBayar, string> = {
  belum_bayar: 'bg-red-100 text-red-700',
  dp: 'bg-amber-100 text-amber-700',
  lunas: 'bg-emerald-100 text-emerald-700',
}

export const STATUS_KIRIM_LABEL: Record<StatusKirim, string> = {
  menunggu_data: 'Menunggu Data',
  belum_dijadwalkan: 'Belum Dijadwalkan',
  dijadwalkan: 'Dijadwalkan',
  dalam_perjalanan: 'Dalam Perjalanan',
  terkirim: 'Terkirim',
}

export const STATUS_KIRIM_CLS: Record<StatusKirim, string> = {
  menunggu_data: 'bg-slate-100 text-slate-700',
  belum_dijadwalkan: 'bg-amber-100 text-amber-700',
  dijadwalkan: 'bg-blue-100 text-blue-700',
  dalam_perjalanan: 'bg-purple-100 text-purple-700',
  terkirim: 'bg-emerald-100 text-emerald-700',
}

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {}
  }
  return []
}

export function siteOrigin(req: Request) {
  const fromHeader = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (fromHeader) return `${proto}://${fromHeader}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondqurban.com'
}

export function buildPengirimanLink(token: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/pengiriman/${token}`
}
