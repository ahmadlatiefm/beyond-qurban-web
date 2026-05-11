export type FieldAlign = 'left' | 'center' | 'right'

export type LaporanElementType =
  | 'field'
  | 'static_text'
  | 'image'
  | 'line'
  | 'foto_zone'

export interface LaporanFieldElement {
  type: 'field'
  key: string
  x: number
  y: number
  fontSize: number
  fontWeight: 'normal' | 'bold'
  color: string
  align: FieldAlign
  maxWidth?: number
  fontFamily?: string
}

export interface LaporanStaticTextElement {
  type: 'static_text'
  key: string
  content: string
  x: number
  y: number
  fontSize: number
  fontWeight: 'normal' | 'bold'
  color: string
  align: FieldAlign
  maxWidth?: number
  fontFamily?: string
}

export type LaporanImageKind =
  | 'logo_utama'
  | 'logo_tambahan'
  | 'ttd'
  | 'cap'
  | 'custom'

export interface LaporanImageElement {
  type: 'image'
  key: string
  imageKind?: LaporanImageKind
  url: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
}

export interface LaporanLineElement {
  type: 'line'
  key: string
  x: number
  y: number
  width: number
  height: number
  color: string
  rotation?: number
}

export type FotoZoneKey = 'foto_sembelih' | 'foto_distribusi'

export type FotoZoneLayout = 'grid_2x1' | 'grid_2x2' | 'kolom' | 'baris'

export interface LaporanFotoZoneElement {
  type: 'foto_zone'
  key: FotoZoneKey
  label: string
  x: number
  y: number
  width: number
  height: number
  maxFoto: number
  layout: FotoZoneLayout
  border: boolean
  borderColor: string
  gap: number
}

export type LaporanElement =
  | LaporanFieldElement
  | LaporanStaticTextElement
  | LaporanImageElement
  | LaporanLineElement
  | LaporanFotoZoneElement

export interface AvailableLaporanField {
  key: string
  label: string
  example: string
}

export const AVAILABLE_LAPORAN_FIELDS: AvailableLaporanField[] = [
  { key: 'nomor_order',           label: 'Nomor Order',            example: 'Q-2506-0001' },
  { key: 'nama_donatur',          label: 'Nama Donatur',           example: 'Ahmad Latief' },
  { key: 'atas_nama',             label: 'Atas Nama Qurban',       example: 'Keluarga Ahmad' },
  { key: 'nomor_hewan',           label: 'Nomor Hewan',            example: '001' },
  { key: 'lokasi_distribusi',     label: 'Lokasi Distribusi',      example: 'Desa Ciporeat, Jawa Barat' },
  { key: 'tanggal_penyembelihan', label: 'Tanggal Penyembelihan',  example: '10 Mei 2026' },
  { key: 'jenis_hewan',           label: 'Jenis Hewan',            example: 'Domba Premium' },
  { key: 'jumlah_hewan',          label: 'Jumlah Hewan',           example: '1 ekor' },
]

export const FOTO_ZONE_PRESETS: { key: FotoZoneKey; label: string; defaultMax: number }[] = [
  { key: 'foto_sembelih',   label: 'Foto Penyembelihan',         defaultMax: 2 },
  { key: 'foto_distribusi', label: 'Foto Distribusi/Implementasi', defaultMax: 4 },
]

export function defaultField(key: string, xPct = 50, yPct = 50): LaporanFieldElement {
  return {
    type: 'field',
    key,
    x: xPct,
    y: yPct,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B3A2F',
    align: 'center',
    maxWidth: 60,
    fontFamily: 'serif',
  }
}

export function defaultStaticText(key: string, xPct = 50, yPct = 50): LaporanStaticTextElement {
  return {
    type: 'static_text',
    key,
    content: 'Klik untuk edit',
    x: xPct,
    y: yPct,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#1B3A2F',
    align: 'center',
    maxWidth: 60,
    fontFamily: 'serif',
  }
}

