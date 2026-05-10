import { prisma } from '@/lib/prisma'

export type PaymentInfo = {
  /** Friendly label for {{metode_bayar}} — e.g. "Transfer Manual", "QRIS BSI". */
  label: string
  /** Friendly account string for {{rekening}} — e.g. "BCA 1234567890 A/N Yayasan One Ummah". */
  account: string
  /** True when customer chose the manual-QRIS flow (image needs to be sent separately). */
  isManualQris: boolean
  /** Raw saved value for `manual_qris_image`; relative or absolute. */
  qrisImageUrl: string | null
}

const TRIPAY_LABELS: Record<string, string> = {
  BCAVA: 'BCA Virtual Account',
  MANDIRIVA: 'Mandiri Virtual Account',
  BNIVA: 'BNI Virtual Account',
  BRIVA: 'BRI Virtual Account',
  PERMATAVA: 'Permata Virtual Account',
  BSIVA: 'BSI Virtual Account',
  QRIS: 'QRIS',
  OVO: 'OVO',
  DANA: 'DANA',
  SHOPEEPAY: 'ShopeePay',
  ALFAMART: 'Alfamart',
}

interface ManualBankRow { id?: string; code?: string; name?: string; number?: string; owner?: string }

/**
 * Resolve the customer-facing description of a payment method from the raw
 * `paymentMethod` code. Manual codes (`MANUAL_<idx>`, `MANUAL_QRIS`) are
 * looked up in Settings; Tripay codes get a friendly label.
 */
export async function resolvePaymentInfo(paymentMethod: string): Promise<PaymentInfo> {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['manual_banks', 'manual_qris_bank', 'manual_qris_label', 'manual_qris_image'] } },
  })
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })

  if (paymentMethod === 'MANUAL_QRIS') {
    const bankName = (map.manual_qris_bank ?? '').trim()
    const label = (map.manual_qris_label ?? '').trim() || (bankName ? `QRIS ${bankName}` : 'QRIS Manual')
    return {
      label,
      account: bankName ? `QRIS ${bankName}` : 'QRIS Manual',
      isManualQris: true,
      qrisImageUrl: (map.manual_qris_image ?? '').trim() || null,
    }
  }

  const manualMatch = /^MANUAL_(\d+)$/.exec(paymentMethod)
  if (manualMatch) {
    const idx = parseInt(manualMatch[1], 10)
    let bank: ManualBankRow | null = null
    try {
      const arr = JSON.parse(map.manual_banks ?? '[]')
      if (Array.isArray(arr) && arr[idx]) bank = arr[idx] as ManualBankRow
    } catch {}
    if (bank?.number) {
      const parts = [bank.name?.trim(), bank.number.trim()].filter(Boolean).join(' ')
      const owner = bank.owner?.trim()
      return {
        label: 'Transfer Manual',
        account: owner ? `${parts} A/N ${owner}` : parts,
        isManualQris: false,
        qrisImageUrl: null,
      }
    }
    return { label: 'Transfer Manual', account: '-', isManualQris: false, qrisImageUrl: null }
  }

  return {
    label: TRIPAY_LABELS[paymentMethod] ?? paymentMethod,
    account: '-',
    isManualQris: false,
    qrisImageUrl: null,
  }
}
