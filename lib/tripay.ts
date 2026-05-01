import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

type TripayMode = 'sandbox' | 'production'

function getBaseUrl(mode: TripayMode): string {
  return mode === 'production'
    ? 'https://tripay.co.id/api'
    : 'https://tripay.co.id/api-sandbox'
}

export type TripayConfig = {
  apiKey: string
  privateKey: string
  merchantCode: string
  mode: TripayMode
}

export async function getTripayConfig(): Promise<TripayConfig> {
  const rows = await prisma.settings.findMany({
    where: {
      key: { in: ['tripay_api_key', 'tripay_private_key', 'tripay_merchant_code', 'tripay_mode'] },
    },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    apiKey: s.tripay_api_key ?? '',
    privateKey: s.tripay_private_key ?? '',
    merchantCode: s.tripay_merchant_code ?? '',
    mode: (s.tripay_mode ?? 'sandbox') as TripayMode,
  }
}

type CreateTransactionInput = {
  merchantRef: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  orderItems: { name: string; price: number; quantity: number }[]
  returnUrl: string
  expiredTime: number
}

type TripayTransactionResponse = {
  success: boolean
  data?: {
    reference: string
    payment_url: string
  }
  message?: string
}

export async function createTripayTransaction(
  input: CreateTransactionInput
): Promise<TripayTransactionResponse> {
  const config = await getTripayConfig()
  if (!config.apiKey || !config.privateKey || !config.merchantCode) {
    return { success: false, message: 'Konfigurasi Tripay belum lengkap.' }
  }

  const signature = crypto
    .createHmac('sha256', config.privateKey)
    .update(`${config.merchantCode}${input.merchantRef}${input.amount}`)
    .digest('hex')

  const payload = {
    method: 'QRIS',
    merchant_ref: input.merchantRef,
    amount: input.amount,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    order_items: input.orderItems,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tripay/callback`,
    return_url: input.returnUrl,
    expired_time: input.expiredTime,
    signature,
  }

  try {
    const res = await fetch(`${getBaseUrl(config.mode)}/transaction/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return (await res.json()) as TripayTransactionResponse
  } catch {
    return { success: false, message: 'Gagal menghubungi Tripay.' }
  }
}

export function verifyTripayCallback(
  privateKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!privateKey || !signatureHeader) return false
  const expected = crypto
    .createHmac('sha256', privateKey)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'))
  } catch {
    return false
  }
}
