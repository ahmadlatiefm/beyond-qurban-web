'use client'
import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faMagnifyingGlass, faFilter, faSort, faDownload, faCircleCheck, faChevronDown, faBell, faPrint, faTrashCan, faTrash, faXmark, faLocationDot, faBoxOpen, faCreditCard, faReceipt, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faCalendar as faCalendarRegular } from '@fortawesome/free-regular-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateOrderStatus, confirmPayment, deleteOrders } from '@/lib/actions/orders'
import { useAppToast } from '@/components/ui/AppToast'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import { StatusDropdown } from '@/components/admin/StatusDropdown'
import KonfirmasiBayarModal from '@/components/admin/KonfirmasiBayarModal'
import type { Order, Product } from '@prisma/client'

type OrderWithProduct = Order & { product: Product }
type TabType = 'semua' | 'baru' | 'menunggu' | 'diproses' | 'dikirim' | 'selesai'
type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'status'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_desc',  label: 'Tanggal: Terbaru' },
  { key: 'date_asc',   label: 'Tanggal: Terlama' },
  { key: 'total_desc', label: 'Total: Terbesar' },
  { key: 'total_asc',  label: 'Total: Terkecil' },
  { key: 'status',     label: 'Status Pesanan' },
]

const STATUS_OPTIONS = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Menunggu Bayar',
  CONFIRMED: 'Dikonfirmasi',
  PREPARING: 'Hewan Disiapkan',
  SHIPPED:   'Dikirim',
  DELIVERED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

