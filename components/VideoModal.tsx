'use client'
import { useEffect } from 'react'
import { getEmbedUrl } from '@/lib/video-utils'

export function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const embedUrl = getEmbedUrl(url)
  if (!embedUrl) return null

  const separator = embedUrl.includes('?') ? '&' : '?'
  const autoplayUrl = `${embedUrl}${separator}autoplay=1`

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white
                     rounded-full w-8 h-8 flex items-center justify-center
                     hover:bg-black/80 text-lg"
          aria-label="Tutup video"
        >
          ✕
        </button>
        <iframe
          src={autoplayUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  )
}
