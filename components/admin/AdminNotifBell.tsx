'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faReceipt, faCircleCheck, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons'

type Item = {
  id: string
  kind: 'order_paid' | 'proof_uploaded' | 'donation_new'
  title: string
  subtitle: string
  href: string
  createdAt: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Baru saja'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const KIND_ICON = {
  order_paid: faCircleCheck,
  proof_uploaded: faReceipt,
  donation_new: faHandHoldingHeart,
}
const KIND_TINT: Record<Item['kind'], string> = {
  order_paid: 'text-emerald-600 bg-emerald-50',
  proof_uploaded: 'text-amber-600 bg-amber-50',
  donation_new: 'text-blue-600 bg-blue-50',
}

export default function AdminNotifBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
      setCount(data.count ?? 0)
    } catch {}
    finally { setLoading(false) }
  }

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  // Refresh when opening
  useEffect(() => { if (open) load() }, [open])

  // Click-outside / Esc to close
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notifikasi"
        className="relative w-9 h-9 rounded-full bg-brand-light border border-brand-muted/20 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-white transition-colors"
      >
        <FontAwesomeIcon icon={faBell} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-brand-light leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-[340px] max-w-[90vw] bg-white border border-brand-muted/20 rounded-[12px] shadow-premium z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-muted/10 bg-brand-light flex items-center justify-between">
            <div className="font-bold text-sm text-brand-dark">Notifikasi</div>
            {loading && <div className="text-xs text-brand-muted">Memuat...</div>}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 && !loading && (
              <div className="px-4 py-10 text-center text-sm text-brand-muted">Tidak ada notifikasi baru</div>
            )}
            {items.map(item => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-brand-light transition-colors border-b border-brand-muted/8 last:border-b-0"
                role="menuitem"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${KIND_TINT[item.kind]}`}>
                  <FontAwesomeIcon icon={KIND_ICON[item.kind]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-brand-dark truncate">{item.title}</div>
                  <div className="text-xs text-brand-muted truncate mt-0.5">{item.subtitle}</div>
                  <div className="text-[10px] text-brand-muted/70 mt-1">{relativeTime(item.createdAt)}</div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/admin/pesanan"
            onClick={() => setOpen(false)}
            className="block text-center px-4 py-2.5 text-xs font-bold text-brand-surface hover:bg-brand-light border-t border-brand-muted/10"
          >
            Lihat Semua →
          </Link>
        </div>
      )}
    </div>
  )
}
