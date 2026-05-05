export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import KontenClient from './KontenClient'

const ALL_KEYS = [
  // Homepage
  'home_badge','home_hero_title_1','home_hero_title_2','home_hero_desc',
  'home_cta_primary','home_cta_primary_href','home_cta_secondary','home_cta_secondary_href',
  'home_stats',
  // Header
  'store_name','nav_items','header_cta_text','header_cta_href',
  // Footer
  'footer_description','footer_address','footer_phone','footer_email',
  'footer_instagram','footer_facebook','footer_whatsapp','footer_copyright',
  // Tentang Kami
  'about_badge','about_title_1','about_title_2','about_description',
  'about_stats','about_mission','about_vision',
]

export default async function AdminKontenPage() {
  const rows = await prisma.settings.findMany({ where: { key: { in: ALL_KEYS } } })
  const settings: Record<string, string> = {}
  rows.forEach(r => { settings[r.key] = r.value })
  return <KontenClient initialSettings={settings} />
}
