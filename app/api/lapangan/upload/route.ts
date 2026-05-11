import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { checkLapanganCode } from '@/lib/lapangan-auth'
import { compressToTarget, formatBytes, reductionPercent } from '@/lib/compress-image'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB pre-compression — field photos can be large

export async function POST(req: NextRequest) {
  if (!(await checkLapanganCode(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 8MB.' }, { status: 400 })
  }

  const filename = `${Date.now()}.webp`
  const dir = join(process.cwd(), 'public', 'uploads', 'lapangan')
  const originalSize = file.size
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await compressToTarget(buffer, join(dir, filename), {
      maxWidth: 1200,
      maxHeight: 1200,
      targetSizeBytes: 150 * 1024,
    })
    return NextResponse.json({
      url: `/uploads/lapangan/${filename}`,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(result.size),
      reduction: reductionPercent(originalSize, result.size),
      quality: result.quality,
    })
  } catch (err) {
    console.error('lapangan upload compress error', err)
    return NextResponse.json({ error: 'Gagal memproses gambar' }, { status: 500 })
  }
}
