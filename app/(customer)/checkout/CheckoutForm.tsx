'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPenToSquare, faBuildingColumns, faQrcode,
  faCircleInfo, faWallet, faStore,
  faShieldHalved, faArrowRight, faWeightScale, faTag, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createOrder } from '@/lib/actions/orders'
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
  product, activeChannels, manualBank, discountedPrice, discountLabel, hasVouchers
}: {
  product: Product
  activeChannels?: ActiveChannels
  manualBank?: ManualBank
  discountedPrice?: number | null   // final price after global discount (null = no discount)
  discountLabel?: string | null     // e.g. "Diskon 10%"
  hasVouchers?: boolean             // whether voucher input should show
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
    if (activeChannels.MANUAL) return 'MANUAL_TRANSFER'
    return 'BCAVA'
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  // Effective display price (global discount already computed server-side)
  const baseDisplayPrice = discountedPrice ?? product.price
  const discountAmount = product.price - baseDisplayPrice

  // Simulate voucher client-side hint (actual validation is server-side in createOrder)
  function handleApplyVoucher() {
    if (!voucherCode.trim()) return
    setVoucherApplied(true)
    setVoucherError(null)
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
                placeholder="Contoh: Bandung, Jakarta Selatan, Sumedang"
                className="w-full h-12 px-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]"
              />
              <p className="text-xs text-brand-muted">Bandung Raya = gratis ongkir · Luar Bandung Raya = +Rp 150.000</p>
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
            <div className="flex flex-col gap-2 pb-6 border-b border-dashed border-brand-muted/20">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">CATATAN TAMBAHAN (OPSIONAL)</label>
              <input name="notes" type="text" placeholder="Misal: Patokan rumah, jam pengiriman yang diinginkan" className={inputCls} />
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

              {/* Manual Transfer — show all configured banks */}
              {showManual && manualBank && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Transfer Manual</span>
                    <span className="text-[10px] text-brand-muted ml-1">— langsung ke rekening</span>
                  </div>
                  {/* ONE selectable option that covers all banks */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MANUAL_TRANSFER')}
                    className={`w-full px-4 py-3 text-left transition-all ${paymentMethod === 'MANUAL_TRANSFER' ? 'bg-brand-accent/[0.04]' : 'hover:bg-brand-light/70'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${paymentMethod === 'MANUAL_TRANSFER' ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                        {paymentMethod === 'MANUAL_TRANSFER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-brand-dark block mb-2">
                          Transfer ke rekening bank kami
                        </span>
                        {/* Show all configured banks */}
                        <div className="flex flex-col gap-1.5">
                          {(manualBank.banks && manualBank.banks.length > 0
                            ? manualBank.banks
                            : [{ id:'0', code:'', name: manualBank.bankName, number: manualBank.accountNumber, owner: manualBank.accountOwner }]
                          ).map((b, idx) => {
                            const style = BANK_STYLE[b.code] ?? { bg: '#1B5E3B', text: '#fff', abbr: b.name.replace('Bank ','').substring(0,4).toUpperCase() }
                            return (
                              <div key={idx} className="flex items-center gap-2.5">
                                <div className="w-10 h-7 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                                  style={{ background: style.bg, color: style.text }}>
                                  {style.abbr}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-brand-dark">{b.name}</span>
                                  <span className="text-xs text-brand-muted ml-2">{b.number} — A/N {b.owner}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              <div className="flex items-start gap-2 bg-brand-light border border-brand-accent/20 rounded-[8px] p-3">
                <FontAwesomeIcon icon={faCircleInfo} className="text-brand-accent text-sm mt-0.5" />
                <p className="text-xs text-brand-muted">
                  <span className="font-bold text-brand-text-dark">Pembayaran Aman:</span> Semua transaksi dienkripsi dan dilindungi sistem keamanan berlapis.
                </p>
              </div>
            </div>

            {/* Voucher input */}
            {hasVouchers && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTag} className="text-brand-accent" /> KODE VOUCHER (OPSIONAL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherApplied(false) }}
                    placeholder="Masukkan kode voucher"
                    className={`${inputCls} flex-1 font-mono tracking-wider`}
                  />
                  <button type="button" onClick={handleApplyVoucher}
                    className="px-4 h-12 bg-brand-surface text-white text-sm font-bold rounded-[8px] hover:bg-brand-dark transition-colors flex items-center gap-1.5 shrink-0">
                    {voucherApplied ? <><FontAwesomeIcon icon={faCheck} /> Diterapkan</> : 'Terapkan'}
                  </button>
                </div>
                {voucherApplied && !voucherError && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Voucher akan diterapkan saat checkout</p>
                )}
                {voucherError && <p className="text-xs text-red-600">{voucherError}</p>}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[8px] p-3 text-sm text-red-700">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Mobile submit */}
            <button type="submit" disabled={isPending} className="lg:hidden w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
              {isPending ? 'Memproses...' : 'Konfirmasi Pesanan'} <FontAwesomeIcon icon={faArrowRight} />
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
                {discountAmount > 0
                  ? <div className="flex flex-col gap-0.5">
                      <span className="text-brand-accent-light/50 line-through text-sm">{formatCurrency(product.price)}</span>
                      <span className="font-bold text-brand-accent text-base">{formatCurrency(baseDisplayPrice)}</span>
                    </div>
                  : <span className="font-bold text-brand-accent text-base">{formatCurrency(product.price)}</span>
                }
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm border-t border-brand-surface-light/30 pt-4 mb-4">
              <div className="flex justify-between text-brand-accent-light/80"><span>Harga Produk</span><span>{formatCurrency(product.price)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span><FontAwesomeIcon icon={faTag} className="mr-1 text-xs" />{discountLabel}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {voucherApplied && voucherCode && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span><FontAwesomeIcon icon={faTag} className="mr-1 text-xs" />Voucher {voucherCode}</span>
                  <span className="text-xs opacity-70">diterapkan</span>
                </div>
              )}
              <div className="flex justify-between text-brand-accent-light/80"><span>Biaya Pengiriman</span><span className="text-[#25D366] font-semibold">Gratis*</span></div>
              <div className="flex justify-between text-brand-accent-light/80"><span>Biaya Perawatan</span><span className="text-[#25D366] font-semibold">Gratis</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-brand-surface-light/30 pt-4 mb-6">
              <span className="font-bold text-brand-light">Total Pembayaran</span>
              <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(baseDisplayPrice)}</span>
            </div>
            <button type="submit" form="order-form" disabled={isPending} className="hidden lg:flex w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity items-center justify-center gap-2 disabled:opacity-60">
              {isPending ? 'Memproses...' : 'Konfirmasi Pesanan'} <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-brand-accent-light/50 text-xs">
              <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/60" /> Transaksi aman &amp; terenkripsi
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
