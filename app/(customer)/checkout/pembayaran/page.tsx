export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons'
import { formatDate } from '@/lib/utils'
import PembayaranClient from './PembayaranClient'

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams: { order?: string }
}) {
  const orderNumber = searchParams.order
  if (!orderNumber) notFound()

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { product: true },
  })
  if (!order) notFound()

  return (
    <main className="pt-28 pb-24 min-h-screen" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}>
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-7 flex-wrap">
          <Link href="/katalog" className="hover:text-brand-surface transition-colors">Katalog</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <Link href={`/checkout?slug=${order.product.slug}`} className="hover:text-brand-surface transition-colors">Form Pesanan</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span className="text-brand-text-dark font-medium">Detail Pembayaran</span>
        </nav>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-surface text-white flex items-center justify-center text-xs font-bold">
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            </div>
            <span className="text-sm font-medium text-brand-muted">Form Pesanan</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-surface/50 mx-3" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-brand-text-dark" style={{ background: 'linear-gradient(135deg,#F5E6C3,#C8962A)' }}>2</div>
            <span className="text-sm font-semibold text-brand-surface">Detail Pembayaran</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-muted/20 mx-3" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-sm font-medium text-brand-muted">Selesai</span>
          </div>
        </div>

        {/* Order header */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-brand-surface/5 rounded-bl-[80px]" />
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Nomor Pesanan</p>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-text-dark">{order.orderNumber}</h1>
            <p className="text-sm text-brand-muted mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm py-2 px-5 rounded-[20px] w-fit">
            Menunggu Pembayaran
          </span>
        </div>

        {/* Full 2-col layout rendered by client */}
        <PembayaranClient
          orderNumber={order.orderNumber}
          totalAmount={order.totalAmount}
          productName={order.product.name}
          productImage={order.product.imageUrl}
          productWeight={order.product.weight}
          createdAt={order.createdAt.toISOString()}
          paymentMethod={order.paymentMethod ?? 'BVAI'}
          payCode={order.tripayReference}
        />
      </div>
    </main>
  )
}
