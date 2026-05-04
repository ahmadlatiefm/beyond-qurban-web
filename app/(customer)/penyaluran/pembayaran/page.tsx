export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCheck, faClock } from '@fortawesome/free-solid-svg-icons'
import { formatDate } from '@/lib/utils'
import PembayaranPenyaluranClient from './PembayaranPenyaluranClient'

export default async function PembayaranPenyaluranPage({
  searchParams,
}: {
  searchParams: { order?: string }
}) {
  const orderNumber = searchParams.order
  if (!orderNumber) notFound()

  const donation = await prisma.donation.findUnique({
    where: { orderNumber },
    include: { campaign: true },
  })
  if (!donation) notFound()

  return (
    <main
      className="pt-28 pb-24 min-h-screen"
      style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}
    >
      <div className="max-w-[860px] mx-auto px-6 md:px-12">
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-6 flex-wrap">
          <Link href="/penyaluran" className="hover:text-brand-surface transition-colors">
            Program Penyaluran
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span className="text-brand-text-dark font-medium">Detail Pembayaran</span>
        </nav>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-surface text-white flex items-center justify-center text-xs font-bold">
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            </div>
            <span className="text-sm font-medium text-brand-muted line-through">Data Donatur</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-surface/40 mx-3" />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-brand-text-dark"
              style={{ background: 'linear-gradient(135deg,#F5E6C3,#C8962A)' }}
            >
              2
            </div>
            <span className="text-sm font-semibold text-brand-surface">Pembayaran</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-muted/20 mx-3" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="text-sm font-medium text-brand-muted">Konfirmasi</span>
          </div>
        </div>

        {/* Order header */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-surface/5 rounded-bl-[100px]" />
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Nomor Donasi</p>
            <h1 className="font-serif text-3xl font-bold text-brand-text-dark">{donation.orderNumber}</h1>
            <p className="text-sm text-brand-muted mt-1">{formatDate(donation.createdAt)}</p>
          </div>
          <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm py-2 px-5 rounded-[20px] w-fit">
            <FontAwesomeIcon icon={faClock} /> Menunggu Pembayaran
          </span>
        </div>

        <PembayaranPenyaluranClient
          orderNumber={donation.orderNumber}
          totalAmount={donation.totalAmount}
          campaignTitle={donation.campaign.title}
          campaignLocation={donation.campaign.location}
          quantity={donation.quantity}
          createdAt={donation.createdAt.toISOString()}
        />
      </div>
    </main>
  )
}
