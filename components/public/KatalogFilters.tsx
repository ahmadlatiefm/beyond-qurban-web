'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useRef, useCallback } from 'react'

const TYPE_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'GARUT', label: 'Domba Garut' },
  { value: 'LOKAL', label: 'Domba Lokal' },
  { value: 'ETAWA', label: 'Domba Etawa' },
  { value: 'BATUR', label: 'Domba Batur' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'available', label: 'Tersedia' },
  { value: 'booked', label: 'Terpesan' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
]

export default function KatalogFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const sort = searchParams.get('sort') || ''

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams()
      const current = { q, type, status, sort, ...overrides }
      if (current.q) params.set('q', current.q)
      if (current.type) params.set('type', current.type)
      if (current.status) params.set('status', current.status)
      if (current.sort) params.set('sort', current.sort)
      return `/katalog${params.toString() ? `?${params.toString()}` : ''}`
    },
    [q, type, status, sort]
  )

  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
    }, 350)
  }

  const handleTypeChange = (value: string) => {
    router.push(buildUrl({ type: value }))
  }

  const handleStatusChange = (value: string) => {
    router.push(buildUrl({ status: value }))
  }

  const handleSortChange = (value: string) => {
    router.push(buildUrl({ sort: value }))
  }

  const removeFilter = (key: string) => {
    router.push(buildUrl({ [key]: '' }))
  }

  const clearAll = () => {
    router.push('/katalog')
  }

  const activeFilters = [
    q ? { key: 'q', label: `"${q}"` } : null,
    type ? { key: 'type', label: TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type } : null,
    status ? { key: 'status', label: STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status } : null,
    sort ? { key: 'sort', label: SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort } : null,
  ].filter(Boolean) as { key: string; label: string }[]

  return (
    <div className="bg-white shadow-premium rounded-[12px] p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-[8px] bg-brand-surface/10 flex items-center justify-center">
          <SlidersHorizontal size={15} className="text-brand-surface" />
        </div>
        <span className="font-sans font-semibold text-brand-text-dark text-sm">Filter &amp; Cari</span>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none"
          />
          <input
            type="text"
            defaultValue={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nama domba..."
            className="w-full bg-brand-light border border-brand-muted/20 rounded-[8px] pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-brand-text-dark placeholder:text-brand-muted"
          />
        </div>

        {/* Type select */}
        <div className="relative">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-brand-accent-light/30 border border-brand-accent/20 rounded-[8px] px-4 py-3 pr-9 text-sm text-brand-text-dark font-medium appearance-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent cursor-pointer"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dark pointer-events-none"
          />
        </div>

        {/* Status select */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-brand-accent-light/30 border border-brand-accent/20 rounded-[8px] px-4 py-3 pr-9 text-sm text-brand-text-dark font-medium appearance-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dark pointer-events-none"
          />
        </div>

        {/* Sort select */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-brand-accent-light/30 border border-brand-accent/20 rounded-[8px] px-4 py-3 pr-9 text-sm text-brand-text-dark font-medium appearance-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dark pointer-events-none"
          />
        </div>

        {/* Clear all */}
        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-3 rounded-[8px] border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <X size={14} />
            Hapus Semua
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-muted/10">
          <span className="text-xs text-brand-muted self-center">Aktif:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => removeFilter(filter.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface/10 text-brand-surface text-xs font-medium hover:bg-brand-surface/20 transition-colors"
            >
              {filter.label}
              <X size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
