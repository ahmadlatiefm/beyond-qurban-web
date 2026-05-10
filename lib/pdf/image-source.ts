import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Resolve image src for @react-pdf/renderer. PDFs generated server-side
 * need either an absolute http(s) URL or a file:// path / data URI.
 *
 * Uploads in this project live under public/uploads, surfaced via /uploads/...
 * URLs. Reading them off disk avoids cycling through the gateway.
 */
export async function resolvePdfImageSrc(src: string | null | undefined): Promise<string> {
  const v = (src ?? '').trim()
  if (!v) return ''

  // External absolute URL
  if (/^https?:\/\//i.test(v)) return v

  // Local public file (e.g. /logo-gold.png or /uploads/...)
  const cleanPath = v.startsWith('/') ? v : `/${v}`
  const filePath = join(process.cwd(), 'public', cleanPath.replace(/^\/+/, ''))

  try {
    const buf = await readFile(filePath)
    const ext = (cleanPath.split('.').pop() ?? '').toLowerCase()
    const mime =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'gif' ? 'image/gif' :
      'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    // Fallback: return absolute URL using NEXTAUTH_URL so renderer can fetch.
    const base = (process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '')
    return `${base}${cleanPath}`
  }
}
