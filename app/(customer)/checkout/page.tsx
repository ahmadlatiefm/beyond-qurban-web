export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import CheckoutForm from './CheckoutForm'
import { applyGlobalDiscount, applyCategoryDiscount } from '@/lib/discount'
import { parseShippingZones } from '@/lib/shipping'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { slug?: string }
}) {
  const slug = searchParams.slug
  if (!slug) notFound()

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) notFound()

  const [settings] = await Promise.all([
    prisma.settings.findMany({
      where: {
        key: {
          in: [
            'tripay_enabled',
            'ch_bcava','ch_mandiriva','ch_bniva','ch_briva','ch_permatava','ch_muamalatva','ch_cimbva','ch_bsiva',
            'ch_qris','ch_qris2','ch_ovo','ch_dana','ch_shopeepay',
            'ch_alfamart','ch_indomaret','ch_alfamidi',
            'manual_transfer_enabled','manual_banks',
            'manual_qris_enabled','manual_qris_image','manual_qris_bank','manual_qris_label',
            // Discount settings
            'diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end',
            'vouchers','shipping_zones',
            // Per-category discount
            'disc_sapi','disc_kambing','disc_domba','disc_unta',
            'disc_sapi_until','disc_kambing_until','disc_domba_until','disc_unta_until',
            'discount_category_sapi_active','discount_category_kambing_active','discount_category_domba_active','discount_category_unta_active',
          ]
        }
      }
    })
  ])
  const settingsMap: Record<string, string> = {}
  settings.forEach(s => { settingsMap[s.key] = s.value })

  const tripayEnabled = settingsMap.tripay_enabled !== 'false'
  const activeChannels = {
    BCAVA:      tripayEnabled && settingsMap.ch_bcava !== 'false',
    MANDIRIVA:  tripayEnabled && settingsMap.ch_mandiriva !== 'false',
    BNIVA:      tripayEnabled && settingsMap.ch_bniva !== 'false',
    BRIVA:      tripayEnabled && settingsMap.ch_briva !== 'false',
    PERMATAVA:  tripayEnabled && settingsMap.ch_permatava === 'true',
    MUAMALATVA: tripayEnabled && settingsMap.ch_muamalatva === 'true',
    CIMBVA:     tripayEnabled && settingsMap.ch_cimbva === 'true',
    BSIVA:      tripayEnabled && settingsMap.ch_bsiva === 'true',
    QRIS:       tripayEnabled && settingsMap.ch_qris !== 'false',
    QRIS2:      tripayEnabled && settingsMap.ch_qris2 === 'true',
    OVO:        tripayEnabled && settingsMap.ch_ovo === 'true',
    DANA:       tripayEnabled && settingsMap.ch_dana === 'true',
    SHOPEEPAY:  tripayEnabled && settingsMap.ch_shopeepay === 'true',
    ALFAMART:   tripayEnabled && settingsMap.ch_alfamart === 'true',
    INDOMARET:  tripayEnabled && settingsMap.ch_indomaret === 'true',
    ALFAMIDI:   tripayEnabled && settingsMap.ch_alfamidi === 'true',
    MANUAL:     settingsMap.manual_transfer_enabled === 'true',
  }

  // Parse multi-bank JSON
  const manualBanksRaw = settingsMap.manual_banks ?? '[]'
  let manualBanksList: {id:string;code:string;name:string;number:string;owner:string}[] = []
  try { manualBanksList = JSON.parse(manualBanksRaw) } catch {}

  const manualBank = {
    enabled: settingsMap.manual_transfer_enabled === 'true' && manualBanksList.length > 0,
    banks: manualBanksList,
    // backward compat: primary bank = first in list
    bankName: manualBanksList[0]?.name ?? 'Bank BCA',
    accountNumber: manualBanksList[0]?.number ?? '',
    accountOwner: manualBanksList[0]?.owner ?? 'Yayasan One Ummah',
  }

  const manualQris = settingsMap.manual_qris_enabled === 'true' && (settingsMap.manual_qris_image ?? '').length > 0
    ? {
        enabled: true,
        image: settingsMap.manual_qris_image ?? '',
        bank: settingsMap.manual_qris_bank ?? '',
        label: settingsMap.manual_qris_label ?? '',
      }
    : null

  // Global + per-category discount stacked
  const global = applyGlobalDiscount(product.price, settingsMap)
  const category = applyCategoryDiscount(global.finalPrice, product.category, settingsMap)
  const totalDiscountAmount = global.discountAmount + category.discountAmount
  const discount = {
    finalPrice: category.finalPrice,
    discountAmount: totalDiscountAmount,
    discountLabel: [global.discountLabel, category.discountLabel].filter(Boolean).join(' + ') || null,
  }

  // Always show voucher input — validation happens server-side
  const hasVouchers = true

  // Shipping zones
  const shippingZones = parseShippingZones(settingsMap.shipping_zones)

  return (
    <main className="pt-32 pb-24 min-h-screen bg-soft-gradient max-w-[1440px] mx-auto px-6 md:px-12">
      <nav className="flex items-center gap-2 text-sm text-brand-muted mb-8">
        <Link href="/" className="hover:text-brand-surface">Beranda</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <Link href="/katalog" className="hover:text-brand-surface">Katalog</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <span className="text-brand-text-dark font-medium">Checkout Pemesanan</span>
      </nav>

      <div className="flex items-center gap-0 mb-10 max-w-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-surface text-brand-light flex items-center justify-center text-sm font-bold">1</div>
          <span className="text-sm font-semibold text-brand-surface">Form Pesanan</span>
        </div>
        <div className="flex-1 h-0.5 bg-brand-muted/20 mx-4" />
        <div className="flex items-center gap-2 opacity-40">
          <div className="w-8 h-8 rounded-full bg-brand-muted/20 text-brand-muted flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-sm font-medium text-brand-muted">Detail Pembayaran</span>
        </div>
      </div>

      <CheckoutForm
        product={product}
        activeChannels={activeChannels}
        manualBank={manualBank}
        manualQris={manualQris}
        discountedPrice={discount.discountAmount > 0 ? discount.finalPrice : null}
        discountLabel={discount.discountLabel}
        hasVouchers={hasVouchers}
        shippingZones={shippingZones}
      />
    </main>
  )
}
