'use client'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, Suspense } from 'react'

interface TrackingConfig {
  fbPixelId?: string
  tiktokPixelId?: string
  gtmId?: string
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    ttq?: { track: (event: string, props?: any) => void; page: () => void; load: (id: string) => void }
    dataLayer?: any[]
  }
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Collapse pathname + searchParams into a single primitive dep so React
  // can't re-run the effect twice for one logical navigation when the two
  // hooks update in separate commits. lastFiredUrl is a per-tab dedup —
  // the inline init scripts have already fired PageView for the very first
  // URL of the session, so we seed the ref on first render and only fire
  // when the URL actually changes after that.
  const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
  const lastFiredUrl = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (lastFiredUrl.current === null) {
      // First mount — inline init already fired PageView for this URL.
      lastFiredUrl.current = url
      return
    }
    if (lastFiredUrl.current === url) {
      // Same URL as last fire — guard against duplicate effect runs.
      return
    }
    lastFiredUrl.current = url
    // Meta Pixel — PageView on route change
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
    // TikTok — page() reports a PageView
    if (window.ttq && typeof window.ttq.page === 'function') {
      window.ttq.page()
    }
    // GTM — push virtual page event for SPA route changes
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'page_view', page_path: url })
    }
  }, [url])

  return null
}

export default function TrackingScripts({ fbPixelId, tiktokPixelId, gtmId }: TrackingConfig) {
  const hasMeta = !!fbPixelId
  const hasTiktok = !!tiktokPixelId
  const hasGtm = !!gtmId

  return (
    <>
      {/* Meta Pixel — fbevents.js. The library IIFE already guards against
          double-load via `if(f.fbq)return;`, but `fbq('init')` and
          `fbq('track','PageView')` sit outside that guard. Next.js 14 can
          re-execute inline <Script strategy="afterInteractive"> bodies on SPA
          navigation, which would re-fire PageView. The window flag below
          makes the init+PageView pair idempotent across re-executions. */}
      {hasMeta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            if (!window.__bqMetaInited) {
              window.__bqMetaInited = true;
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            }
          `}
        </Script>
      )}

      {/* TikTok Pixel — same SPA re-execution concern as Meta above. Guarded
          with a window flag so load+page() only run once per browser session. */}
      {hasTiktok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              if (w.__bqTiktokInited) return;
              w.__bqTiktokInited = true;
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
              n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Google Tag Manager */}
      {hasGtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {/* No-script fallbacks. Rendered via dangerouslySetInnerHTML so React 18
          doesn't parse the inner <img>/<iframe> and emit a <link rel="preload">
          for it in <head>. The preload would be FETCHED by the browser even
          though the noscript wraps it — and for the Meta tracker that fetch
          counts as a real PageView, doubling the pixel hit. */}
      {hasMeta && (
        <noscript dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" alt="" style="display:none" src="https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1"/>`,
        }} />
      )}
      {hasGtm && (
        <noscript dangerouslySetInnerHTML={{
          __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        }} />
      )}

      {/* SPA route-change PageView for all 3 — wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
