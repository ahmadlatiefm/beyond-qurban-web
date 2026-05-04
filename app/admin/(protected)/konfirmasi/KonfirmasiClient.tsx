'use client'
import { useState, useTransition, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCircleCheck, faCircleXmark, faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { confirmPayment, rejectPayment } from '@/lib/actions/orders'
import type { Order } from '@prisma/client'

type TabType = 'semua' | 'menunggu' | 'dikonfirmasi' | 'ditolak'

interface Stats { total: number; pending: number; confirmed: number; rejected: number }

const STATUS_BADGE: Record<string, string> = {
  UNPAID:   'px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-[20px] border border-amber-200',
  PAID:     'px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-[20px] border border-emerald-200',
  EXPIRED:  'px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-[20px] border border-red-100',
}
const STATUS_LABEL: Record<string, string> = { UNPAID: 'Menunggu', PAID: 'Dikonfirmasi', EXPIRED: 'Ditolak' }

export default function KonfirmasiClient({ initialOrders, stats }: { initialOrders: Order[]; stats: Stats }) {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [previewModal, setPreviewModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null })
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2800)
  }

  const filtered = useMemo(() => orders.filter(o => {
    if (activeTab === 'semua') return true
    if (activeTab === 'menunggu') return o.paymentStatus === 'UNPAID'
    if (activeTab === 'dikonfirmasi') return o.paymentStatus === 'PAID'
    if (activeTab === 'ditolak') return o.paymentStatus === 'EXPIRED'
    return true
  }), [orders, activeTab])

  function handleConfirm(id: string) {
    startTransition(async () => {
      await confirmPayment(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any } : o))
      setPreviewModal({ open: false, order: null })
      showToast('Pembayaran berhasil dikonfirmasi!')
    })
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectPayment(id)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'EXPIRED' as any, status: 'CANCELLED' as any } : o))
      setPreviewModal({ open: false, order: null })
      showToast('Pembayaran ditolak.')
    })
  }

  const liveStats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    confirmed: orders.filter(o => o.paymentStatus === 'PAID').length,
    rejected: orders.filter(o => o.paymentStatus === 'EXPIRED').length,
  }), [orders])

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Konfirmasi Pembayaran</h1>
          <p className="text-brand-muted text-xs mt-0.5">Verifikasi bukti transfer dari pelanggan</p>
        </div>
        <div className="flex items-center gap-3">
          {liveStats.pending > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-[20px]">
              <FontAwesomeIcon icon={faClock} className="text-xs" /> {liveStats.pending} Menunggu
            </div>
          )}
          <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">A</div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-[12px] p-4 shadow-premium border border-brand-muted/10 text-center">
            <div className="font-serif text-2xl font-bold text-brand-dark">{liveStats.total}</div>
            <div className="text-xs text-brand-muted mt-1">Total</div>
          </div>
          <div className="bg-amber-50 rounded-[12px] p-4 shadow-sm border border-amber-200 text-center">
            <div className="font-serif text-2xl font-bold text-amber-700">{liveStats.pending}</div>
            <div className="text-xs text-amber-600 mt-1">Menunggu Verifikasi</div>
          </div>
          <div className="bg-emerald-50 rounded-[12px] p-4 shadow-sm border border-emerald-200 text-center">
            <div className="font-serif text-2xl font-bold text-emerald-700">{liveStats.confirmed}</div>
            <div className="text-xs text-emerald-600 mt-1">Dikonfirmasi</div>
          </div>
          <div className="bg-red-50 rounded-[12px] p-4 shadow-sm border border-red-100 text-center">
            <div className="font-serif text-2xl font-bold text-red-600">{liveStats.rejected}</div>
            <div className="text-xs text-red-500 mt-1">Ditolak</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-brand-muted/15 overflow-x-auto">
          {([
            { key: 'semua' as TabType, label: 'Semua', count: liveStats.total, badgeCls: 'bg-brand-surface text-white' },
            { key: 'menunggu' as TabType, label: 'Menunggu', count: liveStats.pending, badgeCls: 'bg-amber-500 text-white' },
            { key: 'dikonfirmasi' as TabType, label: 'Dikonfirmasi', count: liveStats.confirmed, badgeCls: 'bg-emerald-500 text-white' },
            { key: 'ditolak' as TabType, label: 'Ditolak', count: liveStats.rejected, badgeCls: 'bg-red-500 text-white' },
          ]).map(({ key, label, count, badgeCls }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`tab-btn pb-3 border-b-2 text-sm whitespace-nowrap px-4 ${activeTab === key ? 'active border-brand-surface text-brand-surface font-bold' : 'border-transparent text-brand-muted hover:text-brand-dark font-medium'}`}
            >
              {label}
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${badgeCls}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['No. Pesanan', 'Nama Pelanggan', 'Nominal', 'Metode', 'Tanggal', 'Bukti', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id} className={`border-b border-brand-muted/7 hover:bg-brand-light/40 transition-colors ${i % 2 === 1 ? 'bg-brand-light/20' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-brand-surface">{order.orderNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-dark font-medium">{order.customerName}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-brand-accent">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-muted">{order.paymentMethod ?? 'Transfer Bank'}</td>
                    <td className="px-5 py-3.5 text-xs text-brand-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setPreviewModal({ open: true, order })}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-surface hover:text-brand-accent border border-brand-surface/30 hover:border-brand-accent px-3 py-1.5 rounded-[8px] transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} /> Lihat Bukti
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_BADGE[order.paymentStatus] ?? 'text-xs text-brand-muted'}>
                        {STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {order.paymentStatus === 'UNPAID' && (
                          <>
                            <button onClick={() => handleConfirm(order.id)} disabled={isPending} className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[7px] flex items-center justify-center text-xs disabled:opacity-60">
                              <FontAwesomeIcon icon={faCircleCheck} />
                            </button>
                            <button onClick={() => handleReject(order.id)} disabled={isPending} className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-[7px] flex items-center justify-center text-xs disabled:opacity-60">
                              <FontAwesomeIcon icon={faCircleXmark} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-brand-muted">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview modal — detail bukti pembayaran */}
      {previewModal.open && previewModal.order && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPreviewModal({ open: false, order: null }) }}>
          <div className="bg-white rounded-[16px] w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/10 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-dark">Detail Bukti Pembayaran</h3>
                <p className="text-xs text-brand-muted mt-0.5 font-mono">{previewModal.order.orderNumber}</p>
              </div>
              <button onClick={() => setPreviewModal({ open: false, order: null })} className="text-brand-muted hover:text-brand-dark w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto p-6 flex flex-col gap-5">

              {/* Bukti foto */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Foto Bukti Transfer</div>
                <div className="rounded-[10px] overflow-hidden bg-brand-light border border-brand-muted/15 flex items-center justify-center" style={{ height: 240 }}>
                  {previewModal.order.paymentProofUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewModal.order.paymentProofUrl} className="w-full h-full object-contain" alt="Bukti bayar" />
                  ) : (
                    <div className="text-center text-brand-muted py-10">
                      <FontAwesomeIcon icon={faEye} className="text-5xl mb-3 opacity-20" />
                      <p className="text-sm font-medium">Belum ada bukti bayar diunggah</p>
                      <p className="text-xs mt-1">Pelanggan belum upload bukti transfer</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info pembayaran */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Informasi Pembayaran</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'No. Pesanan', value: previewModal.order.orderNumber },
                    { label: 'Total Bayar', value: formatCurrency(previewModal.order.totalAmount), cls: 'text-brand-accent font-bold' },
                    { label: 'Metode', value: previewModal.order.paymentMethod ?? 'Transfer Bank' },
                    { label: 'Tanggal', value: formatDate(previewModal.order.createdAt) },
                    { label: 'Status Bayar', value: STATUS_LABEL[previewModal.order.paymentStatus] ?? previewModal.order.paymentStatus },
                    { label: 'Ongkir', value: previewModal.order.shippingCost === 0 ? 'Gratis' : formatCurrency(previewModal.order.shippingCost) },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-brand-light rounded-[8px] p-3">
                      <div className="text-xs text-brand-muted mb-1">{label}</div>
                      <div className={`font-bold text-brand-dark text-sm ${cls ?? ''}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info pemesan */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Data Pemesan</div>
                <div className="bg-brand-light rounded-[10px] p-4 flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-surface text-xs w-4">👤</span>
                    <span className="font-semibold text-brand-dark">{previewModal.order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#25D366] text-xs w-4">📱</span>
                    <span className="text-brand-muted">+62 {previewModal.order.whatsapp}</span>
                    <a href={`https://wa.me/${previewModal.order.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#25D366] font-bold hover:underline ml-auto">Chat WA →</a>
                  </div>
                  {previewModal.order.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-surface text-xs w-4 mt-0.5">📍</span>
                      <span className="text-brand-muted text-xs leading-relaxed">{previewModal.order.address}{previewModal.order.city ? `, ${previewModal.order.city}` : ''}</span>
                    </div>
                  )}
                  {previewModal.order.deliveryDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-brand-surface text-xs w-4">📅</span>
                      <span className="text-brand-muted">Jadwal kirim: {formatDate(previewModal.order.deliveryDate)}</span>
                    </div>
                  )}
                  {previewModal.order.notes && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-surface text-xs w-4 mt-0.5">📝</span>
                      <span className="text-brand-muted text-xs italic">{previewModal.order.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {previewModal.order.paymentStatus === 'UNPAID' && (
              <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-brand-muted/10 pt-4">
                <button onClick={() => handleConfirm(previewModal.order!.id)} disabled={isPending} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-[10px] hover:bg-emerald-600 flex items-center justify-center gap-2 disabled:opacity-60">
                  <FontAwesomeIcon icon={faCircleCheck} /> Konfirmasi Pembayaran
                </button>
                <button onClick={() => handleReject(previewModal.order!.id)} disabled={isPending} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-[10px] hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
                  <FontAwesomeIcon icon={faCircleXmark} /> Tolak
                </button>
              </div>
            )}
            {previewModal.order.paymentStatus !== 'UNPAID' && (
              <div className="px-6 pb-6 shrink-0">
                <div className={`w-full py-3 font-bold rounded-[10px] flex items-center justify-center gap-2 text-sm ${previewModal.order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  <FontAwesomeIcon icon={previewModal.order.paymentStatus === 'PAID' ? faCircleCheck : faCircleXmark} />
                  {previewModal.order.paymentStatus === 'PAID' ? 'Pembayaran telah dikonfirmasi' : 'Pembayaran ditolak'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <FontAwesomeIcon icon={faCircleCheck} className="text-brand-accent" />
        {toast.msg}
      </div>
    </>
  )
}
