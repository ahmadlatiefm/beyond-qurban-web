'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useAppToast } from '@/components/ui/AppToast'
import { formatCurrency } from '@/lib/utils'

export interface AnimalItem {
  id: string
  name: string
  weight: string
  originalPrice?: number
  price: number
  imageUrl: string
  stock?: number
}

export type DonationType = 'qurban' | 'sedekah'
export type ShareType = '1/1' | '1/7'

type Ctx = {
  slug: string
  programType: string
  animalType: string
  allowShare: boolean
  ctaText: string
  campaignPrice: number | null
  animals: AnimalItem[]
  hasAnimals: boolean

  selectedAnimal: AnimalItem | null
  setSelectedAnimal: (a: AnimalItem | null) => void
  qty: number
  setQty: (q: number | ((prev: number) => number)) => void
  donationType: DonationType
  setDonationType: (t: DonationType) => void
  shareType: ShareType
  setShareType: (s: ShareType) => void

  isReady: boolean
  unitPrice: number
  total: number
  checkoutHref: string
  /** Imperatively navigate to checkout using the *current* state (qty, animal, etc). */
  goToCheckout: () => void
}

const CampaignCtx = createContext<Ctx | null>(null)

export function useCampaignInteractive() {
  const ctx = useContext(CampaignCtx)
  if (!ctx) throw new Error('useCampaignInteractive must be used within CampaignInteractiveProvider')
  return ctx
}

export function CampaignInteractiveProvider({
  children,
  slug,
  programType,
  animalType,
  allowShare,
  ctaText,
  campaignPrice,
  animals,
}: {
  children: React.ReactNode
  slug: string
  programType: string
  animalType: string
  allowShare: boolean
  ctaText: string
  campaignPrice: number | null
  animals: AnimalItem[]
}) {
  const router = useRouter()
  const hasAnimals = animals.length > 0
  const singleAnimal = animals.length === 1

  // - 1 animal:  no picker UI; auto-select that one animal so the stepper drives total directly.
  // - 2+ animals: user must pick; the CTA gates until they do.
  // - 0 animals: legacy data only — CTA is locked, no checkout path.
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(
    singleAnimal ? animals[0] : null
  )
  const [qty, setQty] = useState<number>(1)
  const [donationType, setDonationType] = useState<DonationType>(
    programType === 'sedekah' ? 'sedekah' : 'qurban'
  )
  const [shareType, setShareType] = useState<ShareType>('1/1')

  // When the campaign uses animal cards we deliberately suppress any unit price
  // until the donor picks one — showing the legacy `campaignPrice` as a default
  // misleads the donor into thinking that's what they'd pay.
  const unitPrice = selectedAnimal
    ? selectedAnimal.price
    : (hasAnimals ? 0 : (campaignPrice ?? 0))
  const total = unitPrice * qty

  // Always require an animal selection — no path to checkout without one.
  const isReady = selectedAnimal !== null

  const params = new URLSearchParams()
  params.set('campaign', slug)
  params.set('qty', String(qty))
  params.set('type', donationType)
  params.set('share', shareType)
  if (selectedAnimal) {
    params.set('animalName', selectedAnimal.name)
    params.set('animalPrice', String(selectedAnimal.price))
  }
  const checkoutHref = `/penyaluran/checkout?${params.toString()}`

  const goToCheckout = useCallback(() => {
    if (!selectedAnimal) return
    const p = new URLSearchParams()
    p.set('campaign', slug)
    p.set('qty', String(qty))
    p.set('type', donationType)
    p.set('share', shareType)
    p.set('animalName', selectedAnimal.name)
    p.set('animalPrice', String(selectedAnimal.price))
    router.push(`/penyaluran/checkout?${p.toString()}`)
  }, [router, slug, qty, donationType, shareType, selectedAnimal])

  return (
    <CampaignCtx.Provider value={{
      slug, programType, animalType, allowShare, ctaText, campaignPrice, animals, hasAnimals,
      selectedAnimal, setSelectedAnimal,
      qty, setQty,
      donationType, setDonationType,
      shareType, setShareType,
      isReady, unitPrice, total, checkoutHref, goToCheckout,
    }}>
      {children}
    </CampaignCtx.Provider>
  )
}

function flashWidget() {
  if (typeof window === 'undefined') return
  const el = document.getElementById('donation-widget')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('campaign-widget-flash')
  setTimeout(() => el.classList.remove('campaign-widget-flash'), 1400)
}

export function CampaignStickyCta() {
  const ctx = useCampaignInteractive()
  const appToast = useAppToast()
  const handleClick = () => {
    if (!ctx.isReady) {
      flashWidget()
      appToast.warning('Pilih hewan terlebih dahulu')
      return
    }
    ctx.goToCheckout()
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-muted/15 shadow-[0_-4px_20px_rgba(13,51,32,0.10)] px-4 py-3 lg:hidden">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-brand-muted">Total Donasi</div>
          {ctx.hasAnimals && !ctx.selectedAnimal ? (
            <div className="font-serif text-sm font-medium text-brand-muted leading-tight truncate">
              Pilih hewan dulu
            </div>
          ) : (
            <div className="font-serif text-base font-bold text-brand-accent leading-tight truncate">
              {formatCurrency(ctx.total)}
              <span className="text-[10px] font-sans font-normal text-brand-muted ml-1">
                · {ctx.qty} ekor
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="flex-1 max-w-[220px] bg-cta-gradient text-brand-text-dark font-bold rounded-[12px] py-3 px-4 flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-premium active:scale-95 transition-transform"
        >
          <FontAwesomeIcon icon={faHeart} className="text-xs" /> {ctx.ctaText} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </button>
      </div>
    </div>
  )
}
