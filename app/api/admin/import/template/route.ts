import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx-js-style'

export const dynamic = 'force-dynamic'

type Tipe = 'pesanan' | 'penyaluran'

interface ColumnSpec {
  key: string
  label: string
  description: string
}

const PESANAN_COLUMNS: ColumnSpec[] = [
  { key: 'nomor_order', label: 'nomor_order', description: 'Opsional. Kosongkan untuk auto-generate.' },
  { key: 'nama_pembeli', label: 'nama_pembeli', description: 'Wajib. Nama lengkap pembeli.' },
  { key: 'no_whatsapp', label: 'no_whatsapp', description: 'Wajib. Nomor WA aktif (08xx atau 62xx).' },
  { key: 'produk_id', label: 'produk_id', description: 'Opsional. ID produk dari katalog. Kosongkan jika pakai nama_produk.' },
  { key: 'nama_produk', label: 'nama_produk', description: 'Opsional. Nama produk (akan dicocokkan dengan katalog).' },
  { key: 'jenis_hewan', label: 'jenis_hewan', description: 'Opsional. Contoh: Domba, Kambing, Sapi. Default: domba.' },
  { key: 'jumlah', label: 'jumlah', description: 'Wajib. Jumlah hewan (angka).' },
  { key: 'total_harga', label: 'total_harga', description: 'Wajib. Total harga dalam Rupiah (angka tanpa titik).' },
  { key: 'status_bayar', label: 'status_bayar', description: 'PAID | UNPAID | DP | EXPIRED | REFUNDED. Default: UNPAID.' },
  { key: 'jumlah_dp', label: 'jumlah_dp', description: 'Jumlah DP yang sudah dibayar. Isi jika status_bayar=DP.' },
  { key: 'metode_bayar', label: 'metode_bayar', description: 'Opsional. Contoh: Transfer BCA, Cash, dll.' },
  { key: 'tanggal_pesan', label: 'tanggal_pesan', description: 'Opsional. Format: YYYY-MM-DD atau DD/MM/YYYY.' },
  { key: 'atas_nama', label: 'atas_nama', description: 'Opsional. Nama yang dicantumkan pada sertifikat.' },
  { key: 'alamat', label: 'alamat', description: 'Opsional. Alamat pengiriman.' },
  { key: 'catatan', label: 'catatan', description: 'Opsional. Catatan tambahan.' },
]

const PESANAN_EXAMPLES: Record<string, string | number>[] = [
  {
    nomor_order: '',
    nama_pembeli: 'Ahmad Latief',
    no_whatsapp: '081234567890',
    produk_id: '',
    nama_produk: 'Domba Premium',
    jenis_hewan: 'Domba',
    jumlah: 1,
    total_harga: 1900000,
    status_bayar: 'PAID',
    jumlah_dp: '',
    metode_bayar: 'Transfer BCA',
    tanggal_pesan: '2026-05-09',
    atas_nama: 'Keluarga Ahmad',
    alamat: 'Jl. Mawar No. 12 Bandung',
    catatan: '',
  },
  {
    nomor_order: '',
    nama_pembeli: 'Rizki Maulana',
    no_whatsapp: '085678901234',
    produk_id: '',
    nama_produk: 'Domba Premium',
    jenis_hewan: 'Domba',
    jumlah: 1,
    total_harga: 1900000,
    status_bayar: 'DP',
    jumlah_dp: 1000000,
    metode_bayar: 'Transfer BCA',
    tanggal_pesan: '2026-05-09',
    atas_nama: 'Keluarga Rizki',
    alamat: 'Jl. Anggrek No. 3 Bandung',
    catatan: 'sisa dibayar mendekati hari H',
  },
  {
    nomor_order: '',
    nama_pembeli: 'Siti Nurhasanah',
    no_whatsapp: '082345678901',
    produk_id: '',
    nama_produk: 'Kambing Standar',
    jenis_hewan: 'Kambing',
    jumlah: 2,
    total_harga: 3800000,
    status_bayar: 'UNPAID',
    jumlah_dp: '',
    metode_bayar: '',
    tanggal_pesan: '2026-05-10',
    atas_nama: '',
    alamat: '',
    catatan: 'catatan opsional',
  },
]

const PENYALURAN_COLUMNS: ColumnSpec[] = [
  { key: 'nomor_donasi', label: 'nomor_donasi', description: 'Opsional. Kosongkan untuk auto-generate.' },
  { key: 'nama_donatur', label: 'nama_donatur', description: 'Wajib. Nama lengkap donatur.' },
  { key: 'no_whatsapp', label: 'no_whatsapp', description: 'Wajib. Nomor WA aktif (08xx atau 62xx).' },
  { key: 'campaign_id', label: 'campaign_id', description: 'Opsional. ID campaign. Kosongkan jika pakai nama_campaign.' },
  { key: 'nama_campaign', label: 'nama_campaign', description: 'Opsional. Nama campaign (akan dicocokkan).' },
  { key: 'jumlah_donasi', label: 'jumlah_donasi', description: 'Wajib. Total donasi dalam Rupiah (angka tanpa titik).' },
  { key: 'jumlah_hewan', label: 'jumlah_hewan', description: 'Opsional. Jumlah ekor hewan. Default: 1.' },
  { key: 'jenis_hewan', label: 'jenis_hewan', description: 'Opsional. Contoh: Domba, Kambing, Sapi. Default: domba.' },
  { key: 'atas_nama', label: 'atas_nama', description: 'Opsional. Nama yang dicantumkan pada sertifikat. Default: nama_donatur.' },
  { key: 'status_bayar', label: 'status_bayar', description: 'PAID | UNPAID | DP | EXPIRED | REFUNDED. Default: UNPAID.' },
  { key: 'jumlah_dp', label: 'jumlah_dp', description: 'Jumlah DP yang sudah dibayar. Isi jika status_bayar=DP.' },
  { key: 'metode_bayar', label: 'metode_bayar', description: 'Opsional. Contoh: Transfer Mandiri, dll.' },
  { key: 'tanggal_donasi', label: 'tanggal_donasi', description: 'Opsional. Format: YYYY-MM-DD atau DD/MM/YYYY.' },
  { key: 'catatan', label: 'catatan', description: 'Opsional. Catatan tambahan.' },
]

