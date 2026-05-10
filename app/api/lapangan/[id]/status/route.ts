import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLapanganCode } from '@/lib/lapangan-auth'
import { STATUS_KIRIM, parseTags, type StatusKirim } from '@/lib/pengiriman'
import { sendWhatsApp } from '@/lib/onesender'

export const dynamic = 'force-dynamic'

function buildTransitMessage(p: {
  namaPemesan: string | null
  jumlahHewan: number
  jenisHewan: string
  nomorTagHewan: unknown
  jamKirim: string | null
  pic: { nama: string; noTelepon: string } | null
}): string {
  const tags = parseTags(p.nomorTagHewan)
  const tagSuffix = tags.length ? ` (Tag: ${tags.join(', ')})` : ''
  const picBlock = p.pic
    ? `\n👤 Penanggung Jawab: ${p.pic.nama}\n📞 No. HP PIC: ${p.pic.noTelepon}`
    : ''
  const eta = p.jamKirim || 'Akan segera tiba'
  return (
    `Assalamu'alaikum Kak ${p.namaPemesan || ''} 🐑\n\n` +
    `Hewan qurban Anda sedang dalam perjalanan menuju lokasi Anda.\n\n` +
    `Detail pengiriman:\n` +
    `📦 Hewan: ${p.jumlahHewan}x ${p.jenisHewan}${tagSuffix}` +
    `${picBlock}\n\n` +
    `Estimasi tiba: ${eta}\n\n` +
    `Jika ada pertanyaan, hubungi PIC langsung di nomor di atas.\n\n` +
    `Jazakallah khairan 🤲\n— Tim Beyond Qurban`
  )
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await checkLapanganCode(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const status = String(body.statusKirim || '').trim() as StatusKirim
  if (!STATUS_KIRIM.includes(status)) {
    return NextResponse.json({ error: 'statusKirim tidak valid' }, { status: 400 })
  }
  if (status === 'terkirim' && !body.fotoSerahTerima) {
    return NextResponse.json({ error: 'Foto serah terima wajib untuk status terkirim' }, { status: 400 })
  }
  if (status === 'terkirim' && !String(body.namaPenerima || '').trim()) {
    return NextResponse.json({ error: 'Nama penerima wajib diisi untuk status terkirim' }, { status: 400 })
  }

  const data: Record<string, unknown> = { statusKirim: status }
  if (typeof body.fotoSerahTerima === 'string' && body.fotoSerahTerima.trim()) {
    data.fotoSerahTerima = body.fotoSerahTerima.trim()
  }
  if (typeof body.namaPengirim === 'string') data.namaPengirim = body.namaPengirim.trim() || null
  if (typeof body.noKendaraan === 'string') data.noKendaraan = body.noKendaraan.trim() || null
  if (typeof body.picId === 'string') data.picId = body.picId.trim() || null
  if (typeof body.namaPenerima === 'string') data.namaPenerima = body.namaPenerima.trim() || null
  if (typeof body.noWaPenerima === 'string') data.noWaPenerima = body.noWaPenerima.trim() || null
  if (typeof body.keteranganSerahTerima === 'string') data.keteranganSerahTerima = body.keteranganSerahTerima.trim() || null

  const updated = await prisma.pengiriman.update({
    where: { id: params.id },
    data,
    include: { pic: true },
  })

  // When status flips to "dalam_perjalanan", notify the donor via OneSender.
  // Fire-and-forget — failures are logged but never fail the status update,
  // since the field team's primary need is the state change.
  if (status === 'dalam_perjalanan' && updated.noWhatsapp) {
    void (async () => {
      try {
        const message = buildTransitMessage(updated)
        const result = await sendWhatsApp(updated.noWhatsapp, message)
        if (!result.success) {
          console.warn('[lapangan/status] OneSender transit notif failed', {
            id: updated.id,
            error: result.error,
          })
        }
      } catch (err) {
        console.warn('[lapangan/status] OneSender transit notif threw', {
          id: updated.id,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    })()
  }

  return NextResponse.json(updated)
}
