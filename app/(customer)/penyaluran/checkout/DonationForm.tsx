'use client'
import { useTransition } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faHandHoldingHeart,
  faScroll,
  faArrowRight,
  faShieldHalved,
  faPen,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createDonation } from '@/lib/actions/donations'
import type { Campaign } from '@prisma/client'

const inpCls =
  'w-full h-11 px-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-brand-text-dark placeholder:text-brand-muted/50 text-sm focus:outline-none focus:border-brand-accent focus:shadow-[0_0_0_1px_#C8962A] transition-[border-color]'

export default function DonationForm({ campaign, qty }: { campaign: Campaign; qty: number }) {
  const [isPending, startTransition] = useTransition()
  const total = campaign.price * qty

  function getFlag(loc: string) {
    if (loc === 'AFRICA') return '🌍'
    if (loc === 'PALESTINE') return '🇵🇸'
    return '🇮🇩'
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => {
      createDonation(fd)
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* LEFT: Form */}
      <div className="flex-1 flex flex-col gap-5">
        <form id="donation-form" onSubmit={handleSubmit} className="contents">
          <input type="hidden" name="campaignSlug" value={campaign.slug} />
          <input type="hidden" name="quantity" value={qty} />
          <input type="hidden" name="paymentMethod" value="BANK_TRANSFER" />

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
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  className="mt-1 w-4 h-4 accent-brand-surface cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs text-brand-muted leading-relaxed cursor-pointer">
                  Saya menyetujui{' '}
                  <span className="text-brand-surface font-semibold">syarat &amp; ketentuan</span> program qurban
                  penyaluran dan memahami bahwa hewan akan disalurkan langsung ke destinasi yang dipilih
                </label>
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
              className="rounded-[12px] border-2 border-brand-accent/30 p-5 relative overflow-hidden"
              style={{ background: 'rgba(200,150,42,.03)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{getFlag(campaign.location)}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-brand-dark mb-1">{campaign.title}</h3>
                  <p className="text-xs text-brand-muted leading-relaxed">{campaign.description}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {['Laporan Foto & Video', 'Sertifikat Qurban', 'Sesuai Syariat'].map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-1.5 text-xs text-brand-surface font-medium bg-brand-surface/10 px-2.5 py-1 rounded-full"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-brand-muted">Harga</div>
                  <div className="font-serif text-2xl font-bold text-brand-accent">
                    {formatCurrency(campaign.price)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Atas Nama */}
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-7">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dashed border-brand-muted/10">
              <div className="w-10 h-10 rounded-[10px] bg-brand-light border border-brand-muted/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faScroll} className="text-brand-surface" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-text-dark">Atas Nama Qurban</h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  Nama yang tertera dalam sertifikat dan laporan qurban
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-3">
                  Qurban untuk siapa?
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="forWhom"
                      value="self"
                      defaultChecked
                      className="accent-brand-surface w-4 h-4"
                    />
                    <span className="text-sm font-medium text-brand-dark">Diri sendiri</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input type="radio" name="forWhom" value="other" className="accent-brand-surface w-4 h-4" />
                    <span className="text-sm font-medium text-brand-dark">Orang lain</span>
                  </label>
                </div>
              </div>
              <input
                name="qurbanName"
                type="text"
                placeholder="Nama atas nama qurban (sama dengan nama donatur jika untuk diri sendiri)"
                className={inpCls}
              />
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
              {qty} ekor × {formatCurrency(campaign.price)}
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
              <span className="font-medium text-brand-dark">{formatCurrency(campaign.price)}</span>
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
  )
}
