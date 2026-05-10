import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSertifikatPng } from '@/lib/sertifikat/generate'
import { migrateLegacyElements, type SertifikatElement } from '@/lib/sertifikat/types'

export const dynamic = 'force-dynamic'

const DUMMY_DATA: Record<string, string> = {
  nama_pembeli: 'Ahmad Latief',
  atas_nama: 'Keluarga Bahagia',
  jenis_hewan: 'Domba Premium',
  jumlah_hewan: '1 ekor',
  nomor_order: 'BQ-2026-0001',
  tanggal: '9 Mei 2026',
  total_harga: 'Rp 3.500.000',
  berat_hewan: '32 kg',
  lokasi_penyaluran: 'Desa Baranusa, NTT',
  nomor_sertifikat: 'BQ-SRT-2026-0001',
  campaign: 'Qurban Pelosok Indonesia',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as
    | { blankoUrl: string; fields: SertifikatElement[]; data?: Record<string, string> }
    | null
  if (!body || !body.blankoUrl || !Array.isArray(body.fields)) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const data = { ...DUMMY_DATA, ...(body.data || {}) }
  const elements = migrateLegacyElements(body.fields)

  try {
    const { buffer } = await generateSertifikatPng({
      blankoUrl: body.blankoUrl,
      fields: elements,
      data,
    })
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal generate preview'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
