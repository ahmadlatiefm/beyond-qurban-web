'use client'
import { useState } from 'react'
import { getEmbedUrl } from '@/lib/video-utils'

export function VideoGallery({ urls }: { urls: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const embedUrls = urls.map(getEmbedUrl).filter(Boolean) as string[]
  if (embedUrls.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">Gallery Video</h3>
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-3">
        <iframe
          key={activeIndex}
          src={embedUrls[activeIndex]}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {embedUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {embedUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden
                border-2 transition-all ${i === activeIndex
                  ? 'border-amber-500 opacity-100'
                  : 'border-gray-200 opacity-60 hover:opacity-80'}`}
            >
              <iframe
                src={url}
                className="w-full h-full pointer-events-none scale-150"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
