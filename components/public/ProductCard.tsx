import Link from 'next/link'
import Image from 'next/image'

type QurbanLocation = 'INDONESIA' | 'AFRICA' | 'PALESTINE'

type Props = {
  id: string
  slug: string
  name: string
  type: string
  weight: number
  price: number
  imageUrl: string
  badge: string | null
  qurbanLocation: QurbanLocation
  allowHomeDelivery: boolean
  stock: number
}

const locationBadge: Record<QurbanLocation, { label: string; color: string }> = {
  INDONESIA: { label: 'Antar Rumah', color: 'bg-green-100 text-green-800' },
  AFRICA: { label: 'Kurban Afrika', color: 'bg-orange-100 text-orange-800' },
  PALESTINE: { label: 'Kurban Palestina', color: 'bg-red-100 text-red-800' },
}

function getCategoryBadge(loc: QurbanLocation, allowHome: boolean) {
  if (loc === 'INDONESIA' && !allowHome) {
    return { label: 'Penyaluran', color: 'bg-blue-100 text-blue-800' }
  }
  return locationBadge[loc]
}

const TYPE_LABEL: Record<string, string> = {
  LOKAL: 'Lokal',
  ETAWA: 'Etawa',
  GARUT: 'Garut',
  BATUR: 'Batur',
}

export default function ProductCard(props: Props) {
  const catBadge = getCategoryBadge(props.qurbanLocation, props.allowHomeDelivery)

  return (
    <Link href={`/katalog/${props.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={props.imageUrl}
            alt={props.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {props.badge && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-[#C8962A] text-white">
              {props.badge}
            </span>
          )}
          {props.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Habis Terjual</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${catBadge.color}`}>
            {catBadge.label}
          </span>
          <h3 className="font-serif font-semibold text-[#0D1F17] text-base leading-snug mb-1 line-clamp-2">
            {props.name}
          </h3>
          <p className="text-sm text-[#6B7280] mb-3">
            {props.weight} kg · {TYPE_LABEL[props.type] ?? props.type}
          </p>
          <p className="font-bold text-[#1B5E3B] text-lg">
            Rp {props.price.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </Link>
  )
}
