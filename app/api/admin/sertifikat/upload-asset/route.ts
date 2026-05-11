import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { join } from 'path'
import sharp from 'sharp'
import { compressAsset, formatBytes, reductionPercent } from '@/lib/compress-image'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024
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
    return NextResponse.json({ error: 'File terlalu besar (maks 4MB)' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  let hasAlpha = false
  try {
    const meta = await sharp(bytes).metadata()
    hasAlpha = meta.hasAlpha || false
  } catch {
    return NextResponse.json({ error: 'File gambar tidak valid' }, { status: 400 })
  }

  const ext = hasAlpha ? '.png' : '.webp'
  const filename = `${kind}-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'sertifikat', 'assets')
  const originalSize = file.size

  try {
    const result = await compressAsset(bytes, join(uploadDir, filename))
    return NextResponse.json({
      url: `/uploads/sertifikat/assets/${filename}`,
      width: result.width,
      height: result.height,
      kind,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(result.size),
      reduction: reductionPercent(originalSize, result.size),
      quality: result.quality,
    })
  } catch (err) {
    console.error('sertifikat upload-asset compress error', err)
    return NextResponse.json({ error: 'Gagal memproses gambar' }, { status: 500 })
  }
}
