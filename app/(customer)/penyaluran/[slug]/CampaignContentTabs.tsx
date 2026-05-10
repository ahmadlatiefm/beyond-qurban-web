'use client'
import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp, faNewspaper } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getEmbedUrl } from '@/lib/video-utils'

type RichBlock = { type: string; value: string; caption?: string }

export type DonorItem = {
  customerName: string
  totalAmount: number
  quantity: number
  createdAt: string
}

export type CampaignUpdateItem = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

interface Props {
  description: string
  richContent: string | null
  donors: DonorItem[]
  donorCount: number
  updates: CampaignUpdateItem[]
}

type TabKey = 'keterangan' | 'kabar' | 'donatur'

const COLLAPSED_MAX_HEIGHT = 300

export default function CampaignContentTabs({ description, richContent, donors, donorCount, updates }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('keterangan')
  const [expanded, setExpanded] = useState(false)
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const blocks: RichBlock[] = (() => {
    if (!richContent) return []
    try {
      const parsed = JSON.parse(richContent)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  useEffect(() => {
    if (activeTab !== 'keterangan') return
    const el = contentRef.current
    if (!el) return
    setNeedsCollapse(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 20)
  }, [activeTab, blocks.length, description])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'keterangan', label: 'Keterangan' },
    { key: 'kabar', label: 'Kabar Terbaru' },
    { key: 'donatur', label: `Donatur (${donorCount})` },
  ]

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'HA'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const displayName = (name: string) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return 'Hamba Allah'
    return trimmed
  }

  return (
    <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium overflow-hidden">
      {/* Tab headers */}
      <div role="tablist" className="flex border-b border-brand-muted/10 overflow-x-auto">
        {tabs.map((t) => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 min-w-fit px-4 py-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-brand-accent text-brand-dark'
                  : 'border-transparent text-brand-muted hover:text-brand-dark'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        {activeTab === 'keterangan' && (
          <div>
            <div
              ref={contentRef}
              style={{
                maxHeight: !expanded && needsCollapse ? `${COLLAPSED_MAX_HEIGHT}px` : '99999px',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                position: 'relative',
              }}
            >
              <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">{description}</p>

              {blocks.length > 0 && (
                <div className="flex flex-col gap-4 mt-5">
                  {blocks.map((block, i) => {
                    if (block.type === 'image') {
                      return (
                        <div key={i}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={block.value}
                            alt={block.caption || ''}
                            className="w-full rounded-[10px] object-cover max-h-[360px]"
                          />
                          {block.caption && (
                            <p className="text-xs text-brand-muted text-center mt-2 italic">{block.caption}</p>
                          )}
                        </div>
                      )
                    }
                    if (block.type === 'video') {
                      const embed = getEmbedUrl(block.value)
                      if (!embed) return null
                      return (
                        <div key={i}>
                          <div className="relative w-full rounded-[10px] overflow-hidden bg-black aspect-video">
                            <iframe
                              src={embed}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          {block.caption && (
                            <p className="text-xs text-brand-muted text-center mt-2 italic">{block.caption}</p>
                          )}
                        </div>
                      )
                    }
                    return (
                      <p key={i} className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">
                        {block.value}
                      </p>
                    )
                  })}
                </div>
              )}

              {!expanded && needsCollapse && (
                <div
                  className="pointer-events-none absolute left-0 right-0 bottom-0 h-16"
                  style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))' }}
                />
              )}
            </div>

            {needsCollapse && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] border border-brand-muted/20 text-brand-dark text-sm font-semibold hover:bg-brand-light transition-colors"
              >
                {expanded ? 'Sembunyikan' : 'Baca selengkapnya'}
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-xs" />
              </button>
            )}
          </div>
        )}

        {activeTab === 'kabar' && (
          updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 md:py-14">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mb-3">
                <FontAwesomeIcon icon={faNewspaper} className="text-brand-muted text-xl" />
              </div>
              <div className="text-sm font-semibold text-brand-dark mb-1">Belum ada kabar terbaru</div>
              <div className="text-xs text-brand-muted max-w-xs">
                Admin akan memposting update penyaluran di sini
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {updates.map((u) => (
                <article key={u.id} className="border-l-2 border-brand-accent/40 pl-4">
                  <div className="text-[11px] uppercase tracking-wider text-brand-muted mb-1">
                    {formatDate(u.createdAt)}
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-brand-dark mb-2">
                    📣 {u.title}
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">
                    {u.content}
                  </p>
                  {u.imageUrl && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.imageUrl}
                        alt={u.title}
                        className="w-full rounded-[10px] object-cover max-h-[360px]"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )
        )}

        {activeTab === 'donatur' && (
          <div>
            {donors.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="text-sm font-semibold text-brand-dark mb-1">Belum ada donatur</div>
                <div className="text-xs text-brand-muted">Jadilah donatur pertama untuk program ini</div>
              </div>
            ) : (
              <div className="flex flex-col">
                {donors.map((d, i) => {
                  const name = displayName(d.customerName)
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-brand-muted/8 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-surface/10 flex items-center justify-center font-bold text-brand-surface text-xs shrink-0">
                          {initials(name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-brand-dark truncate">{name}</div>
                          <div className="text-[11px] text-brand-muted">{formatDate(d.createdAt)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-brand-accent shrink-0 ml-3">
                        {formatCurrency(d.totalAmount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
