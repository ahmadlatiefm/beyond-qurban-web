import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateLaporanPng } from '@/lib/laporan/generate'
import { migrateLegacyElements, type LaporanElement, type FotoZoneKey } from '@/lib/laporan/types'

export const dynamic = 'force-dynamic'

const DUMMY_DATA: Record<string, string> = {
  nomor_order: 'Q-2506-0001',
  nama_donatur: 'Ahmad Latief',
  atas_nama: 'Keluarga Ahmad',
  nomor_hewan: '001',
  lokasi_distribusi: 'Desa Ciporeat, Jawa Barat',
  tanggal_penyembelihan: '10 Mei 2026',
  jenis_hewan: 'Domba Premium',
  jumlah_hewan: '1 ekor',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as
    | {
        blankoUrl: string
        elements: LaporanElement[]
        data?: Record<string, string>
        photos?: Partial<Record<FotoZoneKey, string[]>>
      }
    | null
  if (!body || !body.blankoUrl || !Array.isArray(body.elements)) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const data = { ...DUMMY_DATA, ...(body.data || {}) }
  const elements = migrateLegacyElements(body.elements)
  const photos: Record<FotoZoneKey, string[]> = {
    foto_sembelih: body.photos?.foto_sembelih ?? [],
    foto_distribusi: body.photos?.foto_distribusi ?? [],
  }

  try {
    const { buffer } = await generateLaporanPng({
      blankoUrl: body.blankoUrl,
      elements,
      data,
      photos,
      placeholderEmpty: true,
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
