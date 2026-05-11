'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage, faUpload, faTrash, faUsers, faCircleCheck, faCircleXmark,
  faFilePdf, faPaperPlane, faXmark, faPlus, faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import {
  setFotoPenyembelihan, setPatungan, setLaporanLink,
} from '@/lib/actions/laporan-donatur'

export interface AssignCampaign {
  id: string
  title: string
  location: string
  animalType: string
}

export interface AssignLaporan {
  id: string
  campaignId: string | null
  judul: string
  lokasi: string
  jumlahPenerima: number | null
  fotoCount: number
}

export interface AssignDonation {
  id: string
  orderNumber: string
  customerName: string
  whatsapp: string
  qurbanName: string | null
  qurbanNames: string | null
  quantity: number
  totalAmount: number
  campaignId: string
  campaignTitle: string
  campaignLocation: string
  animalType: string
  paymentStatus: string
  status: string
  laporanDonatur: {
    fotoPenyembelihan: string[]
    isPatungan: boolean
    namaPatungan: string[]
    laporanId: string | null
    statusPenyembelihan: string
    assignedAt: string | null
    sudahDikirim: boolean
    dikirimAt: string | null
  } | null
}

function statusOf(d: AssignDonation): 'menunggu' | 'disembelih' | 'disalurkan' {
  const s = d.laporanDonatur?.statusPenyembelihan
  if (s === 'disalurkan') return 'disalurkan'
  if (s === 'disembelih') return 'disembelih'
  // Backwards-compat: infer from photos if status is null/legacy.
  const fotoCount = d.laporanDonatur?.fotoPenyembelihan.length ?? 0
  if (fotoCount > 0) return d.laporanDonatur?.laporanId ? 'disalurkan' : 'disembelih'
  return 'menunggu'
}

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function donationAtasNama(d: AssignDonation): string {
  if (d.qurbanNames) {
    try {
      const arr = JSON.parse(d.qurbanNames) as string[]
      if (Array.isArray(arr) && arr.length > 0) return arr.join(', ')
    } catch {}
  }
  return d.qurbanName || d.customerName
}

