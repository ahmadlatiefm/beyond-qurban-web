import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB for proofs

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File terlalu besar (max 5MB)' }, { status: 400 })

  const ext = extname(file.name) || '.jpg'
  const filename = `proof-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'proofs')
  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))
  return NextResponse.json({ url: `/uploads/proofs/${filename}` })
}
