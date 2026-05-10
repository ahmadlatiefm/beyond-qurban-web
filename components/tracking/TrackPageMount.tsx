'use client'
import { useEffect, useRef } from 'react'
import { trackEvent, type TrackProps } from '@/lib/tracking-client'
import { usePixelEventMapping, type PixelEventMap } from '@/hooks/usePixelEventMapping'

/**
 * Fires the admin-configured pixel event for a given page, once per mount.
 * `pageKey` selects which entry from /api/settings/pixel-events drives the
 * event name. Embed in server components — the hook turns this into a tiny
 * client island.
 */
export default function TrackPageMount({
  pageKey,
  props,
}: {
  pageKey: keyof PixelEventMap
  props?: TrackProps
}) {
  const map = usePixelEventMapping()
  const eventName = map[pageKey]
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    if (!eventName) return
    fired.current = true
    trackEvent(eventName, props)
  }, [eventName, props])
  return null
}