const PENYALURAN_EXAMPLES: Record<string, string | number>[] = [
  {
    nomor_donasi: '',
    nama_donatur: 'Budi Santoso',
    no_whatsapp: '083456789012',
    campaign_id: '',
    nama_campaign: 'Layarkan Qurban Ke Pedalaman Indonesia',
    jumlah_donasi: 1900000,
    jumlah_hewan: 1,
    jenis_hewan: 'Domba',
    atas_nama: 'Keluarga Budi',
    status_bayar: 'PAID',
    jumlah_dp: '',
    metode_bayar: 'Transfer Mandiri',
    tanggal_donasi: '2026-05-09',
    catatan: '',
  },
  {
    nomor_donasi: '',
    nama_donatur: 'Hendra Wijaya',
    no_whatsapp: '081112223333',
    campaign_id: '',
    nama_campaign: 'Layarkan Qurban Ke Pedalaman Indonesia',
    jumlah_donasi: 1900000,
    jumlah_hewan: 1,
    jenis_hewan: 'Domba',
    atas_nama: 'Keluarga Hendra',
    status_bayar: 'DP',
    jumlah_dp: 1000000,
    metode_bayar: 'Transfer Mandiri',
    tanggal_donasi: '2026-05-09',
    catatan: 'cicilan',
  },
  {
    nomor_donasi: '',
    nama_donatur: 'Dewi Lestari',
    no_whatsapp: '084567890123',
    campaign_id: '',
    nama_campaign: 'Layarkan Qurban Ke Pedalaman Indonesia',
    jumlah_donasi: 3800000,
    jumlah_hewan: 2,
    jenis_hewan: 'Kambing',
    atas_nama: 'Keluarga Dewi',
    status_bayar: 'UNPAID',
    jumlah_dp: '',
    metode_bayar: '',
    tanggal_donasi: '2026-05-10',
    catatan: 'patungan keluarga',
  },
]

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: '1B3A2F' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '0F2820' } },
    bottom: { style: 'thin', color: { rgb: '0F2820' } },
    left: { style: 'thin', color: { rgb: '0F2820' } },
    right: { style: 'thin', color: { rgb: '0F2820' } },
  },
}

const EXAMPLE_STYLE = {
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF7CC' } },
  alignment: { vertical: 'center' },
}

function buildDataSheet(columns: ColumnSpec[], examples: Record<string, string | number>[]) {
  const headers = columns.map(c => c.label)
  const rows: (string | number)[][] = [headers]
  for (const ex of examples) {
    rows.push(columns.map(c => ex[c.key] ?? ''))
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)

  for (let col = 0; col < headers.length; col++) {
    const headerAddr = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[headerAddr]) ws[headerAddr].s = HEADER_STYLE
    for (let row = 1; row <= examples.length; row++) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[addr]) ws[addr].s = EXAMPLE_STYLE
    }
  }

  ws['!cols'] = columns.map(c => {
    let maxLen = c.label.length
    for (const ex of examples) {
      const v = ex[c.key]
      const len = v == null ? 0 : String(v).length
      if (len > maxLen) maxLen = len
    }
    return { wch: Math.min(Math.max(maxLen + 2, 12), 40) }
  })
  ws['!rows'] = [{ hpt: 22 }]

  return ws
}

function buildPanduanSheet(columns: ColumnSpec[]) {
  const rows: (string | number)[][] = [
    ['Kolom', 'Keterangan'],
    ...columns.map(c => [c.label, c.description]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)

  for (let col = 0; col < 2; col++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[addr]) ws[addr].s = HEADER_STYLE
  }

  ws['!cols'] = [{ wch: 22 }, { wch: 80 }]
  ws['!rows'] = [{ hpt: 22 }]

  return ws
}

function buildWorkbook(tipe: Tipe): Buffer {
  const columns = tipe === 'penyaluran' ? PENYALURAN_COLUMNS : PESANAN_COLUMNS
  const examples = tipe === 'penyaluran' ? PENYALURAN_EXAMPLES : PESANAN_EXAMPLES

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildDataSheet(columns, examples), 'Data')
  XLSX.utils.book_append_sheet(wb, buildPanduanSheet(columns), 'Panduan')

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return out as Buffer
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tipeParam = req.nextUrl.searchParams.get('tipe')
  const tipe: Tipe = tipeParam === 'penyaluran' ? 'penyaluran' : 'pesanan'
  const filename = tipe === 'penyaluran' ? 'template-penyaluran.xlsx' : 'template-pesanan.xlsx'

  const buffer = buildWorkbook(tipe)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
