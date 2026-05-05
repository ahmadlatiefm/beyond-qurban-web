export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import CheckoutForm from './CheckoutForm'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { slug?: string }
}) {
  const slug = searchParams.slug
  if (!slug) notFound()

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) notFound()

  const [settings] = await Promise.all([
    prisma.settings.findMany({
      where: { key: { in: ['ch_bca','ch_mandiri','ch_bni','ch_bri','ch_qris','ch_shopeepay','manual_transfer_enabled','manual_banks'] } }
    })
  ])
  const settingsMap: Record<string, string> = {}
  settings.forEach(s => { settingsMap[s.key] = s.value })

  const activeChannels = {
    BVAI:      settingsMap.ch_bca !== 'false',
    MANDIRIVA: settingsMap.ch_mandiri !== 'false',
    BNIVA:     settingsMap.ch_bni !== 'false',
    BRIVA:     settingsMap.ch_bri !== 'false',
    QRIS:      settingsMap.ch_qris !== 'false',
    MANUAL:    settingsMap.manual_transfer_enabled === 'true',
  }

  // Parse multi-bank JSON
  const manualBanksRaw = settingsMap.manual_banks ?? '[]'
  let manualBanksList: {id:string;code:string;name:string;number:string;owner:string}[] = []
  try { manualBanksList = JSON.parse(manualBanksRaw) } catch {}

  const manualBank = {
    enabled: settingsMap.manual_transfer_enabled === 'true' && manualBanksList.length > 0,
    banks: manualBanksList,
    // backward compat: primary bank = first in list
    bankName: manualBanksList[0]?.name ?? 'Bank BCA',
    accountNumber: manualBanksList[0]?.number ?? '',
    accountOwner: manualBanksList[0]?.owner ?? 'Yayasan One Ummah',
  }

  return (
    <main className="pt-32 pb-24 min-h-screen bg-soft-gradient max-w-[1440px] mx-auto px-6 md:px-12">
      <nav className="flex items-center gap-2 text-sm text-brand-muted mb-8">
        <Link href="/" className="hover:text-brand-surface">Beranda</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <Link href="/katalog" className="hover:text-brand-surface">Katalog</Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        <span className="text-brand-text-dark font-medium">Checkout Pemesanan</span>
      </nav>

      <div className="flex items-center gap-0 mb-10 max-w-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-surface text-brand-light flex items-center justify-center text-sm font-bold">1</div>
          <span className="text-sm font-semibold text-brand-surface">Form Pesanan</span>
        </div>
        <div className="flex-1 h-0.5 bg-brand-muted/20 mx-4" />
        <div className="flex items-center gap-2 opacity-40">
          <div className="w-8 h-8 rounded-full bg-brand-muted/20 text-brand-muted flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-sm font-medium text-brand-muted">Detail Pembayaran</span>
        </div>
      </div>

      <CheckoutForm product={product} activeChannels={activeChannels} manualBank={manualBank} />
    </main>
  )
}
