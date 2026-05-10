'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/tracking-client'
import { usePixelEventMapping } from '@/hooks/usePixelEventMapping'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPenToSquare, faBuildingColumns, faQrcode,
  faCircleInfo, faWallet, faStore,
  faShieldHalved, faArrowRight, faWeightScale, faTag, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createOrder } from '@/lib/actions/orders'
import { validateVoucherCode } from '@/lib/actions/settings'
import { getShippingInfo, DEFAULT_SHIPPING_ZONES } from '@/lib/shipping'
import type { ShippingZone } from '@/lib/shipping'
import type { Product } from '@prisma/client'

interface ActiveChannels {
  BCAVA: boolean; MANDIRIVA: boolean; BNIVA: boolean; BRIVA: boolean
  PERMATAVA: boolean; MUAMALATVA: boolean; CIMBVA: boolean; BSIVA: boolean
  QRIS: boolean; QRIS2: boolean
  OVO: boolean; DANA: boolean; SHOPEEPAY: boolean
  ALFAMART: boolean; INDOMARET: boolean; ALFAMIDI: boolean
  MANUAL: boolean
}
interface ManualBankItem { id: string; code: string; name: string; number: string; owner: string }
interface ManualBank {
  enabled: boolean; bankName: string; accountNumber: string; accountOwner: string
  banks?: ManualBankItem[]
}
interface ManualQris {
  enabled: boolean; image: string; bank: string; label: string
}

// Proper Indonesian bank brand colors
const BANK_STYLE: Record<string, { bg: string; text: string; abbr: string }> = {
  BCA:   { bg: '#003D86', text: '#fff',    abbr: 'BCA' },
  MNR:   { bg: '#003087', text: '#FFD700', abbr: 'MNR' },
  BNI:   { bg: '#FF6600', text: '#fff',    abbr: 'BNI' },
  BRI:   { bg: '#00529B', text: '#fff',    abbr: 'BRI' },
  BSI:   { bg: '#007A52', text: '#fff',    abbr: 'BSI' },
  CIMB:  { bg: '#BE1E2D', text: '#fff',    abbr: 'CIMB' },
  DNN:   { bg: '#E40522', text: '#fff',    abbr: 'DNN' },
  PMT:   { bg: '#00A651', text: '#fff',    abbr: 'PMT' },
  BTN:   { bg: '#009A44', text: '#fff',    abbr: 'BTN' },
  MEGA:  { bg: '#1B1464', text: '#fff',    abbr: 'MEGA' },
  OCBC:  { bg: '#EE3124', text: '#fff',    abbr: 'OCBC' },
  PANIN: { bg: '#003399', text: '#fff',    abbr: 'PANIN' },
}

// VA methods with proper brand styles
const ALL_VA_METHODS = [
  { value: 'BCAVA',      code: 'BCA',  label: 'BCA Virtual Account',        channelKey: 'BCAVA' as const },
  { value: 'MANDIRIVA',  code: 'MNR',  label: 'Mandiri Virtual Account',    channelKey: 'MANDIRIVA' as const },
  { value: 'BNIVA',      code: 'BNI',  label: 'BNI Virtual Account',        channelKey: 'BNIVA' as const },
  { value: 'BRIVA',      code: 'BRI',  label: 'BRI Virtual Account',        channelKey: 'BRIVA' as const },
  { value: 'PERMATAVA',  code: 'PMT',  label: 'Permata Virtual Account',    channelKey: 'PERMATAVA' as const },
  { value: 'MUAMALATVA', code: 'MMT',  label: 'Muamalat Virtual Account',   channelKey: 'MUAMALATVA' as const },
  { value: 'CIMBVA',     code: 'CIMB', label: 'CIMB Niaga Virtual Account', channelKey: 'CIMBVA' as const },
  { value: 'BSIVA',      code: 'BSI',  label: 'BSI Virtual Account',        channelKey: 'BSIVA' as const },
]

