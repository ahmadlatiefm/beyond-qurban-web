import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB for proofs

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const orderNumber = String(formData.get('orderNumber') ?? '').trim()

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File terlalu besar (max 5MB)' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const isAdmin = !!session?.user

  if (!isAdmin) {
    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber wajib disertakan' }, { status: 400 })
    }

    const rl = rateLimit(`proof-upload:${orderNumber}`, 5, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Terlalu banyak upload. Coba lagi dalam ${Math.ceil(rl.retryAfterSec / 60)} menit.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { paymentStatus: true },
    })
    const donation = order
      ? null
      : await prisma.donation.findUnique({
          where: { orderNumber },
          select: { paymentStatus: true },
        })
    const status = order?.paymentStatus ?? donation?.paymentStatus
    if (!status) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 403 })
    }
    if (status !== 'UNPAID' && status !== 'DP') {
      return NextResponse.json({ error: 'Pesanan tidak dalam status menunggu pembayaran' }, { status: 403 })
    }
  }

  const ext = extname(file.name) || '.jpg'
  const filename = `proof-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'proofs')
  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))
  return NextResponse.json({ url: `/uploads/proofs/${filename}` })
}
