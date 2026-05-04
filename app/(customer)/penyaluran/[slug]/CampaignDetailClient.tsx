'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShieldHalved, faArrowRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'

interface AnimalItem {
  id: string; name: string; weight: string
  originalPrice?: number; price: number; imageUrl: string; stock?: number
}

interface Props {
  campaign: {
    id: string; slug: string; title: string; price: number
    programType: string; location: string; animalType: string
    allowShare: boolean; ctaButtonText: string | null
    animals: AnimalItem[]
  }
}

type DonationType = 'qurban' | 'sedekah'

function getButtonText(programType: string, donationType: DonationType, ctaText: string | null, hasAnimals: boolean): string {
  if (ctaText) return ctaText
  if (programType === 'sedekah') return 'Sedekah Sekarang'
  if (hasAnimals) return 'Qurban Sekarang'
  if (programType === 'keduanya') return donationType === 'sedekah' ? 'Sedekah Sekarang' : 'Qurban Sekarang'
  return 'Qurban Sekarang'
}

export default function CampaignDetailClient({ campaign }: Props) {
  const { animals } = campaign
  const hasAnimals = animals.length > 0

  const [qty, setQty] = useState(1)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(hasAnimals ? animals[0] : null)
  const [donationType, setDonationType] = useState<DonationType>('qurban')
  const [shareType, setShareType] = useState<'1/1' | '1/7'>('1/1')

  const showTypeSelector = campaign.programType === 'keduanya' && !hasAnimals
  const isSedekahOnly = campaign.programType === 'sedekah'

  // Price calculation
  const unitPrice = hasAnimals && selectedAnimal
    ? selectedAnimal.price
    : shareType === '1/7' ? Math.round(campaign.price / 7) : campaign.price
  const total = unitPrice * qty

  // Header price display
  const displayPrice = hasAnimals && selectedAnimal
    ? selectedAnimal.price
    : shareType === '1/7' ? Math.round(campaign.price / 7) : campaign.price

  // Checkout URL with correct price
  const checkoutUrl = hasAnimals && selectedAnimal
    ? `/penyaluran/checkout?campaign=${campaign.slug}&qty=${qty}&type=${donationType}&share=1/1&animalName=${encodeURIComponent(selectedAnimal.name)}&animalPrice=${selectedAnimal.price}`
    : `/penyaluran/checkout?campaign=${campaign.slug}&qty=${qty}&type=${isSedekahOnly ? 'sedekah' : donationType}&share=${shareType}`

  const buttonText = getButtonText(campaign.programType, donationType, campaign.ctaButtonText, hasAnimals)

  return (
    <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-premium overflow-hidden sticky top-28">
      {/* Header */}
      <div className="p-5 bg-brand-surface text-brand-light">
        <div className="text-xs text-brand-accent-light/70 mb-1">Program</div>
        <div className="font-serif text-sm font-bold text-brand-light leading-tight mb-1">{campaign.title}</div>
        <div className="font-serif text-2xl font-bold text-brand-accent">
          {formatCurrency(displayPrice)}
          <span className="text-sm font-sans font-normal text-brand-accent-light/70">
            {shareType === '1/7' ? '/bagian' : '/ekor'}
          </span>
        </div>
        {hasAnimals && selectedAnimal && (
          <div className="text-[11px] text-brand-accent-light/60 mt-1">
            {selectedAnimal.name} · ⚖️ {selectedAnimal.weight}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* ── Animal Picker (in sidebar) ─────────────────── */}
        {hasAnimals && (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Pilih Hewan</div>
            <div className="flex flex-col gap-2">
              {animals.map((animal) => {
                const isSelected = selectedAnimal?.id === animal.id
                return (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal)}
                    className={`w-full flex items-center gap-3 p-3 border-2 rounded-[12px] text-left transition-all ${
                      isSelected
                        ? 'border-brand-accent bg-brand-accent/[0.04] shadow-sm'
                        : 'border-brand-muted/20 hover:border-brand-accent/40'
                    }`}
                  >
                    {/* Animal image */}
                    <div className="w-14 h-12 rounded-[8px] overflow-hidden bg-brand-light shrink-0 border border-brand-muted/15">
                      {animal.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={animal.imageUrl}
                          alt={animal.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🐑</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-brand-dark leading-tight">{animal.name}</div>
                      <div className="text-[10px] text-brand-muted mt-0.5">⚖️ {animal.weight}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {animal.originalPrice && animal.originalPrice > animal.price && (
                          <span className="text-[10px] text-brand-muted line-through">
                            {formatCurrency(animal.originalPrice)}
                          </span>
                        )}
                        <span className="text-xs font-bold text-brand-accent">{formatCurrency(animal.price)}</span>
                      </div>
                    </div>

                    {/* Selected indicator */}
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Tipe donasi (keduanya, no animals) ─────────── */}
        {showTypeSelector && (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Tipe Donasi</div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'qurban' as DonationType, label: '🐑 Qurban', desc: 'Atas nama ibadah qurban' },
                { key: 'sedekah' as DonationType, label: '💝 Sedekah', desc: 'Sedekah umum / infaq' },
              ]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setDonationType(key)}
                  className={`border-2 rounded-[10px] p-2.5 text-left transition-all ${donationType === key ? 'border-brand-accent bg-brand-accent/[0.04]' : 'border-brand-muted/20 hover:border-brand-accent/40'}`}
                >
                  <div className="font-bold text-xs text-brand-dark">{label}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sedekah badge */}
        {isSedekahOnly && !hasAnimals && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-[8px] px-3 py-2">
            <span>💝</span>
            <div className="text-xs font-bold text-blue-700">Program Sedekah — dicatat sebagai infaq</div>
          </div>
        )}

        {/* 1/7 sapi option */}
        {!hasAnimals && campaign.animalType === 'sapi' && campaign.allowShare && (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Jenis Qurban Sapi</div>
            <div className="flex gap-2">
              {(['1/1', '1/7'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setShareType(key)}
                  className={`flex-1 border-2 rounded-[10px] p-2.5 text-center transition-all ${shareType === key ? 'border-brand-accent bg-brand-accent/[0.04]' : 'border-brand-muted/20 hover:border-brand-accent/40'}`}
                >
                  <div className="font-bold text-xs text-brand-dark">{key === '1/1' ? '1 Ekor Penuh' : '1/7 Bagian'}</div>
                  <div className="text-xs text-brand-accent font-bold">
                    {formatCurrency(key === '1/7' ? Math.round(campaign.price / 7) : campaign.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Qty selector ──────────────────────────────── */}
        <div>
          <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
            Jumlah {hasAnimals ? 'Hewan' : 'Ekor'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent transition-colors"
            >
              <FontAwesomeIcon icon={faMinus} className="text-xs" />
            </button>
            <span className="text-xl font-bold text-brand-dark w-8 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
            </button>
            <span className="text-xs text-brand-muted ml-1">ekor</span>
          </div>
        </div>

        {/* Multiple atas nama info */}
        {qty > 1 && campaign.programType !== 'sedekah' && (
          <div className="text-xs text-brand-muted bg-brand-light rounded-[8px] p-2.5 flex items-start gap-2">
            <span>📜</span>
            <span>Checkout akan meminta <strong className="text-brand-dark">{qty} nama</strong> atas nama qurban</span>
          </div>
        )}

        {/* Total */}
        <div className="bg-brand-light rounded-[10px] p-3.5 flex justify-between items-center">
          <span className="text-sm font-medium text-brand-dark">Total Donasi</span>
          <span className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(total)}</span>
        </div>

        {/* CTA */}
        <Link
          href={checkoutUrl}
          className="w-full bg-cta-gradient text-brand-text-dark font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-glow transition-all text-sm shadow-premium"
        >
          <FontAwesomeIcon icon={faHeart} className="text-xs" />
          {buttonText}
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </Link>

        <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
          <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" />
          Transaksi aman &amp; amanah
        </div>
      </div>
    </div>
  )
}