export function defaultImageElement(
  imageKind: LaporanImageKind,
  url: string,
  key: string,
  xPct = 50,
  yPct = 50,
): LaporanImageElement {
  const defaults: Record<LaporanImageKind, { width: number; height: number; opacity: number }> = {
    logo_utama:    { width: 18, height: 10, opacity: 100 },
    logo_tambahan: { width: 16, height: 9,  opacity: 100 },
    ttd:           { width: 14, height: 9,  opacity: 100 },
    cap:           { width: 16, height: 16, opacity: 90 },
    custom:        { width: 16, height: 12, opacity: 100 },
  }
  const d = defaults[imageKind]
  return {
    type: 'image',
    key,
    imageKind,
    url,
    x: xPct,
    y: yPct,
    width: d.width,
    height: d.height,
    rotation: 0,
    opacity: d.opacity,
  }
}

export function defaultLineElement(key: string, xPct = 20, yPct = 50): LaporanLineElement {
  return {
    type: 'line',
    key,
    x: xPct,
    y: yPct,
    width: 60,
    height: 0.4,
    color: '#1B3A2F',
    rotation: 0,
  }
}

export function defaultFotoZone(
  zoneKey: FotoZoneKey,
  key: string,
  xPct = 5,
  yPct = 40,
): LaporanFotoZoneElement {
  const preset = FOTO_ZONE_PRESETS.find(p => p.key === zoneKey)
  const isDistribusi = zoneKey === 'foto_distribusi'
  return {
    type: 'foto_zone',
    key: zoneKey,
    label: preset?.label || zoneKey,
    x: isDistribusi ? 52 : 5,
    y: yPct,
    width: 45,
    height: 35,
    maxFoto: preset?.defaultMax ?? 2,
    layout: (preset?.defaultMax ?? 2) >= 4 ? 'grid_2x2' : 'grid_2x1',
    border: true,
    borderColor: '#1B3A2F',
    gap: 4,
  }
}

export function migrateLegacyElement(raw: unknown): LaporanElement | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (
    r.type === 'field' ||
    r.type === 'static_text' ||
    r.type === 'image' ||
    r.type === 'line' ||
    r.type === 'foto_zone'
  ) {
    return r as unknown as LaporanElement
  }
  if (typeof r.key === 'string' && typeof r.x === 'number' && typeof r.fontSize === 'number') {
    return { type: 'field', ...(r as Omit<LaporanFieldElement, 'type'>) }
  }
  return null
}

export function migrateLegacyElements(raw: unknown): LaporanElement[] {
  if (!Array.isArray(raw)) return []
  return raw.map(migrateLegacyElement).filter((x): x is LaporanElement => x !== null)
}

export function getPhotoSlots(
  zoneX: number,
  zoneY: number,
  zoneW: number,
  zoneH: number,
  count: number,
  layout: FotoZoneLayout,
  gap = 0,
): { x: number; y: number; w: number; h: number }[] {
  if (count <= 0) return []
  if (count === 1) return [{ x: zoneX, y: zoneY, w: zoneW, h: zoneH }]

  let cols = 1
  let rows = count
  if (layout === 'grid_2x1') {
    cols = 2
    rows = Math.ceil(count / 2)
  } else if (layout === 'grid_2x2') {
    cols = 2
    rows = Math.ceil(count / 2)
  } else if (layout === 'baris') {
    cols = count
    rows = 1
  } else {
    cols = 1
    rows = count
  }

  const totalGapX = gap * (cols - 1)
  const totalGapY = gap * (rows - 1)
  const slotW = (zoneW - totalGapX) / cols
  const slotH = (zoneH - totalGapY) / rows

  const slots: { x: number; y: number; w: number; h: number }[] = []
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    slots.push({
      x: zoneX + c * (slotW + gap),
      y: zoneY + r * (slotH + gap),
      w: slotW,
      h: slotH,
    })
  }
  return slots
}
