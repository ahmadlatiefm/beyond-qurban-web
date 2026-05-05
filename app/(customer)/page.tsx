export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faMagnifyingGlass,
  faShieldHalved,
  faTruckFast,
  faCamera,
  faWeightScale,
  faCow,
  faFileInvoiceDollar,
  faHouseCircleCheck,
  faStar as faStarSolid,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { applyGlobalDiscount } from '@/lib/discount'
import ProductCard from '@/components/ui/ProductCard'

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ badge: 'asc' }, { createdAt: 'desc' }],
    take: 4,
  })
}

export default async function HomePage() {
  const [products, settingsRows] = await Promise.all([
    getFeaturedProducts(),
    prisma.settings.findMany({
      where: { key: { in: [
        'diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end',
        'home_badge','home_hero_title_1','home_hero_title_2','home_hero_desc',
        'home_cta_primary','home_cta_primary_href','home_cta_secondary','home_cta_secondary_href',
        'home_stats',
      ] } }
    }),
  ])
  const settingsMap: Record<string, string> = {}
  settingsRows.forEach(s => { settingsMap[s.key] = s.value })
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">Mengapa Memilih Kami?</h2>
            <p className="text-brand-muted">Kami hadir dengan komitmen penuh untuk ibadah kurban yang tenang dan terpercaya.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-brand-surface rounded-[12px] p-8 text-center border border-brand-surface-light/20 relative overflow-hidden group shadow-premium">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-surface-light/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-16 h-16 mx-auto bg-brand-dark rounded-full flex items-center justify-center mb-5 border border-brand-accent/30 relative z-10">
                <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent text-2xl" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-3 relative z-10">Hewan Terseleksi</h3>
              <p className="text-brand-accent-light/85 text-sm leading-relaxed relative z-10">
                Setiap hewan kurban lolos pemeriksaan kesehatan ketat dan memenuhi syarat syariat Islam.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-brand-surface rounded-[12px] p-8 text-center border border-brand-surface-light/20 relative overflow-hidden group shadow-premium">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-surface-light/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-16 h-16 mx-auto bg-brand-dark rounded-full flex items-center justify-center mb-5 border border-brand-accent/30 relative z-10">
                <FontAwesomeIcon icon={faTruckFast} className="text-brand-accent text-2xl" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-3 relative z-10">Pengiriman Amanah</h3>
              <p className="text-brand-accent-light/85 text-sm leading-relaxed relative z-10">
                Pengiriman gratis ke lokasi Anda dengan jadwal fleksibel hingga H-1 Idul Adha.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-brand-surface rounded-[12px] p-8 text-center border border-brand-surface-light/20 relative overflow-hidden group shadow-premium">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-surface-light/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-16 h-16 mx-auto bg-brand-dark rounded-full flex items-center justify-center mb-5 border border-brand-accent/30 relative z-10">
                <FontAwesomeIcon icon={faCamera} className="text-brand-accent text-2xl" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-3 relative z-10">Laporan Foto &amp; Video</h3>
              <p className="text-brand-accent-light/85 text-sm leading-relaxed relative z-10">
                Update kondisi hewan dan dokumentasi penyembelihan dikirim langsung via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Produk Unggulan */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-2">Produk Unggulan</h2>
              <p className="text-brand-muted">Pilihan hewan kurban terbaik yang paling diminati.</p>
            </div>
            <Link
              href="/katalog"
              className="text-brand-surface font-bold hover:text-brand-accent flex items-center gap-2 transition-colors"
            >
              Lihat Semua Katalog <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
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
        </div>
      </section>

      {/* Section 5: Cara Pesan */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-surface opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-light mb-3">Cara Pesan Kurban</h2>
            <p className="text-brand-accent-light/80">Proses mudah, transparan, dan aman dari awal hingga selesai.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[18%] right-[18%] h-0.5 bg-brand-surface-light/30"></div>
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-28 h-28 rounded-full bg-brand-surface border-4 border-brand-dark flex items-center justify-center text-brand-accent text-3xl mb-5 shadow-premium">
                <FontAwesomeIcon icon={faCow} />
              </div>
              <div className="text-brand-accent font-bold text-xs uppercase tracking-widest mb-2">Langkah 1</div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-2">Pilih Hewan</h3>
              <p className="text-brand-accent-light/75 text-sm">Pilih hewan kurban dari katalog sesuai budget dan kriteria Anda.</p>
              <Link href="/katalog" className="mt-4 text-brand-accent text-sm font-bold hover:underline">
                Buka Katalog →
              </Link>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-28 h-28 rounded-full bg-brand-surface border-4 border-brand-dark flex items-center justify-center text-brand-accent text-3xl mb-5 shadow-premium">
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
              </div>
              <div className="text-brand-accent font-bold text-xs uppercase tracking-widest mb-2">Langkah 2</div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-2">Isi Data &amp; Transfer</h3>
              <p className="text-brand-accent-light/75 text-sm">Isi formulir pemesanan dan selesaikan pembayaran via transfer atau QRIS.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-28 h-28 rounded-full bg-brand-surface border-4 border-brand-dark flex items-center justify-center text-brand-accent text-3xl mb-5 shadow-premium">
                <FontAwesomeIcon icon={faHouseCircleCheck} />
              </div>
              <div className="text-brand-accent font-bold text-xs uppercase tracking-widest mb-2">Langkah 3</div>
              <h3 className="font-serif text-xl font-bold text-brand-light mb-2">Terima &amp; Selesai</h3>
              <p className="text-brand-accent-light/75 text-sm">Hewan diantar ke lokasi Anda, laporan foto/video dikirim via WhatsApp.</p>
              <Link href="/lacak-pesanan" className="mt-4 text-brand-accent text-sm font-bold hover:underline">
                Lacak Pesanan →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Testimoni */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">Kata Pelanggan Kami</h2>
            <p className="text-brand-muted">Ribuan keluarga telah mempercayakan ibadah kurbannya kepada kami.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1: Ahmad Fauzi */}
            <div className="bg-white rounded-[12px] p-6 shadow-premium border border-brand-muted/10">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStarSolid} className="text-brand-accent text-sm" />
                ))}
              </div>
              <p className="text-brand-muted text-sm leading-relaxed mb-5">
                &ldquo;Pengalaman kurban terbaik! Hewan sehat, pengiriman tepat waktu, dan laporan video sangat memuaskan. Tahun depan pasti pesan lagi.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface/20 text-brand-surface flex items-center justify-center font-bold">
                  AF
                </div>
                <div>
                  <div className="text-brand-dark font-semibold text-sm">Ahmad Fauzi</div>
                  <div className="text-brand-muted text-xs">Jakarta</div>
                </div>
              </div>
            </div>
            {/* Testimonial 2: Siti Rahayu */}
            <div className="bg-white rounded-[12px] p-6 shadow-premium border border-brand-muted/10">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStarSolid} className="text-brand-accent text-sm" />
                ))}
              </div>
              <p className="text-brand-muted text-sm leading-relaxed mb-5">
                &ldquo;Sangat mudah, transparan, dan amanah. Bisa memantau kondisi hewan secara real-time. Sungguh tenang ibadah kurbannya bersama Beyond Qurban.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center font-bold">
                  SR
                </div>
                <div>
                  <div className="text-brand-dark font-semibold text-sm">Siti Rahayu</div>
                  <div className="text-brand-muted text-xs">Surabaya</div>
                </div>
              </div>
            </div>
            {/* Testimonial 3: Budi Santoso (4 stars) */}
            <div className="bg-white rounded-[12px] p-6 shadow-premium border border-brand-muted/10">
              <div className="flex gap-0.5 mb-3">
                {[...Array(4)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStarSolid} className="text-brand-accent text-sm" />
                ))}
                <FontAwesomeIcon icon={faStarRegular} className="text-brand-accent text-sm" />
              </div>
              <p className="text-brand-muted text-sm leading-relaxed mb-5">
                &ldquo;Layanannya profesional dan responsif. Hewan kurban berkualitas baik dan proses pengiriman lancar. Sangat direkomendasikan untuk keluarga Muslim.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface-light/20 text-brand-surface flex items-center justify-center font-bold">
                  BS
                </div>
                <div>
                  <div className="text-brand-dark font-semibold text-sm">Budi Santoso</div>
                  <div className="text-brand-muted text-xs">Bandung</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: CTA Tentang Kami */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-brand-accent opacity-5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="max-w-[900px] mx-auto px-6 md:px-12 text-center relative z-10">
          <span className="text-brand-accent font-bold text-xs uppercase tracking-widest border border-brand-accent/40 px-4 py-1.5 rounded-full inline-block mb-6">
            Yayasan One Ummah
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-brand-light mb-6 leading-tight">
            Menjaga Amanah,<br />
            <span className="text-brand-accent">Menyempurnakan Ibadah</span>
          </h2>
          <p className="text-brand-accent-light/75 text-lg mb-10 font-light leading-relaxed max-w-2xl mx-auto">
            Beyond Qurban adalah program Yayasan One Ummah untuk memudahkan umat Islam menunaikan ibadah kurban secara benar, transparan, dan penuh amanah sejak 2019.
          </p>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 px-10 rounded-[20px] shadow-premium hover:scale-105 transition-transform"
          >
            Mulai Pesan Kurban <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>
    </>
  )
}
