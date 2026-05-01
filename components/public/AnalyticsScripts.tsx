import Script from 'next/script'
import { prisma } from '@/lib/prisma'

async function getAnalyticsSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            'fb_pixel_id', 'fb_pixel_enabled',
            'tiktok_pixel_id', 'tiktok_pixel_enabled',
            'gtm_container_id', 'gtm_enabled',
          ],
        },
      },
    })
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch {
    // DB unavailable — silently skip analytics
    return {}
  }
}

export default async function AnalyticsScripts() {
  const s = await getAnalyticsSettings()

  return (
    <>
      {s.gtm_enabled === 'true' && s.gtm_container_id && (
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtm_container_id}');`}
        </Script>
      )}

      {s.fb_pixel_enabled === 'true' && s.fb_pixel_id && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.fb_pixel_id}');fbq('track','PageView');`}
        </Script>
      )}

      {s.tiktok_pixel_enabled === 'true' && s.tiktok_pixel_id && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._r=ttq._r||{},n&&(ttq._r[e]=n),ttq.load(e);var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${s.tiktok_pixel_id}');ttq.page()}(window,document,'ttq');`}
        </Script>
      )}
    </>
  )
}
