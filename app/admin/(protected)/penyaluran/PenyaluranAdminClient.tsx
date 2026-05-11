'use client'
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload, faXmark, faFloppyDisk, faPlus, faEye,
  faChevronDown, faReceipt, faCircleCheck, faTrash, faSort, faAward, faCamera,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateDonationStatus, confirmDonationPayment, deleteDonations } from '@/lib/actions/donations'
import { useAppToast } from '@/components/ui/AppToast'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import { StatusDropdown } from '@/components/admin/StatusDropdown'
import KonfirmasiBayarModal from '@/components/admin/KonfirmasiBayarModal'
import type { Donation, Campaign } from '@prisma/client'

type DonationWithCampaign = Donation & { campaign: Campaign }

function waNumber(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^62/, '').replace(/^0/, '')
  return `62${digits}`
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

function donationAtasNama(d: { qurbanNames?: string | null; qurbanName?: string | null; customerName: string }): string {
  if (d.qurbanNames) {
    try {
      const arr = JSON.parse(d.qurbanNames) as string[]
      if (Array.isArray(arr) && arr.length > 0) return arr.join(', ')
    } catch {}
  }
  return d.qurbanName || d.customerName
}

interface LocationStats {
  total: number; delivered: number; processing: number; nominal: number
}
interface Stats { INDONESIA: LocationStats; AFRICA: LocationStats; PALESTINE: LocationStats }

const DEST_FILTER = ['all', 'INDONESIA', 'AFRICA', 'PALESTINE'] as const
const STATUS_FILTER = ['all', 'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const
const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'status'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_desc',  label: 'Tanggal: Terbaru' },
  { key: 'date_asc',   label: 'Tanggal: Terlama' },
  { key: 'total_desc', label: 'Nominal: Terbesar' },
  { key: 'total_asc',  label: 'Nominal: Terkecil' },
  { key: 'status',     label: 'Status Pesanan' },
]

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

