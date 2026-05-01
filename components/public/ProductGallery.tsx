'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  productName: string
  badge?: string | null
}

export default function ProductGallery({ images, productName, badge }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const activeImage = images[activeIndex] ?? images[0]

  function prev() {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }
  function next() {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <>
      {/* Main image */}
      <div
        className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={activeImage}
          alt={productName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {badge && (
          <span className="absolute top-4 left-4 px-3 py-1 bg-[#C8962A] text-white text-sm font-semibold rounded-full z-10">
            {badge}
          </span>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={18} />
        </div>

        {/* Arrow navigation if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#0D1F17] rounded-full p-1.5 shadow transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#0D1F17] rounded-full p-1.5 shadow transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mb-6">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === activeIndex
                  ? 'border-[#1B5E3B] ring-2 ring-[#1B5E3B]/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image src={img} alt={`${productName} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Tutup"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-3xl aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                aria-label="Foto berikutnya"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(i) }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
