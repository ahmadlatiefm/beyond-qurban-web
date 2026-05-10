'use client'
import { useEffect, useRef } from 'react'
import { trackEvent, type TrackProps } from '@/lib/tracking-client'

/**
 * Fires one or more conversion events on mount. Designed to be embedded in
 * server components so they don't have to become client-side just to track.
 */
export default function TrackOnMount({
  events,
}: {
  events: Array<{ name: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'; props?: TrackProps }>
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    for (const e of events) trackEvent(e.name, e.props)
  }, [events])
  return null
}
