'use client'
import { useState } from 'react'
import { getYoutubeThumbnail } from '@/lib/video-utils'
import { VideoModal } from '@/components/VideoModal'

interface Props {
  images: string[]
  mainImage: string
  name: string
  badge: string | null
  videoUrls?: string[]
}

export default function ProductGallery({ images, mainImage, name, badge, videoUrls = [] }: Props) {
  const allImages = [mainImage, ...images.filter(img => img !== mainImage)]
  const [activeImg, setActiveImg] = useState(allImages[0] || mainImage)
  const [activeIdx, setActiveIdx] = useState(0)
  const [openVideo, setOpenVideo] = useState<string | null>(null)

  return (
    <div className="w-full lg:w-1/2 flex flex-col gap-4">
      {/* Main image */}
      <div className="w-full aspect-square bg-brand-light rounded-[24px] overflow-hidden border border-brand-muted/10 relative shadow-premium">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <span className="bg-brand-surface text-brand-light text-xs font-bold px-3 py-1.5 rounded-[20px]">Tersedia</span>
          {badge && (
            <span className="bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1.5 rounded-[20px]">{badge}</span>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImg}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      {/* Thumbnails: photos + videos in a single strip */}
      <div className="grid grid-cols-4 gap-3">
        {allImages.slice(0, 4).map((img, idx) => (
          <button
            key={`img-${idx}`}
            type="button"
            onClick={() => { setActiveImg(img); setActiveIdx(idx) }}
            className={`gallery-thumb aspect-square rounded-[16px] overflow-hidden border-2 ${activeIdx === idx ? 'active border-brand-surface' : 'border-transparent'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" src={img} alt="" />
          </button>
        ))}
        {videoUrls.map((url, idx) => {
          const ytThumb = getYoutubeThumbnail(url)
          return (
            <button
              key={`vid-${idx}`}
              type="button"
              onClick={() => setOpenVideo(url)}
              className="gallery-thumb relative aspect-square rounded-[16px] overflow-hidden border-2 border-transparent group"
              aria-label="Putar video"
            >
              {ytThumb ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="w-full h-full object-cover" src={ytThumb} alt="" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-surface to-brand-dark" />
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <span className="text-brand-surface text-sm font-bold ml-0.5">▶</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {openVideo && <VideoModal url={openVideo} onClose={() => setOpenVideo(null)} />}
    </div>
  )
}
