export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import KatalogClient from './KatalogClient'

async function getAllProducts() {
  return prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function KatalogPage() {
  const products = await getAllProducts()
  return (
    <main className="pt-20">
      {/* Hero section */}
      <section className="bg-brand-dark pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage:'radial-gradient(#C8962A 1px,transparent 1px)',backgroundSize:'28px 28px'}}></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-surface opacity-15 blur-[100px] rounded-full"></div>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 text-center relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-sm text-brand-accent-light/70 mb-5">
            <Link href="/" className="hover:text-brand-accent">Beranda</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span className="text-brand-accent font-medium">Katalog Hewan</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-light mb-3">Katalog Hewan Kurban</h1>
          <p className="text-brand-accent-light/80 max-w-xl mx-auto">Pilih hewan kurban terbaik — sehat, memenuhi syarat syariat, dan siap diantar ke lokasi Anda.</p>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{display:'block',width:'100%',height:'50px'}}>
            <path d="M0,40 C300,80 900,0 1200,40 L1200,60 L0,60 Z" fill="#FAFAF8"/>
          </svg>
        </div>
      </section>

      {/* Client interactive section */}
      <KatalogClient products={products} />
    </main>
  )
}
