import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import OrderForm from '@/components/public/OrderForm'
import { sendFbCapiEvent } from '@/lib/facebook-capi'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return { title: 'Produk Tidak Ditemukan' }
  return {
    title: `${product.name} — Beyond Qurban`,
    description: product.description.slice(0, 160),
  }
}

const TYPE_LABEL: Record<string, string> = { LOKAL: 'Lokal', ETAWA: 'Etawa', GARUT: 'Garut', BATUR: 'Batur' }
const LOCATION_LABEL: Record<string, string> = { INDONESIA: 'Indonesia', AFRICA: 'Afrika', PALESTINE: 'Palestina' }

export default async function DetailProdukPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product || product.status === 'INACTIVE') notFound()

  // Fire-and-forget ViewContent
  void sendFbCapiEvent('ViewContent', {
    contentIds: [product.id],
    contentName: product.name,
    value: product.price,
  })

  const allImages = [product.imageUrl, ...product.images].filter(Boolean).slice(0, 5)

  const orderFormProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    allowHomeDelivery: product.allowHomeDelivery,
    qurbanLocation: product.qurbanLocation as string,
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Kiri: Gallery + Info */}
          <div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#C8962A] text-white text-sm font-semibold rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 mb-6">
                {allImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Berat', value: `${product.weight} kg` },
                { label: 'Jenis', value: TYPE_LABEL[product.type] ?? product.type },
                { label: 'Kondisi', value: 'Sehat & tidak cacat' },
                { label: 'Lokasi Kurban', value: LOCATION_LABEL[product.qurbanLocation] ?? product.qurbanLocation },
              ].map((spec) => (
                <div key={spec.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-xs text-[#6B7280] mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold text-[#0D1F17]">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-3">Deskripsi Produk</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>

          {/* Kanan: Order Form */}
          <div>
            <div className="mb-6">
              <h1 className="font-serif text-2xl font-bold text-[#0D1F17] mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-[#1B5E3B]">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">Stok tersisa: {product.stock} ekor</p>
            </div>
            <OrderForm product={orderFormProduct} />
          </div>
        </div>
      </div>
    </div>
  )
}
