'use server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  return session
}

async function getOrCreate(donationId: string) {
  const existing = await prisma.laporanDonatur.findUnique({ where: { donationId } })
  if (existing) return existing
  return await prisma.laporanDonatur.create({ data: { donationId } })
}

export async function setFotoPenyembelihan(donationId: string, urls: string[]) {
  await requireAdmin()
  await getOrCreate(donationId)
  const cleanUrls = urls.filter(u => typeof u === 'string' && u.trim())
  const hasPhotos = cleanUrls.length > 0
  await prisma.laporanDonatur.update({
    where: { donationId },
    data: {
      fotoPenyembelihan: cleanUrls,
      statusPenyembelihan: hasPhotos ? 'disembelih' : 'menunggu',
      assignedAt: hasPhotos ? new Date() : null,
    },
  })
  revalidatePath('/admin/laporan/assign')
}

export async function setPatungan(donationId: string, isPatungan: boolean, names: string[]) {
  await requireAdmin()
  await getOrCreate(donationId)
  await prisma.laporanDonatur.update({
    where: { donationId },
    data: {
      isPatungan,
      namaPatungan: names.filter(n => n.trim()).map(n => n.trim()),
    },
  })
  revalidatePath('/admin/laporan/assign')
}

export async function setLaporanLink(donationId: string, laporanId: string | null) {
  await requireAdmin()
  const ld = await getOrCreate(donationId)
  // If linking to a laporan and the donor already has slaughter photos,
  // promote the status to 'disalurkan' (laporan = distribution evidence).
  const hasPhotos = Array.isArray(ld.fotoPenyembelihan)
    ? (ld.fotoPenyembelihan as unknown[]).length > 0
    : false
  const nextStatus = laporanId
    ? (hasPhotos ? 'disalurkan' : ld.statusPenyembelihan)
    : (hasPhotos ? 'disembelih' : 'menunggu')
  await prisma.laporanDonatur.update({
    where: { donationId },
    data: { laporanId, statusPenyembelihan: nextStatus },
  })
  revalidatePath('/admin/laporan/assign')
}

export async function bulkSetLaporanLink(donationIds: string[], laporanId: string | null) {
  await requireAdmin()
  for (const donationId of donationIds) {
    await setLaporanLink(donationId, laporanId)
  }
  revalidatePath('/admin/laporan/assign')
}

export async function markSudahDikirim(donationId: string) {
  await requireAdmin()
  await getOrCreate(donationId)
  await prisma.laporanDonatur.update({
    where: { donationId },
    data: { sudahDikirim: true, dikirimAt: new Date() },
  })
  revalidatePath('/admin/laporan/assign')
}
