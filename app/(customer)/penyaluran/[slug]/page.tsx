export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight,
  faCamera, faCertificate, faStarAndCrescent,
} from '@fortawesome/free-solid-svg-icons'
import { prisma } from '@/lib/prisma'
import CampaignDetailClient from './CampaignDetailClient'
import CampaignContentTabs from './CampaignContentTabs'
import {
  CampaignInteractiveProvider,
  CampaignStickyCta,
  type AnimalItem,
} from './CampaignInteractive'
import TrackPageMount from '@/components/tracking/TrackPageMount'
import { VideoGallery } from '@/components/VideoGallery'

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
  // Use a light background here — this badge sits on the dark hero gradient,
  // so the previous dark-green-on-translucent style was invisible.
  return { label: 'Qurban', cls: 'bg-brand-accent-light text-brand-surface' }
}

export default async function CampaignDetailPage({ params }: { params: { slug: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: params.slug },
    include: {
      donations: {
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true, quantity: true, customerName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      updates: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!campaign || !campaign.isActive) notFound()

  const totalQty = campaign.donations.reduce((s, d) => s + d.quantity, 0)
  const pctReached = campaign.targetCount > 0 ? Math.min(100, Math.round((totalQty / campaign.targetCount) * 100)) : 0
  const programBadge = getProgramLabel(campaign.programType)
  const flag = getFlag(campaign.location)
  const locationLabel = getLocationLabel(campaign.location)
  const animalLabel = getAnimalLabel(campaign.animalType)
  const ctaText = (campaign.ctaButtonText && campaign.ctaButtonText.trim())
    || (campaign.programType === 'sedekah' ? 'Sedekah Sekarang' : 'Qurban Sekarang')
  const animals: AnimalItem[] = (() => {
    try { return JSON.parse(campaign.animals || '[]') } catch { return [] }
  })()

  return (
    <CampaignInteractiveProvider
      slug={campaign.slug}
      programType={campaign.programType}
      animalType={campaign.animalType}
      allowShare={campaign.allowShare}
      ctaText={ctaText}
      campaignPrice={campaign.price ?? null}
      animals={animals}
    >
    <main className="pt-20">
      <TrackPageMount pageKey="page_campaign" props={{
        content_ids: [campaign.slug],
        content_name: campaign.title,
        content_category: campaign.location,
        value: campaign.price ?? undefined,
        currency: 'IDR',
      }} />
      {/* ── Hero Image ─────────────────────────────────────────────────── */}
      <div className="relative h-[260px] md:h-[420px] overflow-hidden bg-brand-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />

        {/* Breadcrumb */}
        <nav className="absolute top-4 left-4 right-4 md:top-6 md:left-6 flex items-center gap-2 text-xs text-white/70 truncate">
          <Link href="/" className="hover:text-white shrink-0">Beranda</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px] shrink-0" />
          <Link href="/penyaluran" className="hover:text-white shrink-0">Program Penyaluran</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px] shrink-0" />
          <span className="text-white font-medium truncate">{campaign.title}</span>
        </nav>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10">
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
          <h1 className="font-serif text-xl md:text-4xl font-bold text-white leading-tight">
            {campaign.title}
          </h1>
        </div>
      </div>

      {/* ── Content + Sidebar ──────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-12 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

          {/* LEFT: Detail content */}
          <div className="flex-1 min-w-0 w-full space-y-4 md:space-y-6">

            {/* Progress card */}
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-brand-dark">Progress Penyaluran</div>
                <div className="text-2xl font-bold" style={{ color: '#1B3A2F' }}>{pctReached}%</div>
              </div>
              <div className="h-3 bg-brand-light rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pctReached}%`, backgroundColor: '#1B3A2F' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div>
                  <div className="text-[11px] text-brand-muted uppercase tracking-wider">Terkumpul</div>
                  <div className="text-sm font-bold text-brand-dark">{totalQty} ekor</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-brand-muted uppercase tracking-wider">Target</div>
                  <div className="text-sm font-bold text-brand-dark">{campaign.targetCount} ekor</div>
                </div>
              </div>
              <div className="text-xs text-brand-muted">
                Donatur: <strong className="text-brand-dark">{campaign.donations.length}</strong> orang
              </div>
              {pctReached === 0 && (
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                    ✨ Baru Dibuka
                  </span>
                </div>
              )}
            </div>

            {/* Tabs: Keterangan / Kabar Terbaru / Donatur */}
            <CampaignContentTabs
              description={campaign.description}
              richContent={campaign.richContent ?? null}
              donorCount={campaign.donations.length}
              donors={campaign.donations.map((d) => ({
                customerName: d.customerName,
                totalAmount: d.totalAmount,
                quantity: d.quantity,
                createdAt: d.createdAt.toISOString(),
              }))}
              updates={campaign.updates.map((u) => ({
                id: u.id,
                title: u.title,
                content: u.content,
                imageUrl: u.imageUrl,
                createdAt: u.createdAt.toISOString(),
              }))}
            />

            {/* Video gallery */}
            {campaign.videoUrls && campaign.videoUrls.length > 0 && (
              <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-4 md:p-6">
                <VideoGallery urls={campaign.videoUrls} />
              </div>
            )}

            {/* What you get */}
            <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-4 md:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-dark mb-3 md:mb-4">Yang Anda Dapatkan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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

          </div>

          {/* RIGHT: Donation widget — animal picker included */}
          <div id="donation-widget" className="w-full lg:w-[340px] shrink-0 scroll-mt-24">
            <CampaignDetailClient campaign={{ title: campaign.title, location: campaign.location }} />
          </div>
        </div>
      </div>

      {/* Spacer so content doesn't sit behind the mobile sticky bar */}
      <div className="h-20 lg:hidden" />

      {/* Sticky CTA Bar — mobile only, reads animal + qty from shared context */}
      <CampaignStickyCta />
    </main>
    </CampaignInteractiveProvider>
  )
}
