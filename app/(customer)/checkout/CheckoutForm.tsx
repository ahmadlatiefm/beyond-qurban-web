'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPenToSquare, faBuildingColumns, faWallet,
  faHandHoldingDollar, faCreditCard, faCircleInfo,
  faShieldHalved, faArrowRight, faWeightScale,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createOrder } from '@/lib/actions/orders'
import type { Product } from '@prisma/client'

const PAYMENT_METHODS = [
  {
    value: 'BANK_TRANSFER', icon: faBuildingColumns, label: 'Transfer Bank',
    desc: 'Transfer ke rekening BCA, Mandiri, atau BNI. Instruksi dikirim via WhatsApp.',
  },
  {
    value: 'E_WALLET', icon: faWallet, label: 'E-Wallet',
    desc: 'Bayar dengan GoPay, OVO, DANA, atau ShopeePay.',
    badge: { text: 'Populer', cls: 'bg-brand-accent/10 text-brand-accent text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase' },
    chips: ['GoPay', 'OVO', 'DANA', 'ShopeePay'],
  },
  {
    value: 'COD', icon: faHandHoldingDollar, label: 'Bayar di Tempat (COD)',
    desc: 'Bayar tunai saat domba tiba. Tersedia area tertentu + Rp 50.000.',
  },
  {
    value: 'CICILAN', icon: faCreditCard, label: 'Cicilan 0%',
    desc: 'Cicilan 3, 6, atau 12 bulan tanpa bunga.',
    badge: { text: 'Rekomendasi', cls: 'bg-[#25D366]/10 text-[#25D366] text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase' },
    chips: ['3 Bulan', '6 Bulan', '12 Bulan'],
  },
] as const

const inputCls = 'w-full h-12 px-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A]'

export default function CheckoutForm({ product }: { product: Product }) {
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('paymentMethod', paymentMethod)
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

            {/* Payment Methods */}
            <div className="flex flex-col gap-4 pt-2">
              <label className="text-xs font-bold text-brand-text-dark uppercase tracking-widest">METODE PEMBAYARAN <span className="text-brand-surface">*</span></label>

              {PAYMENT_METHODS.map((m) => (
                <div
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`border-2 rounded-[8px] p-3.5 cursor-pointer transition-all flex items-start gap-4 ${paymentMethod === m.value ? 'border-brand-accent bg-brand-accent/[0.04]' : 'border-brand-muted/20 hover:border-brand-accent/50'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-1 shrink-0 flex items-center justify-center ${paymentMethod === m.value ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                    {paymentMethod === m.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={m.icon} className="text-brand-surface text-sm" />
                      <span className="font-bold text-sm text-brand-text-dark">{m.label}</span>
                      {'badge' in m && m.badge && <span className={m.badge.cls}>{m.badge.text}</span>}
                    </div>
                    <p className="text-xs text-brand-muted">{m.desc}</p>
                    {'chips' in m && m.chips && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {m.chips.map((c) => <span key={c} className="bg-brand-light border border-brand-muted/20 rounded px-2 py-0.5 text-[10px] font-medium">{c}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-2 bg-brand-light border border-brand-accent/20 rounded-[8px] p-3">
                <FontAwesomeIcon icon={faCircleInfo} className="text-brand-accent text-sm mt-0.5" />
                <p className="text-xs text-brand-muted"><span className="font-bold text-brand-text-dark">Pembayaran Aman:</span> Semua transaksi dienkripsi dan dilindungi sistem keamanan berlapis.</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[8px] p-3 text-sm text-red-700">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Consent */}
            <div className="flex items-start gap-3 pt-4 border-t border-dashed border-brand-muted/20">
              <input type="checkbox" id="consent" required className="mt-1 w-4 h-4 accent-brand-surface cursor-pointer" />
              <label htmlFor="consent" className="text-xs text-brand-muted leading-relaxed cursor-pointer">Saya menyetujui data yang saya masukkan adalah benar dan memahami syarat &amp; ketentuan pembelian hewan kurban.</label>
            </div>

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
                <span className="font-bold text-brand-accent text-base">{formatCurrency(product.price)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm border-t border-brand-surface-light/30 pt-4 mb-4">
              <div className="flex justify-between text-brand-accent-light/80"><span>Subtotal Produk</span><span>{formatCurrency(product.price)}</span></div>
              <div className="flex justify-between text-brand-accent-light/80"><span>Biaya Pengiriman</span><span className="text-[#25D366] font-semibold">Gratis*</span></div>
              <div className="flex justify-between text-brand-accent-light/80"><span>Biaya Perawatan</span><span className="text-[#25D366] font-semibold">Gratis</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-brand-surface-light/30 pt-4 mb-6">
              <span className="font-bold text-brand-light">Total Pembayaran</span>
              <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(product.price)}</span>
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
