import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { loadImage } from 'canvas'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_KIND = ['logo_utama', 'logo_tambahan', 'ttd', 'cap', 'custom']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const kindRaw = String(formData.get('kind') || 'custom')
  const kind = ALLOWED_KIND.includes(kindRaw) ? kindRaw : 'custom'

  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Format harus PNG, JPG, atau WebP' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File terlalu besar (maks 2MB)' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  let width = 0
  let height = 0
  try {
    const img = await loadImage(bytes)
    width = img.width
    height = img.height
  } catch {
    return NextResponse.json({ error: 'File gambar tidak valid' }, { status: 400 })
  }

  const ext = extname(file.name).toLowerCase() || '.png'
  const filename = `${kind}-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'laporan', 'assets')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), bytes)

  return NextResponse.json({
    url: `/uploads/laporan/assets/${filename}`,
    width,
    height,
    kind,
  })
}
