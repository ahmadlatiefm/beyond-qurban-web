import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

type FbCapiEventName = 'ViewContent' | 'InitiateCheckout' | 'Purchase'

type FbCapiOptions = {
  phone?: string
  customerName?: string
  value?: number
  contentIds?: string[]
  contentName?: string
}

async function getFbCapiConfig() {
  const rows = await prisma.settings.findMany({
    where: {
      key: { in: ['fb_capi_enabled', 'fb_pixel_id', 'fb_capi_token', 'fb_capi_test_event_code'] },
    },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  if (s.fb_capi_enabled !== 'true' || !s.fb_capi_token || !s.fb_pixel_id) return null

  return {
    pixelId: s.fb_pixel_id,
    accessToken: s.fb_capi_token,
    testEventCode: s.fb_capi_test_event_code || undefined,
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendFbCapiEvent(
  eventName: FbCapiEventName,
  options: FbCapiOptions
): Promise<void> {
  const config = await getFbCapiConfig()
  if (!config) return

  const userData: Record<string, string> = {}
  if (options.phone) userData.ph = sha256(options.phone.replace(/\D/g, ''))
  if (options.customerName) {
    const parts = options.customerName.trim().split(/\s+/)
    userData.fn = sha256(parts[0] ?? '')
    if (parts.length > 1) userData.ln = sha256(parts.slice(1).join(' '))
  }

  const customData: Record<string, unknown> = {
    currency: 'IDR',
    content_type: 'product',
  }
  if (options.value !== undefined) customData.value = options.value
  if (options.contentIds) customData.content_ids = options.contentIds
  if (options.contentName) customData.content_name = options.contentName

  const eventData: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: customData,
  }
  if (config.testEventCode) eventData.test_event_code = config.testEventCode

  const url = `https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.accessToken}`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [eventData] }),
  }).catch(() => {
    console.error('[FB CAPI] Gagal kirim event', eventName)
  })
}
