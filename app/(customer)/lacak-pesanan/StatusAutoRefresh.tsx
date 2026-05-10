'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons'

const REFRESH_MS = 30_000

function formatAgo(s: number) {
  if (s < 5) return 'baru saja'
  if (s < 60) return `${s} detik lalu`
  const m = Math.floor(s / 60)
  return `${m} menit lalu`
}

export default function StatusAutoRefresh() {
  const router = useRouter()
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    router.refresh()
    setLastRefreshedAt(Date.now())
    setTimeout(() => setIsRefreshing(false), 800)
  }, [router])

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [lastRefreshedAt])

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-[10px] border border-brand-muted/15 px-4 py-2.5 text-xs shadow-sm">
      <span className="text-brand-muted">
        Status diperbarui otomatis setiap 30 detik · Update terakhir:{' '}
        <strong className="text-brand-dark">{formatAgo(secondsAgo)}</strong>
      </span>
      <button
        type="button"
        onClick={refresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 text-brand-surface font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        <FontAwesomeIcon icon={faArrowRotateRight} className={isRefreshing ? 'animate-spin' : ''} />
        {isRefreshing ? 'Memuat…' : 'Refresh'}
      </button>
    </div>
  )
}
