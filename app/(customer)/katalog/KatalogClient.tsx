'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faGrip, faList,
  faWeightScale, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@prisma/client'

type FilterType = 'all' | 'domba' | 'kambing' | 'sapi' | 'tersedia' | 'premium'
type SortType = 'default' | 'price-asc' | 'price-desc' | 'weight-desc'
type ViewType = 'grid' | 'list'

interface Props { products: Product[] }

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'domba', label: 'Domba' },
  { key: 'kambing', label: 'Kambing' },
  { key: 'sapi', label: 'Sapi' },
  { key: 'tersedia', label: 'Tersedia' },
  { key: 'premium', label: 'Premium' },
]

export default function KatalogClient({ products }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('default')
  const [view, setView] = useState<ViewType>('grid')

  const filtered = useMemo(() => {
    const matchFilter = (p: Product) => {
      if (filter === 'all') return true
      if (filter === 'domba') return p.name.toLowerCase().includes('domba')
      if (filter === 'kambing') return p.name.toLowerCase().includes('kambing')
      if (filter === 'sapi') return p.name.toLowerCase().includes('sapi')
      if (filter === 'tersedia') return p.status === 'ACTIVE'
      if (filter === 'premium') return p.badge === 'Premium' || p.badge === 'Best Seller'
      return true
    }

    const matchSearch = (p: Product) => {
      if (!search.trim()) return true
      return p.name.toLowerCase().includes(search.toLowerCase())
    }

    const result = products.filter(p => matchFilter(p) && matchSearch(p))

    result.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'weight-desc') return b.weight - a.weight
      return 0
    })

    return result
  }, [products, filter, search, sort])

  return (
    <section className="max-w-[1100px] mx-auto px-6 md:px-12 -mt-6 pb-24">
      {/* Search bar + sort */}
      <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 p-5 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
          <input
            type="text"
            placeholder="Cari nama, jenis hewan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-[8px] border border-brand-muted/20 bg-brand-light text-sm text-brand-text-dark focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider mr-1">Urutkan:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            className="h-10 px-3 border border-brand-muted/20 rounded-[8px] text-sm bg-brand-light text-brand-text-dark focus:outline-none focus:border-brand-accent"
          >
            <option value="default">Default</option>
            <option value="price-asc">Harga: Rendah ke Tinggi</option>
            <option value="price-desc">Harga: Tinggi ke Rendah</option>
            <option value="weight-desc">Berat: Terberat</option>
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        <span className="text-xs font-bold text-brand-muted uppercase tracking-wider self-center mr-1">Filter:</span>
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`filter-chip${filter === key ? ' active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results count + view toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-brand-muted"><span>{filtered.length}</span> hewan ditemukan</p>
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <button
            onClick={() => setView('grid')}
            className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${view === 'grid' ? 'bg-brand-surface text-white' : 'bg-brand-light border border-brand-muted/20 text-brand-muted'}`}
          >
            <FontAwesomeIcon icon={faGrip} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${view === 'list' ? 'bg-brand-surface text-white' : 'bg-brand-light border border-brand-muted/20 text-brand-muted'}`}
          >
            <FontAwesomeIcon icon={faList} />
          </button>
        </div>
      </div>

      {/* Product grid */}
      <div className={`grid gap-5 mb-10 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {filtered.map(product => {
          const avail = product.status === 'ACTIVE' && product.stock > 0
          return (
            <div
              key={product.id}
              className={`product-card bg-white rounded-[12px] overflow-hidden border border-brand-muted/10 flex flex-col shadow-premium${!avail ? ' opacity-70' : ''}`}
            >
              <div className="relative h-52 bg-brand-light overflow-hidden">
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                  {avail && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-light">
                      Tersedia
                    </span>
                  )}
                  {(product.badge === 'Best Seller' || product.badge === 'Premium') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-accent text-brand-dark">
                      {product.badge}
                    </span>
                  )}
                </div>
                {/* Overlay for unavailable */}
                {!avail && (
                  <div className="absolute inset-0 bg-white/35 z-[3]"></div>
                )}
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`w-full h-full object-cover hover:scale-110 transition-transform duration-500${!avail ? ' grayscale-[30%]' : ''}`}
                  src={product.imageUrl}
                  alt={product.name}
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">{product.name}</h3>
                <div className="flex items-center gap-3 text-xs text-brand-muted mb-3">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faWeightScale} />
                    {product.weight} kg
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-brand-muted/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand-muted">Harga</div>
                    <div className={`font-bold text-base ${avail ? 'text-brand-accent' : 'text-brand-muted'}`}>
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                  {avail ? (
                    <Link
                      href={`/produk/${product.slug}`}
                      className="bg-cta-gradient text-brand-text-dark text-xs font-bold px-4 py-2 rounded-[20px] hover:scale-105 transition-transform"
                    >
                      Lihat Detail
                    </Link>
                  ) : (
                    <span className="text-xs text-brand-muted font-medium bg-brand-light px-3 py-1.5 rounded-[20px]">
                      Terpesan
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination (static display) */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-muted hover:border-brand-surface hover:text-brand-surface flex items-center justify-center text-sm">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="w-9 h-9 rounded-[8px] bg-brand-surface text-white text-sm font-bold">1</button>
          <button className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-muted hover:border-brand-surface text-sm">2</button>
          <button className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-muted hover:border-brand-surface text-sm">3</button>
          <button className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-muted hover:border-brand-surface flex items-center justify-center text-sm">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </section>
  )
}
