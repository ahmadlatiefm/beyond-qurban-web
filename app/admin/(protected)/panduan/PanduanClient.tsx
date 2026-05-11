'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faBookOpen, faXmark, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import ChapterContent, { CHAPTER_KEYWORDS } from '@/components/admin/panduan/ChapterContent'

const CHAPTERS = [
  { id: 1, title: 'Dashboard', icon: '📊' },
  { id: 2, title: 'Produk Katalog', icon: '🐑' },
  { id: 3, title: 'Campaign / Penyaluran', icon: '📢' },
  { id: 4, title: 'Manajemen Order', icon: '🛒' },
  { id: 5, title: 'Manajemen Donasi', icon: '💚' },
  { id: 6, title: 'Pengiriman', icon: '🚚' },
  { id: 7, title: 'Pixel & Tracking', icon: '⚙️' },
  { id: 8, title: 'Follow Up Otomatis', icon: '📲' },
  { id: 9, title: 'WhatsApp', icon: '💬' },
  { id: 10, title: 'Pengaturan Umum', icon: '🔧' },
  { id: 11, title: 'Tim Lapangan', icon: '👷' },
  { id: 12, title: 'Form Konsumen', icon: '📋' },
  { id: 13, title: 'Sertifikat', icon: '📜' },
  { id: 14, title: 'Import Data', icon: '📥' },
  { id: 15, title: 'Laporan Penyaluran', icon: '📋' },
] as const

const TOTAL = CHAPTERS.length

function clamp(n: number) {
  return Math.max(1, Math.min(TOTAL, n))
}

export default function PanduanClient() {
  const router = useRouter()
  const [active, setActive] = useState<number>(1)
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false) // mobile drawer

  // Read ?bab from URL on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('bab')
    if (raw) {
      const parsed = parseInt(raw, 10)
      if (Number.isFinite(parsed)) setActive(clamp(parsed))
    }
  }, [])

  // When active changes, push the URL so back/forward works.
  function goToChapter(n: number) {
    const next = clamp(n)
    setActive(next)
    setNavOpen(false)
    // Scroll active chapter content to top — admin layout has overflow-y-auto
    // wrapper so the doc element doesn't scroll, the wrapper does.
    const main = document.getElementById('panduan-content')
    if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (typeof window !== 'undefined') {
      router.replace(`/admin/panduan?bab=${next}`, { scroll: false })
    }
  }

  // Sync if user uses browser back/forward.
  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search)
      const raw = params.get('bab')
      const parsed = raw ? parseInt(raw, 10) : 1
      if (Number.isFinite(parsed)) setActive(clamp(parsed))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const q = query.trim().toLowerCase()
  function isMatch(id: number): boolean {
    if (!q) return false
    const ch = CHAPTERS.find((c) => c.id === id)
    if (!ch) return false
    return ch.title.toLowerCase().includes(q) || (CHAPTER_KEYWORDS[id] ?? '').toLowerCase().includes(q)
  }
  const matchCount = q ? CHAPTERS.filter((c) => isMatch(c.id)).length : 0

  const activeMeta = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0]

  return (
    <div className="px-5 md:px-8 py-5 md:py-6 max-w-[1300px] mx-auto w-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-dark flex items-center gap-2">
          <FontAwesomeIcon icon={faBookOpen} className="text-brand-accent" />
          Panduan Admin Beyond Qurban
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Pilih bab di sidebar atau pakai tombol prev/next di bawah konten.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari bab… contoh: tag hewan, follow up, pixel"
          className="inp pl-9 pr-9 w-full"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
            aria-label="Hapus pencarian"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
        {q && (
          <p className="text-[11px] text-brand-muted mt-1">
            {matchCount === 0
              ? `Tidak ada bab yang cocok dengan "${query}".`
              : `${matchCount} bab cocok — disorot di sidebar.`}
          </p>
        )}
      </div>

      {/* Mobile drawer toggle */}
      <button
        onClick={() => setNavOpen((v) => !v)}
        className="md:hidden mb-3 px-3 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-dark"
      >
        {navOpen ? 'Tutup daftar bab' : `Daftar bab — ${activeMeta.icon} ${activeMeta.title}`}
      </button>

      <div className="md:flex md:gap-6 md:items-start">
        {/* Sidebar */}
        <aside
          className={`${navOpen ? 'block mb-4' : 'hidden md:block'} md:w-56 md:flex-shrink-0 md:self-start md:sticky md:top-6`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted mb-2 px-2">
            Daftar Bab
          </p>
          <nav className="flex flex-col gap-0.5">
            {CHAPTERS.map((ch) => {
              const isActive = ch.id === active
              const matched = isMatch(ch.id)
              return (
                <button
                  key={ch.id}
                  onClick={() => goToChapter(ch.id)}
                  className={`w-full text-left text-sm px-2.5 py-2 rounded-[8px] transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-brand-dark text-brand-accent-light font-semibold'
                      : matched
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 ring-1 ring-amber-300'
                        : 'text-brand-dark hover:bg-brand-light'
                  }`}
                >
                  <span className="shrink-0">{ch.icon}</span>
                  <span className="flex-1 truncate">
                    <span className="text-[10px] mr-1 opacity-60">{ch.id}.</span>
                    {ch.title}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Active chapter content */}
        <main id="panduan-content" className="flex-1 min-w-0 scroll-mt-6">
          <article className="bg-white rounded-[14px] border border-brand-muted/10 shadow-sm min-h-[70vh]">
            <header className="px-6 md:px-8 py-5 border-b border-brand-muted/10">
              <div className="text-[11px] uppercase tracking-wider text-brand-muted">
                Bab {activeMeta.id} dari {TOTAL}
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-brand-dark mt-0.5 flex items-center gap-2">
                <span className="text-2xl">{activeMeta.icon}</span> {activeMeta.title}
              </h2>
            </header>
            <div className="px-6 md:px-8 py-6 flex flex-col gap-4 text-sm text-brand-dark leading-relaxed">
              <ChapterContent chapter={active} />
            </div>
          </article>

          {/* Prev / Next */}
          <div className="flex items-center justify-between gap-2 mt-4">
            <button
              onClick={() => goToChapter(active - 1)}
              disabled={active === 1}
              className="px-4 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faChevronLeft} /> Sebelumnya
            </button>
            <span className="text-xs text-brand-muted hidden sm:block">
              Bab {active} dari {TOTAL}
            </span>
            <button
              onClick={() => goToChapter(active + 1)}
              disabled={active === TOTAL}
              className="px-4 py-2 bg-brand-dark text-brand-accent-light rounded-[8px] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Selanjutnya <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
