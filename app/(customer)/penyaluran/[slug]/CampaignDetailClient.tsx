'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShieldHalved, faArrowRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { useCampaignInteractive, type DonationType } from './CampaignInteractive'
import { useAppToast } from '@/components/ui/AppToast'

interface Props {
  campaign: {
    title: string
    location: string
  }
}

// Default animal photos berdasarkan nama hewan
const ANIMAL_DEFAULT_PHOTOS: { keywords: string[]; url: string }[] = [
  {
    keywords: ['sapi', 'lembu', 'cow', 'limosin', 'simental'],
    url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4aa755a4cf-d8191206751ab0936532.png',
  },
  {
    keywords: ['kambing', 'etawa', 'goat'],
    url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a9f65ae09d-dbb9748e6b272c117e01.png',
  },
  {
    keywords: ['domba', 'garut', 'merino', 'priangan', 'ekor', 'sheep', 'lamb'],
    url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png',
  },
  {
    keywords: ['unta', 'camel'],
    url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-c4fe96d3e4365e7ee53c.png',
  },
]

function getDefaultAnimalPhoto(name: string): string {
  const lower = name.toLowerCase()
  for (const { keywords, url } of ANIMAL_DEFAULT_PHOTOS) {
    if (keywords.some(k => lower.includes(k))) return url
  }
  // fallback: domba
  return 'https://storage.googleapis.com/uxpilot-auth.appspot.com/92bbac4904-633c0c42c771a49f61b6.png'
}

