'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeart, faShieldHalved, faUsers, faArrowRight,
  faHandHoldingHeart, faChevronRight, faHandHoldingDollar,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import type { Campaign } from '@prisma/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFlag(location: string) {
  if (location === 'AFRICA') return '🌍'
  if (location === 'PALESTINE') return '🇵🇸'
  return '🇮🇩'
}
function getLocationLabel(location: string) {
  if (location === 'AFRICA') return 'Afrika Sub-Sahara'
  if (location === 'PALESTINE') return 'Palestina'
  return 'Pedalaman Indonesia'
}
function getLocationSub(location: string) {
  if (location === 'AFRICA') return 'Sudan · Somalia · Sahel'
  if (location === 'PALESTINE') return 'Gaza & Tepi Barat'
  return 'Papua · NTT · Kalimantan'
}
function getLocationBadge(location: string): { label: string; cls: string } {
  if (location === 'AFRICA') return { label: '🌐 Internasional', cls: 'bg-blue-100 text-blue-700' }
  if (location === 'PALESTINE') return { label: '🚨 Prioritas', cls: 'bg-red-100 text-red-600' }
  return { label: '🔥 Terpopuler', cls: 'bg-brand-accent text-brand-dark' }
}

type FilterType = 'ALL' | 'INDONESIA' | 'AFRICA' | 'PALESTINE'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Semua Program' },
  { key: 'INDONESIA', label: '🇮🇩 Pedalaman Indonesia' },
  { key: 'AFRICA', label: '🌍 Afrika' },
  { key: 'PALESTINE', label: '🇵🇸 Palestina' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function PenyaluranClient({
  campaigns,
  settingsMap = {},
}: {
  campaigns: Campaign[]
  settingsMap?: Record<string, string>
}) {
  // Hero content from settings
  const heroBadge = settingsMap.penyaluran_badge || 'Qurban Penyaluran 1447H'
  const heroTitle1 = settingsMap.penyaluran_hero_title_1 || 'Salurkan Qurban ke'
  const heroTitle2 = settingsMap.penyaluran_hero_title_2 || 'Mereka yang Membutuhkan'
  const heroDesc = settingsMap.penyaluran_hero_desc || 'Pilih program penyaluran sesuai destinasi pilihan Anda. Hewan disembelih sesuai syariat dan laporan dikirim langsung via WhatsApp.'
  const trust1 = settingsMap.penyaluran_trust_1 || 'Terverifikasi MUI'
  const trust2 = settingsMap.penyaluran_trust_2 || '635+ Donatur'
  const trust3 = settingsMap.penyaluran_trust_3 || 'Amanah sejak 2019'

  let impactStats: { stat: string; label: string }[] = [
    { stat: '1.247', label: 'Ekor Tersalurkan' },
    { stat: '48', label: 'Desa Terjangkau' },
    { stat: '8.500+', label: 'Penerima Manfaat' },
    { stat: '3 Negara', label: 'Destinasi Aktif' },
  ]
  try {
    const p = JSON.parse(settingsMap.penyaluran_impact_stats ?? '')
    if (Array.isArray(p) && p.length > 0) impactStats = p
  } catch {}
  const [filter, setFilter] = useState<FilterType>('ALL')

  const filtered = useMemo(() =>
    filter === 'ALL' ? campaigns : campaigns.filter(c => c.location === filter),
    [campaigns, filter]
  )

  return (
    <div className="pt-20">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-brand-dark relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-surface/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 text-center relative z-10">
          {/* breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs text-brand-accent-light/60 mb-6">
            <Link href="/" className="hover:text-brand-accent">Beranda</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
            <span className="text-brand-accent font-medium">Program Penyaluran</span>
          </nav>
          <div className="inline-flex items-center gap-2 bg-brand-surface/50 border border-brand-surface-light/30 px-4 py-1.5 rounded-[20px] mb-5">
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-brand-accent text-xs" />
            <span className="text-brand-accent-light text-xs font-medium tracking-wide uppercase">{heroBadge}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-brand-light mb-4 leading-tight">
            {heroTitle1}<br />
            <span className="text-brand-accent">{heroTitle2}</span>
          </h1>
          <p className="text-brand-accent-light/75 text-base md:text-lg max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            {heroDesc}
          </p>
          {/* trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-brand-accent-light/60">
            <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent" /> {trust1}</span>
            <span className="text-brand-surface-light/40">·</span>
            <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faUsers} className="text-brand-accent" /> {trust2}</span>
            <span className="text-brand-surface-light/40">·</span>
            <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faHeart} className="text-brand-accent" /> {trust3}</span>
          </div>
        </div>
        {/* wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '50px' }}>
            <path d="M0,40 C300,80 900,0 1200,40 L1200,60 L0,60 Z" fill="#FAFAF8" />
          </svg>
        </div>
      </section>

      {/* ── Katalog Campaign ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-12 -mt-4 pb-24">

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8 pt-4">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`filter-chip text-sm px-4 py-2 ${filter === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center text-sm text-brand-muted">
            <span className="font-semibold text-brand-dark">{filtered.length}</span>&nbsp;program tersedia
          </div>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-16 text-center">
            <div className="text-5xl mb-4">🐑</div>
            <p className="text-brand-muted">Tidak ada program untuk destinasi ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((campaign) => {
              const badge = getLocationBadge(campaign.location)
              // Starting price comes from the cheapest animal card; settings-level fallback only kicks in
              // if a campaign somehow has no animals (legacy). The form now requires ≥1 animal.
              let animalsList: { price?: number }[] = []
              try { animalsList = JSON.parse((campaign as any).animals ?? '[]') } catch {}
              const animalPrices = animalsList
                .map(a => a.price)
                .filter((p): p is number => typeof p === 'number' && p > 0)
              const startingPrice = animalPrices.length > 0
                ? Math.min(...animalPrices)
                : (campaign.price ?? 0)
              const locationKey = campaign.location === 'INDONESIA' ? 'indonesia'
                : campaign.location === 'AFRICA' ? 'africa' : 'palestine'
              const settingsDisc = parseInt(settingsMap[`penyaluran_disc_${locationKey}`] ?? '0')
              const finalPrice = Math.round(startingPrice * (1 - settingsDisc / 100))
              const hasDiscount = settingsDisc > 0 && finalPrice < startingPrice
              const hasMultipleAnimals = animalsList.length > 1

              return (
                <div
                  key={campaign.id}
                  className="product-card bg-white rounded-[14px] overflow-hidden border border-brand-muted/10 shadow-premium flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-52 bg-brand-light overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent" />
                    {/* Location badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-[20px] ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    {/* Discount badge — hanya dari setting per destinasi */}
                    {hasDiscount && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-[20px] shadow-sm">
                          DISKON {settingsDisc}%
                        </span>
                      </div>
                    )}
                    {/* Flag + location bottom */}
                    <div className="absolute bottom-3 left-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{getFlag(campaign.location)}</span>
                        <div>
                          <div className="text-white font-bold text-sm leading-tight">{getLocationLabel(campaign.location)}</div>
                          <div className="text-white/70 text-[10px]">{getLocationSub(campaign.location)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif text-base font-bold text-brand-dark mb-1.5 leading-snug">
                      {campaign.title}
                    </h3>
                    <p
                      className="text-xs text-brand-muted leading-relaxed mb-4"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {campaign.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="h-1.5 bg-brand-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: '62%', background: 'linear-gradient(90deg,#1B5E3B,#C8962A)' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-brand-muted mt-1">
                        <span>Target: <strong className="text-brand-dark">{campaign.targetCount} ekor</strong></span>
                        <span className="text-brand-accent font-bold">62% tercapai</span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-brand-muted/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-brand-muted uppercase tracking-wide">
                            {hasMultipleAnimals ? 'Mulai dari' : 'Harga / Ekor'}
                          </div>
                          {hasDiscount ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="text-brand-muted/50 line-through text-sm">{formatCurrency(startingPrice)}</div>
                              <div className="font-bold text-lg text-red-500 leading-tight">{formatCurrency(finalPrice)}</div>
                            </div>
                          ) : (
                            <div className="font-bold text-lg text-brand-accent leading-tight">
                              {formatCurrency(startingPrice)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-brand-muted">
                          <FontAwesomeIcon icon={faUsers} className="text-brand-surface text-[10px]" />
                          <span>635 donatur</span>
                        </div>
                      </div>
                      <Link
                        href={`/penyaluran/${campaign.slug}`}
                        className="w-full bg-cta-gradient text-brand-text-dark font-bold text-sm py-2.5 rounded-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-glow transition-all"
                      >
                        <FontAwesomeIcon icon={faHeart} className="text-xs" />
                        Lihat Campaign
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Impact stats strip */}
        <div className="mt-14 bg-brand-dark rounded-[16px] p-7 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <h3 className="font-serif text-lg font-bold text-brand-light mb-5 relative z-10">
            {settingsMap.penyaluran_impact_title || 'Dampak Program Sejak 2019'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {impactStats.map(({ stat, label }) => (
              <div key={label} className="text-center">
                <div className="font-serif text-2xl md:text-3xl font-bold text-brand-accent">{stat}</div>
                <div className="text-brand-accent-light/65 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sticky bottom bar (konsisten dengan payment pages) ─────────── */}
      {filtered.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand-muted/15 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-brand-muted leading-none">Program Qurban</span>
              <span className="font-serif text-base font-bold text-brand-dark leading-tight">{filtered.length} Campaign Aktif</span>
            </div>
            <Link
              href={`/penyaluran/${filtered[0].slug}`}
              className="ml-auto flex items-center gap-2 bg-brand-surface text-white font-bold px-6 py-3 rounded-[12px] shadow-premium hover:bg-brand-dark transition-colors text-sm whitespace-nowrap shrink-0"
            >
              <FontAwesomeIcon icon={faHandHoldingDollar} className="text-brand-accent" />
              Qurban Sekarang
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
        </div>
      )}
      <div className="h-20" />
    </div>
  )
}
