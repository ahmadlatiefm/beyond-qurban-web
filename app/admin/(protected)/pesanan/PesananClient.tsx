'use client'
import { useState, useTransition, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faMagnifyingGlass, faFilter, faSort, faDownload, faCircleCheck, faChevronDown, faBell, faPrint, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faCalendar as faCalendarRegular } from '@fortawesome/free-regular-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateOrderStatus, confirmPayment } from '@/lib/actions/orders'
import type { Order, Product } from '@prisma/client'

type OrderWithProduct = Order & { product: Product }
type TabType = 'semua' | 'baru' | 'menunggu' | 'diproses' | 'dikirim' | 'selesai'

const STATUS_OPTIONS = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Dikonfirmasi', PREPARING: 'Disiapkan',
  SHIPPED: 'Dikirim', DELIVERED: 'Selesai', CANCELLED: 'Dibatalkan',
}

const PAYMENT_BADGES: Record<string, { label: string; cls: string }> = {
  UNPAID:   { label: 'Menunggu Bayar', cls: 'bg-amber-500 text-white' },
  PAID:     { label: 'Lunas',          cls: 'bg-emerald-500 text-white' },
  EXPIRED:  { label: 'Kadaluarsa',     cls: 'bg-gray-200 text-gray-600' },
  REFUNDED: { label: 'Refund',         cls: 'bg-red-100 text-red-600' },
}

const ORDER_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',      cls: 'bg-brand-surface/10 text-brand-surface' },
  CONFIRMED: { label: 'Dikonfirmasi', cls: 'bg-blue-50 text-blue-700' },
  PREPARING: { label: 'Disiapkan',    cls: 'bg-purple-50 text-purple-700' },
  SHIPPED:   { label: 'Dikirim',      cls: 'bg-violet-500 text-white' },
  DELIVERED: { label: 'Selesai',      cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Dibatalkan',   cls: 'bg-red-50 text-red-600' },
}

const TABS: { key: TabType; label: string; badgeCls: string }[] = [
  { key: 'semua', label: 'Semua', badgeCls: 'bg-brand-surface text-brand-light' },
  { key: 'baru', label: 'Baru', badgeCls: 'bg-emerald-500 text-white' },
  { key: 'menunggu', label: 'Menunggu Bayar', badgeCls: 'bg-amber-500 text-white' },
  { key: 'diproses', label: 'Diproses', badgeCls: 'bg-brand-muted/20 text-brand-dark' },
  { key: 'dikirim', label: 'Dikirim', badgeCls: 'bg-violet-500 text-white' },
  { key: 'selesai', label: 'Selesai', badgeCls: 'bg-brand-surface text-brand-light' },
]

