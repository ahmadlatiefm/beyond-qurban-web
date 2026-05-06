'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faHandHoldingHeart,
  faArrowRight,
  faShieldHalved,
  faPen,
  faBuildingColumns,
  faQrcode,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'

interface ActiveChannels {
  BCAVA: boolean; MANDIRIVA: boolean; BNIVA: boolean; BRIVA: boolean
  PERMATAVA: boolean; MUAMALATVA: boolean; CIMBVA: boolean; BSIVA: boolean
  QRIS: boolean; QRIS2: boolean
  OVO: boolean; DANA: boolean; SHOPEEPAY: boolean
  ALFAMART: boolean; INDOMARET: boolean; ALFAMIDI: boolean
  MANUAL: boolean
}
interface ManualBankItemD { id: string; code: string; name: string; number: string; owner: string }
interface ManualBank { enabled: boolean; bankName: string; accountNumber: string; accountOwner: string; banks?: ManualBankItemD[] }

const BANK_STYLE_D: Record<string, { bg: string; text: string; abbr: string }> = {
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

const VA_STYLE_D: Record<string, { bg: string; text: string; abbr: string }> = {
  BCAVA:      { ...BANK_STYLE_D['BCA']! },
  MANDIRIVA:  { ...BANK_STYLE_D['MNR']! },
  BNIVA:      { ...BANK_STYLE_D['BNI']! },
  BRIVA:      { ...BANK_STYLE_D['BRI']! },
  PERMATAVA:  { ...BANK_STYLE_D['PMT']! },
  MUAMALATVA: { bg: '#007A52', text: '#fff', abbr: 'MMT' },
  CIMBVA:     { ...BANK_STYLE_D['CIMB']! },
  BSIVA:      { ...BANK_STYLE_D['BSI']! },
}

const ALL_VA_METHODS = [
  { value: 'BCAVA',      bank: 'BCA',  label: 'BCA Virtual Account',        channelKey: 'BCAVA' as const },
  { value: 'MANDIRIVA',  bank: 'MNR',  label: 'Mandiri Virtual Account',    channelKey: 'MANDIRIVA' as const },
  { value: 'BNIVA',      bank: 'BNI',  label: 'BNI Virtual Account',        channelKey: 'BNIVA' as const },
  { value: 'BRIVA',      bank: 'BRI',  label: 'BRI Virtual Account',        channelKey: 'BRIVA' as const },
  { value: 'PERMATAVA',  bank: 'PMT',  label: 'Permata Virtual Account',    channelKey: 'PERMATAVA' as const },
  { value: 'MUAMALATVA', bank: 'MMT',  label: 'Muamalat Virtual Account',   channelKey: 'MUAMALATVA' as const },
  { value: 'CIMBVA',     bank: 'CIMB', label: 'CIMB Niaga Virtual Account', channelKey: 'CIMBVA' as const },
  { value: 'BSIVA',      bank: 'BSI',  label: 'BSI Virtual Account',        channelKey: 'BSIVA' as const },
]

const ALL_EWALLET_METHODS_D = [
  { value: 'OVO',       code: 'OVO',  label: 'OVO',       channelKey: 'OVO' as const,       bg: '#4C3494', text: '#fff' },
  { value: 'DANA',      code: 'DANA', label: 'DANA',      channelKey: 'DANA' as const,      bg: '#108EE9', text: '#fff' },
  { value: 'SHOPEEPAY', code: 'SPAY', label: 'ShopeePay', channelKey: 'SHOPEEPAY' as const, bg: '#EE4D2D', text: '#fff' },
]

const ALL_KASIR_METHODS_D = [
  { value: 'ALFAMART',  code: 'ALFA', label: 'Alfamart',  channelKey: 'ALFAMART' as const,  bg: '#E8192C', text: '#fff' },
  { value: 'INDOMARET', code: 'INDO', label: 'Indomaret', channelKey: 'INDOMARET' as const, bg: '#CC0000', text: '#fff' },
  { value: 'ALFAMIDI',  code: 'MIDI', label: 'Alfamidi',  channelKey: 'ALFAMIDI' as const,  bg: '#0063A7', text: '#fff' },
]
import { formatCurrency } from '@/lib/utils'
import { createDonation } from '@/lib/actions/donations'
import type { Campaign } from '@prisma/client'

const inpCls =
  'w-full h-11 px-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A] transition-[border-color]'

export default function DonationForm({
  campaign, qty, shareType, animalName, animalPrice, activeChannels, manualBank
}: {
  campaign: Campaign; qty: number; shareType: '1/1' | '1/7'
  animalName?: string | null; animalPrice?: number | null
  activeChannels?: ActiveChannels
  manualBank?: ManualBank
}) {
  const [isPending, startTransition] = useTransition()
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
  // Use specific animal price if provided (from sidebar animal picker)
  const unitPrice = animalPrice ?? (shareType === '1/7' ? Math.round(campaign.price / 7) : campaign.price)
  const total = unitPrice * qty

  function getFlag(loc: string) {
    if (loc === 'AFRICA') return '🌍'
    if (loc === 'PALESTINE') return '🇵🇸'
    return '🇮🇩'
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('paymentMethod', paymentMethod)
    startTransition(() => {
      createDonation(fd)
    })
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* LEFT: Form */}
      <div className="flex-1 flex flex-col gap-5">
        <form id="donation-form" onSubmit={handleSubmit} className="contents">
          <input type="hidden" name="campaignSlug" value={campaign.slug} />
          {animalName && <input type="hidden" name="animalName" value={animalName} />}
          {animalPrice && <input type="hidden" name="animalPrice" value={animalPrice} />}
          <input type="hidden" name="quantity" value={qty} />

          {/* Section 1: Informasi Donatur */}
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-7">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dashed border-brand-muted/10">
              <div className="w-10 h-10 rounded-[10px] bg-brand-light border border-brand-muted/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-brand-surface" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-text-dark">Informasi Donatur</h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  Data ini digunakan untuk laporan dan sertifikat qurban Anda
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Nama Lengkap <span className="text-brand-surface">*</span>
                </label>
                <input
                  name="customerName"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  className={inpCls}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Nomor WhatsApp <span className="text-brand-surface">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-medium">
                    +62
                  </span>
                  <input
                    name="whatsapp"
                    type="tel"
                    required
                    placeholder="812-3456-7890"
                    className={`${inpCls} pl-12`}
                  />
                </div>
                <p className="text-xs text-brand-muted mt-1.5">
                  Laporan foto &amp; sertifikat akan dikirim ke nomor ini
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Email{' '}
                  <span className="text-brand-muted/60 font-normal normal-case">(Opsional)</span>
                </label>
                <input name="email" type="email" placeholder="email@contoh.com" className={inpCls} />
              </div>
            </div>
          </div>

          {/* Section 2: Destinasi (read-only) */}
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-brand-light border border-brand-muted/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faHandHoldingHeart} className="text-brand-surface" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-brand-text-dark">Destinasi Penyaluran</h2>
                  <p className="text-xs text-brand-muted mt-0.5">Dipilih dari halaman program</p>
                </div>
              </div>
              <Link
                href="/penyaluran"
                className="text-brand-surface text-xs font-bold hover:text-brand-accent transition-colors border border-brand-surface/30 hover:border-brand-accent px-3 py-1.5 rounded-[8px]"
              >
                <FontAwesomeIcon icon={faPen} className="text-xs mr-1" />
                Ganti
              </Link>
            </div>
            <div
              className="rounded-[12px] border-2 border-brand-accent/30 p-4 relative overflow-hidden"
              style={{ background: 'rgba(200,150,42,.03)' }}
            >
              {/* Baris 1: Flag + Judul + Harga */}
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl shrink-0">{getFlag(campaign.location)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-brand-dark text-sm leading-snug">{campaign.title}</h3>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[10px] text-brand-muted">Harga</div>
                  <div className="font-serif text-lg font-bold text-brand-accent leading-tight">
                    {formatCurrency(campaign.price)}
                  </div>
                </div>
              </div>
              {/* Baris 2: Deskripsi singkat */}
              <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 mb-3 pl-9">
                {campaign.description}
              </p>
              {/* Baris 3: Chips fitur — penuh lebar */}
              <div className="flex flex-row flex-wrap gap-1.5 pl-9">
                {['Laporan Foto & Video', 'Sertifikat Qurban', 'Sesuai Syariat'].map((f) => (
                  <span
                    key={f}
                    className="text-[11px] text-brand-surface font-medium bg-brand-surface/10 px-2.5 py-1 rounded-full whitespace-nowrap"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Atas Nama */}
          {(campaign as any).programType !== 'sedekah' && (
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-7">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dashed border-brand-muted/10">
                <div className="w-10 h-10 rounded-[10px] bg-brand-light border border-brand-muted/15 flex items-center justify-center">
                  📜
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-brand-text-dark">Atas Nama Qurban</h2>
                  <p className="text-xs text-brand-muted mt-0.5">Nama yang tertera dalam sertifikat</p>
                </div>
              </div>

              {shareType === '1/7' && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2 text-xs text-amber-700 mb-4">
                  <span>🐄</span>
                  <span><strong>1/7 bagian sapi</strong> — Anda berkurban bersama 6 peserta lainnya dalam 1 ekor sapi</span>
                </div>
              )}
              <input type="hidden" name="shareType" value={shareType} />

              {/* Single name if qty=1 */}
              {qty === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="radio" name="forWhom" value="self" defaultChecked className="accent-brand-surface w-4 h-4" />
                      <span className="text-sm font-medium text-brand-dark">Diri sendiri</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="radio" name="forWhom" value="other" className="accent-brand-surface w-4 h-4" />
                      <span className="text-sm font-medium text-brand-dark">Orang lain</span>
                    </label>
                  </div>
                  <input name="qurbanName" type="text" required placeholder="Nama atas nama qurban" className={inpCls} />
                </div>
              )}

              {/* Multiple names if qty > 1 */}
              {qty > 1 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-brand-muted mb-2">Masukkan nama untuk masing-masing ekor hewan kurban:</p>
                  {Array.from({ length: qty }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-surface/10 border border-brand-surface/20 flex items-center justify-center text-xs font-bold text-brand-surface shrink-0">
                        {i + 1}
                      </div>
                      <input
                        name={`qurbanName_${i}`}
                        type="text"
                        required={i === 0}
                        placeholder={i === 0 ? `Nama ke-${i + 1} atas nama qurban (wajib)` : `Nama ke-${i + 1} atas nama qurban (opsional)`}
                        className={inpCls}
                      />
                    </div>
                  ))}
                  <input type="hidden" name="qurbanCount" value={qty.toString()} />
                </div>
              )}
            </div>
          )}

          {/* Section 4: Metode Pembayaran */}
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-7">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dashed border-brand-muted/10">
              <div className="w-10 h-10 rounded-[10px] bg-brand-light border border-brand-muted/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-surface" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-text-dark">Metode Pembayaran</h2>
                <p className="text-xs text-brand-muted mt-0.5">Pilih metode pembayaran donasi Anda</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Virtual Account group */}
              {ALL_VA_METHODS.filter(m => !activeChannels || activeChannels[m.channelKey]).length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Transfer Bank (Virtual Account)</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {ALL_VA_METHODS.filter(m => !activeChannels || activeChannels[m.channelKey]).map((method) => (
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
                        {/* Bank badge with proper brand color */}
                        {(() => {
                          const s = VA_STYLE_D[method.value] ?? { bg:'#1B5E3B', text:'#fff', abbr: method.bank }
                          return (
                            <div className="w-11 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                              style={{ background: s.bg, color: s.text }}>{s.abbr}</div>
                          )
                        })()}
                        <span className="text-sm font-medium text-brand-dark">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QRIS */}
              {(!activeChannels || activeChannels.QRIS !== false) && (
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
                      <div className="w-10 h-7 rounded-[6px] bg-brand-light flex items-center justify-center font-bold text-[10px] text-brand-dark shrink-0">QRIS</div>
                      <span className="text-sm font-medium text-brand-dark">QRIS — Semua E-Wallet &amp; M-Banking</span>
                    </button>
                  </div>
                </div>
              )}

              {/* E-Wallet (Redirect) */}
              {ALL_EWALLET_METHODS_D.filter(m => !activeChannels || activeChannels[m.channelKey]).length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">E-Wallet</span>
                    <span className="text-[10px] text-brand-muted ml-1">— akan diarahkan ke app e-wallet</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {ALL_EWALLET_METHODS_D.filter(m => !activeChannels || activeChannels[m.channelKey]).map((method) => (
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
              {ALL_KASIR_METHODS_D.filter(m => !activeChannels || activeChannels[m.channelKey]).length > 0 && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Minimarket / Kasir</span>
                  </div>
                  <div className="divide-y divide-brand-muted/10">
                    {ALL_KASIR_METHODS_D.filter(m => !activeChannels || activeChannels[m.channelKey]).map((method) => (
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
              {manualBank?.enabled && activeChannels?.MANUAL && (
                <div className="border border-brand-muted/20 rounded-[10px] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light border-b border-brand-muted/15">
                    <FontAwesomeIcon icon={faBuildingColumns} className="text-brand-muted text-sm" />
                    <span className="text-xs font-bold text-brand-dark">Transfer Manual</span>
                    <span className="text-[10px] text-brand-muted ml-1">— langsung ke rekening</span>
                  </div>
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
                        <span className="text-sm font-medium text-brand-dark block mb-2">Transfer ke rekening bank kami</span>
                        <div className="flex flex-col gap-1.5">
                          {(manualBank.banks && manualBank.banks.length > 0
                            ? manualBank.banks
                            : [{ id:'0', code:'', name: manualBank.bankName, number: manualBank.accountNumber, owner: manualBank.accountOwner }]
                          ).map((b, idx) => {
                            const style = BANK_STYLE_D[b.code] ?? { bg:'#1B5E3B', text:'#fff', abbr: b.name.replace('Bank ','').substring(0,4).toUpperCase() }
                            return (
                              <div key={idx} className="flex items-center gap-2.5">
                                <div className="w-10 h-7 rounded-[6px] flex items-center justify-center font-bold text-[10px] shrink-0"
                                  style={{ background: style.bg, color: style.text }}>{style.abbr}</div>
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
                  <span className="font-bold text-brand-text-dark">Donasi Aman:</span> Semua transaksi dienkripsi dan dilindungi sistem keamanan berlapis.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile submit */}
          <button
            type="submit"
            disabled={isPending}
            className="lg:hidden w-full bg-cta-gradient text-brand-text-dark font-bold py-4 rounded-[12px] shadow-premium flex items-center justify-center gap-2 text-lg disabled:opacity-60"
          >
            {isPending ? 'Memproses...' : 'Lanjut ke Pembayaran'}{' '}
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </form>
      </div>

      {/* RIGHT: Summary sticky */}
      <div className="w-full lg:w-[360px] shrink-0">
        <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-premium overflow-hidden sticky top-24">
          <div className="p-5 bg-brand-surface text-brand-light">
            <div className="text-xs text-brand-accent-light/70 mb-1">Ringkasan Donasi</div>
            <div className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(total)}</div>
            <div className="text-xs text-brand-accent-light/60 mt-1">
              {qty} ekor × {formatCurrency(unitPrice)}
            </div>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Destinasi</span>
              <span className="font-medium text-brand-dark">{campaign.title}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Jumlah</span>
              <span className="font-medium text-brand-dark">{qty} ekor</span>
            </div>
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Harga/ekor</span>
              <span className="font-medium text-brand-dark">{formatCurrency(unitPrice)}</span>
            </div>
            <div className="border-t border-brand-muted/10 pt-3 flex justify-between">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(total)}</span>
            </div>
            <button
              type="submit"
              form="donation-form"
              disabled={isPending}
              className="hidden lg:flex w-full bg-cta-gradient text-brand-text-dark font-bold py-4 rounded-[12px] shadow-premium items-center justify-center gap-2 disabled:opacity-60"
            >
              {isPending ? 'Memproses...' : 'Lanjut ke Pembayaran'}{' '}
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
              <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" /> Transaksi aman &amp; amanah
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Sticky bottom bar ── */}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand-muted/15 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-brand-muted leading-none">Total Donasi</span>
          <span className="font-serif text-xl font-bold text-brand-accent leading-tight">{formatCurrency(total)}</span>
        </div>
        <button
          type="submit" form="donation-form"
          disabled={isPending}
          className="ml-auto flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold px-6 py-3 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity text-sm whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          {isPending ? 'Memproses...' : <><span>Qurban Sekarang</span><FontAwesomeIcon icon={faArrowRight} /></>}
        </button>
      </div>
    </div>
    <div className="h-20" />
    </>
  )
}
