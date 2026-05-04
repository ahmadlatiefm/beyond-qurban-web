export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight, faUsers, faHeart, faHandHoldingHeart,
  faCamera, faCertificate, faStarAndCrescent,
  faShieldHalved, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import CampaignDetailClient from './CampaignDetailClient'

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
function getAnimalLabel(animal: string) {
  const map: Record<string, string> = {
    domba: '🐑 Domba', kambing: '🐐 Kambing', sapi: '🐄 Sapi',
    unta: '🐪 Unta', mix: '🐑🐄 Mix',
  }
  return map[animal] ?? `🐑 ${animal}`
}
function getProgramLabel(type: string) {
  if (type === 'sedekah') return { label: 'Sedekah', cls: 'bg-blue-100 text-blue-700' }
  if (type === 'keduanya') return { label: 'Qurban & Sedekah', cls: 'bg-purple-100 text-purple-700' }
  return { label: 'Qurban', cls: 'bg-brand-surface/10 text-brand-surface' }
}

export default async function CampaignDetailPage({ params }: { params: { slug: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: params.slug },
    include: {
      donations: {
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true, quantity: true, customerName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!campaign || !campaign.isActive) notFound()

  const totalCollected = campaign.donations.reduce((s, d) => s + d.totalAmount, 0)
  const totalQty = campaign.donations.reduce((s, d) => s + d.quantity, 0)
  const pctReached = campaign.targetCount > 0 ? Math.min(100, Math.round((totalQty / campaign.targetCount) * 100)) : 0
  const programBadge = getProgramLabel(campaign.programType)
  const flag = getFlag(campaign.location)
  const locationLabel = getLocationLabel(campaign.location)
  const animalLabel = getAnimalLabel(campaign.animalType)

  return (
    <main className="pt-20">
      {/* ── Hero Image ─────────────────────────────────────────────────── */}
      <div className="relative h-[320px] md:h-[420px] overflow-hidden bg-brand-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />

        {/* Breadcrumb */}
        <nav className="absolute top-6 left-6 flex items-center gap-2 text-xs text-white/70">
          <Link href="/" className="hover:text-white">Beranda</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
          <Link href="/penyaluran" className="hover:text-white">Program Penyaluran</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
          <span className="text-white font-medium">{campaign.title}</span>
        </nav>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-accent text-brand-dark">
              {flag} {locationLabel}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${programBadge.cls}`}>
              {programBadge.label}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-white">
              {animalLabel}
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-4xl font-bold text-white leading-tight">
            {campaign.title}
          </h1>
        </div>
      </div>

      {/* ── Content + Sidebar ──────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* LEFT: Detail content */}
          <div className="flex-1 min-w-0">

            {/* Progress card */}
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-6 mb-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="font-serif text-2xl font-bold text-brand-accent">
                    {totalCollected > 0 ? `Rp ${(totalCollected / 1_000_000).toFixed(1)}Jt` : 'Baru Dibuka'}
                  </div>
                  <div className="text-xs text-brand-muted">
                    terkumpul dari target {campaign.targetCount} ekor
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-surface">{pctReached}%</div>
                  <div className="text-xs text-brand-muted">tercapai</div>
                </div>
              </div>
              <div className="h-2.5 bg-brand-light rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctReached}%`, background: 'linear-gradient(90deg,#1B5E3B,#C8962A)' }}
                />
              </div>
              <div className="flex gap-6 text-xs text-brand-muted">
                <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUsers} /> <strong className="text-brand-dark">{campaign.donations.length}</strong> donatur</span>
                <span className="flex items-center gap-1"><FontAwesomeIcon icon={faHandHoldingHeart} /> <strong className="text-brand-dark">{totalQty}</strong> ekor terkumpul</span>
                <span className="flex items-center gap-1">🎯 Target: <strong className="text-brand-dark">{campaign.targetCount}</strong> ekor</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-6 mb-6">
              <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Tentang Program Ini</h2>
              <p className="text-brand-muted text-sm leading-relaxed">{campaign.description}</p>
            </div>

            {/* Rich Content — renders text and image blocks from admin */}
            {campaign.richContent && (() => {
              try {
                const blocks: {type: string; value: string; caption?: string}[] = JSON.parse(campaign.richContent!)
                if (!blocks.length) return null
                return (
                  <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-6 mb-6">
                    <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Cerita Program</h2>
                    <div className="flex flex-col gap-5">
                      {blocks.map((block, i) => {
                        if (block.type === 'image') return (
                          <div key={i}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={block.value} alt={block.caption || ''} className="w-full rounded-[10px] object-cover max-h-[360px]" />
                            {block.caption && <p className="text-xs text-brand-muted text-center mt-2 italic">{block.caption}</p>}
                          </div>
                        )
                        return (
                          <p key={i} className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">{block.value}</p>
                        )
                      })}
                    </div>
                  </div>
                )
              } catch { return null }
            })()}

            {/* What you get */}
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-6 mb-6">
              <h2 className="font-serif text-lg font-bold text-brand-dark mb-4">Yang Anda Dapatkan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: faCamera, title: 'Laporan Foto & Video', desc: 'Dokumentasi penyaluran dikirim via WhatsApp' },
                  { icon: faCertificate, title: 'Sertifikat Qurban', desc: 'Sertifikat resmi atas nama Anda/yang Anda tunjuk' },
                  { icon: faStarAndCrescent, title: 'Sesuai Syariat', desc: 'Proses penyembelihan sesuai ketentuan Islam' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 bg-brand-light rounded-[10px]">
                    <div className="w-9 h-9 bg-brand-surface/10 rounded-full flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={icon} className="text-brand-surface text-sm" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-brand-dark">{title}</div>
                      <div className="text-[11px] text-brand-muted leading-snug mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donatur terbaru */}
            {campaign.donations.length > 0 && (
              <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-6">
                <h2 className="font-serif text-lg font-bold text-brand-dark mb-4">
                  Donatur Terbaru
                </h2>
                <div className="flex flex-col gap-3">
                  {campaign.donations.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-brand-muted/8 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-surface/10 flex items-center justify-center font-bold text-brand-surface text-sm">
                          {d.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-brand-dark">
                            {d.customerName.split(' ')[0]}***
                          </div>
                          <div className="text-[11px] text-brand-muted">{d.quantity} ekor</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-brand-accent">{formatCurrency(d.totalAmount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Donation widget — animal picker included */}
          <div className="w-full lg:w-[340px] shrink-0">
            <CampaignDetailClient campaign={{
              id: campaign.id,
              slug: campaign.slug,
              title: campaign.title,
              price: campaign.price,
              programType: campaign.programType,
              location: campaign.location,
              animalType: campaign.animalType,
              allowShare: campaign.allowShare,
              ctaButtonText: campaign.ctaButtonText,
              animals: (() => { try { return JSON.parse(campaign.animals || '[]') } catch { return [] } })(),
            }} />
          </div>
        </div>
      </div>
    </main>
  )
}
