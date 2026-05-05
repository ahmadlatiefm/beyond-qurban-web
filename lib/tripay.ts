import crypto from 'crypto'

const TRIPAY_BASE_URL = process.env.TRIPAY_MODE === 'production'
  ? 'https://tripay.co.id/api'
  : 'https://tripay.co.id/api-sandbox'

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY ?? ''
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY ?? ''
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE ?? ''

// Payment method codes — official Tripay channel codes
export const TRIPAY_CHANNELS: Record<string, {
  name: string; group: 'va' | 'qris' | 'ewallet' | 'kasir'
  type: 'DIRECT' | 'REDIRECT'; bank: string; color: string
}> = {
  BCAVA:       { name: 'BCA Virtual Account',       group: 'va',      type: 'DIRECT',   bank: 'BCA',   color: '#003D86' },
  MANDIRIVA:   { name: 'Mandiri Virtual Account',   group: 'va',      type: 'DIRECT',   bank: 'MNR',   color: '#003087' },
  BNIVA:       { name: 'BNI Virtual Account',       group: 'va',      type: 'DIRECT',   bank: 'BNI',   color: '#FF6600' },
  BRIVA:       { name: 'BRI Virtual Account',       group: 'va',      type: 'DIRECT',   bank: 'BRI',   color: '#00529B' },
  PERMATAVA:   { name: 'Permata Virtual Account',   group: 'va',      type: 'DIRECT',   bank: 'PMT',   color: '#00A651' },
  MUAMALATVA:  { name: 'Muamalat Virtual Account',  group: 'va',      type: 'DIRECT',   bank: 'MMT',   color: '#007A52' },
  CIMBVA:      { name: 'CIMB Niaga Virtual Account',group: 'va',      type: 'DIRECT',   bank: 'CIMB',  color: '#BE1E2D' },
  BSIVA:       { name: 'BSI Virtual Account',       group: 'va',      type: 'DIRECT',   bank: 'BSI',   color: '#007A52' },
  QRIS:        { name: 'QRIS',                      group: 'qris',    type: 'DIRECT',   bank: 'QRIS',  color: '#00AED6' },
  QRIS2:       { name: 'QRIS',                      group: 'qris',    type: 'DIRECT',   bank: 'QRIS',  color: '#00AED6' },
  OVO:         { name: 'OVO',                       group: 'ewallet', type: 'REDIRECT', bank: 'OVO',   color: '#4C3494' },
  DANA:        { name: 'DANA',                      group: 'ewallet', type: 'REDIRECT', bank: 'DANA',  color: '#108EE9' },
  SHOPEEPAY:   { name: 'ShopeePay',                 group: 'ewallet', type: 'REDIRECT', bank: 'SPAY',  color: '#EE4D2D' },
  ALFAMART:    { name: 'Alfamart',                  group: 'kasir',   type: 'DIRECT',   bank: 'ALFA',  color: '#E8192C' },
  INDOMARET:   { name: 'Indomaret',                 group: 'kasir',   type: 'DIRECT',   bank: 'INDO',  color: '#CC0000' },
  ALFAMIDI:    { name: 'Alfamidi',                  group: 'kasir',   type: 'DIRECT',   bank: 'MIDI',  color: '#0063A7' },
}

// backward compat alias
export const VA_METHODS = TRIPAY_CHANNELS

export interface TripayTransaction {
  reference: string
  merchant_ref: string
  payment_method: string
  payment_name: string
  total_amount: number
  pay_code: string
  pay_url: string | null
  checkout_url: string
  status: string
  expired_time: number
  instructions: Array<{
    title: string
    steps: string[]
  }>
}

export async function createTripayTransaction(params: {
  method: string
  merchantRef: string
  amount: number
  customerName: string
  customerEmail?: string
  customerPhone: string
  productName: string
  returnUrl?: string
}): Promise<TripayTransaction | null> {
  if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
    console.warn('[Tripay] Credentials not configured — skipping API call')
    return null
  }

  try {
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(TRIPAY_MERCHANT_CODE + params.merchantRef + params.amount)
      .digest('hex')

    const body = {
      method: params.method,
      merchant_ref: params.merchantRef,
      amount: params.amount,
      customer_name: params.customerName,
      customer_email: params.customerEmail ?? `noreply+${params.merchantRef}@beyondqurban.com`,
      customer_phone: params.customerPhone,
      order_items: [{
        name: params.productName,
        price: params.amount,
        quantity: 1,
      }],
      return_url: params.returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/terimakasih`,
      expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      signature,
    }

    const response = await fetch(`${TRIPAY_BASE_URL}/transaction/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRIPAY_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!data.success) {
      console.error('[Tripay] API error:', data.message)
      return null
    }
    return data.data as TripayTransaction
  } catch (err) {
    console.error('[Tripay] Request failed:', err)
    return null
  }
}

export function verifyTripayCallback(
  privateKey: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const expected = crypto
    .createHmac('sha256', privateKey)
    .update(rawBody)
    .digest('hex')
  return expected === signatureHeader
}

// Demo payment data for development when Tripay not configured
export function getDemoPaymentData(method: string, amount: number, merchantRef: string) {
  const ch = TRIPAY_CHANNELS[method]
  const demoVA: Record<string, string> = {
    BCAVA:      '1234 5678 9012 3456',
    MANDIRIVA:  '8900 0123 4567 8901',
    BNIVA:      '8888 1234 5678 9012',
    BRIVA:      '1234 0101 2345 6789',
    PERMATAVA:  '9999 8888 7777 6666',
    MUAMALATVA: '5050 4040 3030 2020',
    CIMBVA:     '7070 6060 5050 4040',
    BSIVA:      '6060 5050 4040 3030',
  }
  const isRedirect = ch?.type === 'REDIRECT'
  return {
    reference: `DEMO-${merchantRef}`,
    payment_method: method,
    payment_name: ch?.name ?? method,
    pay_code: demoVA[method] ?? null,
    pay_url: isRedirect ? `https://tripay.co.id/demo-redirect/${method}` : null,
    checkout_url: `https://tripay.co.id/checkout/demo`,
    status: 'UNPAID',
    total_amount: amount,
    expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    instructions: [],
  }
}