export default function AssignClient({
  campaigns, laporanList, donations: initial, adminWhatsapp,
}: {
  campaigns: AssignCampaign[]
  laporanList: AssignLaporan[]
  donations: AssignDonation[]
  adminWhatsapp: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCampaignId = searchParams.get('campaignId') ?? ''
  const queryDonationId = searchParams.get('donationId') ?? ''
  const queryLaporanId = searchParams.get('laporanId') ?? ''

  // Resolve initial campaign: prefer ?campaignId, else infer from ?laporanId, else first.
  const inferredCampaignFromLaporan = queryLaporanId
    ? (laporanList.find(l => l.id === queryLaporanId)?.campaignId ?? '')
    : ''
  const initialCampaignId =
    (queryCampaignId && campaigns.some(c => c.id === queryCampaignId)) ? queryCampaignId
    : (inferredCampaignFromLaporan && campaigns.some(c => c.id === inferredCampaignFromLaporan)) ? inferredCampaignFromLaporan
    : (campaigns[0]?.id ?? '')

  const [donations, setDonations] = useState<AssignDonation[]>(initial)
  const [campaignId, setCampaignId] = useState<string>(initialCampaignId)
  const [laporanId, setLaporanId] = useState<string>(
    queryLaporanId && laporanList.some(l => l.id === queryLaporanId) ? queryLaporanId : '',
  )
  const [highlightId, setHighlightId] = useState<string | null>(queryDonationId || null)
  const [toast, setToast] = useState<{ show: boolean; msg: string; ok: boolean }>({ show: false, msg: '', ok: true })
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const donorRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Scroll & highlight pre-selected donor
  useEffect(() => {
    if (!highlightId) return
    const target = donorRefs.current.get(highlightId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setHighlightId(null), 3500)
    return () => clearTimeout(t)
  }, [highlightId, donations.length, campaignId])

  function showToast(msg: string, ok = true) {
    setToast({ show: true, msg, ok })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }

  const filteredDonations = useMemo(
    () => donations.filter(d => d.campaignId === campaignId),
    [donations, campaignId],
  )
  const filteredLaporan = useMemo(
    () => laporanList.filter(l => !l.campaignId || l.campaignId === campaignId),
    [laporanList, campaignId],
  )
  const selectedLaporan = laporanList.find(l => l.id === laporanId) ?? null

  // Patch donor entry locally
  function patch(id: string, partial: Partial<NonNullable<AssignDonation['laporanDonatur']>>) {
    setDonations(prev => prev.map(d => {
      if (d.id !== id) return d
      const base: NonNullable<AssignDonation['laporanDonatur']> = d.laporanDonatur ?? {
        fotoPenyembelihan: [],
        isPatungan: false,
        namaPatungan: [],
        laporanId: null,
        statusPenyembelihan: 'menunggu',
        assignedAt: null,
        sudahDikirim: false,
        dikirimAt: null,
      }
      return { ...d, laporanDonatur: { ...base, ...partial } }
    }))
  }

  async function handleUploadFoto(donationId: string, files: File[]) {
    const current = donations.find(d => d.id === donationId)?.laporanDonatur?.fotoPenyembelihan ?? []
    if (current.length + files.length > 5) {
      showToast('Maksimal 5 foto per donatur', false)
      return
    }
    const uploaded: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'laporan-donatur')
      try {
        const res = await fetch('/api/media-upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal upload')
        uploaded.push(json.url)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Gagal upload', false)
      }
    }
    if (uploaded.length === 0) return
    const next = [...current, ...uploaded]
    patch(donationId, {
      fotoPenyembelihan: next,
      statusPenyembelihan: 'disembelih',
      assignedAt: new Date().toISOString(),
    })
    try {
      await setFotoPenyembelihan(donationId, next)
      showToast(`${uploaded.length} foto diupload`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal simpan', false)
    }
  }

  async function handleRemoveFoto(donationId: string, idx: number) {
    const current = donations.find(d => d.id === donationId)?.laporanDonatur?.fotoPenyembelihan ?? []
    const next = current.filter((_, i) => i !== idx)
    patch(donationId, {
      fotoPenyembelihan: next,
      statusPenyembelihan: next.length === 0 ? 'menunggu' : 'disembelih',
      assignedAt: next.length === 0 ? null : new Date().toISOString(),
    })
    try {
      await setFotoPenyembelihan(donationId, next)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal hapus', false)
    }
  }

  async function handleClearAllFotos(donationId: string) {
    if (!confirm('Hapus semua foto donatur ini?')) return
    patch(donationId, { fotoPenyembelihan: [], statusPenyembelihan: 'menunggu', assignedAt: null })
    try {
      await setFotoPenyembelihan(donationId, [])
      showToast('Foto dihapus')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal hapus', false)
    }
  }

  async function handleTogglePatungan(donationId: string, isPatungan: boolean) {
    const d = donations.find(x => x.id === donationId)
    const names = d?.laporanDonatur?.namaPatungan ?? []
    patch(donationId, { isPatungan })
    try {
      await setPatungan(donationId, isPatungan, names)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal', false)
    }
  }

  async function handleSavePatunganNames(donationId: string, names: string[]) {
    patch(donationId, { namaPatungan: names })
    try {
      await setPatungan(donationId, true, names)
      showToast('Nama patungan disimpan')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal', false)
    }
  }

  async function handleLinkLaporan(donationId: string) {
    const linkId = laporanId || null
    patch(donationId, { laporanId: linkId })
    try {
      await setLaporanLink(donationId, linkId)
      showToast(linkId ? 'Laporan ditautkan' : 'Tautan dilepas')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal', false)
    }
  }

  async function handleKirim(d: AssignDonation) {
    if ((d.laporanDonatur?.fotoPenyembelihan.length ?? 0) === 0) {
      showToast('Upload foto penyembelihan dulu', false)
      return
    }
    setSendingIds(prev => { const n = new Set(prev); n.add(d.id); return n })
    try {
      const res = await fetch(`/api/admin/laporan/donatur/${d.id}/kirim`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        patch(d.id, { sudahDikirim: true, dikirimAt: new Date().toISOString() })
        showToast('Laporan berhasil dikirim ke WhatsApp')
      } else {
        showToast(data.error || `Gagal kirim (HTTP ${res.status})`, false)
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal kirim', false)
    } finally {
      setSendingIds(prev => { const n = new Set(prev); n.delete(d.id); return n })
    }
  }

  async function handleSendAll() {
    const ready = filteredDonations.filter(
      d => (d.laporanDonatur?.fotoPenyembelihan.length ?? 0) > 0 && !d.laporanDonatur?.sudahDikirim,
    )
    if (ready.length === 0) {
      showToast('Tidak ada donatur yang perlu dikirim', false)
      return
    }
    if (!confirm(`Kirim laporan ke ${ready.length} donatur via WhatsApp (OneSender)?`)) return

    setBulkSending(true)
    setBulkProgress({ current: 0, total: ready.length })

    let berhasil = 0
    let gagal = 0
    for (let i = 0; i < ready.length; i++) {
      const d = ready[i]
      setBulkProgress({ current: i + 1, total: ready.length })
      try {
        const res = await fetch(`/api/admin/laporan/donatur/${d.id}/kirim`, { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          patch(d.id, { sudahDikirim: true, dikirimAt: new Date().toISOString() })
          berhasil++
        } else {
          gagal++
        }
      } catch {
        gagal++
      }
    }

    setBulkSending(false)
    setBulkProgress(null)
    showToast(`Selesai. Berhasil ${berhasil}, gagal ${gagal}.`, gagal === 0)
  }

  const readyCount = filteredDonations.filter(d => (d.laporanDonatur?.fotoPenyembelihan.length ?? 0) > 0).length
  const sentCount = filteredDonations.filter(d => d.laporanDonatur?.sudahDikirim).length
  const totalDonatur = filteredDonations.length
  const progressPct = totalDonatur === 0 ? 0 : Math.round((readyCount / totalDonatur) * 100)

  return (
    <>
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/20 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Assign Foto Laporan</h1>
          <p className="text-brand-muted text-xs mt-0.5">Upload foto penyembelihan per donatur & kirim laporan via WhatsApp</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-6">
        {/* Campaign + Laporan selector */}
        <div className="bg-white border border-brand-muted/15 rounded-[14px] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-muted mb-1">Pilih Campaign</label>
            <select
              value={campaignId}
              onChange={e => { setCampaignId(e.target.value); setLaporanId('') }}
              className="w-full border border-brand-muted/20 rounded-[10px] px-3 py-2 text-sm focus:border-brand-dark focus:outline-none"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-muted mb-1">
              Laporan Penyaluran (foto bersama, opsional)
            </label>
            <select
              value={laporanId}
              onChange={e => setLaporanId(e.target.value)}
              className="w-full border border-brand-muted/20 rounded-[10px] px-3 py-2 text-sm focus:border-brand-dark focus:outline-none"
            >
              <option value="">— Tidak ada —</option>
              {filteredLaporan.map(l => (
                <option key={l.id} value={l.id}>
                  {l.judul} · {l.lokasi} ({l.fotoCount} foto)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats + send all */}
        <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><b className="text-brand-dark">{totalDonatur}</b> <span className="text-brand-muted">donatur</span></span>
              <span><b className="text-emerald-600">{readyCount}</b> <span className="text-brand-muted">foto terupload ✓</span></span>
              <span><b className="text-blue-600">{readyCount - sentCount > 0 ? readyCount - sentCount : 0}</b> <span className="text-brand-muted">siap kirim</span></span>
              <span><b className="text-amber-600">{sentCount}</b> <span className="text-brand-muted">sudah dikirim</span></span>
            </div>
            <button
              onClick={handleSendAll}
              disabled={readyCount - sentCount <= 0 || bulkSending}
              className="bg-[#25D366] text-white px-4 py-2 rounded-[10px] text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faWhatsapp} />
              {bulkSending && bulkProgress
                ? `Mengirim ${bulkProgress.current}/${bulkProgress.total}…`
                : `Kirim Semua (${Math.max(readyCount - sentCount, 0)})`}
            </button>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] text-brand-muted font-bold uppercase tracking-wider">Progress Foto</span>
              <span className="text-[11px] text-brand-muted">{readyCount}/{totalDonatur} donatur sudah ada foto · {progressPct}%</span>
            </div>
            <div className="h-2 bg-brand-light rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Donor list */}
        {filteredDonations.length === 0 ? (
          <div className="border border-dashed border-brand-muted/30 rounded-[14px] p-12 text-center bg-white">
            <FontAwesomeIcon icon={faUsers} className="text-3xl text-brand-muted mb-3" />
            <p className="text-brand-muted">Belum ada donatur untuk campaign ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDonations.map(d => (
              <DonorCard
                key={d.id}
                donation={d}
                highlighted={highlightId === d.id}
                cardRef={el => { donorRefs.current.set(d.id, el) }}
                selectedLaporan={selectedLaporan}
                sending={sendingIds.has(d.id)}
                onUpload={files => handleUploadFoto(d.id, files)}
                onRemoveFoto={i => handleRemoveFoto(d.id, i)}
                onClearAllFotos={() => handleClearAllFotos(d.id)}
                onTogglePatungan={v => handleTogglePatungan(d.id, v)}
                onSavePatunganNames={names => handleSavePatunganNames(d.id, names)}
                onLinkLaporan={() => handleLinkLaporan(d.id)}
                onSendWa={() => handleKirim(d)}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'} ${toast.ok ? 'bg-brand-dark text-brand-accent-light' : 'bg-red-600 text-white'}`}
      >
        <FontAwesomeIcon icon={toast.ok ? faCircleCheck : faCircleXmark} />
        {toast.msg}
      </div>
    </>
  )
}

function DonorCard({
  donation, selectedLaporan, highlighted, cardRef, sending,
  onUpload, onRemoveFoto, onClearAllFotos, onTogglePatungan, onSavePatunganNames, onLinkLaporan, onSendWa,
}: {
  donation: AssignDonation
  selectedLaporan: AssignLaporan | null
  highlighted: boolean
  cardRef: (el: HTMLDivElement | null) => void
  sending: boolean
  onUpload: (files: File[]) => void
  onRemoveFoto: (idx: number) => void
  onClearAllFotos: () => void
  onTogglePatungan: (v: boolean) => void
  onSavePatunganNames: (names: string[]) => void
  onLinkLaporan: () => void
  onSendWa: () => void
}) {
  const ld = donation.laporanDonatur
  const fotoCount = ld?.fotoPenyembelihan.length ?? 0
  const isReady = fotoCount > 0
  const linkedLaporanId = ld?.laporanId ?? null
  const [patunganNames, setPatunganNames] = useState<string[]>(ld?.namaPatungan ?? [])
  const [showPatunganEditor, setShowPatunganEditor] = useState(false)
  const [uploading, setUploading] = useState(false)

  const status = statusOf(donation)
  const statusBadge = (() => {
    if (status === 'disalurkan')
      return { label: '✅ Telah Disalurkan', cls: 'bg-emerald-100 text-emerald-700' }
    if (status === 'disembelih')
      return { label: '✅ Telah Disembelih', cls: 'bg-emerald-100 text-emerald-700' }
    return { label: '🟡 Menunggu', cls: 'bg-amber-100 text-amber-700' }
  })()

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      await onUpload(Array.from(files))
    } finally {
      setUploading(false)
    }
  }

  const cardCls = [
    'bg-white border rounded-[14px] p-4 flex flex-col gap-3 transition-shadow',
    ld?.sudahDikirim ? 'border-emerald-200' : 'border-brand-muted/15',
    highlighted ? 'ring-2 ring-brand-accent shadow-lg' : '',
  ].filter(Boolean).join(' ')

  return (
    <div ref={cardRef} className={cardCls}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-brand-light text-brand-muted rounded-full font-mono">
              {donation.orderNumber}
            </span>
            {ld?.sudahDikirim && (
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold flex items-center gap-1"
                title={ld.dikirimAt ? `Dikirim ${new Date(ld.dikirimAt).toLocaleString('id-ID')}` : undefined}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                ✅ Sudah Dikirim
                {ld.dikirimAt ? ` ${new Date(ld.dikirimAt).toLocaleDateString('id-ID')}` : ''}
              </span>
            )}
          </div>
          <h3 className="font-bold text-brand-dark mt-2">{donation.customerName}</h3>
          <div className="text-sm text-brand-muted mt-0.5">
            Atas nama: <b className="text-brand-dark">{donationAtasNama(donation)}</b>
          </div>
          <div className="text-sm text-brand-muted mt-0.5">
            {donation.quantity}× {donation.animalType}
            {' · '}{formatRupiah(donation.totalAmount)}
            {ld?.isPatungan && ` · patungan ${ld.namaPatungan.length} orang`}
          </div>
          <div className="text-xs text-brand-muted mt-0.5">
            WA: {donation.whatsapp}
            {linkedLaporanId && ' · ✓ tautan laporan penyaluran'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={`/api/admin/laporan/donatur/${donation.id}/pdf`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-brand-light flex items-center gap-1.5"
            title="Preview PDF laporan"
          >
            <FontAwesomeIcon icon={faFilePdf} /> Preview PDF
          </a>
          <button
            onClick={onSendWa}
            disabled={!isReady || sending}
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40"
            title={isReady ? 'Kirim laporan via WhatsApp (OneSender)' : 'Upload foto dulu'}
          >
            {sending ? (
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="animate-pulse" />
                Mengirim…
              </>
            ) : ld?.sudahDikirim ? (
              <>
                <FontAwesomeIcon icon={faWhatsapp} />
                Kirim Ulang
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWhatsapp} />
                Kirim Laporan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-brand-light cursor-pointer flex items-center gap-1.5">
            <FontAwesomeIcon icon={uploading ? faUpload : faImage} />
            {uploading ? 'Mengupload…' : 'Upload Foto Penyembelihan'}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            />
          </label>
          <span className="text-[11px] text-brand-muted">{fotoCount}/5 foto</span>

          {/* Link laporan (uses currently-selected laporan in header) */}
          <button
            onClick={onLinkLaporan}
            disabled={!selectedLaporan && !linkedLaporanId}
            className={`text-xs font-bold px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 ${linkedLaporanId ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'border border-brand-muted/20 hover:bg-brand-light'} disabled:opacity-40`}
            title={selectedLaporan ? `Tautkan ke "${selectedLaporan.judul}"` : 'Pilih laporan di atas'}
          >
            {linkedLaporanId
              ? <><FontAwesomeIcon icon={faXmark} /> Lepas Tautan Laporan</>
              : <><FontAwesomeIcon icon={faPlus} /> Tautkan Laporan Bersama</>}
          </button>

          {/* Patungan toggle */}
          <label className="text-xs flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ld?.isPatungan ?? false}
              onChange={e => onTogglePatungan(e.target.checked)}
            />
            Patungan
          </label>
          {ld?.isPatungan && (
            <button
              onClick={() => setShowPatunganEditor(s => !s)}
              className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-brand-light flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faUsers} />
              {ld.namaPatungan.length > 0
                ? `Nama: ${ld.namaPatungan.slice(0, 3).join(', ')}${ld.namaPatungan.length > 3 ? `, +${ld.namaPatungan.length - 3}` : ''}`
                : 'Atur Nama Peserta'}
              <FontAwesomeIcon icon={faChevronDown} className="text-[8px]" />
            </button>
          )}

          {fotoCount > 0 && (
            <button
              onClick={onClearAllFotos}
              className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-[8px] hover:bg-red-50 flex items-center gap-1.5 ml-auto"
              title="Hapus semua foto"
            >
              <FontAwesomeIcon icon={faTrash} /> Hapus Semua Foto
            </button>
          )}
        </div>

        {/* Photo previews */}
        {fotoCount > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ld!.fotoPenyembelihan.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-[8px] overflow-hidden border border-brand-muted/15 bg-brand-light group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemoveFoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Hapus foto"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showPatunganEditor && ld?.isPatungan && (
          <PatunganEditor
            initial={patunganNames}
            onCancel={() => setShowPatunganEditor(false)}
            onSave={(names) => {
              setPatunganNames(names)
              onSavePatunganNames(names)
              setShowPatunganEditor(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

function PatunganEditor({
  initial, onCancel, onSave,
}: {
  initial: string[]
  onCancel: () => void
  onSave: (names: string[]) => void
}) {
  const [names, setNames] = useState<string[]>(initial.length > 0 ? initial : [''])

  return (
    <div className="bg-brand-light/50 border border-brand-muted/15 rounded-[10px] p-3 flex flex-col gap-2">
      <div className="text-xs font-bold text-brand-muted">Nama-nama peserta patungan (1 baris per orang)</div>
      <div className="flex flex-col gap-1.5">
        {names.map((n, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={n}
              onChange={e => setNames(prev => prev.map((v, j) => j === i ? e.target.value : v))}
              placeholder={`Peserta ${i + 1}`}
              className="flex-1 border border-brand-muted/20 rounded-[8px] px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => setNames(prev => prev.filter((_, j) => j !== i))}
              className="text-red-600 px-2 hover:bg-red-50 rounded-[6px]"
              title="Hapus baris"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setNames(prev => [...prev, ''])}
          className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-white flex items-center gap-1.5"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah Baris
        </button>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-[8px] hover:bg-white"
        >
          Batal
        </button>
        <button
          onClick={() => onSave(names.filter(n => n.trim()))}
          className="bg-brand-dark text-brand-accent-light text-xs font-bold px-3 py-1.5 rounded-[8px]"
        >
          Simpan
        </button>
      </div>
    </div>
  )
}
