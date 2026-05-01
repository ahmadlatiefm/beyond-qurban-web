import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { sendFbCapiEvent } from '@/lib/facebook-capi'
import OrderForm from '@/components/public/OrderForm'
import ProductGallery from '@/components/public/ProductGallery'
import ProductActions from '@/components/public/ProductActions'
import StickyBar from '@/components/public/StickyBar'
import { CheckCircle2, Shield, Camera } from 'lucide-react'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return { title: 'Produk Tidak Ditemukan' }
  return {
    title: `${product.name} — Beyond Qurban`,
    description: product.description.slice(0, 160),
  }
}

const TYPE_LABEL: Record<string, string> = {
  LOKAL: 'Lokal',
  ETAWA: 'Etawa',
  GARUT: 'Garut',
  BATUR: 'Batur',
}
const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Indonesia',
  AFRICA: 'Afrika',
  PALESTINE: 'Palestina',
}

export default async function DetailProdukPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product || product.status === 'INACTIVE') notFound()

  // Fire-and-forget ViewContent
  void sendFbCapiEvent('ViewContent', {
    contentIds: [product.id],
    contentName: product.name,
    value: product.price,
  })

  // Fetch admin WA for "Tanya via WhatsApp" button
  const adminWaRow = await prisma.settings.findUnique({ where: { key: 'store_whatsapp' } })
  const adminWhatsapp = adminWaRow?.value ?? '6281234567890'

  const allImages = [product.imageUrl, ...product.images].filter(Boolean).slice(0, 5)

  const orderFormProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    allowHomeDelivery: product.allowHomeDelivery,
    qurbanLocation: product.qurbanLocation as string,
  }

  const categoryLabel =
    product.qurbanLocation !== 'INDONESIA'
      ? `Qurban ${LOCATION_LABEL[product.qurbanLocation]}`
      : product.allowHomeDelivery
      ? 'Domba Lokal'
      : 'Penyaluran Indonesia'

  return (
    <>
      <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1B5E3B] transition-colors">Beranda</Link>
            <span>/</span>
            <Link href="/katalog" className="hover:text-[#1B5E3B] transition-colors">Katalog</Link>
            <span>/</span>
            <span className="text-[#0D1F17] font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

            {/* ── Kiri: Gallery + Info ─────────────────────── */}
            <div>
              {/* Category chip */}
              <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#1B5E3B]/10 text-[#1B5E3B]">
                {categoryLabel}
              </span>

              {/* Gallery with lightbox */}
              <ProductGallery
                images={allImages}
                productName={product.name}
                badge={product.badge}
              />

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Berat',        value: `${product.weight} kg` },
                  { label: 'Jenis',        value: TYPE_LABEL[product.type] ?? product.type },
                  { label: 'Kondisi',      value: 'Sehat & tidak cacat' },
                  { label: 'Lokasi Kurban', value: LOCATION_LABEL[product.qurbanLocation] ?? product.qurbanLocation },
                ].map((spec) => (
                  <div key={spec.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                    <p className="text-xs text-[#6B7280] mb-1">{spec.label}</p>
                    <p className="text-sm font-semibold text-[#0D1F17]">{spec.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-3">Deskripsi Produk</h2>
                <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Kenapa Pilih Produk Ini */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-4">
                  Kenapa Pilih Produk Ini?
                </h2>
                <ul className="space-y-3">
                  {[
                    {
                      icon: '🐑',
                      title: 'Domba Pilihan Langsung dari Peternak',
                      desc: 'Setiap domba dipilih secara langsung — sehat, tidak cacat, dan memenuhi syarat kurban sesuai syariat Islam.',
                    },
                    {
                      icon: '📍',
                      title: `Kurban di ${LOCATION_LABEL[product.qurbanLocation] ?? 'Indonesia'}`,
                      desc:
                        product.qurbanLocation === 'INDONESIA'
                          ? 'Penyembelihan dilakukan di Bandung oleh tim profesional bersertifikasi halal.'
                          : `Disalurkan ke saudara muslim yang membutuhkan di ${LOCATION_LABEL[product.qurbanLocation]}.`,
                    },
                    {
                      icon: '✅',
                      title: 'Berat Terjamin ' + product.weight + ' kg',
                      desc: 'Berat domba sudah ditimbang dan tercatat. Tidak ada manipulasi — Anda mendapat apa yang dibayar.',
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-[#0D1F17]">{item.title}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Garansi Beyond Qurban */}
              <div className="rounded-2xl p-6 border border-[#1B5E3B]/20 bg-gradient-to-br from-[#1B5E3B]/5 to-transparent">
                <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#1B5E3B]" />
                  Garansi Beyond Qurban
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      icon: CheckCircle2,
                      label: 'Amanah & Transparan',
                      desc: 'Setiap pesanan didokumentasikan dan dilaporkan langsung kepada shohibul qurban.',
                    },
                    {
                      icon: Shield,
                      label: 'Sesuai Syariat Islam',
                      desc: 'Proses penyembelihan mengikuti tata cara Islam, disaksikan oleh petugas bersertifikasi.',
                    },
                    {
                      icon: Camera,
                      label: 'Foto & Video Dokumentasi',
                      desc: 'Anda akan menerima foto/video dokumentasi kurban yang dikirim via WhatsApp.',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3 items-start">
                      <item.icon size={18} className="text-[#1B5E3B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-[#0D1F17]">{item.label}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Kanan: Harga + Aksi + Form ──────────────── */}
            <div>
              {/* Product header */}
              <div className="mb-5">
                <h1 className="font-serif text-2xl font-bold text-[#0D1F17] mb-2">
                  {product.name}
                </h1>
                <p
                  className="text-3xl font-bold"
                  style={{ color: '#1B5E3B' }}
                >
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-[#6B7280] mt-1">
                  {product.stock > 0
                    ? `Stok tersisa: ${product.stock} ekor`
                    : '⚠️ Stok habis'}
                </p>
              </div>

              {/* Action buttons: Tanya WA + Share */}
              <ProductActions
                productName={product.name}
                productPrice={product.price}
                adminWhatsapp={adminWhatsapp}
                slug={product.slug}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-[#6B7280] font-medium">atau pesan langsung</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Order form */}
              <OrderForm product={orderFormProduct} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom bar */}
      <StickyBar
        productName={product.name}
        price={product.price}
        stock={product.stock}
        formId="order-form"
      />
    </>
  )
}
