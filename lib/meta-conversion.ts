import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Meta Conversions API (server-side) helper. Sends events directly to Meta
 * so they aren't blocked by adblockers. Use the same `event_id` here and on
 * the browser pixel call to enable deduplication.
 *
 * Reads pixel id + access token from env (canonical) with DB Settings as
 * fallback. Returns silently with success:false when not configured — so
 * checkout flows are never blocked by tracking.
 */

export type CapiUserData = {
  email?: string
  phone?: string  // raw — will be hashed
  externalId?: string
  clientIp?: string
  userAgent?: string
  fbp?: string  // Facebook browser cookie
  fbc?: string  // Facebook click cookie
}

export type CapiCustomData = {
  currency?: string
  value?: number
  content_ids?: string[]
  content_name?: string
  content_type?: string
  num_items?: number
  order_id?: string
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s.trim().toLowerCase()).digest('hex')
}

function normalizePhoneE164(p: string): string {
  let d = p.replace(/\D/g, '').replace(/^0/, '62')
  if (!d.startsWith('62')) d = '62' + d
  return d
}

async function loadConfig(): Promise<{ pixelId: string; token: string; testCode?: string } | null> {
  let pixelId = process.env.META_PIXEL_ID || ''
  let token = process.env.META_CONVERSION_API_TOKEN || ''
  let testCode: string | undefined
  let enabledFlag: string | undefined

  try {
    const rows = await prisma.settings.findMany({
      where: { key: { in: ['fb_pixel_enabled', 'fb_pixel_id', 'fb_secret_token', 'fb_test_code'] } },
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    enabledFlag = map.fb_pixel_enabled
    if (!pixelId && map.fb_pixel_id) pixelId = map.fb_pixel_id
    if (!token && map.fb_secret_token) token = map.fb_secret_token
    if (map.fb_test_code) testCode = map.fb_test_code
  } catch { /* ignore */ }

  if (enabledFlag === 'false') return null
  if (!pixelId || !token) return null
  return { pixelId, token, testCode }
}

export async function sendCapiEvent(
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | string,
  options: {
    eventId: string
    eventSourceUrl?: string
    userData?: CapiUserData
    customData?: CapiCustomData
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = await loadConfig()
    if (!cfg) return { success: false, error: 'Meta CAPI not configured' }

    const ud = options.userData ?? {}
    const userData: Record<string, string | string[]> = {}
    if (ud.email)      userData.em = sha256(ud.email)
    if (ud.phone)      userData.ph = sha256(normalizePhoneE164(ud.phone))
    if (ud.externalId) userData.external_id = sha256(ud.externalId)
    if (ud.clientIp)   userData.client_ip_address = ud.clientIp
    if (ud.userAgent)  userData.client_user_agent = ud.userAgent
    if (ud.fbp)        userData.fbp = ud.fbp
    if (ud.fbc)        userData.fbc = ud.fbc

    const body: Record<string, unknown> = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: options.eventId,
        action_source: 'website',
        event_source_url: options.eventSourceUrl,
        user_data: userData,
        custom_data: options.customData,
      }],
    }
    if (cfg.testCode) body.test_event_code = cfg.testCode

    const url = `https://graph.facebook.com/v18.0/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.token)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[Meta CAPI] non-OK', res.status, txt)
      return { success: false, error: txt || `HTTP ${res.status}` }
    }
    return { success: true }
  } catch (err) {
    console.error('[Meta CAPI] exception', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
