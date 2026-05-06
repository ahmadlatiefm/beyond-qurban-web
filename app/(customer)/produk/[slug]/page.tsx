export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight, faWeightScale, faTag, faCircleCheck,
  faTruckFast, faCalendarCheck, faFileContract, faHandHoldingHeart,
  faCartShopping, faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import ProductGallery from './ProductGallery'

async function getProduct(slug: string) {
  return prisma.product.findUnique({ where: { slug } })
}

async function getRelatedProducts(currentSlug: string) {
  return prisma.product.findMany({
    where: { status: 'ACTIVE', slug: { not: currentSlug } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })
}

async function getWhatsapp() {
  const s = await prisma.settings.findUnique({ where: { key: 'store_whatsapp' } })
  return s?.value ?? '6281234567890'
}

export default async function ProdukDetailPage({ params }: { params: { slug: string } }) {
  const [product, related, waNumber] = await Promise.all([
    getProduct(params.slug),
    getRelatedProducts(params.slug),
    getWhatsapp(),
  ])

  if (!product) notFound()

  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${product.name}`)}`
  const checkoutLink = `/checkout?slug=${product.slug}`

  return (
    <main className="pt-28 pb-32 max-w-[1440px] mx-auto px-6 md:px-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-muted mb-8">
        <Link href="/" className="hover:text-brand-surface">Beranda</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <Link href="/katalog" className="hover:text-brand-surface">Katalog</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <span className="text-brand-text-dark font-medium">{product.name}</span>
      </nav>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: Gallery (Client Component) */}
        <ProductGallery
          images={product.images}
          mainImage={product.imageUrl}
          name={product.name}
          badge={product.badge}
        />

        {/* Right: Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-text-dark mb-2 leading-tight">{product.name}</h1>
          <div className="text-3xl font-bold text-brand-accent font-sans mb-6">{formatCurrency(product.price)}</div>

          {/* Specs grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-surface text-brand-light rounded-[12px] p-4 flex flex-col items-center text-center shadow-sm">
              <FontAwesomeIcon icon={faWeightScale} className="text-brand-accent text-xl mb-2" />
              <span className="text-xs opacity-80 mb-1">Berat</span>
              <span className="font-bold text-lg">{product.weight} kg</span>
            </div>
            <div className="bg-brand-light border border-brand-muted/20 rounded-[12px] p-4 flex flex-col items-center text-center">
              <FontAwesomeIcon icon={faTag} className="text-brand-surface text-xl mb-2" />
              <span className="text-xs text-brand-muted mb-1">Jenis</span>
              <span className="font-bold text-brand-text-dark text-sm">{product.badge ?? 'Lokal'}</span>
            </div>
            <div className="bg-brand-light border border-brand-muted/20 rounded-[12px] p-4 flex flex-col items-center text-center">
              <FontAwesomeIcon icon={faCircleCheck} className="text-brand-surface text-xl mb-2" />
              <span className="text-xs text-brand-muted mb-1">Kondisi</span>
              <span className="font-bold text-brand-text-dark text-sm">Sehat</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 mb-6 shadow-sm">
              <h3 className="font-bold text-brand-text-dark text-lg mb-3">Deskripsi {product.name}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Shipping info */}
          <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 mb-8 shadow-sm">
            <h3 className="font-bold text-brand-text-dark text-lg mb-5">Informasi Pengiriman</h3>
            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: faTruckFast, title: 'Gratis Ongkir', desc: 'Area Bandung Raya' },
                { icon: faCalendarCheck, title: 'Jadwal Antar', desc: 'H-3 s/d H-1 Idul Adha' },
                { icon: faFileContract, title: 'Garansi Sehat', desc: 'Diganti jika sakit/mati' },
                { icon: faHandHoldingHeart, title: 'Perawatan Gratis', desc: 'Hingga hari pengiriman' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-surface shrink-0">
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-brand-text-dark mb-0.5">{title}</h4>
                    <p className="text-xs text-brand-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop CTA buttons — hidden on mobile (sticky bar handles mobile) */}
          <div className="hidden lg:flex flex-col sm:flex-row gap-4">
            <Link href={checkoutLink} className="flex-1 bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 px-8 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity flex items-center justify-center gap-3">
              <FontAwesomeIcon icon={faCartShopping} /> Pesan Sekarang
            </Link>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="sm:w-auto w-full bg-white border-2 border-[#25D366] text-[#25D366] font-bold text-lg py-4 px-8 rounded-[12px] hover:bg-[#25D366]/5 transition-colors flex items-center justify-center gap-3">
              <FontAwesomeIcon icon={faWhatsapp} className="text-xl" /> Tanya Admin
            </a>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-24 mb-8">
        <div className="flex items-center justify-between mb-8 border-b border-brand-muted/20 pb-4">
          <h2 className="font-serif text-3xl font-bold text-brand-text-dark">Rekomendasi Lainnya</h2>
          <Link href="/katalog" className="text-brand-surface font-medium hover:text-brand-accent flex items-center gap-2">
            Lihat Semua <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {related.map((rel) => (
            <Link key={rel.id} href={`/produk/${rel.slug}`} className="bg-white rounded-[12px] overflow-hidden border border-brand-muted/10 flex flex-col group hover:shadow-premium transition-all">
              <div className="relative h-48 bg-brand-light overflow-hidden">
                <span className="absolute top-3 left-3 z-10 bg-brand-surface text-brand-light text-[10px] font-bold px-2.5 py-1 rounded-[20px]">Tersedia</span>
                {rel.badge && (
                  <span className="absolute top-10 left-3 z-10 bg-brand-accent text-brand-dark text-[10px] font-bold px-2.5 py-1 rounded-[20px]">{rel.badge}</span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={rel.imageUrl} alt={rel.name} />
              </div>
              <div className={`p-4 flex flex-col flex-1 border-t-4 ${rel.badge ? 'border-brand-surface' : 'border-brand-muted/20 group-hover:border-brand-surface'} transition-colors`}>
                <h3 className="font-serif text-base font-bold text-brand-dark mb-3">{rel.name}</h3>
                <div className="mt-auto pt-3 border-t border-brand-muted/10 flex items-center justify-between">
                  <span className="font-bold text-brand-accent">{formatCurrency(rel.price)}</span>
                  <span className="flex items-center gap-1 text-[10px] text-brand-surface font-bold bg-brand-accent-light/50 px-2 py-1 rounded-[8px]">
                    <FontAwesomeIcon icon={faWeightScale} /> {rel.weight} kg
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sticky CTA Bar — always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-muted/15 shadow-[0_-4px_20px_rgba(13,51,32,0.10)] px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-brand-muted">Harga</div>
          <div className="font-serif text-base sm:text-xl font-bold text-brand-accent leading-tight truncate">{formatCurrency(product.price)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-[#25D366] text-[#25D366] font-bold rounded-[12px] py-2.5 px-3 sm:px-5 flex items-center justify-center gap-2 text-sm hover:bg-[#25D366] hover:text-white transition-all">
            <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
            <span className="hidden sm:inline">Tanya Admin</span>
          </a>
          <Link href={checkoutLink} className="bg-cta-gradient text-brand-text-dark font-bold rounded-[12px] py-2.5 px-4 sm:px-6 flex items-center gap-2 text-sm sm:text-base hover:scale-[1.03] transition-transform whitespace-nowrap">
            <FontAwesomeIcon icon={faCartShopping} /> Pesan Sekarang
          </Link>
        </div>
      </div>
    </main>
  )
}
