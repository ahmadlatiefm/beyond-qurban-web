'use client'
import { useEffect, useState } from 'react'

export type PixelEventMap = {
  page_campaign: string
  page_checkout: string
  page_pembayaran: string
  page_sukses: string
}

const DEFAULT_MAP: PixelEventMap = {
  page_campaign:   'ViewContent',
  page_checkout:   'InitiateCheckout',
  page_pembayaran: 'AddToCart',
  page_sukses:     'Purchase',
}

// In-memory cache so multiple components on the same page share one fetch.
let cached: PixelEventMap | null = null
let inflight: Promise<PixelEventMap> | null = null

function fetchMap(): Promise<PixelEventMap> {
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = fetch('/api/settings/pixel-events')
    .then(r => r.json())
    .then((data: Partial<PixelEventMap>) => {
      cached = { ...DEFAULT_MAP, ...data }
      return cached
    })
    .catch(() => DEFAULT_MAP)
    .finally(() => { inflight = null })
  return inflight
}

export function usePixelEventMapping(): PixelEventMap {
  const [map, setMap] = useState<PixelEventMap>(cached ?? DEFAULT_MAP)
  useEffect(() => {
    let alive = true
    fetchMap().then(m => { if (alive) setMap(m) })
    return () => { alive = false }
  }, [])
  return map
}
