export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/public/ProductCard'
import Link from 'next/link'

type SearchParams = { tab?: string; sort?: string }

type Tab = 'semua' | 'lokal' | 'penyaluran' | 'afrika' | 'palestina'

const TABS: { key: Tab; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'lokal', label: 'Domba Lokal' },
  { key: 'penyaluran', label: 'Penyaluran Indonesia' },
  { key: 'afrika', label: 'Qurban Afrika' },
  { key: 'palestina', label: 'Qurban Palestina' },
]

async function getProducts(tab: Tab, sort: string) {
  type WhereClause = {
    status: 'ACTIVE'
    qurbanLocation?: 'INDONESIA' | 'AFRICA' | 'PALESTINE'
    allowHomeDelivery?: boolean
  }

  const where: WhereClause = { status: 'ACTIVE' }

  if (tab === 'lokal') {
    where.qurbanLocation = 'INDONESIA'
    where.allowHomeDelivery = true
  } else if (tab === 'penyaluran') {
    where.qurbanLocation = 'INDONESIA'
    where.allowHomeDelivery = false
  } else if (tab === 'afrika') {
    where.qurbanLocation = 'AFRICA'
  } else if (tab === 'palestina') {
    where.qurbanLocation = 'PALESTINE'
  }

  const orderBy =
    sort === 'price_asc'
      ? { price: 'asc' as const }
      : sort === 'price_desc'
      ? { price: 'desc' as const }
      : { createdAt: 'desc' as const }

  return prisma.product.findMany({ where, orderBy })
}

export default async function KatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const tab = (searchParams.tab as Tab) || 'semua'
  const sort = searchParams.sort || 'newest'
  const products = await getProducts(tab, sort)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-[#1B5E3B] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-bold mb-2">Katalog Domba Kurban</h1>
          <p className="text-white/70">Pilih domba sesuai kebutuhan dan kemampuan Anda</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab filter */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/katalog?tab=${t.key}&sort=${sort}`}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#1B5E3B] text-white'
                  : 'bg-white text-[#6B7280] border border-gray-200 hover:border-[#1B5E3B] hover:text-[#1B5E3B]'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#6B7280]">{products.length} produk ditemukan</p>
          <div className="flex gap-2">
            {[
              { value: 'newest', label: 'Terbaru' },
              { value: 'price_asc', label: 'Harga ↑' },
              { value: 'price_desc', label: 'Harga ↓' },
            ].map((s) => (
              <Link
                key={s.value}
                href={`/katalog?tab=${tab}&sort=${s.value}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  sort === s.value
                    ? 'bg-[#1B5E3B] text-white border-[#1B5E3B]'
                    : 'bg-white text-[#6B7280] border-gray-200 hover:border-[#1B5E3B]'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">
            <p className="text-4xl mb-4">🐑</p>
            <p className="font-semibold text-lg">Belum ada produk di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
