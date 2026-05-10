import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { checkLapanganCode } from '@/lib/lapangan-auth'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024 // 4MB — field photos can be larger

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
    return NextResponse.json({ error: 'Ukuran file maksimal 4MB.' }, { status: 400 })
  }

  const ext = extname(file.name) || '.jpg'
  const filename = `${Date.now()}${ext}`.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase()
  const dir = join(process.cwd(), 'public', 'uploads', 'lapangan')
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(dir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/lapangan/${filename}` })
}
