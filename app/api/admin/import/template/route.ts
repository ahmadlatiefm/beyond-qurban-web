import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PESANAN_TEMPLATE = [
  'nomor_order,nama_pembeli,no_whatsapp,produk_id,nama_produk,jumlah,total_harga,status_bayar,metode_bayar,tanggal_pesan,atas_nama,alamat,catatan',
  ',Ahmad Latief,081234567890,,Domba Premium,1,1900000,PAID,Transfer BCA,2026-05-09,Keluarga Ahmad,Jl. Mawar No. 12 Bandung,',
  ',Siti Nurhasanah,082345678901,,Kambing Standar,2,3800000,UNPAID,,2026-05-10,,,catatan opsional',
].join('\n')

const PENYALURAN_TEMPLATE = [
  'nomor_donasi,nama_donatur,no_whatsapp,campaign_id,nama_campaign,jumlah_donasi,jumlah_hewan,status_bayar,metode_bayar,tanggal_donasi,atas_nama,catatan',
  ',Budi Santoso,083456789012,,Layarkan Qurban Ke Pedalaman Indonesia,1900000,1,PAID,Transfer Mandiri,2026-05-09,Keluarga Budi,',
  ',Dewi Lestari,084567890123,,Layarkan Qurban Ke Pedalaman Indonesia,3800000,2,UNPAID,,2026-05-10,,patungan keluarga',
].join('\n')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tipe = req.nextUrl.searchParams.get('tipe')
  const csv = tipe === 'penyaluran' ? PENYALURAN_TEMPLATE : PESANAN_TEMPLATE
  const filename = tipe === 'penyaluran' ? 'template-penyaluran.csv' : 'template-pesanan.csv'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
