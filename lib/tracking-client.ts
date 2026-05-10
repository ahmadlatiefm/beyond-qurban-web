/**
 * Client-side helper to fire conversion events to Meta Pixel, TikTok Pixel,
 * and GTM (dataLayer) from any 'use client' component. Safe no-op when the
 * relevant pixel isn't loaded.
 *
 * Retries each pixel up to 4 times (immediately, then 500ms / 1500ms / 3000ms)
 * because useEffect can run before the Next.js `afterInteractive` Script tag
 * has injected `window.fbq` / `ttq` — common on mobile and in-app browsers.
 */

export type TrackProps = {
  value?: number
  currency?: string
  contents?: Array<{ id: string; quantity?: number; name?: string; item_price?: number }>
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
  /** Use the same ID server-side (e.g. orderNumber) for Conversion API dedup. */
  eventId?: string
}

const TIKTOK_NAME: Record<string, string> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'CompletePayment',
}

const RETRY_DELAYS = [500, 1500, 3000]

// `name` is widened to string because the active event is admin-configurable
// (see /api/settings/pixel-events). Common values: ViewContent, AddToCart,
// InitiateCheckout, AddPaymentInfo, Purchase, Lead, Donate, PageView.
export function trackEvent(
  name: string,
  props: TrackProps = {},
) {
  if (typeof window === 'undefined') return
  const currency = props.currency ?? 'IDR'

  const fbProps: Record<string, unknown> = {
    currency,
    value: props.value,
    content_name: props.content_name,
    content_category: props.content_category,
    content_ids: props.content_ids ?? props.contents?.map(c => c.id),
    content_type: props.content_type,
    contents: props.contents,
    num_items: props.num_items,
  }
  Object.keys(fbProps).forEach(k => fbProps[k] === undefined && delete fbProps[k])

  let metaFired = false
  let tiktokFired = false
  let gtmFired = false

  if (typeof console !== 'undefined') {
    console.log('[Pixel] Attempting to fire:', name, props)
  }

  const fire = (attempt: number) => {
    const w = window as any

    // Meta Pixel — pass eventID for server↔client dedup
    if (!metaFired && typeof w.fbq === 'function') {
      if (props.eventId) {
        w.fbq('track', name, fbProps, { eventID: props.eventId })
      } else {
        w.fbq('track', name, fbProps)
      }
      metaFired = true
      console.log('[Pixel] Fired Meta:', name, `(attempt ${attempt})`)
    }

    // TikTok Pixel
    if (!tiktokFired && w.ttq && typeof w.ttq.track === 'function') {
      const ttkName = TIKTOK_NAME[name] ?? name
      w.ttq.track(ttkName, {
        value: props.value,
        currency,
        content_id: props.content_ids?.[0] ?? props.contents?.[0]?.id,
        content_name: props.content_name ?? props.contents?.[0]?.name,
        content_type: 'product',
        quantity: props.num_items ?? props.contents?.[0]?.quantity,
      })
      tiktokFired = true
      console.log('[Pixel] Fired TikTok:', ttkName, `(attempt ${attempt})`)
    }

    // GTM dataLayer
    if (!gtmFired && Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: name,
        currency,
        value: props.value,
        content_ids: props.content_ids ?? props.contents?.map(c => c.id),
        content_name: props.content_name,
        event_id: props.eventId,
      })
      gtmFired = true
      console.log('[Pixel] Fired GTM:', name, `(attempt ${attempt})`)
    }

    return metaFired && tiktokFired && gtmFired
  }

  if (fire(0)) return
  RETRY_DELAYS.forEach((delay, i) => {
    setTimeout(() => {
      if (metaFired && tiktokFired && gtmFired) return
      fire(i + 1)
    }, delay)
  })
}