const ALL_EWALLET_METHODS = [
  { value: 'OVO',       code: 'OVO',  label: 'OVO',       channelKey: 'OVO' as const,       bg: '#4C3494', text: '#fff' },
  { value: 'DANA',      code: 'DANA', label: 'DANA',      channelKey: 'DANA' as const,      bg: '#108EE9', text: '#fff' },
  { value: 'SHOPEEPAY', code: 'SPAY', label: 'ShopeePay', channelKey: 'SHOPEEPAY' as const, bg: '#EE4D2D', text: '#fff' },
]

const ALL_KASIR_METHODS = [
  { value: 'ALFAMART',  code: 'ALFA', label: 'Alfamart',  channelKey: 'ALFAMART' as const,  bg: '#E8192C', text: '#fff' },
  { value: 'INDOMARET', code: 'INDO', label: 'Indomaret', channelKey: 'INDOMARET' as const, bg: '#CC0000', text: '#fff' },
  { value: 'ALFAMIDI',  code: 'MIDI', label: 'Alfamidi',  channelKey: 'ALFAMIDI' as const,  bg: '#0063A7', text: '#fff' },
]

function BankBadge({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' }) {
  const style = BANK_STYLE[code] ?? { bg: '#6B7280', text: '#fff', abbr: code.substring(0, 4) }
  const dim = size === 'sm' ? 'w-8 h-7 text-[9px]' : 'w-11 h-8 text-[10px]'
  return (
    <div className={`${dim} rounded-[6px] flex items-center justify-center font-bold shrink-0 leading-none`}
      style={{ background: style.bg, color: style.text }}>
      {style.abbr}
    </div>
  )
}

const inputCls = 'w-full h-12 px-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]'

export default function CheckoutForm({
  product, activeChannels, manualBank, manualQris, discountedPrice, discountLabel, hasVouchers, shippingZones
}: {
  product: Product
  activeChannels?: ActiveChannels
  manualBank?: ManualBank
  manualQris?: ManualQris | null
  discountedPrice?: number | null
  discountLabel?: string | null
  hasVouchers?: boolean
  shippingZones?: ShippingZone[]
}) {
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (!activeChannels) return 'BCAVA'
    if (activeChannels.BCAVA) return 'BCAVA'
    if (activeChannels.MANDIRIVA) return 'MANDIRIVA'
    if (activeChannels.BNIVA) return 'BNIVA'
    if (activeChannels.BRIVA) return 'BRIVA'
    if (activeChannels.PERMATAVA) return 'PERMATAVA'
    if (activeChannels.BSIVA) return 'BSIVA'
    if (activeChannels.QRIS) return 'QRIS'
    if (activeChannels.OVO) return 'OVO'
    if (activeChannels.DANA) return 'DANA'
    if (activeChannels.SHOPEEPAY) return 'SHOPEEPAY'
    if (activeChannels.ALFAMART) return 'ALFAMART'
    if (activeChannels.MANUAL) return 'MANUAL_0'
    return 'BCAVA'
  })
  const [isPending, startTransition] = useTransition()
  const [voucherPending, startVoucherTransition] = useTransition()

  // Pixel event for /checkout is admin-configurable via /admin/pengaturan
  // (key: fb_event_checkout). Default: InitiateCheckout.
  const pixelMap = usePixelEventMapping()
  const trackedRef = useRef(false)
  useEffect(() => {
    if (trackedRef.current) return
    if (!pixelMap.page_checkout) return
    trackedRef.current = true
    trackEvent(pixelMap.page_checkout, {
      content_ids: [product.slug],
      content_name: product.name,
      content_category: product.category ?? undefined,
      value: discountedPrice ?? product.price,
      currency: 'IDR',
      num_items: 1,
    })
  }, [pixelMap.page_checkout, product.slug, product.name, product.category, product.price, discountedPrice])
  const [error, setError] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherDiscount, setVoucherDiscount] = useState(0)      // actual discount Rp
  const [voucherPct, setVoucherPct] = useState(0)
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [city, setCity] = useState('')

  // Effective display price (global discount already computed server-side)
  const baseDisplayPrice = discountedPrice ?? product.price
  const globalDiscountAmount = product.price - baseDisplayPrice

  // Live shipping from zones (use server-passed zones, fallback to defaults)
  const zones = shippingZones ?? DEFAULT_SHIPPING_ZONES
  const shippingInfo = city.trim() ? getShippingInfo(city, zones) : { available: true, cost: 0, zoneName: '' }
  const shippingCost = shippingInfo.available ? shippingInfo.cost : 0
  const cityNotServed = city.trim().length > 2 && !shippingInfo.available

  // Final totals
  const subtotalAfterGlobal = baseDisplayPrice + shippingCost
  const totalDisplay = subtotalAfterGlobal - voucherDiscount

  function handleApplyVoucher() {
    const code = voucherCode.trim().toUpperCase()
    if (!code) return
    setVoucherError(null)
    startVoucherTransition(async () => {
      const result = await validateVoucherCode(code, subtotalAfterGlobal)
      if (result.valid) {
        setVoucherDiscount(result.discountAmount)
        setVoucherPct(result.discountPct)
        setVoucherApplied(true)
        setVoucherError(null)
      } else {
        setVoucherDiscount(0)
        setVoucherApplied(false)
        setVoucherError(result.error)
      }
    })
  }

  const activeVA = ALL_VA_METHODS.filter(m => !activeChannels || activeChannels[m.channelKey])
  const activeEWallet = ALL_EWALLET_METHODS.filter(m => !activeChannels || activeChannels[m.channelKey])
  const activeKasir = ALL_KASIR_METHODS.filter(m => !activeChannels || activeChannels[m.channelKey])
  const showQRIS = !activeChannels || activeChannels.QRIS !== false
  const showManual = manualBank?.enabled && activeChannels?.MANUAL

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('paymentMethod', paymentMethod)
    fd.set('voucherCode', voucherCode.trim().toUpperCase())
    startTransition(async () => {
      try {
        await createOrder(fd)
      } catch (err: any) {
        // redirect() throws NEXT_REDIRECT which is not a real error
        if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.startsWith('NEXT_REDIRECT')) return
        setError(err?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
      }
    })
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* LEFT: Form */}
      <div className="w-full lg:w-[65%]">
        <div className="bg-white rounded-[12px] border border-brand-muted/20 shadow-premium p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dashed border-brand-muted/20">
            <div className="w-12 h-12 rounded-[12px] bg-brand-light border border-brand-muted/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faPenToSquare} className="text-brand-surface text-xl" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-brand-text-dark">Formulir Pemesanan</h1>
              <p className="text-brand-muted text-sm mt-0.5">Lengkapi data diri dan alamat pengiriman Anda.</p>
            </div>
          </div>

          <form id="order-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input type="hidden" name="slug" value={product.slug} />

            {/* Nama */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">NAMA LENGKAP <span className="text-brand-surface">*</span></label>
              <input name="customerName" type="text" required placeholder="Masukkan nama lengkap Anda" className={inputCls} />
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">NOMOR WHATSAPP <span className="text-brand-surface">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-medium">+62</span>
                <input name="whatsapp" type="tel" required placeholder="812-3456-7890" className={`${inputCls} pl-12`} />
              </div>
            </div>

            {/* Alamat */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">ALAMAT PENGIRIMAN <span className="text-brand-surface">*</span></label>
              <textarea name="address" rows={3} placeholder="Masukkan alamat lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kota)" className="w-full p-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm resize-none focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]" />
            </div>
            {/* Kota */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">KOTA <span className="text-brand-surface">*</span></label>
              <input
                name="city"
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Contoh: Bandung, Garut, Purwakarta..."
                className={`w-full h-12 px-4 rounded-[8px] border bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none ${
                  cityNotServed
                    ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_1px_#f87171]'
                    : shippingInfo.available && city.trim()
                    ? 'border-emerald-400 focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]'
                    : 'border-brand-muted/20 focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]'
                }`}
              />
              {/* Hint area */}
              {!city.trim() && (
                <p className="text-xs text-brand-muted">
                  Area terlayani: <span className="font-medium">Bandung Raya, Garut, Subang, Purwakarta, Tasikmalaya</span>
                </p>
              )}
              {city.trim() && shippingInfo.available && (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ {shippingInfo.zoneName}{' '}
                  {shippingInfo.cost === 0 ? '— Gratis ongkir' : `— Ongkir +${formatCurrency(shippingInfo.cost)}`}
                </p>
              )}
              {cityNotServed && (
                <p className="text-xs text-red-600 font-medium">
                  ✕ Maaf, pengiriman belum tersedia ke kota ini. Area terlayani: Bandung Raya, Garut, Subang, Purwakarta, Tasikmalaya.
                </p>
              )}
            </div>

            {/* Tanggal */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">TANGGAL PENGIRIMAN <span className="text-brand-surface">*</span></label>
              <div className="relative">
                <select name="deliveryDate" className={`${inputCls} appearance-none`}>
                  <option value="" disabled>Pilih jadwal pengiriman</option>
                  <option value="2025-06-14">H-3 Idul Adha (14 Juni 2025)</option>
                  <option value="2025-06-15">H-2 Idul Adha (15 Juni 2025)</option>
                  <option value="2025-06-16">H-1 Idul Adha (16 Juni 2025)</option>
                </select>
                <i className="fa-solid fa-chevron-down text-xs text-brand-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Catatan */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">CATATAN TAMBAHAN (OPSIONAL)</label>
              <input name="notes" type="text" placeholder="Misal: Patokan rumah, jam pengiriman yang diinginkan" className={inputCls} />
            </div>

            {/* Voucher input — di sini supaya mudah ditemukan */}
            <div className="flex flex-col gap-2 pb-6 border-b border-dashed border-brand-muted/20">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTag} className="text-brand-accent" /> KODE VOUCHER (OPSIONAL)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={e => {
                    setVoucherCode(e.target.value.toUpperCase())
                    setVoucherApplied(false)
                    setVoucherDiscount(0)
                    setVoucherError(null)
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyVoucher() } }}
                  placeholder="Masukkan kode voucher (opsional)"
                  className={`${inputCls} flex-1 font-mono tracking-wider ${voucherApplied ? 'border-emerald-400' : ''}`}
                />
                <button type="button" onClick={handleApplyVoucher} disabled={voucherPending || !voucherCode.trim()}
                  className="px-4 h-12 bg-brand-surface text-white text-sm font-bold rounded-[8px] hover:bg-brand-dark transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-60">
                  {voucherPending ? '...' : voucherApplied ? <><FontAwesomeIcon icon={faCheck} /> Diterapkan</> : 'Terapkan'}
                </button>
              </div>
              {voucherApplied && voucherDiscount > 0 && (
                <p className="text-xs text-emerald-600 font-semibold">✓ Diskon {voucherPct}% ({formatCurrency(voucherDiscount)}) berhasil diterapkan</p>
              )}
              {voucherError && <p className="text-xs text-red-600 font-medium">✕ {voucherError}</p>}
            </div>

            {/* Payment methods — dynamic */}
            <div className="flex flex-col gap-4 pt-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">
                METODE PEMBAYARAN <span className="text-brand-surface">*</span>
              </label>

              {/* Virtual Account group */}
              {activeVA.length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Transfer Bank (Virtual Account)</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {activeVA.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                          paymentMethod === method.value ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          paymentMethod === method.value ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'
                        }`}>
                          {paymentMethod === method.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        {/* Proper bank badge with brand color */}
                        <BankBadge code={method.code} />
                        <span className="text-sm font-medium text-brand-dark">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QRIS group */}
              {showQRIS && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faQrcode} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">QRIS</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        paymentMethod === 'QRIS' ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        paymentMethod === 'QRIS' ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'
                      }`}>
                        {paymentMethod === 'QRIS' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                        style={{ background: '#00AED6', color: '#fff' }}>QRIS</div>
                      <div>
                        <span className="text-sm font-medium text-brand-dark">QRIS</span>
                        <div className="text-xs text-brand-muted">GoPay · OVO · DANA · ShopeePay · M-Banking</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* E-Wallet (Redirect) */}
              {activeEWallet.length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faWallet} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">E-Wallet</span>
                    <span className="text-[10px] text-brand-muted ml-1">— akan diarahkan ke app e-wallet</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {activeEWallet.map((method) => (
                      <button key={method.value} type="button" onClick={() => setPaymentMethod(method.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${paymentMethod === method.value ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod === method.value ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                          {paymentMethod === method.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ background: method.bg, color: method.text }}>{method.code}</div>
                        <div>
                          <span className="text-sm font-medium text-brand-dark">{method.label}</span>
                          <div className="text-xs text-brand-muted">Akan diarahkan ke aplikasi {method.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kasir / Minimarket */}
              {activeKasir.length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faStore} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Minimarket / Kasir</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {activeKasir.map((method) => (
                      <button key={method.value} type="button" onClick={() => setPaymentMethod(method.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${paymentMethod === method.value ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod === method.value ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                          {paymentMethod === method.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ background: method.bg, color: method.text }}>{method.code}</div>
                        <span className="text-sm font-medium text-brand-dark">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QRIS Manual — appears before Manual Transfer */}
              {manualQris?.enabled && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faQrcode} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">QRIS Manual</span>
                    <span className="text-[10px] text-brand-muted ml-1">— scan & upload bukti</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MANUAL_QRIS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${paymentMethod === 'MANUAL_QRIS' ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${paymentMethod === 'MANUAL_QRIS' ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                      {paymentMethod === 'MANUAL_QRIS' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                      style={{ background: '#00AED6', color: '#fff' }}>QRIS</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-brand-dark leading-tight">
                        QRIS{manualQris.bank ? ` — ${manualQris.bank}` : ''}
                      </span>
                      {manualQris.label && (
                        <span className="text-xs text-brand-muted leading-tight mt-0.5">{manualQris.label}</span>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* Manual Transfer — each bank is its own radio option */}
              {showManual && manualBank && (() => {
                const banks = manualBank.banks && manualBank.banks.length > 0
                  ? manualBank.banks
                  : [{ id:'0', code:'', name: manualBank.bankName, number: manualBank.accountNumber, owner: manualBank.accountOwner }]
                return (
                  <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                      <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                      <span className="text-xs font-bold text-brand-dark">Transfer Manual</span>
                      <span className="text-[10px] text-brand-muted ml-1">— langsung ke rekening</span>
                    </div>
                    <div className="divide-y divide-brand-muted/10">
                      {banks.map((b, idx) => {
                        const value = `MANUAL_${idx}`
                        const style = BANK_STYLE[b.code] ?? { bg: '#1B5E3B', text: '#fff', abbr: b.name.replace('Bank ','').substring(0,4).toUpperCase() }
                        const selected = paymentMethod === value
                        return (
                          <button
                            key={b.id ?? idx}
                            type="button"
                            onClick={() => setPaymentMethod(value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                              selected ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                              selected ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'
                            }`}>
                              {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                              style={{ background: style.bg, color: style.text }}>
                              {style.abbr}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-brand-dark leading-tight">{b.name}</span>
                              <span className="text-xs text-brand-muted leading-tight mt-0.5">{b.number} — A/N {b.owner}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              <div className="flex items-start gap-2 bg-brand-light border border-brand-accent/20 rounded-[8px] p-3">
                <FontAwesomeIcon icon={faCircleInfo} className="text-brand-accent text-sm mt-0.5" />
                <p className="text-xs text-brand-muted">
                  <span className="font-bold text-brand-text-dark">Pembayaran Aman:</span> Semua transaksi dienkripsi dan dilindungi sistem keamanan berlapis.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[8px] p-3 text-sm text-red-700">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Mobile submit */}
            <button type="submit" disabled={isPending || cityNotServed} className="lg:hidden w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isPending ? 'Memproses...' : cityNotServed ? 'Area Tidak Terlayani' : 'Konfirmasi Pesanan'} {!cityNotServed && <FontAwesomeIcon icon={faArrowRight} />}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Summary */}
      <div className="w-full lg:w-[35%]">
        <div className="bg-brand-surface rounded-[12px] shadow-premium overflow-hidden sticky top-28">
          <div className="p-6 border-b border-brand-surface-light/30">
            <h2 className="font-serif text-xl font-bold text-brand-light mb-1">Ringkasan Pesanan</h2>
            <p className="text-brand-accent-light/70 text-xs">Periksa kembali pesanan Anda</p>
          </div>
          <div className="p-6 bg-brand-dark/20">
            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 rounded-[8px] overflow-hidden bg-brand-light shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-brand-light font-bold text-sm mb-1">{product.name}</h3>
                <span className="bg-brand-surface-light/50 text-brand-accent-light text-xs px-2 py-0.5 rounded-[4px] w-fit mb-2">
                  <FontAwesomeIcon icon={faWeightScale} className="mr-1" />{product.weight} kg
                </span>
                {/* Show strikethrough if any discount active */}
                {(globalDiscountAmount > 0 || voucherDiscount > 0)
                  ? <div className="flex flex-col gap-0.5">
                      <span className="text-brand-accent-light/40 line-through text-sm">{formatCurrency(product.price)}</span>
                      <span className="font-bold text-brand-accent text-base">{formatCurrency(totalDisplay)}</span>
                    </div>
                  : <span className="font-bold text-brand-accent text-base">{formatCurrency(product.price)}</span>
                }
              </div>
            </div>
            <div className="flex flex-col gap-2.5 text-sm border-t border-brand-surface-light/30 pt-4 mb-4">
              <div className="flex justify-between text-brand-accent-light/80">
                <span>Harga Produk</span>
                <span>{formatCurrency(product.price)}</span>
              </div>
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span><FontAwesomeIcon icon={faTag} className="mr-1 text-xs" />{discountLabel}</span>
                  <span>-{formatCurrency(globalDiscountAmount)}</span>
                </div>
              )}
              {voucherApplied && voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span><FontAwesomeIcon icon={faTag} className="mr-1 text-xs" />Voucher {voucherCode} ({voucherPct}%)</span>
                  <span>-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-accent-light/80">
                <span>Biaya Pengiriman</span>
                {cityNotServed
                  ? <span className="text-red-400 text-xs font-semibold">Tidak Terlayani</span>
                  : shippingCost > 0
                  ? <span className="text-amber-400 font-semibold">+{formatCurrency(shippingCost)}</span>
                  : <span className="text-[#25D366] font-semibold">{city.trim() ? 'Gratis ✓' : 'Gratis*'}</span>
                }
              </div>
              <div className="flex justify-between text-brand-accent-light/80"><span>Biaya Perawatan</span><span className="text-[#25D366] font-semibold">Gratis</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-brand-surface-light/30 pt-4 mb-6">
              <span className="font-bold text-brand-light">Total Pembayaran</span>
              <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalDisplay)}</span>
            </div>
            <button type="submit" form="order-form" disabled={isPending || cityNotServed} className="hidden lg:flex w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isPending ? 'Memproses...' : cityNotServed ? 'Area Tidak Terlayani' : 'Konfirmasi Pesanan'} {!cityNotServed && <FontAwesomeIcon icon={faArrowRight} />}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-brand-accent-light/50 text-xs">
              <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/60" /> Transaksi aman &amp; terenkripsi
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Sticky bottom bar ── */}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand-muted/15 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-brand-muted leading-none">Total Pembayaran</span>
          <span className="font-serif text-xl font-bold text-brand-accent leading-tight">{formatCurrency(totalDisplay)}</span>
        </div>
        <button
          type="submit" form="order-form"
          disabled={isPending || cityNotServed}
          className="ml-auto flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold px-6 py-3 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity text-sm whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Memproses...' : cityNotServed ? 'Area Tidak Terlayani' : <><span>Qurban Sekarang</span><FontAwesomeIcon icon={faArrowRight} /></>}
        </button>
      </div>
    </div>
    <div className="h-20" />
    </>
  )
}
