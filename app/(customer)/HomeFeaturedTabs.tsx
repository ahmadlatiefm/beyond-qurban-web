'use client'
import { useState, type ReactNode } from 'react'

interface Props {
  hasProducts: boolean
  hasCampaigns: boolean
  campaignLabel: string
  produkLabel?: string
  produkSlot: ReactNode
  campaignSlot: ReactNode
}

export default function HomeFeaturedTabs({
  hasProducts, hasCampaigns, campaignLabel, produkLabel = 'Produk Katalog',
  produkSlot, campaignSlot,
}: Props) {
  const [tab, setTab] = useState<'produk' | 'campaign'>(hasProducts ? 'produk' : 'campaign')
  if (!hasProducts && !hasCampaigns) return null
  if (!hasCampaigns) return <>{produkSlot}</>
  if (!hasProducts) return <>{campaignSlot}</>
  return (
    <>
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white border border-brand-muted/20 rounded-[12px] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('produk')}
            className={`px-4 py-2 text-sm font-bold rounded-[10px] transition-all ${
              tab === 'produk' ? 'bg-brand-surface text-white shadow' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            {produkLabel}
          </button>
          <button
            type="button"
            onClick={() => setTab('campaign')}
            className={`px-4 py-2 text-sm font-bold rounded-[10px] transition-all ${
              tab === 'campaign' ? 'bg-brand-surface text-white shadow' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            {campaignLabel}
          </button>
        </div>
      </div>
      {tab === 'produk' ? produkSlot : campaignSlot}
    </>
  )
}
