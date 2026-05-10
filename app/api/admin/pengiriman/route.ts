import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/pengiriman'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.pengiriman.findMany({
    orderBy: { createdAt: 'desc' },
    include: { pic: true },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const noWhatsapp = String(body.noWhatsapp || '').trim()
  if (!noWhatsapp) {
    return NextResponse.json({ error: 'noWhatsapp wajib diisi' }, { status: 400 })
  }

  const tanggalKirim = body.tanggalKirim ? new Date(body.tanggalKirim) : null
  const tags = parseTags(body.nomorTagHewan)

  const created = await prisma.pengiriman.create({
    data: {
      namaPemesan: body.namaPemesan?.trim() || null,
      noWhatsapp,
      alamatLengkap: body.alamatLengkap?.trim() || null,
      kecamatan: body.kecamatan?.trim() || null,
      kota: body.kota?.trim() || null,
      gmapsPin: body.gmapsPin?.trim() || null,
      catatan: body.catatan?.trim() || null,
      jenisHewan: body.jenisHewan?.trim() || 'Domba',
      jumlahHewan: Number(body.jumlahHewan) || 1,
      beratHewan: body.beratHewan?.trim() || null,
      nomorTagHewan: tags,
      atasNama: body.atasNama?.trim() || null,
      totalHarga: Number(body.totalHarga) || 0,
      statusBayar: body.statusBayar || 'belum_bayar',
      jumlahDP: body.jumlahDP != null && body.jumlahDP !== '' ? Number(body.jumlahDP) : null,
      sisaPembayaran: body.sisaPembayaran != null && body.sisaPembayaran !== '' ? Number(body.sisaPembayaran) : null,
      metodeBayar: body.metodeBayar?.trim() || null,
      tanggalBayar: body.tanggalBayar ? new Date(body.tanggalBayar) : null,
      buktiTransfer: body.buktiTransfer?.trim() || null,
      tanggalKirim,
      jamKirim: body.jamKirim?.trim() || null,
      statusKirim: body.statusKirim || 'menunggu_data',
      namaPengirim: body.namaPengirim?.trim() || null,
      noKendaraan: body.noKendaraan?.trim() || null,
      sumber: body.sumber || 'offline',
      orderId: body.orderId?.trim() || null,
      createdBy: session.user?.email || null,
      picId: body.picId?.trim() || null,
    },
    include: { pic: true },
  })

  return NextResponse.json(created, { status: 201 })
}
