export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import TrackingStepper from '@/components/public/TrackingStepper'
import Link from 'next/link'
import { PaymentStatus } from '@prisma/client'

type SearchParams = { order?: string }

const DELIVERY_METHOD_LABEL: Record<string, string> = {
  ONE_UMMAH: 'Penyaluran One Ummah',
  HOME_DELIVERY: 'Antar ke Rumah',
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Bayar',
  PAID: 'Sudah Bayar',
  EXPIRED: 'Kadaluarsa',
  REFUNDED: 'Dikembalikan',
}

const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Indonesia',
  AFRICA: 'Afrika',
  PALESTINE: 'Palestina',
}

export default async function LacakPage({ searchParams }: { searchParams: SearchParams }) {
  const orderNumber = searchParams.order?.toUpperCase()

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { product: { select: { name: true } } },
      })
    : null

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-[#1B5E3B] text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl font-bold mb-2">Lacak Pesanan</h1>
          <p className="text-white/70">Masukkan nomor pesanan untuk melihat status terkini</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Form input */}
        <form method="get" action="/lacak" className="flex gap-3 mb-10">
          <input
            name="order"
            defaultValue={searchParams.order}
            placeholder="Contoh: ORD-20260606-0001"
            required
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold text-sm hover:bg-[#0D3320] transition-colors"
          >
            Lacak
          </button>
        </form>

        {/* Tidak ditemukan */}
        {orderNumber && !order && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-[#0D1F17]">Pesanan tidak ditemukan</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Pastikan nomor pesanan benar, contoh: ORD-20260606-0001
            </p>
          </div>
        )}

        {/* Hasil */}
        {order && (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-6">Status Pesanan</h2>
              <TrackingStepper status={order.status} />
            </div>

            {/* Detail */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-[#0D1F17] text-lg mb-5">Detail Pesanan</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Nomor Pesanan', value: order.orderNumber },
                  { label: 'Produk', value: order.product.name },
                  { label: 'Nama Pemesan', value: order.customerName },
                  { label: 'Metode Kurban', value: DELIVERY_METHOD_LABEL[order.deliveryMethod] ?? order.deliveryMethod },
                  { label: 'Lokasi Kurban', value: LOCATION_LABEL[order.qurbanLocation] ?? order.qurbanLocation },
                  {
                    label: 'Tanggal Idul Adha',
                    value: new Date(order.sacrificeDate).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    }),
                  },
                  { label: 'Status Pembayaran', value: PAYMENT_STATUS_LABEL[order.paymentStatus] },
                  { label: 'Total Pembayaran', value: `Rp ${order.totalAmount.toLocaleString('id-ID')}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">{row.label}</span>
                    <span className="font-medium text-[#0D1F17] text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {order.paymentStatus === 'UNPAID' && order.tripayPaymentUrl && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <a
                    href={order.tripayPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-xl bg-[#C8962A] text-white font-semibold hover:bg-[#b07e20] transition-colors"
                  >
                    Lanjutkan Pembayaran →
                  </a>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link href="/katalog" className="text-[#1B5E3B] text-sm font-medium hover:underline">
                ← Kembali ke Katalog
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
