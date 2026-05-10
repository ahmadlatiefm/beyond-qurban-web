import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'

const DEFAULT_MIME = ['image/jpeg', 'image/png', 'image/webp']
// Branding folders accept extra formats (SVG for logos, ICO for favicons) and
// are sized to whatever the spec for that asset is.
const LOGO_MIME = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
const FAVICON_MIME = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
const DEFAULT_MAX = 3 * 1024 * 1024
const LOGO_MAX = 2 * 1024 * 1024
const FAVICON_MAX = 500 * 1024

export async function POST(req: NextRequest) {
  // Require admin session
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'general'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  let allowedMime = DEFAULT_MIME
  let maxSize = DEFAULT_MAX
  let formatHint = 'JPG/PNG/WebP'
  let sizeHint = '3MB'
  if (folder === 'logo') {
    allowedMime = LOGO_MIME
    maxSize = LOGO_MAX
    formatHint = 'PNG/SVG/JPG/WebP'
    sizeHint = '2MB'
  } else if (folder === 'favicon') {
    allowedMime = FAVICON_MIME
    maxSize = FAVICON_MAX
    formatHint = 'PNG/ICO'
    sizeHint = '500KB'
  }

  if (!allowedMime.includes(file.type)) return NextResponse.json({ error: `Format tidak didukung (${formatHint})` }, { status: 400 })
  if (file.size > maxSize) return NextResponse.json({ error: `File terlalu besar (maks ${sizeHint})` }, { status: 400 })

  // Sanitize folder name — only allow alphanumeric and hyphens
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').substring(0, 32) || 'general'

  const ext = extname(file.name) || '.jpg'
  const filename = `${safeFolder}-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', safeFolder)
  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/${safeFolder}/${filename}` })
}