const PAYMENT_BADGES: Record<string, { label: string; cls: string }> = {
  UNPAID:   { label: 'Menunggu Bayar', cls: 'bg-amber-500 text-white' },
  PAID:     { label: 'Lunas',          cls: 'bg-emerald-500 text-white' },
  DP:       { label: 'DP',             cls: 'bg-blue-500 text-white' },
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

function waNumber(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^62/, '').replace(/^0/, '')
  return `62${digits}`
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

const TABS: { key: TabType; label: string; badgeCls: string }[] = [
  { key: 'semua', label: 'Semua', badgeCls: 'bg-brand-surface text-brand-light' },
  { key: 'baru', label: 'Baru', badgeCls: 'bg-emerald-500 text-white' },
  { key: 'menunggu', label: 'Menunggu Bayar', badgeCls: 'bg-amber-500 text-white' },
  { key: 'diproses', label: 'Diproses', badgeCls: 'bg-brand-muted/20 text-brand-dark' },
  { key: 'dikirim', label: 'Dikirim', badgeCls: 'bg-violet-500 text-white' },
  { key: 'selesai', label: 'Selesai', badgeCls: 'bg-brand-surface text-brand-light' },
]

export default function PesananClient({ initialOrders, followupTemplate }: { initialOrders: OrderWithProduct[]; followupTemplate: string }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const appToast = useAppToast()
  const [detailOrder, setDetailOrder] = useState<OrderWithProduct | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortKey>('date_desc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [konfirmasiTarget, setKonfirmasiTarget] = useState<OrderWithProduct | null>(null)

  // Sync local state when server component re-fetches (after router.refresh)
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const counts = useMemo(() => ({
    semua: orders.length,
    baru: orders.filter(o => o.status === 'PENDING').length,
    menunggu: orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length,
    diproses: orders.filter(o => o.status === 'PREPARING' || o.status === 'CONFIRMED').length,
    dikirim: orders.filter(o => o.status === 'SHIPPED').length,
    selesai: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders])

  const filtered = useMemo(() => {
    const list = orders.filter(o => {
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
    })
    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':  return +new Date(b.createdAt) - +new Date(a.createdAt)
        case 'date_asc':   return +new Date(a.createdAt) - +new Date(b.createdAt)
        case 'total_desc': return b.totalAmount - a.totalAmount
        case 'total_asc':  return a.totalAmount - b.totalAmount
        case 'status':     return a.status.localeCompare(b.status)
      }
    })
    return sorted
  }, [orders, activeTab, search, sortBy])

  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(prev => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        filtered.forEach(o => next.delete(o.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach(o => next.add(o.id))
      return next
    })
  }

  function handleConfirmPayment(id: string) {
    startTransition(async () => {
      await confirmPayment(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any } : o))
      router.refresh()
    })
  }

  function handleKonfirmasiSuccess(id: string, linkForm: string | null) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any, sisaPembayaran: 0 } : o))
    setKonfirmasiTarget(null)
    appToast.success(
      linkForm
        ? 'Lunas! Link form pengiriman dikirim ke WA konsumen'
        : 'Lunas! Status pesanan diperbarui',
    )
    router.refresh()
  }

  function handleUpdateStatus(id: string, status: string) {
    startTransition(async () => {
      await updateOrderStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
      router.refresh()
    })
  }

  function handleExport() {
    const headers = ['No Order', 'Nama', 'WhatsApp', 'Alamat', 'Kota', 'Produk', 'Qty', 'Total', 'Status Bayar', 'Status Pesanan', 'Tanggal']
    const escape = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filtered.map(o => [
      o.orderNumber,
      o.customerName,
      `+62${o.whatsapp}`,
      o.address ?? '',
      o.city ?? '',
      o.product.name,
      o.quantity,
      o.totalAmount,
      PAYMENT_BADGES[o.paymentStatus]?.label ?? o.paymentStatus,
      ORDER_BADGES[o.status]?.label ?? o.status,
      new Date(o.createdAt).toISOString(),
    ].map(escape).join(','))
    const csv = '﻿' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pesanan-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const target = selected.size > 0 ? filtered.filter(o => selected.has(o.id)) : filtered
    if (target.length === 0) {
      appToast.warning('Tidak ada pesanan untuk dicetak')
      return
    }
    const w = window.open('', '_blank', 'width=1000,height=800')
    if (!w) { appToast.error('Popup diblokir browser. Izinkan popup untuk mencetak.'); return }
    const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
    const rowsHtml = target.map(o => `
      <tr>
        <td>${escapeHtml(o.orderNumber)}</td>
        <td>${escapeHtml(o.customerName)}<br/><span class="muted">+62${escapeHtml(o.whatsapp)}</span></td>
        <td>${escapeHtml(o.product.name)}<br/><span class="muted">Qty ${o.quantity}</span></td>
        <td class="num">${formatCurrency(o.totalAmount)}</td>
        <td>${escapeHtml(PAYMENT_BADGES[o.paymentStatus]?.label ?? o.paymentStatus)}</td>
        <td>${escapeHtml(ORDER_BADGES[o.status]?.label ?? o.status)}</td>
        <td>${escapeHtml(formatDate(o.createdAt))}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pesanan Beyond Qurban</title>
<style>
  body { font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .muted { color: #888; font-size: 11px; }
  .num { text-align: right; white-space: nowrap; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>Daftar Pesanan — Beyond Qurban</h1>
<div class="meta">Dicetak ${new Date().toLocaleString('id-ID')} · ${target.length} pesanan</div>
<table>
  <thead><tr><th>No Order</th><th>Pemesan</th><th>Produk</th><th>Total</th><th>Bayar</th><th>Status</th><th>Tanggal</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
</body></html>`
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch {} }, 350)
  }

  function handleBulkDelete() {
    if (selected.size === 0) {
      appToast.warning('Pilih minimal 1 pesanan untuk dihapus')
      return
    }
    setDeleteModalOpen(true)
  }

  function confirmBulkDelete() {
    const ids = Array.from(selected)
    startTransition(async () => {
      await deleteOrders(ids)
      setOrders(prev => prev.filter(o => !ids.includes(o.id)))
      setSelected(new Set())
      setDeleteModalOpen(false)
      router.refresh()
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
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
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
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="px-4 py-2 bg-brand-light text-brand-dark border border-brand-muted/20 text-sm font-medium rounded-[8px] hover:bg-brand-surface/5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
            <div className="relative">
              <button
                onClick={() => setSortMenuOpen(o => !o)}
                onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
                className="px-3 py-2 bg-white border border-brand-muted/20 text-sm font-medium rounded-[8px] hover:bg-brand-surface/5 flex items-center gap-2 text-brand-dark"
              >
                <FontAwesomeIcon icon={faSort} className="text-brand-muted" /> Urutkan
                <FontAwesomeIcon icon={faChevronDown} className="text-[9px] text-brand-muted" />
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-brand-muted/20 rounded-[8px] shadow-premium z-20 min-w-[200px] overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setSortBy(opt.key); setSortMenuOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-brand-light ${sortBy === opt.key ? 'text-brand-surface bg-brand-surface/5' : 'text-brand-dark'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
            />
            <span className="text-sm font-medium text-brand-dark">
              Pilih Semua{selected.size > 0 ? ` (${selected.size})` : ''}
            </span>
          </label>
          <button
            onClick={handlePrint}
            disabled={filtered.length === 0}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium rounded-[8px] flex items-center gap-2 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={selected.size > 0 ? `Print ${selected.size} terpilih` : 'Print semua yang tampil'}
          >
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selected.size === 0 || isPending}
            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-[8px] hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title={selected.size > 0 ? `Hapus ${selected.size} terpilih` : 'Pilih dulu pesanan untuk dihapus'}
          >
            <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
          </button>
        </div>

        {/* Order cards */}
        <div className="flex flex-col gap-5">
          {filtered.map(order => {
            const payBadge = PAYMENT_BADGES[order.paymentStatus] ?? { label: order.paymentStatus, cls: 'bg-gray-100 text-gray-600' }
            const ordBadge = ORDER_BADGES[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
            const isUnpaid = order.paymentStatus === 'UNPAID'
            const showKonfirmasi = order.paymentStatus === 'UNPAID' || order.paymentStatus === 'DP'
            const waText = encodeURIComponent(`Halo ${order.customerName}, ini konfirmasi pesanan ${order.orderNumber} dari Beyond Qurban.`)

            return (
              <div key={order.id} className={`bg-white rounded-[12px] border ${isUnpaid ? 'border-amber-200' : 'border-brand-muted/15'} shadow-premium p-6`}>
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    className="custom-checkbox mt-1"
                    checked={selected.has(order.id)}
                    onChange={() => toggleSelect(order.id)}
                  />
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
                          href={`https://wa.me/${waNumber(order.whatsapp)}?text=${waText}`}
                          target="_blank" rel="noopener noreferrer"
                          className="wa-btn"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Kirim WA
                        </a>
                        <a
                          href={`https://wa.me/${waNumber(order.whatsapp)}?text=${encodeURIComponent(renderTemplate(followupTemplate, {
                            nama: order.customerName,
                            nomor_pesanan: order.orderNumber,
                            total: formatCurrency(order.totalAmount),
                          }))}`}
                          target="_blank" rel="noopener noreferrer"
                          className="wa-followup-btn"
                          title="Follow Up Manual via WhatsApp"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Follow Up WA
                        </a>

                        {/* Update Status */}
                        <StatusDropdown
                          value={order.status}
                          align="left"
                          minWidth={160}
                          onChange={s => handleUpdateStatus(order.id, s)}
                          options={STATUS_OPTIONS.map(s => ({
                            value: s,
                            label: STATUS_LABELS[s] ?? s,
                            dotClass:
                              s === 'PENDING'   ? 'bg-amber-400' :
                              s === 'CONFIRMED' ? 'bg-blue-500' :
                              s === 'PREPARING' ? 'bg-purple-500' :
                              s === 'SHIPPED'   ? 'bg-violet-500' :
                              s === 'DELIVERED' ? 'bg-emerald-500' :
                              s === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-400',
                          }))}
                          buttonContent={
                            <>
                              <span className={`w-2 h-2 rounded-full inline-block ${
                                order.status === 'PENDING'   ? 'bg-amber-400' :
                                order.status === 'CONFIRMED' ? 'bg-blue-500' :
                                order.status === 'PREPARING' ? 'bg-purple-500' :
                                order.status === 'SHIPPED'   ? 'bg-violet-500' :
                                order.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`} />
                              {STATUS_LABELS[order.status] ?? 'Status'}
                              <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
                            </>
                          }
                        />

                        {showKonfirmasi && (
                          <button
                            onClick={() => setKonfirmasiTarget(order)}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-[8px] flex items-center gap-1.5 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <FontAwesomeIcon icon={faCircleCheck} /> Konfirmasi Bayar
                          </button>
                        )}
                        <a
                          href={`/api/admin/sertifikat/pembelian/${order.id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-[8px] flex items-center gap-1.5 hover:bg-amber-100"
                          title="Generate sertifikat pembelian (PDF)"
                        >
                          <FontAwesomeIcon icon={faFilePdf} /> Sertifikat
                        </a>
                      </div>
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="px-4 py-1.5 bg-brand-surface text-brand-light rounded-[8px] text-sm font-bold hover:bg-brand-dark transition-colors"
                      >
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

      {/* ===== MODAL DETAIL PESANAN ===== */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDetailOrder(null) }}
        >
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/15 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-dark">Detail Pesanan</h2>
                <p className="text-xs text-brand-muted mt-0.5">Order #{detailOrder.orderNumber}</p>
              </div>
              <button onClick={() => setDetailOrder(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-light text-brand-muted hover:text-brand-dark transition-colors">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1.5 rounded-[20px] text-xs font-bold ${PAYMENT_BADGES[detailOrder.paymentStatus]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                  {PAYMENT_BADGES[detailOrder.paymentStatus]?.label ?? detailOrder.paymentStatus}
                </span>
                <span className={`px-3 py-1.5 rounded-[20px] text-xs font-bold ${ORDER_BADGES[detailOrder.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                  {ORDER_BADGES[detailOrder.status]?.label ?? detailOrder.status}
                </span>
                <span className="ml-auto font-serif text-xl font-bold text-brand-dark">{formatCurrency(detailOrder.totalAmount)}</span>
              </div>

              {/* Info Pemesan */}
              <div className="bg-brand-light rounded-[10px] p-4">
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} /> Info Pemesan
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-brand-muted text-xs">Nama</span><p className="font-semibold text-brand-dark mt-0.5">{detailOrder.customerName}</p></div>
                  <div><span className="text-brand-muted text-xs">WhatsApp</span><p className="font-semibold text-brand-dark mt-0.5">+62 {detailOrder.whatsapp}</p></div>
                  <div><span className="text-brand-muted text-xs">Tanggal Pesan</span><p className="font-semibold text-brand-dark mt-0.5">{formatDate(detailOrder.createdAt)}</p></div>
                  {detailOrder.deliveryDate && (
                    <div><span className="text-brand-muted text-xs">Jadwal Kirim</span><p className="font-semibold text-brand-dark mt-0.5">{formatDate(detailOrder.deliveryDate)}</p></div>
                  )}
                </div>
              </div>

              {/* Alamat Pengiriman */}
              {detailOrder.address && (
                <div className="bg-brand-light rounded-[10px] p-4">
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} /> Alamat Pengiriman
                  </h3>
                  <p className="text-sm text-brand-dark">{detailOrder.address}</p>
                  {detailOrder.city && <p className="text-sm text-brand-muted mt-1">{detailOrder.city}</p>}
                </div>
              )}

              {/* Produk */}
              <div className="bg-brand-light rounded-[10px] p-4">
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBoxOpen} /> Hewan Kurban
                </h3>
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detailOrder.product.imageUrl} className="w-16 h-16 rounded-[8px] object-cover border border-brand-muted/10" alt={detailOrder.product.name} />
                  <div>
                    <div className="font-bold text-brand-dark text-sm">{detailOrder.product.name}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{detailOrder.product.weight} kg · Qty: {detailOrder.quantity}</div>
                    <div className="font-bold text-brand-accent mt-2">{formatCurrency(detailOrder.product.price)}</div>
                  </div>
                </div>
              </div>

              {/* Pembayaran */}
              <div className="bg-brand-light rounded-[10px] p-4">
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCreditCard} /> Pembayaran
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-brand-muted text-xs">Metode</span><p className="font-semibold text-brand-dark mt-0.5">{detailOrder.paymentMethod ?? '-'}</p></div>
                  <div><span className="text-brand-muted text-xs">Status</span><p className="font-semibold text-brand-dark mt-0.5">{PAYMENT_BADGES[detailOrder.paymentStatus]?.label ?? detailOrder.paymentStatus}</p></div>
                  {detailOrder.tripayReference && (
                    <div><span className="text-brand-muted text-xs">Kode Bayar</span><p className="font-mono font-bold text-brand-dark mt-0.5">{detailOrder.tripayReference}</p></div>
                  )}
                  <div><span className="text-brand-muted text-xs">Total</span><p className="font-serif font-bold text-brand-accent mt-0.5">{formatCurrency(detailOrder.totalAmount)}</p></div>
                </div>
                {/* Bukti Pembayaran */}
                {detailOrder.paymentProofUrl && (
                  <div className="mt-3 pt-3 border-t border-brand-muted/15">
                    <span className="text-brand-muted text-xs block mb-2">Bukti Pembayaran</span>
                    <a href={detailOrder.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                      className="block group" title="Klik untuk lihat ukuran penuh">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={detailOrder.paymentProofUrl}
                        alt="Bukti pembayaran"
                        className="w-full max-h-72 object-contain rounded-[10px] border border-brand-muted/20 bg-brand-light group-hover:border-brand-surface/50 transition-colors"
                      />
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-surface font-semibold group-hover:underline">
                        <FontAwesomeIcon icon={faReceipt} /> Buka ukuran penuh
                      </span>
                    </a>
                  </div>
                )}
              </div>

              {/* Catatan */}
              {detailOrder.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Catatan</h3>
                  <p className="text-sm text-amber-900">{detailOrder.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <a
                  href={`https://wa.me/${detailOrder.whatsapp}?text=${encodeURIComponent(`Halo ${detailOrder.customerName}, ini konfirmasi pesanan ${detailOrder.orderNumber} dari Beyond Qurban.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="wa-btn flex-1 justify-center"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-base" /> Hubungi via WA
                </a>
                <button onClick={() => setDetailOrder(null)}
                  className="px-6 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {konfirmasiTarget && (
        <KonfirmasiBayarModal
          kind="order"
          id={konfirmasiTarget.id}
          customerName={konfirmasiTarget.customerName}
          totalAmount={konfirmasiTarget.totalAmount}
          sisaPembayaran={konfirmasiTarget.sisaPembayaran ?? null}
          jumlahDP={konfirmasiTarget.jumlahDP ?? null}
          onClose={() => setKonfirmasiTarget(null)}
          onSuccess={handleKonfirmasiSuccess}
        />
      )}

      {/* Bulk Delete Confirm Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteModalOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Hapus Pesanan?</h3>
            <p className="text-brand-muted text-sm mb-6">
              {selected.size === 1
                ? 'Pesanan ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.'
                : <>
                    <strong className="text-brand-dark">{selected.size}</strong> pesanan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                  </>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={confirmBulkDelete} disabled={isPending} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px] hover:bg-red-600 transition-colors disabled:opacity-60">
                {isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
