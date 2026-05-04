export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import DonationForm from './DonationForm'

export default async function CheckoutPenyaluranPage({
  searchParams,
}: {
  searchParams: { campaign?: string; qty?: string; share?: string; animalName?: string; animalPrice?: string }
}) {
  const campaignSlug = searchParams.campaign
  if (!campaignSlug) notFound()

  const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } })
  if (!campaign) notFound()

  const settingsRows = await prisma.settings.findMany({
    where: { key: { in: ['ch_bca','ch_mandiri','ch_bni','ch_bri','ch_qris','manual_transfer_enabled','manual_bank_name','manual_bank_number','manual_bank_owner'] } }
  })
  const settingsMap: Record<string, string> = {}
  settingsRows.forEach(s => { settingsMap[s.key] = s.value })

  const activeChannels = {
    BVAI:      settingsMap.ch_bca !== 'false',
    MANDIRIVA: settingsMap.ch_mandiri !== 'false',
    BNIVA:     settingsMap.ch_bni !== 'false',
    BRIVA:     settingsMap.ch_bri !== 'false',
    QRIS:      settingsMap.ch_qris !== 'false',
    MANUAL:    settingsMap.manual_transfer_enabled === 'true',
  }

  const manualBank = {
    enabled: settingsMap.manual_transfer_enabled === 'true',
    bankName: settingsMap.manual_bank_name ?? 'Bank BCA',
    accountNumber: settingsMap.manual_bank_number ?? '',
    accountOwner: settingsMap.manual_bank_owner ?? 'Yayasan One Ummah',
  }

  const qty = parseInt(searchParams.qty ?? '1') || 1
  const shareType = (searchParams.share === '1/7' ? '1/7' : '1/1') as '1/1' | '1/7'
  // Override price if specific animal was selected from sidebar
  const animalName = searchParams.animalName ? decodeURIComponent(searchParams.animalName) : null
  const animalPrice = searchParams.animalPrice ? parseInt(searchParams.animalPrice) || null : null

  return (
    <main className="pt-28 pb-24 min-h-screen" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE,#F5E6C3)' }}>
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-6 flex-wrap">
          <Link href="/penyaluran" className="hover:text-brand-surface transition-colors">
            Program Penyaluran
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span className="text-brand-text-dark font-medium">Checkout Donasi</span>
        </nav>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 max-w-md">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-brand-text-dark"
              style={{ background: 'linear-gradient(135deg,#F5E6C3,#C8962A)' }}
            >
              1
            </div>
            <span className="text-sm font-semibold text-brand-surface">Data Donatur</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-muted/20 mx-3" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-sm font-medium text-brand-muted">Pembayaran</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-muted/20 mx-3" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-sm font-medium text-brand-muted">Konfirmasi</span>
          </div>
        </div>

        <DonationForm
          campaign={campaign}
          qty={qty}
          shareType={shareType}
          animalName={animalName}
          animalPrice={animalPrice}
          activeChannels={activeChannels}
          manualBank={manualBank}
        />
      </div>
    </main>
  )
}
