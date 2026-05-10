import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_LAPANGAN_CODE, LAPANGAN_CODE_KEY } from '@/lib/lapangan-auth'
import { parseTags } from '@/lib/pengiriman'

export const dynamic = 'force-dynamic'

type Mode = 'task' | 'reminder'

function formatPhoneWa(s: string): string {
  return s.replace(/\D/g, '').replace(/^0/, '62')
}

function formatTanggal(d: Date | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const pengirimanId = String(body.pengirimanId || '').trim()
  const mode: Mode = body.mode === 'reminder' ? 'reminder' : 'task'
  if (!pengirimanId) {
    return NextResponse.json({ error: 'pengirimanId wajib diisi' }, { status: 400 })
  }

  const item = await prisma.pengiriman.findUnique({
    where: { id: pengirimanId },
    include: { pic: true },
  })
  if (!item) return NextResponse.json({ error: 'Pengiriman tidak ditemukan' }, { status: 404 })
  if (!item.pic) return NextResponse.json({ error: 'Pengiriman ini belum punya PIC' }, { status: 400 })

  const codeRow = await prisma.settings.findUnique({ where: { key: LAPANGAN_CODE_KEY } })
  const accessCode = (codeRow?.value || DEFAULT_LAPANGAN_CODE).trim()

  const tags = parseTags(item.nomorTagHewan)
  const tagStr = tags.length ? tags.join(', ') : '-'
  const alamatFull = [item.alamatLengkap, item.kecamatan, item.kota].filter(Boolean).join(', ') || '-'
  const tanggal = formatTanggal(item.tanggalKirim)
  const jam = item.jamKirim || '-'

  let message: string
  if (mode === 'reminder') {
    message =
      `Pengingat 🔔\n\n` +
      `Kak ${item.pic.nama}, jangan lupa pengiriman:\n` +
      `${item.namaPemesan || '(tanpa nama)'} — ${[item.alamatLengkap, item.kota].filter(Boolean).join(', ') || '-'}\n` +
      `Tanggal: ${tanggal} | Jam: ${jam}\n` +
      `Tag: ${tagStr}\n\n` +
      `Link lapangan: beyondqurban.com/lapangan\n` +
      `Kode: ${accessCode}`
  } else {
    message =
      `Assalamu'alaikum Kak ${item.pic.nama} 👋\n\n` +
      `Anda mendapat tugas pengiriman hewan qurban:\n\n` +
      `📋 *DETAIL PENGIRIMAN*\n` +
      `Nama Pemesan: ${item.namaPemesan || '(tanpa nama)'}\n` +
      `No WA: ${item.noWhatsapp}\n` +
      `Alamat: ${alamatFull}\n` +
      `📍 Maps: ${item.gmapsPin || '-'}\n\n` +
      `🐑 *DATA HEWAN*\n` +
      `Jenis: ${item.jenisHewan}\n` +
      `Jumlah: ${item.jumlahHewan} ekor\n` +
      `Tag: ${tagStr}\n` +
      `Atas Nama: ${item.atasNama || '-'}\n\n` +
      `📅 *JADWAL*\n` +
      `Tanggal: ${tanggal}\n` +
      `Jam: ${jam}\n` +
      `No Kendaraan: ${item.noKendaraan || 'Belum ditentukan'}\n\n` +
      `📝 *Catatan:*\n${item.catatan || '-'}\n\n` +
      `🔗 *Panduan tim lapangan:*\n` +
      `beyondqurban.com/lapangan\n\n` +
      `Kode akses: ${accessCode}\n\n` +
      `Mohon konfirmasi penerimaan tugas ini.\n` +
      `Jazakallah khairan 🤲`
  }

  const phone = formatPhoneWa(item.pic.noTelepon)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return NextResponse.json({ url, picName: item.pic.nama, mode })
}
