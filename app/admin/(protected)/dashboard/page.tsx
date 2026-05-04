export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCartShopping, faClock, faCircleCheck, faCoins,
  faPlus, faListCheck, faGear, faExternalLinkAlt,
  faBell, faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import DashboardChart from './DashboardChart'

async function getDashboardData() {
  const [totalOrders, pendingPayment, paidOrders, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: 'UNPAID', status: { not: 'CANCELLED' } } }),
    prisma.order.count({ where: { paymentStatus: 'PAID' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    }),
  ])

  const omsetResult = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { paymentStatus: 'PAID' },
  })
  const totalOmset = omsetResult._sum.totalAmount ?? 0

  // Last 7 days chart data
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const chartData = await Promise.all(
    days.map(async (day) => {
      const start = new Date(day); start.setHours(0, 0, 0, 0)
      const end = new Date(day); end.setHours(23, 59, 59, 999)
      const [orders, paid] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.order.count({ where: { createdAt: { gte: start, lte: end }, paymentStatus: 'PAID' } }),
      ])
      return {
        label: day.toLocaleDateString('id-ID', { weekday: 'short' }),
        orders,
        paid,
      }
    })
  )

  return { totalOrders, pendingPayment, paidOrders, totalOmset, recentOrders, chartData }
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Menunggu Bayar', cls: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Dikonfirmasi',   cls: 'bg-blue-50 text-blue-700' },
  PREPARING: { label: 'Disiapkan',      cls: 'bg-purple-50 text-purple-700' },
  SHIPPED:   { label: 'Dikirim',        cls: 'bg-violet-50 text-violet-700' },
  DELIVERED: { label: 'Terkirim',       cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Dibatalkan',     cls: 'bg-red-50 text-red-700' },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const { totalOrders, pendingPayment, paidOrders, totalOmset, recentOrders, chartData } =
    await getDashboardData()

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const omsetDisplay = totalOmset >= 1_000_000
    ? `Rp ${(totalOmset / 1_000_000).toFixed(1)}Jt`
    : formatCurrency(totalOmset)

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Ringkasan Dashboard</h1>
          <p className="text-brand-muted text-xs mt-0.5">{today} — Selamat datang kembali 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-full bg-white border border-brand-muted/20 flex items-center justify-center text-brand-muted hover:text-brand-dark shadow-sm">
            <FontAwesomeIcon icon={faBell} className="text-sm" />
            {pendingPayment > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold border-2 border-brand-light">
                {pendingPayment}
              </span>
            )}
          </button>
          <div className="hidden md:flex items-center gap-2 bg-white border border-brand-muted/15 rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center text-xs text-brand-accent font-bold">
              {(session?.user?.name ?? 'A').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-brand-dark">{session?.user?.name ?? 'Admin'}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-brand-muted" />
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-7">

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/produk" className="flex items-center gap-2 px-5 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[10px] shadow-premium hover:scale-[1.02] transition-transform">
            <FontAwesomeIcon icon={faPlus} /> Tambah Produk
          </Link>
          <Link href="/admin/pesanan" className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-dark border border-brand-muted/20 font-bold text-sm rounded-[10px] shadow-sm hover:bg-brand-surface/5">
            <FontAwesomeIcon icon={faListCheck} className="text-brand-muted" /> Lihat Pesanan
          </Link>
          <Link href="/admin/pengaturan" className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-dark border border-brand-muted/20 font-bold text-sm rounded-[10px] shadow-sm hover:bg-brand-surface/5">
            <FontAwesomeIcon icon={faGear} className="text-brand-muted" /> Pengaturan
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-dark border border-brand-muted/20 font-bold text-sm rounded-[10px] shadow-sm hover:bg-brand-surface/5">
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-brand-muted" /> Lihat Website
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: faCartShopping, label: 'Total Pesanan', value: totalOrders.toString(), badge: '+12%', badgeCls: 'bg-brand-accent/20 text-brand-accent', iconBg: 'border-brand-accent/20' },
            { icon: faClock, label: 'Menunggu Bayar', value: pendingPayment.toString(), badge: pendingPayment.toString(), badgeCls: 'bg-amber-400/20 text-amber-300', iconBg: 'border-amber-400/30', iconCls: 'text-amber-400' },
            { icon: faCircleCheck, label: 'Lunas', value: paidOrders.toString(), badge: '+5%', badgeCls: 'bg-emerald-400/20 text-emerald-300', iconBg: 'border-emerald-400/30', iconCls: 'text-emerald-400' },
            { icon: faCoins, label: 'Total Omset', value: omsetDisplay, badge: '+18%', badgeCls: 'bg-brand-accent/20 text-brand-accent', iconBg: 'border-brand-accent/30' },
          ].map(({ icon, label, value, badge, badgeCls, iconBg, iconCls }) => (
            <div key={label} className="bg-brand-surface rounded-[12px] p-5 shadow-premium border border-brand-accent/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-surface-light/20 rounded-full blur-[20px] -mr-8 -mt-8" />
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-[10px] bg-brand-dark/40 border ${iconBg} flex items-center justify-center`}>
                  <FontAwesomeIcon icon={icon} className={`text-base ${iconCls ?? 'text-brand-accent'}`} />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
              </div>
              <div className="relative z-10">
                <p className="text-brand-light/65 text-xs mb-1">{label}</p>
                <div className="font-serif text-3xl font-bold text-brand-light">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Activity feed */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Bar chart (client component) */}
          <div className="xl:col-span-2 bg-white rounded-[12px] p-6 shadow-premium border border-brand-muted/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-serif text-base font-bold text-brand-dark">Pesanan 7 Hari Terakhir</h3>
                <p className="text-xs text-brand-muted mt-0.5">{
                  (() => {
                    const start = new Date(); start.setDate(start.getDate() - 6)
                    return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  })()
                }</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-brand-surface inline-block" />Pesanan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-brand-accent inline-block" />Lunas
                </span>
              </div>
            </div>
            <DashboardChart data={chartData} />
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-[12px] p-5 shadow-premium border border-brand-muted/10">
            <h3 className="font-serif text-base font-bold text-brand-dark mb-4">Aktivitas Terkini</h3>
            <div className="flex flex-col gap-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-surface/10 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCartShopping} className="text-brand-surface text-xs" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-brand-dark">{order.orderNumber}</div>
                    <div className="text-xs text-brand-muted">{order.customerName} · {order.product.name}</div>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-xs text-brand-muted text-center py-4">Belum ada aktivitas</p>
              )}
            </div>
            <Link href="/admin/pesanan" className="block mt-4 text-center text-xs text-brand-surface font-bold hover:text-brand-accent transition-colors">
              Lihat Semua Aktivitas →
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="p-5 border-b border-brand-muted/10 flex justify-between items-center">
            <h3 className="font-serif text-base font-bold text-brand-dark">Pesanan Terbaru</h3>
            <Link href="/admin/pesanan" className="text-brand-surface text-xs font-bold hover:text-brand-accent transition-colors">Lihat Semua →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['ID Pesanan', 'Pelanggan', 'Produk', 'Total', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const st = STATUS_LABELS[order.status] ?? { label: order.status, cls: 'bg-gray-50 text-gray-700' }
                  return (
                    <tr key={order.id} className="border-b border-brand-muted/7 hover:bg-brand-light/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-brand-surface">{order.orderNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-brand-dark">{order.customerName}</td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted">{order.product.name}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-brand-accent">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-[20px] ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href="/admin/pesanan" className="text-brand-surface text-xs font-bold hover:text-brand-accent">Detail</Link>
                      </td>
                    </tr>
                  )
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-brand-muted">Belum ada pesanan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
