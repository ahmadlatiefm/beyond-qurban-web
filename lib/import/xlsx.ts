import * as XLSX from 'xlsx-js-style'

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function parseXlsxBuffer(buf: ArrayBuffer | Buffer): Record<string, string | number>[] {
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    blankrows: false,
  })

  return rows.map(row => {
    const out: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(row)) {
      const key = normalizeKey(k)
      if (!key) continue
      if (typeof v === 'number') out[key] = v
      else if (v == null) out[key] = ''
      else out[key] = String(v).trim()
    }
    return out
  }).filter(r => Object.values(r).some(v => v !== '' && v !== 0))
}

export async function parseXlsxRows(req: Request): Promise<Record<string, string | number>[]> {
  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data')) {
    throw new Error('Content-Type harus multipart/form-data')
  }
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) throw new Error('Field "file" tidak ditemukan')
  const buf = await file.arrayBuffer()
  return parseXlsxBuffer(buf)
}
