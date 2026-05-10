import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PUBLIC_FIELDS = {
  id: true,
  token: true,
  namaPemesan: true,
  noWhatsapp: true,
  alamatLengkap: true,
  kecamatan: true,
  kota: true,
  gmapsPin: true,
  catatan: true,
  atasNama: true,
  jenisHewan: true,
  jumlahHewan: true,
  beratHewan: true,
  nomorTagHewan: true,
  statusKirim: true,
  tanggalKirim: true,
  jamKirim: true,
  requestTanggalKirim: true,
  requestJamKirim: true,
  formDiisi: true,
  formDiisiAt: true,
  fotoSerahTerima: true,
} as const

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const item = await prisma.pengiriman.findUnique({
    where: { token: params.token },
    select: PUBLIC_FIELDS,
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const item = await prisma.pengiriman.findUnique({ where: { token: params.token } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Lock editing within H-3 of scheduled delivery
  if (item.tanggalKirim) {
    const threshold = new Date(item.tanggalKirim)
    threshold.setDate(threshold.getDate() - 3)
    if (Date.now() > threshold.getTime() && item.formDiisi) {
      return NextResponse.json(
        { error: 'Form sudah dikunci. Hubungi CS untuk perubahan.' },
        { status: 409 },
      )
    }
  }

  const body = await req.json().catch(() => ({}))
  const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const namaPemesan = trim(body.namaPemesan)
  const noWhatsapp = trim(body.noWhatsapp)
  const alamatLengkap = trim(body.alamatLengkap)

  if (!namaPemesan || !noWhatsapp || !alamatLengkap) {
    return NextResponse.json({ error: 'Nama, WhatsApp, dan Alamat wajib diisi' }, { status: 400 })
  }

  // Customer-requested delivery slot. Always recorded so admin can see the
  // original request even if they later override the schedule. Only mirrored
  // into tanggalKirim/jamKirim when admin hasn't confirmed a date yet — once
  // admin sets tanggalKirim, customer's request becomes advisory only.
  const reqTglRaw = trim(body.requestTanggalKirim)
  const reqJamRaw = trim(body.requestJamKirim)
  const reqTglDate = reqTglRaw ? new Date(reqTglRaw) : null
  const reqJam = reqJamRaw || null
  const adminLockedDate = item.tanggalKirim != null

  const data: Record<string, unknown> = {
    namaPemesan,
    noWhatsapp,
    alamatLengkap,
    kecamatan: trim(body.kecamatan) || null,
    kota: trim(body.kota) || null,
    gmapsPin: trim(body.gmapsPin) || null,
    atasNama: trim(body.atasNama) || null,
    catatan: trim(body.catatan) || null,
    formDiisi: true,
    formDiisiAt: item.formDiisiAt ?? new Date(),
    // Move out of "menunggu_data" once consumer fills the form
    statusKirim: item.statusKirim === 'menunggu_data' ? 'belum_dijadwalkan' : item.statusKirim,
  }

  // Always preserve customer's request for the audit trail.
  if (body.requestTanggalKirim !== undefined) data.requestTanggalKirim = reqTglDate
  if (body.requestJamKirim !== undefined) data.requestJamKirim = reqJam

  // If admin hasn't scheduled, mirror the request into the working schedule
  // so the date shows up in lapangan filters and admin lists.
  if (!adminLockedDate && reqTglDate) {
    data.tanggalKirim = reqTglDate
    data.jamKirim = reqJam
  }

  const updated = await prisma.pengiriman.update({
    where: { token: params.token },
    data,
    select: PUBLIC_FIELDS,
  })

  return NextResponse.json(updated)
}
