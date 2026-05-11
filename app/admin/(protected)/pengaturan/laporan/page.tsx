export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import LaporanTemplateClient from './LaporanTemplateClient'
import type { LaporanElement } from '@/lib/laporan/types'

export default async function AdminLaporanTemplatePage() {
  const rows = await prisma.templateLaporan.findMany({
    orderBy: [{ aktif: 'desc' }, { updatedAt: 'desc' }],
  })

  const templates = rows.map(r => ({
    id: r.id,
    nama: r.nama,
    blankoUrl: r.blankoUrl,
    width: r.width,
    height: r.height,
    elements: (r.elements as unknown as LaporanElement[]) || [],
    aktif: r.aktif,
    updatedAt: r.updatedAt.toISOString(),
  }))

  return <LaporanTemplateClient initialTemplates={templates} />
}
