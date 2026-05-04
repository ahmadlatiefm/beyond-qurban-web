import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWeightScale, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@prisma/client'

interface ProductCardProps {
  product: Product
  available?: boolean
}

export default function ProductCard({ product, available = true }: ProductCardProps) {
  return (
    <div className={`product-card bg-white rounded-[12px] overflow-hidden border border-brand-muted/10 flex flex-col shadow-premium${!available ? ' opacity-70' : ''}`}>
      {/* Image */}
      <div className="relative h-52 bg-brand-light overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-[20px] ${available ? 'bg-brand-surface text-brand-light' : 'bg-brand-muted text-white'}`}>
            {available ? 'Tersedia' : 'Terpesan'}
          </span>
          {product.badge && (
            <span className="bg-brand-accent text-brand-dark text-[10px] font-bold px-2.5 py-1 rounded-[20px]">
              {product.badge}
            </span>
          )}
        </div>
        {/* Unavailable overlay */}
        {!available && (
          <div className="absolute inset-0 bg-white/35 z-[3]" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`w-full h-full object-cover hover:scale-110 transition-transform duration-500${!available ? ' grayscale-[30%]' : ''}`}
          src={product.imageUrl}
          alt={product.name}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-base font-bold text-brand-dark mb-1 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-brand-muted mb-4">
          <FontAwesomeIcon icon={faWeightScale} /> {product.weight} kg
        </div>

        {/* Price + button */}
        <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-brand-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-brand-muted uppercase tracking-wide">Harga</div>
              <div className={`font-bold text-lg leading-tight ${available ? 'text-brand-accent' : 'text-brand-muted'}`}>
                {formatCurrency(product.price)}
              </div>
            </div>
          </div>

          {available ? (
            <Link
              href={`/produk/${product.slug}`}
              className="w-full bg-cta-gradient text-brand-text-dark font-bold text-sm py-2.5 rounded-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-glow transition-all"
            >
              Lihat Detail <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          ) : (
            <div className="w-full text-center text-xs text-brand-muted font-medium bg-brand-light py-2.5 rounded-[10px]">
              Tidak Tersedia
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