export default function PesananClient({ initialOrders }: { initialOrders: OrderWithProduct[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [updateMenuId, setUpdateMenuId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    semua: orders.length,
    baru: orders.filter(o => o.status === 'PENDING').length,
    menunggu: orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length,
    diproses: orders.filter(o => o.status === 'PREPARING' || o.status === 'CONFIRMED').length,
    dikirim: orders.filter(o => o.status === 'SHIPPED').length,
    selesai: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders])

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase())
    const matchTab = (() => {
      if (activeTab === 'semua') return true
      if (activeTab === 'baru') return o.status === 'PENDING'
      if (activeTab === 'menunggu') return o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED'
      if (activeTab === 'diproses') return o.status === 'PREPARING' || o.status === 'CONFIRMED'
      if (activeTab === 'dikirim') return o.status === 'SHIPPED'
      if (activeTab === 'selesai') return o.status === 'DELIVERED'
      return true
    })()
    return matchSearch && matchTab
  }), [orders, activeTab, search])

  function handleConfirmPayment(id: string) {
    startTransition(async () => {
      await confirmPayment(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any } : o))
    })
  }

  function handleUpdateStatus(id: string, status: string) {
    setUpdateMenuId(null)
    startTransition(async () => {
      await updateOrderStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
    })
  }

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div className="hidden md:block">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari pesanan, nama, atau nomor..."
              className="pl-9 pr-4 py-2 w-72 rounded-[8px] bg-brand-light border border-brand-muted/20 focus:outline-none focus:border-brand-surface text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative w-9 h-9 rounded-full bg-brand-light border border-brand-muted/20 flex items-center justify-center text-brand-muted hover:text-brand-dark">
            <FontAwesomeIcon icon={faBell} />
            {counts.menunggu > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold border-2 border-brand-light">{counts.menunggu}</span>
            )}
          </button>
          <div className="w-9 h-9 rounded-full bg-brand-surface border-2 border-brand-accent/30 flex items-center justify-center">
            <span className="text-brand-accent-light text-sm font-bold">A</span>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-dark">Manajemen Pesanan</h1>
            <p className="text-brand-muted text-sm mt-1">Kelola dan monitor seluruh pesanan kurban</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-brand-light text-brand-dark border border-brand-muted/20 text-sm font-medium rounded-[8px] hover:bg-brand-surface/5 flex items-center gap-2">
              <FontAwesomeIcon icon={faDownload} className="text-brand-muted" /> Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-brand-muted/20 overflow-x-auto">
          {TABS.map(({ key, label, badgeCls }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`tab-btn pb-3 border-b-2 text-sm whitespace-nowrap px-3 ${activeTab === key ? 'active border-brand-surface text-brand-surface font-semibold' : 'border-transparent text-brand-muted hover:text-brand-dark font-medium'}`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-[20px] text-[11px] font-bold ${badgeCls}`}>{counts[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-brand-light rounded-[12px] border border-brand-muted/20 p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, ID pesanan..."
              className="w-full pl-9 pr-4 py-2 rounded-[8px] bg-white border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-2 bg-white border border-brand-muted/20 text-sm font-medium rounded-[8px] hover:bg-brand-surface/5 flex items-center gap-2 text-brand-dark">
              <FontAwesomeIcon icon={faFilter} className="text-brand-muted" /> Filter
            </button>
            <button className="px-3 py-2 bg-white border border-brand-muted/20 text-sm font-medium rounded-[8px] hover:bg-brand-surface/5 flex items-center gap-2 text-brand-dark">
              <FontAwesomeIcon icon={faSort} className="text-brand-muted" /> Urutkan
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Update pesanan Beyond Qurban')}`}
              target="_blank" rel="noopener noreferrer"
              className="wa-btn"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Kirim WA Massal
            </a>
          </div>
        </div>

        {/* Bulk actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="custom-checkbox" onChange={() => {}} />
            <span className="text-sm font-medium text-brand-dark">Pilih Semua</span>
          </label>
          <button className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium rounded-[8px] flex items-center gap-2 hover:bg-amber-100">
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium rounded-[8px] flex items-center gap-2 hover:bg-emerald-100">
            Update Status
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-[8px] hover:bg-red-100">
            <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
          </button>
        </div>

        {/* Order cards */}
        <div className="flex flex-col gap-5">
          {filtered.map(order => {
            const payBadge = PAYMENT_BADGES[order.paymentStatus] ?? { label: order.paymentStatus, cls: 'bg-gray-100 text-gray-600' }
            const ordBadge = ORDER_BADGES[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
            const isUnpaid = order.paymentStatus === 'UNPAID'
            const waText = encodeURIComponent(`Halo ${order.customerName}, ini konfirmasi pesanan ${order.orderNumber} dari Beyond Qurban.`)

            return (
              <div key={order.id} className={`bg-white rounded-[12px] border ${isUnpaid ? 'border-amber-200' : 'border-brand-muted/15'} shadow-premium p-6`}>
                <div className="flex items-start gap-4">
                  <input type="checkbox" className="custom-checkbox mt-1" />
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-brand-dark">Order <span className="text-brand-surface">{order.orderNumber}</span></h3>
                        <span className={`px-2.5 py-1 rounded-[20px] text-[11px] font-bold ${payBadge.cls}`}>{payBadge.label}</span>
                        <span className={`px-2.5 py-1 rounded-[20px] text-[11px] font-bold ${ordBadge.cls}`}>{ordBadge.label}</span>
                      </div>
                      <div className="font-serif text-xl font-bold text-brand-dark">{formatCurrency(order.totalAmount)}</div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-muted mb-4">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUser} className="text-xs" /> {order.customerName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faWhatsapp} className="text-xs text-[#25D366]" /> +62 {order.whatsapp}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarRegular} className="text-xs" /> {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* Product */}
                    <div className="flex items-start gap-3 p-3 bg-brand-light rounded-[8px] border border-brand-muted/10 mb-4">
                      <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-white border border-brand-muted/20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={order.product.imageUrl} className="w-full h-full object-cover" alt={order.product.name} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-brand-dark">{order.product.name}</div>
                        <div className="text-xs text-brand-muted">{order.product.weight} kg &middot; Qty: {order.quantity}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex flex-wrap gap-2 relative">
                        <a
                          href={`https://wa.me/${order.whatsapp}?text=${waText}`}
                          target="_blank" rel="noopener noreferrer"
                          className="wa-btn"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Kirim WA
                        </a>
                        <a
                          href={`https://wa.me/${order.whatsapp}?text=${encodeURIComponent(`Halo ${order.customerName}, reminder pembayaran pesanan ${order.orderNumber} Anda dari Beyond Qurban.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="wa-followup-btn"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Follow Up WA
                        </a>

                        {/* Update Status */}
                        <div className="relative">
                          <button
                            onClick={() => setUpdateMenuId(updateMenuId === order.id ? null : order.id)}
                            className="px-3 py-1.5 bg-brand-light border border-brand-muted/20 text-brand-dark text-xs font-medium rounded-[8px] flex items-center gap-1.5 hover:bg-brand-surface/5"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Update Status
                            <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
                          </button>
                          {updateMenuId === order.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-brand-muted/20 rounded-[8px] shadow-premium z-10 min-w-[140px] overflow-hidden">
                              {STATUS_OPTIONS.map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateStatus(order.id, s)}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-brand-dark hover:bg-brand-light"
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {isUnpaid && (
                          <button
                            onClick={() => handleConfirmPayment(order.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-[8px] flex items-center gap-1.5 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <FontAwesomeIcon icon={faCircleCheck} /> Konfirmasi Bayar
                          </button>
                        )}
                      </div>
                      <button className="px-4 py-1.5 bg-brand-surface text-brand-light rounded-[8px] text-sm font-bold hover:bg-brand-dark transition-colors">
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-[12px] border border-brand-muted/10 p-12 text-center">
              <p className="text-brand-muted text-sm">Tidak ada pesanan ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
