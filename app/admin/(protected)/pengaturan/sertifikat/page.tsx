export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import SertifikatTemplateClient from './SertifikatTemplateClient'
import type { SertifikatField } from '@/lib/sertifikat/types'

export default async function AdminSertifikatTemplatePage() {
  const rows = await prisma.templateSertifikat.findMany({
    orderBy: [{ tipe: 'asc' }, { updatedAt: 'desc' }],
  })

  const templates = rows.map(r => ({
    id: r.id,
    nama: r.nama,
    tipe: r.tipe as 'pembelian' | 'qurban',
    blankoUrl: r.blankoUrl,
    width: r.width,
    height: r.height,
    fields: (r.fields as unknown as SertifikatField[]) || [],
    aktif: r.aktif,
    updatedAt: r.updatedAt.toISOString(),
  }))

  return <SertifikatTemplateClient initialTemplates={templates} />
}
