import crypto from 'crypto'

const TRIPAY_BASE_URL = process.env.TRIPAY_MODE === 'production'
  ? 'https://tripay.co.id/api'
  : 'https://tripay.co.id/api-sandbox'

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY ?? ''
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY ?? ''
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE ?? ''

// Payment method codes
export const VA_METHODS: Record<string, { name: string; bank: string; color: string }> = {
  BVAI:      { name: 'BCA Virtual Account',     bank: 'BCA',     color: 'text-blue-700' },
  MANDIRIVA: { name: 'Mandiri Virtual Account',  bank: 'MNR',     color: 'text-yellow-700' },
  BNIVA:     { name: 'BNI Virtual Account',      bank: 'BNI',     color: 'text-orange-600' },
  BRIVA:     { name: 'BRI Virtual Account',      bank: 'BRI',     color: 'text-blue-500' },
  QRIS:      { name: 'QRIS',                     bank: 'QRIS',    color: 'text-[#00AED6]' },
  QRISC:     { name: 'QRIS',                     bank: 'QRIS',    color: 'text-[#00AED6]' },
  GOPAY:     { name: 'GoPay',                    bank: 'GP',      color: 'text-emerald-600' },
  OVO:       { name: 'OVO',                      bank: 'OVO',     color: 'text-purple-600' },
  DANA:      { name: 'DANA',                     bank: 'DANA',    color: 'text-blue-500' },
}

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

// Demo VA data for development when Tripay not configured
export function getDemoPaymentData(method: string, amount: number, merchantRef: string) {
  const demoVA: Record<string, string> = {
    BVAI:      '1234 5678 9012 3456',
    MANDIRIVA: '8900 0123 4567 8901',
    BNIVA:     '8888 1234 5678 9012',
    BRIVA:     '1234 0101 2345 6789',
  }
  return {
    reference: `DEMO-${merchantRef}`,
    payment_method: method,
    payment_name: VA_METHODS[method]?.name ?? method,
    pay_code: demoVA[method] ?? '0000 0000 0000 0000',
    pay_url: null,
    checkout_url: '#',
    status: 'UNPAID',
    total_amount: amount,
    expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    instructions: [
      {
        title: 'Transfer via Mobile Banking / ATM',
        steps: [
          'Buka aplikasi mobile banking atau ATM Anda',
          `Pilih menu Transfer Virtual Account ${VA_METHODS[method]?.bank ?? ''}`,
          `Masukkan nomor VA: ${demoVA[method] ?? '-'}`,
          'Pastikan nama penerima Yayasan One Ummah dan nominal sesuai',
          'Selesaikan transaksi dan simpan bukti transfer',
        ],
      },
    ],
  }
}
