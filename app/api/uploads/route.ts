import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { compressToTarget, formatBytes, reductionPercent } from '@/lib/compress-image'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB pre-compression

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 8MB.' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const rawFolder = searchParams.get('folder') ?? ''
  const safeFolder = rawFolder.replace(/[^a-z0-9-]/gi, '').toLowerCase()

  const filename = `${Date.now()}.webp`
  const uploadDir = safeFolder
    ? join(process.cwd(), 'public', 'uploads', safeFolder)
    : join(process.cwd(), 'public', 'uploads')

  const originalSize = file.size
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await compressToTarget(buffer, join(uploadDir, filename), {
      maxWidth: 1600,
      maxHeight: 1600,
      targetSizeBytes: 150 * 1024,
    })
    const url = safeFolder ? `/uploads/${safeFolder}/${filename}` : `/uploads/${filename}`
    return NextResponse.json({
      url,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(result.size),
      reduction: reductionPercent(originalSize, result.size),
      quality: result.quality,
    })
  } catch (err) {
    console.error('uploads compress error', err)
    return NextResponse.json({ error: 'Gagal memproses gambar' }, { status: 500 })
  }
}
