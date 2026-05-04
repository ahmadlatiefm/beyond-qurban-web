'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShieldHalved, faArrowRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'

interface Props {
  campaign: {
    id: string
    slug: string
    title: string
    price: number
    programType: string
    location: string
    animalType: string
    allowShare: boolean
    ctaButtonText: string | null
    hasAnimals?: boolean
  }
}

type DonationType = 'qurban' | 'sedekah'

function getButtonText(programType: string, donationType: DonationType, ctaText: string | null): string {
  if (ctaText) return ctaText
  if (programType === 'sedekah') return 'Sedekah Sekarang'
  if (programType === 'keduanya') {
    return donationType === 'sedekah' ? 'Sedekah Sekarang' : 'Qurban Sekarang'
  }
  return 'Qurban Sekarang'
}

export default function CampaignDetailClient({ campaign }: Props) {
  const [qty, setQty] = useState(1)
  const [donationType, setDonationType] = useState<DonationType>('qurban')
  const [shareType, setShareType] = useState<'1/1' | '1/7'>('1/1')

  const showTypeSelector = campaign.programType === 'keduanya'
  const isSedekahOnly = campaign.programType === 'sedekah'

  const unitPrice = shareType === '1/7' ? Math.round(campaign.price / 7) : campaign.price
  const total = unitPrice * qty

  const checkoutUrl = `/penyaluran/checkout?campaign=${campaign.slug}&qty=${qty}&type=${isSedekahOnly ? 'sedekah' : donationType}&share=${shareType}`

  const buttonText = getButtonText(campaign.programType, donationType, campaign.ctaButtonText)

  return (
    <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-premium overflow-hidden sticky top-28">
      {/* Header */}
      <div className="p-5 bg-brand-surface text-brand-light">
        <div className="text-xs text-brand-accent-light/70 mb-1">Program</div>
        <div className="font-serif text-base font-bold text-brand-light leading-tight mb-1">{campaign.title}</div>
        <div className="font-serif text-2xl font-bold text-brand-accent">
          {formatCurrency(shareType === '1/7' ? Math.round(campaign.price / 7) : campaign.price)}
          <span className="text-sm font-sans font-normal text-brand-accent-light/70">
            {shareType === '1/7' ? '/bagian' : '/ekor'}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Tipe donasi — hanya muncul jika programType === 'keduanya' */}
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
                  className={`border-2 rounded-[10px] p-3 text-left transition-all ${donationType === key ? 'border-brand-accent bg-brand-accent/[0.04]' : 'border-brand-muted/20 hover:border-brand-accent/40'}`}
                >
                  <div className="font-bold text-xs text-brand-dark">{label}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sedekah saja badge */}
        {isSedekahOnly && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-[8px] px-3 py-2">
            <span className="text-base">💝</span>
            <div>
              <div className="text-xs font-bold text-blue-700">Program Sedekah</div>
              <div className="text-[10px] text-blue-500">Donasi ini dicatat sebagai sedekah / infaq</div>
            </div>
          </div>
        )}

        {/* Opsi bagian sapi — hanya muncul jika animalType = sapi dan allowShare = true */}
        {campaign.animalType === 'sapi' && campaign.allowShare && (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Jenis Qurban Sapi</div>
            <div className="flex gap-2">
              {([
                { key: '1/1', label: '1 Ekor Penuh', price: campaign.price },
                { key: '1/7', label: '1/7 Bagian', price: Math.round(campaign.price / 7) },
              ] as const).map(({ key, label, price }) => (
                <button
                  key={key}
                  onClick={() => setShareType(key as '1/1' | '1/7')}
                  className={`flex-1 border-2 rounded-[10px] p-3 text-center transition-all ${shareType === key ? 'border-brand-accent bg-brand-accent/[0.04]' : 'border-brand-muted/20 hover:border-brand-accent/40'}`}
                >
                  <div className="font-bold text-sm text-brand-dark">{label}</div>
                  <div className="text-xs text-brand-accent font-bold">{formatCurrency(price)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty selector — hidden if campaign has per-animal picker */}
        {campaign.hasAnimals ? (
          <div className="text-xs text-brand-muted bg-brand-light rounded-[8px] p-3 text-center">
            Pilih hewan dari daftar di bawah halaman ini
          </div>
        ) : (
          <div>
            <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Jumlah Hewan</div>
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
        )}

        {/* Info atas nama — will be collected in checkout form */}
        {!campaign.hasAnimals && qty > 1 && campaign.programType !== 'sedekah' && (
          <div className="text-xs text-brand-muted bg-brand-light rounded-[8px] p-3 flex items-start gap-2">
            <span>📜</span>
            <span>Formulir checkout akan meminta <strong className="text-brand-dark">{qty} nama</strong> atas nama qurban (1 per ekor)</span>
          </div>
        )}

        {/* Total */}
        {!campaign.hasAnimals && (
          <div className="bg-brand-light rounded-[10px] p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-brand-dark">Total Donasi</span>
            <span className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(total)}</span>
          </div>
        )}

        {/* CTA */}
        {!campaign.hasAnimals && (
          <Link
            href={checkoutUrl}
            className="w-full bg-cta-gradient text-brand-text-dark font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-glow transition-all text-sm shadow-premium"
          >
            <FontAwesomeIcon icon={faHeart} className="text-xs" />
            {buttonText}
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Link>
        )}

        <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
          <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" />
          Transaksi aman & amanah
        </div>
      </div>
    </div>
  )
}
