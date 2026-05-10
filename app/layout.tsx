import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ToastProvider, ToastBridge } from '@/components/ui/AppToast'
import TrackingScripts from '@/components/tracking/TrackingScripts'
import { prisma } from '@/lib/prisma'

async function loadTrackingConfig() {
  try {
    const rows = await prisma.settings.findMany({
      where: { key: { in: [
        'fb_pixel_enabled', 'fb_pixel_id',
        'tiktok_enabled', 'tiktok_pixel_id',
        'gtm_enabled', 'gtm_id',
      ] } },
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    return {
      // Meta: prefer DB, fallback to env. Respect explicit on/off toggle.
      fbPixelId: map.fb_pixel_enabled === 'false'
        ? undefined
        : (map.fb_pixel_id || process.env.META_PIXEL_ID || undefined),
      // TikTok: needs id + (no explicit toggle assumed enabled)
      tiktokPixelId: map.tiktok_enabled === 'false' ? undefined : (map.tiktok_pixel_id || undefined),
      // GTM: needs id + enabled-flag (default on if id present)
      gtmId: map.gtm_enabled === 'false' ? undefined : (map.gtm_id || undefined),
    }
  } catch {
    return {
      fbPixelId: process.env.META_PIXEL_ID || undefined,
      tiktokPixelId: undefined,
      gtmId: undefined,
    }
  }
}

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
})

// Read the brand title + favicon URL from Settings on every request so admin
// uploads take effect without a redeploy. The static app/favicon.ico file was
// removed deliberately — Next would otherwise let it override metadata.icons.
export async function generateMetadata(): Promise<Metadata> {
  let title = 'Beyond Qurban — Qurban Mudah, Amanah & Transparan'
  let iconUrl: string | undefined
  try {
    const rows = await prisma.settings.findMany({
      where: { key: { in: ['store_name', 'site_favicon_url'] } },
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    if (map.store_name) title = `${map.store_name} — Qurban Mudah, Amanah & Transparan`
    if (map.site_favicon_url) iconUrl = map.site_favicon_url
  } catch {}
  return {
    title,
    description: 'Platform penjualan hewan kurban online terpercaya.',
    icons: iconUrl ? { icon: iconUrl, shortcut: iconUrl, apple: iconUrl } : undefined,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tracking = await loadTrackingConfig()
  return (
    <html lang="id" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-brand-text-dark">
        <TrackingScripts
          fbPixelId={tracking.fbPixelId}
          tiktokPixelId={tracking.tiktokPixelId}
          gtmId={tracking.gtmId}
        />
        <ToastProvider>
          <ToastBridge />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
