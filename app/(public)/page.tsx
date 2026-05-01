export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/public/ProductCard'

async function getHomepageData() {
  const [products, totalOrders, totalCustomers, deliveredCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
  ])
  return { products, totalOrders, totalCustomers, deliveredCount }
}

export default async function HomePage() {
  const { products, totalOrders, totalCustomers, deliveredCount } = await getHomepageData()
  const deliveredPercent = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B5E3B] to-[#0D3320] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C8962A] text-sm font-semibold uppercase tracking-widest mb-4">
            Platform Kurban Online Terpercaya
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Kurban Berkah,<br />
            <span className="text-[#C8962A]">Amanah &amp; Terjangkau</span>
          </h1>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Domba lokal pilihan dengan penyaluran ke Indonesia, Afrika, dan Palestina.
            Proses mudah, pembayaran aman via Tripay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/katalog"
              className="px-8 py-4 rounded-xl bg-[#C8962A] text-white font-semibold text-lg hover:bg-[#b07e20] transition-colors"
            >
              Lihat Katalog Domba
            </Link>
            <Link
              href="/lacak"
              className="px-8 py-4 rounded-xl border border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Lacak Pesanan
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-[#F5E6C3] py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${products.length}+`, label: 'Pilihan Domba' },
            { value: `${totalOrders}+`, label: 'Total Pesanan' },
            { value: `${deliveredPercent}%`, label: 'Terkirim Tepat Waktu' },
            { value: `${totalCustomers}+`, label: 'Pelanggan Puas' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-3xl font-bold text-[#1B5E3B]">{stat.value}</p>
              <p className="text-sm text-[#6B7280] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mengapa Kami */}
      <section className="py-20 px-4 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center text-[#0D1F17] mb-12">
            Mengapa Memilih Kami?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🐑', title: 'Domba Berkualitas', desc: 'Dipilih langsung dari peternak terpercaya. Sehat, tidak cacat, sesuai syariat Islam.' },
              { icon: '🛡️', title: 'Pembayaran Aman', desc: 'Terintegrasi dengan Tripay — mendukung transfer bank, QRIS, dan virtual account.' },
              { icon: '🌍', title: 'Penyaluran Luas', desc: 'Kurban bisa disalurkan di Indonesia, Afrika, maupun Palestina sesuai pilihan Anda.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-lg font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Produk Terpopuler */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-3xl font-bold text-[#0D1F17]">Produk Terpopuler</h2>
            <Link href="/katalog" className="text-[#1B5E3B] font-semibold text-sm hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Cara Pesan */}
      <section className="py-20 px-4 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center text-[#0D1F17] mb-12">
            Cara Memesan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Pilih Domba', desc: 'Pilih dari katalog domba lokal atau penyaluran mancanegara.' },
              { step: '02', title: 'Isi Data', desc: 'Lengkapi nama, nomor WA, dan metode pengiriman.' },
              { step: '03', title: 'Bayar', desc: 'Pilih metode pembayaran via Tripay — bank transfer atau QRIS.' },
              { step: '04', title: 'Terima Laporan', desc: 'Notifikasi WA otomatis + laporan penyembelihan.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif font-bold text-[#0D1F17] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
