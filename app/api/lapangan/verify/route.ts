import { NextRequest, NextResponse } from 'next/server'
import { getLapanganCode } from '@/lib/lapangan-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const code = String(body.code || '').trim()
  if (!code) return NextResponse.json({ ok: false, error: 'Kode wajib diisi' }, { status: 400 })

  const stored = await getLapanganCode()
  if (code !== stored) {
    return NextResponse.json({ ok: false, error: 'Kode salah' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