export default function PenyaluranAdminClient({ donations: initialDonations, stats, followupTemplate }: { donations: DonationWithCampaign[]; stats: Stats; followupTemplate: string }) {
  const router = useRouter()
  const [donations, setDonations] = useState<DonationWithCampaign[]>(initialDonations)
  const [destFilter, setDestFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('date_desc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [updateModal, setUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({ orderId: '', status: 'CONFIRMED', link: '', note: '' })
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [detailModal, setDetailModal] = useState<DonationWithCampaign | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [konfirmasiTarget, setKonfirmasiTarget] = useState<DonationWithCampaign | null>(null)
  const [isPending, startTransition] = useTransition()
  const appToast = useAppToast()

  const filtered = useMemo(() => {
    const list = donations.filter(d => {
      const matchDest = destFilter === 'all' || d.campaign.location === destFilter
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchDest && matchStatus
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
  }, [donations, destFilter, statusFilter, sortBy])

  const allFilteredSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))

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
        filtered.forEach(d => next.delete(d.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach(d => next.add(d.id))
      return next
    })
  }

  function openBulkDeleteModal() {
    if (selected.size === 0) {
      appToast.warning('Pilih minimal 1 donasi untuk dihapus')
      return
    }
    setBulkDeleteModal(true)
  }

  function handleBulkDelete() {
    const ids = Array.from(selected)
    startTransition(async () => {
      try {
        const res = await deleteDonations(ids)
        if (res && res.success === false) {
          setBulkDeleteModal(false)
          appToast.error(res.error || 'Gagal menghapus donasi.')
          return
        }
        setDonations(prev => prev.filter(d => !ids.includes(d.id)))
        setSelected(new Set())
        setBulkDeleteModal(false)
        appToast.success(`${res?.count ?? ids.length} donasi berhasil dihapus.`)
        router.refresh()
      } catch (err) {
        console.error('[handleBulkDelete] error:', err)
        setBulkDeleteModal(false)
        appToast.error('Terjadi kesalahan. Silakan coba lagi.')
      }
    })
  }

  function handleUpdateStatus(id: string, status: string) {
    startTransition(async () => {
      await updateDonationStatus(id, status)
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: status as any } : d))
      setDetailModal(prev => prev && prev.id === id ? { ...prev, status: status as any } : prev)
      router.refresh()
    })
  }

  function handleSubmitUpdateModal() {
    const orderNumber = updateForm.orderId.trim()
    if (!orderNumber) { setUpdateError('Masukkan No. Pesanan'); return }
    const target = donations.find(d => d.orderNumber === orderNumber)
    if (!target) { setUpdateError(`Pesanan ${orderNumber} tidak ditemukan`); return }
    setUpdateError(null)
    handleUpdateStatus(target.id, updateForm.status)
    setUpdateModal(false)
    setUpdateForm({ orderId: '', status: 'CONFIRMED', link: '', note: '' })
  }

  function handleConfirmDonationPayment(id: string) {
    startTransition(async () => {
      await confirmDonationPayment(id)
      setDonations(prev => prev.map(d => d.id === id
        ? { ...d, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any }
        : d
      ))
      setDetailModal(prev => prev && prev.id === id
        ? { ...prev, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any }
        : prev
      )
      router.refresh()
    })
  }

  function handleKonfirmasiSuccess(id: string, linkForm: string | null) {
    setDonations(prev => prev.map(d => d.id === id
      ? { ...d, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any, sisaPembayaran: 0 }
      : d
    ))
    setDetailModal(prev => prev && prev.id === id
      ? { ...prev, paymentStatus: 'PAID' as any, status: 'CONFIRMED' as any, sisaPembayaran: 0 }
      : prev
    )
    setKonfirmasiTarget(null)
    appToast.success(
      linkForm
        ? 'Lunas! Link form pengiriman dikirim ke WA donatur'
        : 'Lunas! Status donasi diperbarui',
    )
    router.refresh()
  }

  function handleExport() {
    if (filtered.length === 0) {
      appToast.warning('Tidak ada donasi untuk diekspor')
      return
    }
    const headers = ['No Order', 'Nama Donatur', 'WA', 'Campaign', 'Hewan', 'Atas Nama Qurban', 'Qty', 'Total', 'Status', 'Tanggal']
    const escape = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    function formatQurbanNames(d: DonationWithCampaign): string {
      if (d.qurbanNames) {
        try {
          const arr = JSON.parse(d.qurbanNames) as string[]
          const filtered = arr.filter(n => !!(n && n.trim()))
          if (filtered.length) return filtered.join(' | ')
        } catch {}
      }
      return d.qurbanName || d.customerName
    }
    const rows = filtered.map(d => [
      d.orderNumber,
      d.customerName,
      `+62${d.whatsapp}`,
      d.campaign.title,
      d.campaign.animalType,
      formatQurbanNames(d),
      d.quantity,
      d.totalAmount,
      STATUS_LABELS[d.status] ?? d.status,
      new Date(d.createdAt).toISOString(),
    ].map(escape).join(','))
    const csv = '﻿' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `penyaluran-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-dark border border-brand-muted/20 font-medium text-xs rounded-[8px] hover:bg-brand-surface/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faDownload} className="text-brand-muted" /> Export
          </button>
          <button onClick={() => setUpdateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-xs rounded-[8px] shadow-premium">
            <FontAwesomeIcon icon={faPlus} /> Update Status
          </button>
          <AdminNotifBell />
          <AdminProfileMenu />
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
          <div className="p-4 border-b border-brand-muted/10 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium text-brand-dark">
              <span className="font-bold">{filtered.length}</span> pesanan penyaluran
              {selected.size > 0 && <> · <span className="text-brand-surface font-bold">{selected.size}</span> dipilih</>}
            </span>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  onClick={openBulkDeleteModal}
                  disabled={isPending}
                  className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  <FontAwesomeIcon icon={faTrash} /> Hapus Terpilih ({selected.size})
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setSortMenuOpen(o => !o)}
                  onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
                  className="text-xs text-brand-dark border border-brand-muted/20 px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 hover:bg-brand-light"
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
              <button
                onClick={handleExport}
                disabled={filtered.length === 0}
                className="text-xs text-brand-muted border border-brand-muted/20 px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faDownload} /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-brand-muted/30 cursor-pointer"
                      aria-label="Pilih semua"
                    />
                  </th>
                  {['No. Pesanan', 'Pemesan', 'Destinasi', 'Nominal', 'Status', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className={`border-b border-brand-muted/7 hover:bg-brand-light/40 transition-colors ${selected.has(d.id) ? 'bg-brand-surface/5' : i % 2 === 1 ? 'bg-brand-light/20' : ''}`}>
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                        className="w-4 h-4 rounded border-brand-muted/30 cursor-pointer"
                        aria-label={`Pilih ${d.orderNumber}`}
                      />
                    </td>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setDetailModal(d)}
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-surface hover:text-brand-accent border border-brand-surface/30 hover:border-brand-accent px-3 py-1.5 rounded-[8px] transition-colors"
                        >
                          <FontAwesomeIcon icon={faEye} /> Detail
                        </button>

                        {/* Update Status dropdown */}
                        <StatusDropdown
                          value={d.status}
                          align="right"
                          minWidth={170}
                          disabled={isPending}
                          onChange={s => handleUpdateStatus(d.id, s)}
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
                                d.status === 'PENDING'   ? 'bg-amber-400' :
                                d.status === 'CONFIRMED' ? 'bg-blue-500' :
                                d.status === 'PREPARING' ? 'bg-purple-500' :
                                d.status === 'SHIPPED'   ? 'bg-violet-500' :
                                d.status === 'DELIVERED' ? 'bg-emerald-500' :
                                d.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              {STATUS_LABELS[d.status] ?? 'Status'}
                              <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
                            </>
                          }
                        />

                        <a
                          href={`https://wa.me/${waNumber(d.whatsapp)}?text=${encodeURIComponent(renderTemplate(followupTemplate, {
                            nama: d.customerName,
                            nomor_pesanan: d.orderNumber,
                            campaign: d.campaign.title,
                            hewan: d.campaign.animalType,
                            atas_nama: donationAtasNama(d),
                            total: formatCurrency(d.totalAmount),
                          }))}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-[#25D366] border border-[#25D366]/30 px-2.5 py-1.5 rounded-[8px] hover:bg-[#25D366] hover:text-white transition-colors"
                          title="Follow Up Manual via WhatsApp"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-sm" /> WA
                        </a>
                        {(d.paymentStatus === 'UNPAID' || d.paymentStatus === 'DP') && (
                          <button
                            onClick={() => setKonfirmasiTarget(d)}
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-[8px] hover:bg-emerald-500 hover:text-white transition-colors"
                            title="Konfirmasi pembayaran offline"
                          >
                            <FontAwesomeIcon icon={faCircleCheck} className="text-sm" /> Konfirmasi Bayar
                          </button>
                        )}
                        {(() => {
                          const eligible = d.paymentStatus === 'PAID' || ['CONFIRMED','PREPARING','SHIPPED','DELIVERED'].includes(d.status)
                          const cls = eligible
                            ? 'flex items-center gap-1.5 text-xs font-bold text-amber-700 border border-amber-300 px-2.5 py-1.5 rounded-[8px] hover:bg-amber-500 hover:text-white transition-colors'
                            : 'flex items-center gap-1.5 text-xs font-bold text-brand-muted/60 border border-brand-muted/15 px-2.5 py-1.5 rounded-[8px] cursor-not-allowed'
                          if (eligible) {
                            return (
                              <a
                                href={`/admin/laporan/assign?campaignId=${d.campaignId}&donationId=${d.id}`}
                                className={cls}
                                title="Assign foto penyembelihan ke donatur ini"
                              >
                                <FontAwesomeIcon icon={faCamera} className="text-sm" /> Assign Foto
                              </a>
                            )
                          }
                          return (
                            <span className={cls} title="Konfirmasi pembayaran dulu">
                              <FontAwesomeIcon icon={faCamera} className="text-sm" /> Assign Foto
                            </span>
                          )
                        })()}

                        <a
                          href={`/api/admin/sertifikat/qurban/${d.id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-accent border border-brand-accent/30 px-2.5 py-1.5 rounded-[8px] hover:bg-brand-accent hover:text-white transition-colors"
                          title="Generate sertifikat qurban (PDF)"
                        >
                          <FontAwesomeIcon icon={faAward} className="text-sm" /> Sertifikat
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-brand-muted">Belum ada data penyaluran</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Pesanan Penyaluran Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDetailModal(null) }}>
          <div className="bg-white rounded-[16px] w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/10 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-dark">Detail Pesanan Penyaluran</h3>
                <p className="text-xs font-mono text-brand-muted mt-0.5">{detailModal.orderNumber}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-brand-muted hover:text-brand-dark w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex flex-col gap-5">

              {/* Campaign / Destinasi */}
              <div className="rounded-[12px] border-2 border-brand-accent/30 p-4 relative overflow-hidden" style={{ background: 'rgba(200,150,42,.03)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getFlag(detailModal.campaign.location)}</span>
                  <div className="flex-1">
                    <div className="font-bold text-brand-dark mb-0.5">{detailModal.campaign.title}</div>
                    <div className="text-xs text-brand-muted">{getLocationLabel(detailModal.campaign.location)}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-brand-surface/10 text-brand-surface px-2.5 py-1 rounded-full font-medium">{detailModal.quantity} ekor</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_CLS[detailModal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[detailModal.status] ?? detailModal.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-brand-muted">Total Donasi</div>
                    <div className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(detailModal.totalAmount)}</div>
                  </div>
                </div>
              </div>

              {/* Info Donatur */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Data Donatur</div>
                <div className="bg-brand-light rounded-[10px] p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-surface/10 border border-brand-surface/20 flex items-center justify-center font-bold text-brand-surface">
                      {detailModal.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-brand-dark">{detailModal.customerName}</div>
                      <div className="text-xs text-brand-muted">+62 {detailModal.whatsapp}</div>
                      {(detailModal as any).email && (
                        <div className="text-xs text-brand-muted">{(detailModal as any).email}</div>
                      )}
                    </div>
                    <a
                      href={`https://wa.me/${detailModal.whatsapp}`}
                      target="_blank" rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#25D366] hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} /> Chat WA
                    </a>
                  </div>
                </div>
              </div>

              {/* Atas Nama Qurban */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Atas Nama Qurban</div>
                <div className="bg-brand-accent-light/40 border border-brand-accent/20 rounded-[10px] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-accent/15 flex items-center justify-center shrink-0">
                      <span className="text-base">📜</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-brand-muted mb-1">
                        Qurban untuk{' '}
                        <span className="font-semibold text-brand-dark">
                          {(detailModal as any).forWhom === 'other' ? 'Orang Lain' : 'Diri Sendiri'}
                        </span>
                      </div>
                      <div className="font-serif text-base font-bold text-brand-dark">
                        {(detailModal as any).qurbanName || detailModal.customerName}
                      </div>
                      <div className="text-xs text-brand-muted mt-1">
                        Nama ini akan tertera di sertifikat dan laporan qurban
                      </div>
                    </div>
                    {(detailModal as any).forWhom === 'other' && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full shrink-0">Orang Lain</span>
                    )}
                    {(!(detailModal as any).forWhom || (detailModal as any).forWhom === 'self') && (
                      <span className="text-[10px] bg-brand-surface/10 text-brand-surface font-bold px-2 py-0.5 rounded-full shrink-0">Diri Sendiri</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Pembayaran */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Informasi Pembayaran</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'No. Pesanan', value: detailModal.orderNumber },
                    { label: 'Nominal', value: formatCurrency(detailModal.totalAmount), cls: 'text-brand-accent font-bold' },
                    { label: 'Metode', value: detailModal.paymentMethod ?? 'Transfer Bank' },
                    { label: 'Status Bayar', value: detailModal.paymentStatus === 'PAID' ? 'Lunas' : detailModal.paymentStatus === 'UNPAID' ? 'Menunggu' : 'Kadaluarsa' },
                    { label: 'Jumlah Hewan', value: `${detailModal.quantity} ekor` },
                    { label: 'Tanggal', value: formatDate(detailModal.createdAt) },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-brand-light rounded-[8px] p-3">
                      <div className="text-xs text-brand-muted mb-1">{label}</div>
                      <div className={`font-bold text-brand-dark text-sm ${cls ?? ''}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bukti Transfer */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Bukti Transfer</div>
                {detailModal.paymentProofUrl ? (
                  <a href={detailModal.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                    className="block group" title="Klik untuk lihat ukuran penuh">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailModal.paymentProofUrl}
                      alt="Bukti transfer"
                      className="w-full max-h-72 object-contain rounded-[10px] border border-brand-muted/20 bg-brand-light group-hover:border-brand-surface/50 transition-colors"
                    />
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-surface font-semibold group-hover:underline">
                      <FontAwesomeIcon icon={faReceipt} /> Buka ukuran penuh
                    </span>
                  </a>
                ) : (
                  <div className="bg-brand-light border border-dashed border-brand-muted/30 rounded-[10px] p-6 text-center">
                    <p className="text-sm text-brand-muted">Belum ada bukti transfer</p>
                  </div>
                )}
              </div>

              {/* Update Status */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Update Status Penyaluran</div>
                <div className="bg-brand-light rounded-[10px] p-4 flex flex-col gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map(s => {
                      const active = detailModal.status === s
                      return (
                        <button
                          key={s}
                          onClick={() => handleUpdateStatus(detailModal.id, s)}
                          disabled={isPending || active}
                          className={`px-3 py-2 text-xs font-bold rounded-[8px] border transition-colors ${
                            active
                              ? `${STATUS_CLS[s] ?? 'bg-gray-100 text-gray-600'} border-transparent cursor-default`
                              : 'bg-white border-brand-muted/20 text-brand-dark hover:bg-brand-surface/5 disabled:opacity-50'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      )
                    })}
                  </div>
                  {detailModal.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => setKonfirmasiTarget(detailModal)}
                      disabled={isPending}
                      className="w-full px-3 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-[8px] flex items-center justify-center gap-1.5 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} /> Konfirmasi Bayar (upload bukti + buat pengiriman)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-brand-muted/10 shrink-0">
              <button
                onClick={() => setDetailModal(null)}
                className="w-full py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
              {updateError && (
                <p className="text-xs text-red-600 font-medium">⚠ {updateError}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setUpdateModal(false); setUpdateError(null) }} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted">Batal</button>
              <button onClick={handleSubmitUpdateModal} disabled={isPending} className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-60">
                <FontAwesomeIcon icon={faFloppyDisk} /> {isPending ? 'Menyimpan...' : 'Simpan Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {konfirmasiTarget && (
        <KonfirmasiBayarModal
          kind="donation"
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
      {bulkDeleteModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setBulkDeleteModal(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Hapus Donasi Terpilih?</h3>
            <p className="text-brand-muted text-sm mb-6">
              Yakin hapus <strong className="text-brand-dark">{selected.size}</strong> donasi?
              Tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteModal(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={handleBulkDelete} disabled={isPending} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px] hover:bg-red-600 transition-colors disabled:opacity-60">
                {isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
