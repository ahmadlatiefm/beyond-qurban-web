export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import KontenClient from './KontenClient'

const ALL_KEYS = [
  // Homepage
  'home_badge','home_hero_title_1','home_hero_title_2','home_hero_desc',
  'home_cta_primary','home_cta_primary_href','home_cta_secondary','home_cta_secondary_href',
  'home_stats','home_features','home_features_title','home_features_desc',
  'home_featured_title','home_featured_desc',
  'home_steps','home_steps_title','home_steps_desc',
  'home_testimonials','home_testimonials_title','home_testimonials_desc',
  'home_cta_badge','home_cta_title_1','home_cta_title_2','home_cta_desc','home_cta_btn','home_cta_btn_href',
  'home_featured_product_label','home_featured_product_count',
  'home_featured_campaign_label','home_featured_campaign_count',
  // Penyaluran
  'penyaluran_badge','penyaluran_hero_title_1','penyaluran_hero_title_2','penyaluran_hero_desc',
  'penyaluran_trust_1','penyaluran_trust_2','penyaluran_trust_3',
  'penyaluran_impact_stats','penyaluran_impact_title',
  // Katalog
  'katalog_hero_title','katalog_hero_desc',
  // Header
  'store_name','nav_items','header_cta_text','header_cta_href',
  'site_logo_url','site_favicon_url',
  // Footer
  'footer_description','footer_address','footer_phone','footer_email',
  'footer_instagram','footer_facebook','footer_whatsapp','footer_copyright',
  // Tentang Kami
  'about_badge','about_title_1','about_title_2','about_description',
  'about_stats','about_mission','about_vision',
  'about_why_title','about_why_desc','about_why_items',
  'about_team_title','about_team_desc','about_team',
  'about_contact_title','about_contact_desc',
]

export default async function AdminKontenPage() {
  const rows = await prisma.settings.findMany({ where: { key: { in: ALL_KEYS } } })
  const settings: Record<string, string> = {}
  rows.forEach(r => { settings[r.key] = r.value })
  return <KontenClient initialSettings={settings} />
}
