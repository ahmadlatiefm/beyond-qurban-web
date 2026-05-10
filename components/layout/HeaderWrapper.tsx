import { prisma } from '@/lib/prisma'
import Header from './Header'

export default async function HeaderWrapper() {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['store_name', 'nav_items', 'header_cta_text', 'header_cta_href', 'site_logo_url'] } }
  })
  const s: Record<string, string> = {}
  rows.forEach(r => { s[r.key] = r.value })

  let navItems: { label: string; href: string }[] | undefined
  try {
    const parsed = JSON.parse(s.nav_items ?? '[]')
    if (Array.isArray(parsed) && parsed.length > 0) navItems = parsed
  } catch {}

  return (
    <Header
      storeName={s.store_name}
      navItems={navItems}
      ctaText={s.header_cta_text}
      ctaHref={s.header_cta_href}
      logoUrl={s.site_logo_url || undefined}
    />
  )
}