export default function CampaignDetailClient({ campaign }: Props) {
  const ctx = useCampaignInteractive()
  const appToast = useAppToast()
  const {
    animals, hasAnimals, programType, animalType, allowShare,
    selectedAnimal, setSelectedAnimal,
    qty, setQty,
    donationType, setDonationType,
    shareType, setShareType,
    unitPrice, total, isReady, ctaText: buttonText, goToCheckout,
  } = ctx

  const showTypeSelector = programType === 'keduanya' && !hasAnimals
  const isSedekahOnly = programType === 'sedekah'

  // Header price display: when nothing selected yet, show "—" instead of confusing default.
  const displayPrice = !selectedAnimal ? null : unitPrice

  function handleCtaClick() {
    if (!isReady) {
      appToast.warning('Pilih hewan terlebih dahulu')
      return
    }
    goToCheckout()
  }

  return (
    <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-premium overflow-hidden w-full lg:sticky lg:top-28">
      {/* Header */}
      <div className="p-4 md:p-5 bg-brand-surface text-brand-light">
        <div className="text-xs text-brand-accent-light/70 mb-1">Program</div>
        <div className="font-serif text-sm font-bold text-brand-light leading-tight mb-1">{campaign.title}</div>
        <div className="font-serif text-2xl font-bold text-brand-accent">
          {displayPrice !== null ? (
            <>
              {formatCurrency(displayPrice)}
              <span className="text-sm font-sans font-normal text-brand-accent-light/70">
                {shareType === '1/7' ? '/bagian' : '/ekor'}
              </span>
            </>
          ) : (
            <span className="text-base font-sans font-normal text-brand-accent-light/70">
              Pilih hewan untuk lihat harga
            </span>
          )}
        </div>
        {hasAnimals && selectedAnimal && (
          <div className="text-[11px] text-brand-accent-light/60 mt-1">
            {selectedAnimal.name} · ⚖️ {selectedAnimal.weight}
          </div>
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col gap-4">

        {/* ── Animal Picker — always rendered when campaign has animals.
              Single-animal campaigns auto-select that card so the donor sees the choice
              they're making (filled radio + amber border) before stepping through qty. */}
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
                    className={`w-full flex items-center gap-3 p-3 border-2 rounded-[12px] text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-accent bg-brand-accent/10 shadow-sm scale-[1.01]'
                        : 'border-brand-muted/20 hover:border-brand-accent hover:bg-brand-accent/[0.05] hover:scale-[1.01]'
                    }`}
                  >
                    {/* Animal image — pakai foto default jika tidak ada */}
                    <div className="w-16 h-14 rounded-[8px] overflow-hidden bg-brand-light shrink-0 border border-brand-muted/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={animal.imageUrl || getDefaultAnimalPhoto(animal.name)}
                        alt={animal.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          // Fallback ke default photo jika URL gagal
                          const img = e.target as HTMLImageElement
                          const fallback = getDefaultAnimalPhoto(animal.name)
                          if (img.src !== fallback) img.src = fallback
                        }}
                      />
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
                  className={`border-2 rounded-[10px] p-2.5 text-left transition-all duration-200 ${donationType === key ? 'border-brand-accent bg-brand-accent/10 scale-[1.01]' : 'border-brand-muted/20 hover:border-brand-accent hover:bg-brand-accent/[0.05] hover:scale-[1.01]'}`}
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

        {/* 1/7 sapi option — legacy, only relevant if a campaign has no animal cards */}
        {!hasAnimals && animalType === 'sapi' && allowShare && ctx.campaignPrice && (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Jenis Qurban Sapi</div>
            <div className="flex gap-2">
              {(['1/1', '1/7'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setShareType(key)}
                  className={`flex-1 border-2 rounded-[10px] p-2.5 text-center transition-all duration-200 ${shareType === key ? 'border-brand-accent bg-brand-accent/10 scale-[1.01]' : 'border-brand-muted/20 hover:border-brand-accent hover:bg-brand-accent/[0.05] hover:scale-[1.01]'}`}
                >
                  <div className="font-bold text-xs text-brand-dark">{key === '1/1' ? '1 Ekor Penuh' : '1/7 Bagian'}</div>
                  <div className="text-xs text-brand-accent font-bold">
                    {formatCurrency(key === '1/7' ? Math.round(ctx.campaignPrice! / 7) : ctx.campaignPrice!)}
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
          <div className="flex items-center justify-center gap-3 bg-brand-light rounded-[10px] py-2">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              aria-label="Kurangi jumlah"
              className="min-w-[44px] min-h-[44px] rounded-[8px] border border-brand-muted/20 bg-white text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faMinus} className="text-sm" />
            </button>
            <span className="text-xl font-bold text-brand-dark min-w-[2.5rem] text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              aria-label="Tambah jumlah"
              className="min-w-[44px] min-h-[44px] rounded-[8px] border border-brand-muted/20 bg-white text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
            </button>
            <span className="text-xs text-brand-muted ml-1">ekor</span>
          </div>
        </div>

        {/* Multiple atas nama info */}
        {qty > 1 && programType !== 'sedekah' && (
          <div className="text-xs text-brand-muted bg-brand-light rounded-[8px] p-2.5 flex items-start gap-2">
            <span>📜</span>
            <span>Checkout akan meminta <strong className="text-brand-dark">{qty} nama</strong> atas nama qurban</span>
          </div>
        )}

        {/* Total — suppressed until donor picks an animal so the displayed price is never misleading */}
        <div className="bg-brand-light rounded-[10px] p-3.5 flex justify-between items-center">
          <span className="text-sm font-medium text-brand-dark">Total Donasi</span>
          {hasAnimals && !selectedAnimal ? (
            <span className="font-serif text-sm font-medium text-brand-muted">Pilih hewan dulu</span>
          ) : (
            <span className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(total)}</span>
          )}
        </div>

        {/* CTA — gated on animal selection when campaign has animals */}
        {hasAnimals && !isReady && (
          <p className="text-[11px] text-amber-600 text-center -mb-1">
            ⚠ Pilih hewan terlebih dahulu untuk melanjutkan
          </p>
        )}
        <button
          type="button"
          onClick={handleCtaClick}
          aria-disabled={!isReady}
          className={`w-full font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all text-sm shadow-premium ${
            isReady
              ? 'bg-cta-gradient text-brand-text-dark hover:scale-[1.02] hover:shadow-glow'
              : 'bg-brand-muted/30 text-brand-muted cursor-not-allowed'
          }`}
        >
          <FontAwesomeIcon icon={faHeart} className="text-xs" />
          {buttonText}
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
          <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" />
          Transaksi aman &amp; amanah
        </div>
      </div>
    </div>
  )
}
