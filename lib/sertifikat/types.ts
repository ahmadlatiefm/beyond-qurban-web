export type SertifikatTipe = 'pembelian' | 'qurban'

export type FieldAlign = 'left' | 'center' | 'right'

export type SertifikatElementType = 'field' | 'static_text' | 'image'

export interface SertifikatFieldElement {
  type: 'field'
  key: string
  label?: string
  x: number
  y: number
  fontSize: number
  fontWeight: 'normal' | 'bold'
  color: string
  align: FieldAlign
  maxWidth?: number
  fontFamily?: string
}

export interface SertifikatStaticTextElement {
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

export type SertifikatImageKind = 'logo_utama' | 'logo_tambahan' | 'ttd' | 'cap' | 'custom'

export interface SertifikatImageElement {
  type: 'image'
  key: string
  imageKind?: SertifikatImageKind
  url: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
}

export type SertifikatElement =
  | SertifikatFieldElement
  | SertifikatStaticTextElement
  | SertifikatImageElement

// Backwards-compat alias — old code referenced `SertifikatField` for the array element.
export type SertifikatField = SertifikatElement

export interface AvailableField {
  key: string
  label: string
  example: string
  tipe: SertifikatTipe | 'both'
}

export const AVAILABLE_FIELDS: AvailableField[] = [
  { key: 'nama_pembeli',       label: 'Nama Pembeli',        example: 'Ahmad Latief',        tipe: 'both' },
  { key: 'atas_nama',          label: 'Atas Nama Qurban',    example: 'Keluarga Bahagia',    tipe: 'both' },
  { key: 'jenis_hewan',        label: 'Jenis Hewan',         example: 'Domba Premium',       tipe: 'both' },
  { key: 'jumlah_hewan',       label: 'Jumlah Hewan',        example: '1 ekor',              tipe: 'both' },
  { key: 'nomor_order',        label: 'Nomor Order',         example: 'BQ-2026-0001',        tipe: 'pembelian' },
  { key: 'nomor_sertifikat',   label: 'Nomor Sertifikat',    example: 'BQ-SRT-2026-0001',    tipe: 'qurban' },
  { key: 'tanggal',            label: 'Tanggal',             example: '9 Mei 2026',          tipe: 'both' },
  { key: 'lokasi_penyaluran',  label: 'Lokasi Penyaluran',   example: 'Pelosok Indonesia',   tipe: 'qurban' },
  { key: 'total_harga',        label: 'Total Harga',         example: 'Rp 3.500.000',        tipe: 'pembelian' },
  { key: 'campaign',           label: 'Nama Program',        example: 'Qurban Pelosok',      tipe: 'qurban' },
  { key: 'berat_hewan',        label: 'Berat Hewan',         example: '23 kg',               tipe: 'pembelian' },
]

export function fieldsForTipe(tipe: SertifikatTipe): AvailableField[] {
  return AVAILABLE_FIELDS.filter(f => f.tipe === tipe || f.tipe === 'both')
}

export function defaultField(key: string, xPct = 50, yPct = 50): SertifikatFieldElement {
  return {
    type: 'field',
    key,
    x: xPct,
    y: yPct,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B3A2F',
    align: 'center',
    maxWidth: 70,
    fontFamily: 'serif',
  }
}

export function defaultStaticText(key: string, xPct = 50, yPct = 50): SertifikatStaticTextElement {
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
  imageKind: SertifikatImageKind,
  url: string,
  key: string,
  xPct = 50,
  yPct = 50,
): SertifikatImageElement {
  const defaults: Record<SertifikatImageKind, { width: number; height: number; opacity: number }> = {
    logo_utama:    { width: 20, height: 12, opacity: 100 },
    logo_tambahan: { width: 18, height: 10, opacity: 100 },
    ttd:           { width: 15, height: 10, opacity: 100 },
    cap:           { width: 18, height: 18, opacity: 90 },
    custom:        { width: 18, height: 12, opacity: 100 },
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

/** Migrate legacy field shape (no `type` key) to new union form. */
export function migrateLegacyElement(raw: unknown): SertifikatElement | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.type === 'field' || r.type === 'static_text' || r.type === 'image') {
    return r as unknown as SertifikatElement
  }
  // Legacy: no type, but has key + x/y/fontSize → treat as field
  if (typeof r.key === 'string' && typeof r.x === 'number' && typeof r.fontSize === 'number') {
    return { type: 'field', ...(r as Omit<SertifikatFieldElement, 'type'>) }
  }
  return null
}

export function migrateLegacyElements(raw: unknown): SertifikatElement[] {
  if (!Array.isArray(raw)) return []
  return raw.map(migrateLegacyElement).filter((x): x is SertifikatElement => x !== null)
}
