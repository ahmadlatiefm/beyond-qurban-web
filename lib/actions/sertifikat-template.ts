'use server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SertifikatField, SertifikatTipe } from '@/lib/sertifikat/types'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  return session
}

interface SaveInput {
  id?: string
  nama: string
  tipe: SertifikatTipe
  blankoUrl: string
  width: number
  height: number
  fields: SertifikatField[]
  aktif: boolean
}

export async function saveTemplateSertifikat(input: SaveInput) {
  await requireAdmin()
  if (!input.nama.trim()) throw new Error('Nama template wajib diisi')
  if (!input.blankoUrl) throw new Error('Gambar blanko wajib diupload')
  if (!['pembelian', 'qurban'].includes(input.tipe)) throw new Error('Tipe tidak valid')

  const data = {
    nama: input.nama.trim(),
    tipe: input.tipe,
    blankoUrl: input.blankoUrl,
    width: input.width || 0,
    height: input.height || 0,
    fields: input.fields as unknown as object,
    aktif: input.aktif,
  }

  if (input.aktif) {
    // Only one active template per tipe — deactivate others
    await prisma.templateSertifikat.updateMany({
      where: { tipe: input.tipe, ...(input.id ? { NOT: { id: input.id } } : {}) },
      data: { aktif: false },
    })
  }

  if (input.id) {
    await prisma.templateSertifikat.update({ where: { id: input.id }, data })
  } else {
    await prisma.templateSertifikat.create({ data })
  }

  revalidatePath('/admin/pengaturan/sertifikat')
}

export async function deleteTemplateSertifikat(id: string) {
  await requireAdmin()
  await prisma.templateSertifikat.delete({ where: { id } })
  revalidatePath('/admin/pengaturan/sertifikat')
}

export async function toggleTemplateAktif(id: string, aktif: boolean) {
  await requireAdmin()
  const tpl = await prisma.templateSertifikat.findUnique({ where: { id } })
  if (!tpl) throw new Error('Template tidak ditemukan')

  if (aktif) {
    await prisma.templateSertifikat.updateMany({
      where: { tipe: tpl.tipe, NOT: { id } },
      data: { aktif: false },
    })
  }
  await prisma.templateSertifikat.update({ where: { id }, data: { aktif } })
  revalidatePath('/admin/pengaturan/sertifikat')
}
