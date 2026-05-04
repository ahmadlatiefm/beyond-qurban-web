'use client'
import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faXmark, faFloppyDisk, faPlus, faBell } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Donation, Campaign } from '@prisma/client'

type DonationWithCampaign = Donation & { campaign: Campaign }

interface LocationStats {
  total: number; delivered: number; processing: number; nominal: number
}
interface Stats { INDONESIA: LocationStats; AFRICA: LocationStats; PALESTINE: LocationStats }

const DEST_FILTER = ['all', 'INDONESIA', 'AFRICA', 'PALESTINE'] as const
const STATUS_FILTER = ['all', 'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const

function getFlag(location: string) {
  if (location === 'AFRICA') return '🌍'
  if (location === 'PALESTINE') return '🇵🇸'
  return '🇮🇩'
}
function getLocationLabel(location: string) {
  if (location === 'AFRICA') return 'Afrika Sub-Sahara'
  if (location === 'PALESTINE') return 'Palestina'
  return 'Pedalaman Indonesia'
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Diterima', CONFIRMED: 'Dikonfirmasi', PREPARING: 'Diproses',
  SHIPPED: 'Disalurkan', DELIVERED: 'Laporan Dikirim', CANCELLED: 'Dibatalkan',
}
const STATUS_CLS: Record<string, string> = {
  PENDING:   'bg-brand-surface/10 text-brand-surface',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-amber-50 text-amber-700',
  SHIPPED:   'bg-violet-50 text-violet-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
}

export default function PenyaluranAdminClient({ donations, stats }: { donations: DonationWithCampaign[]; stats: Stats }) {
  const [destFilter, setDestFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updateModal, setUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({ orderId: '', status: 'CONFIRMED', link: '', note: '' })

  const filtered = useMemo(() => donations.filter(d => {
    const matchDest = destFilter === 'all' || d.campaign.location === destFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchDest && matchStatus
  }), [donations, destFilter, statusFilter])

  const LOCATION_CARDS = [
    { key: 'INDONESIA', flag: '🇮🇩', name: 'Pedalaman Indonesia', sub: 'Papua · NTT · Kalimantan', borderCls: 'border-brand-muted/10' },
    { key: 'AFRICA', flag: '🌍', name: 'Afrika Sub-Sahara', sub: 'Program Internasional', borderCls: 'border-brand-muted/10' },
    { key: 'PALESTINE', flag: '🇵🇸', name: 'Palestina', sub: '🚨 Prioritas Utama', borderCls: 'border-red-100', subCls: 'text-red-500 font-medium' },
  ]

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Manajemen Penyaluran</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola program qurban penyaluran per destinasi</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setUpdateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-xs rounded-[8px] shadow-premium">
            <FontAwesomeIcon icon={faPlus} /> Update Status
          </button>
          <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">A</div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">

        {/* Stats per location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LOCATION_CARDS.map(({ key, flag, name, sub, borderCls, subCls }) => {
            const s = stats[key as keyof Stats]
            return (
              <div key={key} className={`bg-white rounded-[14px] p-5 shadow-premium border ${borderCls}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{flag}</div>
                  <div>
                    <div className="font-bold text-sm text-brand-dark">{name}</div>
                    <div className={`text-xs ${subCls ?? 'text-brand-muted'}`}>{sub}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Pesanan', value: s.total, cls: 'text-brand-dark' },
                    { label: 'Disalurkan', value: s.delivered, cls: 'text-brand-surface' },
                    { label: 'Diproses', value: s.processing, cls: 'text-amber-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-brand-light rounded-[8px] p-2">
                      <div className={`font-bold text-lg ${cls}`}>{value}</div>
                      <div className="text-xs text-brand-muted">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-brand-muted flex justify-between">
                  <span>Total Nominal</span>
                  <span className="font-bold text-brand-accent">{formatCurrency(s.nominal)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider mr-1">Destinasi:</span>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'INDONESIA', label: '🇮🇩 Indonesia' },
            { key: 'AFRICA', label: '🌍 Afrika' },
            { key: 'PALESTINE', label: '🇵🇸 Palestina' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDestFilter(key)}
              className={`filter-chip${destFilter === key ? ' active' : ''}`}
            >
              {label}
            </button>
          ))}
          <span className="mx-2 text-brand-muted/30">|</span>
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider mr-1">Status:</span>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'PENDING', label: 'Diterima' },
            { key: 'PREPARING', label: 'Diproses' },
            { key: 'SHIPPED', label: 'Disalurkan' },
            { key: 'DELIVERED', label: 'Laporan Dikirim' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`filter-chip${statusFilter === key ? ' active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="p-4 border-b border-brand-muted/10 flex items-center justify-between">
            <span className="text-sm font-medium text-brand-dark"><span className="font-bold">{filtered.length}</span> pesanan penyaluran</span>
            <button className="text-xs text-brand-muted border border-brand-muted/20 px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 hover:bg-brand-light">
              <FontAwesomeIcon icon={faDownload} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['No. Pesanan', 'Pemesan', 'Destinasi', 'Nominal', 'Status', 'Tanggal', 'Follow Up'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className={`border-b border-brand-muted/7 hover:bg-brand-light/40 transition-colors ${i % 2 === 1 ? 'bg-brand-light/20' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-brand-surface">{d.orderNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-dark font-medium">{d.customerName}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-muted">
                      {getFlag(d.campaign.location)} {getLocationLabel(d.campaign.location)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-brand-accent">{formatCurrency(d.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-[20px] ${STATUS_CLS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-brand-muted">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <a
                        href={`https://wa.me/${d.whatsapp}?text=${encodeURIComponent(`Halo ${d.customerName}, update penyaluran qurban Anda (${d.orderNumber}): Status saat ini ${STATUS_LABELS[d.status] ?? d.status}.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#25D366] hover:text-white transition-colors w-fit"
                      >
                        <FontAwesomeIcon icon={faWhatsapp} className="text-sm" /> WA
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-brand-muted">Belum ada data penyaluran</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {updateModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setUpdateModal(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/10">
              <h3 className="font-serif text-lg font-bold text-brand-dark">Update Status Penyaluran</h3>
              <button onClick={() => setUpdateModal(false)} className="text-brand-muted hover:text-brand-dark">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">No. Pesanan</label>
                <input type="text" value={updateForm.orderId} onChange={e => setUpdateForm(f => ({ ...f, orderId: e.target.value }))} className="inp" placeholder="BQ-XXXX-XXXX" />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Status Baru</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))} className="inp" style={{ height: 42 }}>
                  <option value="PENDING">Diterima</option>
                  <option value="CONFIRMED">Dikonfirmasi</option>
                  <option value="PREPARING">Diproses</option>
                  <option value="SHIPPED">Disalurkan</option>
                  <option value="DELIVERED">Laporan Dikirim</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Link Laporan (Opsional)</label>
                <input type="url" value={updateForm.link} onChange={e => setUpdateForm(f => ({ ...f, link: e.target.value }))} className="inp" placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Catatan</label>
                <textarea rows={3} value={updateForm.note} onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))} className="inp" placeholder="Catatan tambahan..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setUpdateModal(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted">Batal</button>
              <button onClick={() => setUpdateModal(false)} className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
