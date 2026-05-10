import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWhatsApp, normalizePhone } from '@/lib/onesender'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: { to?: string; message?: string } = {}
  try { body = await req.json() } catch {}

  const to = (body.to ?? '').trim()
  if (!to) return NextResponse.json({ success: false, error: 'Nomor WA wajib diisi' }, { status: 400 })

  const phone = normalizePhone(to)
  if (phone.length < 10) return NextResponse.json({ success: false, error: 'Nomor WA tidak valid' }, { status: 400 })

  const message = body.message || 'Halo! Ini pesan test dari Beyond Qurban ✅'
  const result = await sendWhatsApp(phone, message)

  return NextResponse.json({ ...result, normalizedPhone: phone })
}
