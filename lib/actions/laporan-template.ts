'use server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LaporanElement } from '@/lib/laporan/types'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  return session
}

interface SaveInput {
  id?: string
  nama: string
  blankoUrl: string
  width: number
  height: number
  elements: LaporanElement[]
  aktif: boolean
}

export async function saveTemplateLaporan(input: SaveInput) {
  await requireAdmin()
  if (!input.nama.trim()) throw new Error('Nama template wajib diisi')
  if (!input.blankoUrl) throw new Error('Gambar blanko wajib diupload')

  const data = {
    nama: input.nama.trim(),
    blankoUrl: input.blankoUrl,
    width: input.width || 0,
    height: input.height || 0,
    elements: input.elements as unknown as object,
    aktif: input.aktif,
  }

  if (input.aktif) {
    await prisma.templateLaporan.updateMany({
      where: { ...(input.id ? { NOT: { id: input.id } } : {}) },
      data: { aktif: false },
    })
  }

  let saved
  if (input.id) {
    saved = await prisma.templateLaporan.update({ where: { id: input.id }, data })
  } else {
    saved = await prisma.templateLaporan.create({ data })
  }

  revalidatePath('/admin/pengaturan/laporan')
  return { id: saved.id }
}

export async function deleteTemplateLaporan(id: string) {
  await requireAdmin()
  await prisma.templateLaporan.delete({ where: { id } })
  revalidatePath('/admin/pengaturan/laporan')
}

export async function toggleTemplateLaporanAktif(id: string, aktif: boolean) {
  await requireAdmin()
  const tpl = await prisma.templateLaporan.findUnique({ where: { id } })
  if (!tpl) throw new Error('Template tidak ditemukan')

  if (aktif) {
    await prisma.templateLaporan.updateMany({
      where: { NOT: { id } },
      data: { aktif: false },
    })
  }
  await prisma.templateLaporan.update({ where: { id }, data: { aktif } })
  revalidatePath('/admin/pengaturan/laporan')
}
