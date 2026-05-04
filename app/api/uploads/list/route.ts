import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const files = await readdir(uploadDir)
    const imageFiles = files
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => `/uploads/${f}`)
      .reverse() // newest first
    return NextResponse.json({ files: imageFiles })
  } catch {
    return NextResponse.json({ files: [] })
  }
}
