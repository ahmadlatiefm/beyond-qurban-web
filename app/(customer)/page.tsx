export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faMagnifyingGlass,
  faStar as faStarSolid,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { applyGlobalDiscount } from '@/lib/discount'
import ProductCard from '@/components/ui/ProductCard'
import { getContentIcon } from '@/lib/contentIcons'
import HomeFeaturedTabs from './HomeFeaturedTabs'

async function getFeaturedProducts(take: number) {
  if (take <= 0) return []
  return prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ badge: 'asc' }, { createdAt: 'desc' }],
    take,
  })
}

async function getFeaturedCampaigns(take: number) {
  if (take <= 0) return []
  return prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      donations: {
        where: { paymentStatus: 'PAID' },
        select: { quantity: true, totalAmount: true },
      },
    },
  })
}

function locationLabel(loc: string) {
  if (loc === 'AFRICA') return 'Afrika Sub-Sahara'
  if (loc === 'PALESTINE') return 'Palestina'
  return 'Pedalaman Indonesia'
}
function locationFlag(loc: string) {
  if (loc === 'AFRICA') return '🌍'
  if (loc === 'PALESTINE') return '🇵🇸'
  return '🇮🇩'
}

export default async function HomePage() {
  const settingsRows = await prisma.settings.findMany({
    where: { key: { in: [
      'diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end',
      'home_badge','home_hero_title_1','home_hero_title_2','home_hero_desc',
      'home_cta_primary','home_cta_primary_href','home_cta_secondary','home_cta_secondary_href',
      'home_stats',
      'home_features_title','home_features_desc','home_features',
      'home_featured_title','home_featured_desc',
      'home_featured_product_label','home_featured_product_count',
      'home_featured_campaign_label','home_featured_campaign_count',
      'home_steps_title','home_steps_desc','home_steps',
      'home_testimonials_title','home_testimonials_desc','home_testimonials',
      'home_cta_badge','home_cta_title_1','home_cta_title_2','home_cta_desc','home_cta_btn','home_cta_btn_href',
    ] } }
  })
  const settingsMap: Record<string, string> = {}
  settingsRows.forEach(s => { settingsMap[s.key] = s.value })
  const productCount = Math.max(0, parseInt(settingsMap.home_featured_product_count ?? '4') || 0)
  const campaignCount = Math.max(0, parseInt(settingsMap.home_featured_campaign_count ?? '4') || 0)
  const [products, campaigns] = await Promise.all([
    getFeaturedProducts(productCount),
    getFeaturedCampaigns(campaignCount),
  ])
  const productLabel = settingsMap.home_featured_product_label || 'Produk Katalog'
  const campaignLabel = settingsMap.home_featured_campaign_label || 'Campaign Penyaluran'
  const discountPct = settingsMap.diskon_global_enabled === 'true' && settingsMap.diskon_type !== 'nominal'
    ? parseInt(settingsMap.diskon_value ?? '0') : 0

  // Hero content from settings
  const homeBadge = settingsMap.home_badge || 'Pemesanan Kurban 2025 Dibuka'
  const heroTitle1 = settingsMap.home_hero_title_1 || 'Qurban Mudah,'
  const heroTitle2 = settingsMap.home_hero_title_2 || 'Amanah & Transparan'
  const heroDesc = settingsMap.home_hero_desc || 'Pilih hewan kurban terbaik, pantau prosesnya secara real-time, dan terima laporan foto/video langsung ke WhatsApp Anda.'
  const ctaPrimary = settingsMap.home_cta_primary || 'Lihat Katalog'
  const ctaPrimaryHref = settingsMap.home_cta_primary_href || '/katalog'
  const ctaSecondary = settingsMap.home_cta_secondary || 'Lacak Pesanan'
  const ctaSecondaryHref = settingsMap.home_cta_secondary_href || '/lacak-pesanan'
  let homeStats: { value: string; label: string }[] = [
    { value: '450+', label: 'Hewan Tersedia' },
    { value: '1.2K+', label: 'Kurban Terlaksana' },
    { value: '850+', label: 'Pelanggan Puas' },
    { value: '98%', label: 'Kepuasan Pelanggan' },
  ]
  try { const p = JSON.parse(settingsMap.home_stats ?? ''); if (Array.isArray(p) && p.length > 0) homeStats = p } catch {}

  // Features (Mengapa Memilih Kami)
  type Feature = { title: string; desc: string; icon?: string }
  let homeFeatures: Feature[] = [
    { title: 'Hewan Terseleksi', desc: 'Setiap hewan kurban telah memenuhi standar kesehatan dan memenuhi syarat syariat Islam.', icon: 'shield' },
    { title: 'Pengiriman Amanah', desc: 'Pengiriman gratis ke lokasi Anda dengan jadwal fleksibel hingga H-1 Idul Adha.', icon: 'truck' },
    { title: 'Laporan Foto & Video', desc: 'Update kondisi hewan dan dokumentasi penyembelihan dikirim langsung via WhatsApp.', icon: 'camera' },
  ]
  try { const p = JSON.parse(settingsMap.home_features ?? ''); if (Array.isArray(p) && p.length > 0) homeFeatures = p } catch {}

  // Steps (Cara Pesan)
  type Step = { title: string; desc: string; icon?: string }
  let homeSteps: Step[] = [
    { title: 'Pilih Hewan', desc: 'Pilih hewan kurban dari katalog sesuai budget dan kriteria Anda.', icon: 'cow' },
    { title: 'Isi Data & Transfer', desc: 'Isi formulir pemesanan dan selesaikan pembayaran via transfer atau QRIS.', icon: 'invoice' },
    { title: 'Terima & Selesai', desc: 'Hewan diantar ke lokasi Anda, laporan foto/video dikirim via WhatsApp.', icon: 'house' },
  ]
  try { const p = JSON.parse(settingsMap.home_steps ?? ''); if (Array.isArray(p) && p.length > 0) homeSteps = p } catch {}

  // Testimonials
  let homeTestimonials: { name: string; city: string; stars: number; text: string }[] = [
    { name: 'Ahmad Fauzi', city: 'Jakarta', stars: 5, text: 'Pengalaman kurban terbaik! Hewan sehat, pengiriman tepat waktu, dan laporan video sangat memuaskan. Tahun depan pasti pesan lagi.' },
    { name: 'Siti Rahayu', city: 'Surabaya', stars: 5, text: 'Sangat mudah, transparan, dan amanah. Bisa memantau kondisi hewan secara real-time. Sungguh tenang ibadah kurbannya bersama Beyond Qurban.' },
    { name: 'Budi Santoso', city: 'Bandung', stars: 4, text: 'Layanannya profesional dan responsif. Hewan kurban berkualitas baik dan proses pengiriman lancar. Sangat direkomendasikan untuk keluarga Muslim.' },
  ]
  try { const p = JSON.parse(settingsMap.home_testimonials ?? ''); if (Array.isArray(p) && p.length > 0) homeTestimonials = p } catch {}

  // Section titles
  const featuresTitle = settingsMap.home_features_title || 'Mengapa Memilih Kami?'
  const featuresDesc = settingsMap.home_features_desc || 'Kami hadir dengan komitmen penuh untuk ibadah kurban yang tenang dan terpercaya.'
  const featuredTitle = settingsMap.home_featured_title || 'Produk Unggulan'
  const featuredDesc = settingsMap.home_featured_desc || 'Pilihan hewan kurban terbaik yang paling diminati.'
  const stepsTitle = settingsMap.home_steps_title || 'Cara Pesan Kurban'
  const stepsDesc = settingsMap.home_steps_desc || 'Proses mudah, transparan, dan aman dari awal hingga selesai.'
  const testimonialsTitle = settingsMap.home_testimonials_title || 'Kata Pelanggan Kami'
  const testimonialsDesc = settingsMap.home_testimonials_desc || 'Ribuan keluarga telah mempercayakan ibadah kurbannya kepada kami.'
  const ctaBadge = settingsMap.home_cta_badge || 'Yayasan One Ummah'
  const ctaTitle1 = settingsMap.home_cta_title_1 || 'Menjaga Amanah,'
  const ctaTitle2 = settingsMap.home_cta_title_2 || 'Menyempurnakan Ibadah'
  const ctaDesc = settingsMap.home_cta_desc || 'Beyond Qurban adalah program Yayasan One Ummah untuk memudahkan umat Islam menunaikan ibadah kurban secara benar, transparan, dan penuh amanah sejak 2019.'
  const ctaBtn = settingsMap.home_cta_btn || 'Mulai Pesan Kurban'
  const ctaBtnHref = settingsMap.home_cta_btn_href || '/katalog'

  return (
    <>
      {/* Section 1: Hero */}
      <section className="relative w-full min-h-[680px] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-hero-gradient"></div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px' }}
        ></div>
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24 flex flex-col items-center text-center fade-up">
          <div className="inline-flex items-center gap-2 bg-brand-surface/40 backdrop-blur-md border border-brand-surface-light/30 px-4 py-1.5 rounded-[20px] mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" style={{ animation: 'pulse-dot 2s infinite' }}></span>
            <span className="text-brand-accent-light text-xs font-medium tracking-wider uppercase">{homeBadge}</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-brand-light leading-[1.08] mb-6 max-w-4xl">
            {heroTitle1}<br />
            <span className="text-brand-accent">{heroTitle2}</span>
          </h1>
          <p className="text-brand-accent-light text-lg md:text-xl font-light max-w-2xl mb-10 leading-relaxed">{heroDesc}</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href={ctaPrimaryHref}
              className="w-full sm:w-auto bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 px-8 rounded-[20px] shadow-premium hover:scale-105 transition-transform flex items-center justify-center gap-2">
              {ctaPrimary} <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link href={ctaSecondaryHref}
              className="w-full sm:w-auto bg-brand-surface/30 backdrop-blur-md border border-brand-surface-light text-brand-light hover:text-brand-accent hover:border-brand-accent font-medium text-lg py-4 px-8 rounded-[20px] transition-all flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faMagnifyingGlass} /> {ctaSecondary}
            </Link>
          </div>
        </div>
        {/* Wave SVG divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '50px' }}
          >
            <path d="M0,40 C300,80 900,0 1200,40 L1200,60 L0,60 Z" fill="#FAFAF8" />
          </svg>
        </div>
      </section>

      {/* Section 2: Stats */}
      <section className="relative -mt-6 z-20 max-w-[1100px] mx-auto px-6 md:px-12 mb-16">
        <div className="bg-brand-accent-light rounded-[20px] shadow-premium p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 border border-white/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#0D3320 1px,transparent 1px)', backgroundSize: '20px 20px' }}></div>
          {homeStats.map((stat, i) => (
            <div key={i} className="text-center relative z-10">
              <div className="font-serif text-4xl font-bold text-brand-dark">{stat.value}</div>
              <div className="text-brand-muted text-xs font-semibold uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Keunggulan */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">{featuresTitle}</h2>
            <p className="text-brand-muted">{featuresDesc}</p>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${homeFeatures.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
            {homeFeatures.map((f, i) => (
              <div key={i} className="bg-brand-surface rounded-[12px] p-8 text-center border border-brand-surface-light/20 relative overflow-hidden group shadow-premium">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-surface-light/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="w-16 h-16 mx-auto bg-brand-dark rounded-full flex items-center justify-center mb-5 border border-brand-accent/30 relative z-10">
                  <FontAwesomeIcon icon={getContentIcon(f.icon, 'shield')} className="text-brand-accent text-2xl" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-light mb-3 relative z-10">{f.title}</h3>
                <p className="text-brand-accent-light/85 text-sm leading-relaxed relative z-10">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Produk Unggulan / Campaign tabs */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-2">{featuredTitle}</h2>
              <p className="text-brand-muted">{featuredDesc}</p>
            </div>
            <Link
              href="/katalog"
              className="text-brand-surface font-bold hover:text-brand-accent flex items-center gap-2 transition-colors"
            >
              Lihat Semua Katalog <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
          <HomeFeaturedTabs
            hasProducts={products.length > 0}
            hasCampaigns={campaigns.length > 0}
            produkLabel={productLabel}
            campaignLabel={campaignLabel}
            produkSlot={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {products.map((product) => {
                  const disc = applyGlobalDiscount(product.price, settingsMap)
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      available
                      discountPct={disc.discountAmount > 0 ? discountPct : undefined}
                      discountedPrice={disc.discountAmount > 0 ? disc.finalPrice : undefined}
                    />
                  )
                })}
              </div>
            }
            campaignSlot={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {campaigns.map((c) => {
                  const totalQty = c.donations.reduce((s, d) => s + d.quantity, 0)
                  const pct = c.targetCount > 0 ? Math.min(100, Math.round((totalQty / c.targetCount) * 100)) : 0
                  let pricePerEkor: number | null = c.price ?? null
                  if (!pricePerEkor) {
                    try {
                      const animals = JSON.parse(c.animals || '[]') as { price: number }[]
                      if (Array.isArray(animals) && animals.length > 0) {
                        pricePerEkor = Math.min(...animals.map(a => a.price))
                      }
                    } catch {}
                  }
                  return (
                    <div key={c.id} className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium overflow-hidden flex flex-col">
                      <div className="relative h-40 bg-brand-dark">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-brand-accent text-brand-dark flex items-center gap-1">
                          {locationFlag(c.location)} {locationLabel(c.location)}
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col gap-2">
                        <h3 className="font-serif text-base font-bold text-brand-dark leading-tight line-clamp-2">{c.title}</h3>
                        <div className="text-[11px] text-brand-muted flex items-center gap-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[9px]" />
                          {locationLabel(c.location)}
                        </div>
                        <div className="mt-1">
                          <div className="h-1.5 bg-brand-light rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1B5E3B,#C8962A)' }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-brand-muted mt-1">
                            <span>{totalQty} / {c.targetCount} ekor</span>
                            <span>{pct}%</span>
                          </div>
                        </div>
                        {pricePerEkor !== null && (
                          <div className="text-brand-accent font-bold text-sm mt-1">
                            {formatCurrency(pricePerEkor)}<span className="text-[10px] font-sans font-normal text-brand-muted"> / ekor</span>
                          </div>
                        )}
                        <Link
                          href={`/penyaluran/${c.slug}`}
                          className="mt-auto bg-brand-surface text-white font-bold text-xs py-2 rounded-[10px] text-center hover:bg-brand-dark transition-colors"
                        >
                          Lihat Campaign
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            }
          />
        </div>
      </section>

      {/* Section 5: Cara Pesan — horizontal scroll on mobile, grid on desktop */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-surface opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-light mb-3">{stepsTitle}</h2>
            <p className="text-brand-accent-light/80">{stepsDesc}</p>
          </div>
          <div className="md:hidden flex gap-5 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory">
            {homeSteps.map((step, i) => (
              <div key={i} className="snap-center shrink-0 w-[78%] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-brand-surface border-4 border-brand-dark flex items-center justify-center text-brand-accent text-3xl mb-4 shadow-premium">
                  <FontAwesomeIcon icon={getContentIcon(step.icon, 'check')} />
                </div>
                <div className="text-brand-accent font-bold text-xs uppercase tracking-widest mb-2">Langkah {i + 1}</div>
                <h3 className="font-serif text-lg font-bold text-brand-light mb-2">{step.title}</h3>
                <p className="text-brand-accent-light/75 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          <div
            className="hidden md:grid gap-8 relative"
            style={{ gridTemplateColumns: `repeat(${Math.min(homeSteps.length || 3, 4)}, minmax(0, 1fr))` }}
          >
            <div className="absolute top-14 left-[18%] right-[18%] h-0.5 bg-brand-surface-light/30"></div>
            {homeSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="w-28 h-28 rounded-full bg-brand-surface border-4 border-brand-dark flex items-center justify-center text-brand-accent text-3xl mb-5 shadow-premium">
                  <FontAwesomeIcon icon={getContentIcon(step.icon, 'check')} />
                </div>
                <div className="text-brand-accent font-bold text-xs uppercase tracking-widest mb-2">Langkah {i + 1}</div>
                <h3 className="font-serif text-xl font-bold text-brand-light mb-2">{step.title}</h3>
                <p className="text-brand-accent-light/75 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Testimoni */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">{testimonialsTitle}</h2>
            <p className="text-brand-muted">{testimonialsDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeTestimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-[12px] p-6 shadow-premium border border-brand-muted/10">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <FontAwesomeIcon key={s} icon={s < t.stars ? faStarSolid : faStarRegular} className="text-brand-accent text-sm" />
                  ))}
                </div>
                <p className="text-brand-muted text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-surface/20 text-brand-surface flex items-center justify-center font-bold text-sm">
                    {t.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-brand-dark font-semibold text-sm">{t.name}</div>
                    <div className="text-brand-muted text-xs">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: CTA Tentang Kami */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-brand-accent opacity-5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="max-w-[900px] mx-auto px-6 md:px-12 text-center relative z-10">
          <span className="text-brand-accent font-bold text-xs uppercase tracking-widest border border-brand-accent/40 px-4 py-1.5 rounded-full inline-block mb-6">
            {ctaBadge}
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-light mb-6 leading-tight">
            {ctaTitle1}<br />
            <span className="text-brand-accent">{ctaTitle2}</span>
          </h2>
          <p className="text-brand-accent-light/75 text-lg mb-10 font-light leading-relaxed max-w-2xl mx-auto">{ctaDesc}</p>
          <Link
            href={ctaBtnHref}
            className="inline-flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 px-10 rounded-[20px] shadow-premium hover:scale-105 transition-transform"
          >
            {ctaBtn} <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>
    </>
  )
}
