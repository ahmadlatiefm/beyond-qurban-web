export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import LacakForm from './LacakForm'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function LacakPesananPage({
  searchParams,
}: { searchParams: { order?: string } }) {
  let order = null
  if (searchParams.order) {
    order = await prisma.order.findUnique({
      where: { orderNumber: searchParams.order },
      include: { product: true },
    })
  }

  return (
    <main className="pt-32 pb-24 max-w-[780px] mx-auto px-6 md:px-12 min-h-screen" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}>
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">Lacak Pesanan</h1>
        <p className="text-brand-muted">Masukkan nomor pesanan untuk melihat status kurban Anda.</p>
      </div>

      {/* Search form (client component) */}
      <LacakForm defaultOrder={searchParams.order} />

      {/* Results — rendered server-side when order found */}
      {searchParams.order && !order && (
        <div className="bg-white rounded-[14px] border border-red-200 p-6 text-center">
          <p className="text-red-600 font-medium">Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.</p>
        </div>
      )}

      {order && (
        <div className="flex flex-col gap-6 mt-8">
          {/* Order header */}
          <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-surface/5 rounded-bl-[100px]" />
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Nomor Pesanan</p>
              <h2 className="font-serif text-3xl font-bold text-brand-text-dark">{order.orderNumber}</h2>
              <p className="text-sm text-brand-muted mt-1">Dipesan: {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="bg-gradient-to-r from-brand-surface to-brand-surface-light text-white font-bold text-sm py-2 px-6 rounded-[20px]">
                {order.status === 'PENDING' ? 'Menunggu Bayar' :
                 order.status === 'CONFIRMED' ? 'Dikonfirmasi' :
                 order.status === 'PREPARING' ? 'Hewan Disiapkan' :
                 order.status === 'SHIPPED' ? 'Dikirim' :
                 order.status === 'DELIVERED' ? 'Selesai' : 'Dibatalkan'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6 md:p-8">
                <h3 className="font-serif text-xl font-bold text-brand-text-dark mb-7">Status Pesanan</h3>
                <div className="relative flex flex-col gap-7">
                  <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-brand-muted/20" />
                  {[
                    { key: 'PENDING', label: 'Pesanan Masuk', desc: 'Pesanan diterima dan menunggu pembayaran.', icon: '✓', done: true },
                    { key: 'CONFIRMED', label: 'Verifikasi Pembayaran', desc: 'Pembayaran berhasil diverifikasi.', icon: '✓', done: ['CONFIRMED','PREPARING','SHIPPED','DELIVERED'].includes(order.status) },
                    { key: 'PREPARING', label: 'Hewan Disiapkan', desc: 'Hewan kurban Anda sedang dalam perawatan intensif.', icon: '⟳', done: ['PREPARING','SHIPPED','DELIVERED'].includes(order.status) },
                    { key: 'SHIPPED', label: 'Penyembelihan', desc: 'Akan dilaksanakan pada hari Idul Adha.', icon: '✂', done: ['SHIPPED','DELIVERED'].includes(order.status) },
                    { key: 'DELIVERED', label: 'Selesai', desc: 'Laporan dan dokumentasi dikirim via WhatsApp.', icon: '✓✓', done: order.status === 'DELIVERED' },
                  ].map((step, i) => (
                    <div key={step.key} className={`flex gap-5 items-start relative z-10 ${!step.done ? 'opacity-40' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${step.done ? 'bg-brand-surface' : 'bg-brand-muted/20'}`}>
                        <span className={`text-[9px] font-bold ${step.done ? 'text-white' : 'text-brand-muted'}`}>{step.icon}</span>
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${step.done ? 'text-brand-text-dark' : 'text-brand-muted'}`}>{step.label}</h4>
                        <p className="text-xs text-brand-muted mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo update placeholder */}
              <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6">
                <h3 className="font-serif text-lg font-bold text-brand-text-dark mb-4">Update Foto Hewan</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[order.product.imageUrl, order.product.imageUrl, order.product.imageUrl].map((img, i) => (
                    <div key={i} className="aspect-square rounded-[8px] overflow-hidden bg-brand-light relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      {i === 2 && <div className="absolute inset-0 bg-brand-dark/50 flex items-center justify-center"><span className="text-white font-bold text-lg">+3</span></div>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-muted mt-3">Update terakhir: baru saja</p>
              </div>
            </div>

            {/* Right: Order info */}
            <div className="flex flex-col gap-5">
              {/* Pemesan */}
              <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-5">
                <h4 className="font-bold text-sm text-brand-dark mb-4">Info Pemesan</h4>
                <div className="flex flex-col gap-2.5 text-sm text-brand-muted">
                  <div className="flex items-center gap-2"><span className="text-brand-surface text-xs">👤</span><span className="text-brand-text-dark font-medium">{order.customerName}</span></div>
                  <div className="flex items-center gap-2"><span className="text-[#25D366] text-xs">📱</span>+62 {order.whatsapp}</div>
                  {order.address && <div className="flex items-start gap-2"><span className="text-brand-surface text-xs">📍</span>{order.address}</div>}
                  {order.deliveryDate && <div className="flex items-center gap-2"><span className="text-brand-surface text-xs">📅</span>Kirim: {formatDate(order.deliveryDate)}</div>}
                </div>
              </div>
              {/* Produk */}
              <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-5">
                <h4 className="font-bold text-sm text-brand-dark mb-4">Hewan Kurban</h4>
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-brand-light shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.product.imageUrl} className="w-full h-full object-cover" alt={order.product.name} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-brand-dark">{order.product.name}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{order.product.weight} kg</div>
                    <div className="font-bold text-brand-accent mt-1">{formatCurrency(order.product.price)}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm border-t border-brand-muted/10 pt-3">
                  <span className="text-brand-muted">Total Bayar</span>
                  <span className="font-serif font-bold text-brand-accent">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
              {/* WA contact */}
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#1ea855] transition-colors">
                💬 Hubungi Admin WA
              </a>
              <a href="/katalog" className="flex items-center justify-center gap-2 border-2 border-brand-surface text-brand-surface font-bold py-3 rounded-[12px] hover:bg-brand-surface hover:text-white transition-colors text-sm">
                + Pesan Kurban Lagi
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
