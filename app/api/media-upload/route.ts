import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { compressToTarget, formatBytes, reductionPercent } from '@/lib/compress-image'

const DEFAULT_MIME = ['image/jpeg', 'image/png', 'image/webp']
// Branding folders accept extra formats (SVG for logos, ICO for favicons) and
// are sized to whatever the spec for that asset is.
const LOGO_MIME = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
const FAVICON_MIME = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
const DEFAULT_MAX = 8 * 1024 * 1024
const LOGO_MAX = 2 * 1024 * 1024
const FAVICON_MAX = 500 * 1024

const RAW_PASSTHROUGH_MIME = new Set([
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

export async function POST(req: NextRequest) {
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
  let sizeHint = '8MB'
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

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').substring(0, 32) || 'general'
  const uploadDir = join(process.cwd(), 'public', 'uploads', safeFolder)
  const originalSize = file.size
  const buffer = Buffer.from(await file.arrayBuffer())

  if (RAW_PASSTHROUGH_MIME.has(file.type)) {
    const ext = extname(file.name).toLowerCase() || (file.type === 'image/svg+xml' ? '.svg' : '.ico')
    const filename = `${safeFolder}-${Date.now()}${ext}`
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)
    return NextResponse.json({
      url: `/uploads/${safeFolder}/${filename}`,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(originalSize),
      reduction: '0%',
    })
  }

  const filename = `${safeFolder}-${Date.now()}.webp`
  try {
    const result = await compressToTarget(buffer, join(uploadDir, filename), {
      maxWidth: 1600,
      maxHeight: 1600,
      targetSizeBytes: 150 * 1024,
    })
    return NextResponse.json({
      url: `/uploads/${safeFolder}/${filename}`,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(result.size),
      reduction: reductionPercent(originalSize, result.size),
      quality: result.quality,
    })
  } catch (err) {
    console.error('media-upload compress error', err)
    return NextResponse.json({ error: 'Gagal memproses gambar' }, { status: 500 })
  }
}
