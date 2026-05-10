import { prisma } from '@/lib/prisma'

export type SendResult = { success: boolean; error?: string; status?: number }

// Backward-compat type kept so existing imports don't break.
export type NotificationTemplate =
  | 'payment_confirmed_customer'
  | 'payment_confirmed_admin'
  | 'order_shipped'
  | 'order_completed'

export type NotificationPayload = {
  customerName: string
  whatsapp: string
  orderNumber: string
  productName: string
  totalAmount: number
  [key: string]: unknown
}

/**
 * Normalize Indonesian phone numbers to E.164-ish form expected by OneSender:
 *   "0812-3456-7890" → "6281234567890"
 *   "+62 812 3456 7890" → "6281234567890"
 *   "812 3456 7890" → "6281234567890"
 */
export function normalizePhone(phone: string): string {
  let p = (phone ?? '').replace(/\D/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (!p.startsWith('62')) p = '62' + p
  return p
}

async function loadConfig(): Promise<{ baseUrl: string; apiKey: string; enabled: boolean }> {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['onesender_enabled', 'onesender_base_url', 'onesender_url', 'onesender_api_key'] } },
  })
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })
  // Prefer DB; fall back to .env (WA_GATEWAY_URL / WA_GATEWAY_TOKEN) so the
  // gateway works even when admin hasn't filled in /pengaturan yet.
  const baseUrl = (map.onesender_base_url || map.onesender_url || process.env.WA_GATEWAY_URL || '').trim().replace(/\/+$/, '')
  const apiKey = (map.onesender_api_key || process.env.WA_GATEWAY_TOKEN || '').trim()
  // Auto-enable when env credentials are present, unless admin explicitly disabled.
  const hasEnvCreds = !!(process.env.WA_GATEWAY_URL && process.env.WA_GATEWAY_TOKEN)
  const enabled = map.onesender_enabled === 'true' || (map.onesender_enabled !== 'false' && hasEnvCreds)
  return { baseUrl, apiKey, enabled }
}

// Tolerate both forms of saved URL: bare host (`https://wa3607.oneapi.my.id`)
// or full path (`https://wa3607.oneapi.my.id/api/v1/messages`). Without this
// we double-append the path and OneSender returns 405 Method Not Allowed.
function messagesUrl(baseUrl: string): string {
  const u = baseUrl.replace(/\/api\/v1\/messages\/?$/, '')
  return `${u}/api/v1/messages`
}

/**
 * OneSender requires the `image.link` to be a publicly reachable absolute URL.
 * Uploaded QRIS images are stored as relative paths (`/uploads/qris/foo.png`)
 * by /api/media-upload — prefix with NEXTAUTH_URL so the gateway can fetch.
 */
export function toAbsoluteUrl(pathOrUrl: string): string {
  const v = (pathOrUrl ?? '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const base = (process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '')
  return `${base}${v.startsWith('/') ? '' : '/'}${v}`
}

/** Send a single WhatsApp text message via OneSender 2.0. */
export async function sendWhatsApp(to: string, message: string): Promise<SendResult> {
  try {
    const { baseUrl, apiKey, enabled } = await loadConfig()
    console.log('[OneSender] sendWhatsApp', { enabled, baseUrl, apiKey: apiKey ? 'ada' : 'kosong', to })
    if (!enabled) return { success: false, error: 'OneSender tidak aktif' }
    if (!baseUrl || !apiKey) return { success: false, error: 'OneSender belum dikonfigurasi' }

    const phone = normalizePhone(to)
    const res = await fetch(messagesUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[OneSender] sendWhatsApp non-OK', res.status, err)
      return { success: false, error: err || `HTTP ${res.status}`, status: res.status }
    }
    return { success: true, status: res.status }
  } catch (err) {
    console.error('[OneSender] sendWhatsApp exception', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Send a WhatsApp image message via OneSender 2.0. `link` must be a public URL
 * — pass through `toAbsoluteUrl()` if it might be a relative `/uploads/...` path.
 */
export async function sendWhatsAppImage(to: string, link: string, caption: string): Promise<SendResult> {
  try {
    const { baseUrl, apiKey, enabled } = await loadConfig()
    console.log('[OneSender] sendWhatsAppImage', { enabled, baseUrl, link, to })
    if (!enabled) return { success: false, error: 'OneSender tidak aktif' }
    if (!baseUrl || !apiKey) return { success: false, error: 'OneSender belum dikonfigurasi' }
    if (!link) return { success: false, error: 'Image link kosong' }

    const phone = normalizePhone(to)
    const res = await fetch(messagesUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient_type: 'individual',
        to: phone,
        type: 'image',
        image: { link, caption },
      }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[OneSender] sendWhatsAppImage non-OK', res.status, err)
      return { success: false, error: err || `HTTP ${res.status}`, status: res.status }
    }
    return { success: true, status: res.status }
  } catch (err) {
    console.error('[OneSender] sendWhatsAppImage exception', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Send the same or different messages to many recipients in a single request. */
export async function sendWhatsAppBulk(
  items: Array<{ to: string; message: string }>
): Promise<SendResult> {
  try {
    if (items.length === 0) return { success: true }
    const { baseUrl, apiKey, enabled } = await loadConfig()
    if (!enabled) return { success: false, error: 'OneSender tidak aktif' }
    if (!baseUrl || !apiKey) return { success: false, error: 'OneSender belum dikonfigurasi' }

    const body = items.map(({ to, message }) => ({
      recipient_type: 'individual',
      to: normalizePhone(to),
      type: 'text',
      text: { body: message },
    }))

    const res = await fetch(messagesUrl(baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[OneSender] sendWhatsAppBulk non-OK', res.status, err)
      return { success: false, error: err || `HTTP ${res.status}`, status: res.status }
    }
    return { success: true, status: res.status }
  } catch (err) {
    console.error('[OneSender] sendWhatsAppBulk exception', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Backward-compatible wrapper used by existing tripay callback. Maps templates
 * to short messages and delegates to sendWhatsApp. Safe to call even when
 * OneSender is disabled — failures are logged but never thrown.
 */
export async function sendOrderNotification(
  template: NotificationTemplate,
  payload: NotificationPayload
): Promise<void> {
  let message = ''
  switch (template) {
    case 'payment_confirmed_customer':
      message = `Halo ${payload.customerName}, pembayaran Anda untuk pesanan ${payload.orderNumber} sudah kami terima. Terima kasih 🙏`
      break
    case 'payment_confirmed_admin':
      message = `Pembayaran masuk: ${payload.orderNumber} — ${payload.customerName}`
      break
    case 'order_shipped':
      message = `Halo ${payload.customerName}, pesanan ${payload.orderNumber} sedang dikirim 🚚`
      break
    case 'order_completed':
      message = `Halo ${payload.customerName}, pesanan ${payload.orderNumber} telah selesai. Terima kasih 🙏`
      break
  }
  await sendWhatsApp(payload.whatsapp, message)
}

/** Resolve {{var}} placeholders against a values dict. */
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}
