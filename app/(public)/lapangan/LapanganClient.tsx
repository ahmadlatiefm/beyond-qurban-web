'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapLocationDot, faTruck, faCheckDouble, faPaperPlane,
  faRotateRight, faCamera, faArrowRightFromBracket, faLock, faSpinner,
  faCircleQuestion, faXmark, faPhone,
} from '@fortawesome/free-solid-svg-icons'
import {
  STATUS_KIRIM_LABEL, STATUS_KIRIM_CLS,
  type StatusKirim,
} from '@/lib/pengiriman'

const STORAGE_KEY = 'lapangan_code'

type Pic = {
  id: string
  nama: string
  noTelepon: string
  keterangan: string | null
  aktif: boolean
}

type Item = {
  id: string
  token: string
  namaPemesan: string | null
  noWhatsapp: string
  alamatLengkap: string | null
  kecamatan: string | null
  kota: string | null
  gmapsPin: string | null
  jenisHewan: string
  jumlahHewan: number
  beratHewan: string | null
  nomorTagHewan: unknown
  atasNama: string | null
  catatan: string | null
  tanggalKirim: string | null
  jamKirim: string | null
  statusKirim: string
  namaPengirim: string | null
  noKendaraan: string | null
  namaPenerima: string | null
  noWaPenerima: string | null
  keteranganSerahTerima: string | null
  fotoSerahTerima: string | null
  picId: string | null
  pic: Pic | null
}

type ConfirmMode = 'dalam_perjalanan' | 'terkirim'
type ConfirmState = {
  open: boolean
  mode: ConfirmMode
  item: Item | null
  picId: string
  noKendaraan: string
  namaPenerima: string
  noWaPenerima: string
  keteranganSerahTerima: string
  file: File | null
}

type DateShortcut = '' | 'today' | 'tomorrow'

function formatPhoneWa(s: string) {
  return s.replace(/\D/g, '').replace(/^0/, '62')
}

function asTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String) } catch {}
  }
  return []
}

function dateOnlyISO(d: Date): string {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c.toISOString().slice(0, 10)
}

function todayISO(): string {
  return dateOnlyISO(new Date())
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return dateOnlyISO(d)
}

function formatTanggalShort(iso: string | null): string {
  if (!iso) return 'Tanpa tanggal'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatTanggalLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_FILTER_OPTIONS: { value: '' | StatusKirim; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'dijadwalkan', label: 'Dijadwalkan' },
  { value: 'dalam_perjalanan', label: 'Dalam Perjalanan' },
  { value: 'belum_dijadwalkan', label: 'Belum Dijadwalkan' },
]

// Card badge palette per spec (overrides the global STATUS_KIRIM_CLS for the
// minimal card view only — admin pages keep their own scheme).
const CARD_STATUS_CLS: Record<string, string> = {
  belum_dijadwalkan: 'bg-slate-100 text-slate-700',
  menunggu_data: 'bg-slate-100 text-slate-700',
  dijadwalkan: 'bg-blue-100 text-blue-700',
  dalam_perjalanan: 'bg-amber-100 text-amber-800',
  terkirim: 'bg-emerald-100 text-emerald-700',
}

export default function LapanganClient() {
  const [code, setCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Filters
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('')
  const [date, setDate] = useState<string>('') // empty = semua
  const [picFilter, setPicFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [items, setItems] = useState<Item[]>([])
  const [pics, setPics] = useState<Pic[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [helpOpen, setHelpOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<Item | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false, mode: 'dalam_perjalanan', item: null,
    picId: '', noKendaraan: '', namaPenerima: '', noWaPenerima: '', keteranganSerahTerima: '', file: null,
  })

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) setCode(saved)
  }, [])

  useEffect(() => {
    if (!code) return
    void load()
    void loadPics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  async function loadPics() {
    if (!code) return
    try {
      const res = await fetch('/api/lapangan/pic', { headers: { 'X-Lapangan-Code': code } })
      if (res.ok) {
        const data = await res.json()
        setPics(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    }
  }

  async function load() {
    if (!code) return
    setLoading(true)
    try {
      const res = await fetch(`/api/lapangan`, {
        headers: { 'X-Lapangan-Code': code },
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      showToast('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (verifying) return
    setVerifying(true)
    setLoginErr('')
    try {
      const res = await fetch('/api/lapangan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setLoginErr(data.error || 'Kode salah')
        return
      }
      sessionStorage.setItem(STORAGE_KEY, codeInput.trim())
      setCode(codeInput.trim())
    } catch {
      setLoginErr('Gagal terhubung')
    } finally {
      setVerifying(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setCode(null)
    setItems([])
  }

  function applyDateShortcut(s: DateShortcut) {
    setDateShortcut(s)
    if (s === 'today') setDate(todayISO())
    else if (s === 'tomorrow') setDate(tomorrowISO())
    else setDate('')
  }

  // Client-side filter chain
  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      if (date) {
        if (!p.tanggalKirim) return false
        if (dateOnlyISO(new Date(p.tanggalKirim)) !== date) return false
      }
      if (picFilter) {
        if (picFilter === '__none__') {
          if (p.picId) return false
        } else if (p.picId !== picFilter) return false
      }
      if (statusFilter && p.statusKirim !== statusFilter) return false
      return true
    })
  }, [items, date, picFilter, statusFilter])

  type StatusPatch = {
    statusKirim: StatusKirim
    fotoSerahTerima?: string
    picId?: string | null
    noKendaraan?: string
    namaPenerima?: string
    noWaPenerima?: string
    keteranganSerahTerima?: string
  }

  async function patchStatus(item: Item, patch: StatusPatch) {
    if (!code) return null
    setBusy(item.id)
    try {
      const res = await fetch(`/api/lapangan/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Lapangan-Code': code },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data?.error || 'Gagal update status')
        return null
      }
      // If marked terkirim, server-side default no longer matches the
      // non-terkirim filter; remove from list.
      if (patch.statusKirim === 'terkirim') {
        setItems((prev) => prev.filter((x) => x.id !== item.id))
      } else {
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...data } : p)))
      }
      showToast('Status diperbarui')
      return data
    } finally {
      setBusy(null)
    }
  }

  function openConfirm(item: Item, mode: ConfirmMode) {
    setConfirm({
      open: true, mode, item,
      picId: item.picId ?? '',
      noKendaraan: item.noKendaraan ?? '',
      namaPenerima: item.namaPenerima ?? '',
      noWaPenerima: item.noWaPenerima ?? '',
      keteranganSerahTerima: item.keteranganSerahTerima ?? '',
      file: null,
    })
  }

  function closeConfirm() {
    setConfirm({
      open: false, mode: 'dalam_perjalanan', item: null,
      picId: '', noKendaraan: '', namaPenerima: '', noWaPenerima: '', keteranganSerahTerima: '', file: null,
    })
  }

  async function submitConfirm() {
    const { item, mode, picId, noKendaraan, namaPenerima, noWaPenerima, keteranganSerahTerima, file } = confirm
    if (!item || !code) return

    if (mode === 'terkirim' && !file) {
      showToast('Foto serah terima wajib diunggah')
      return
    }
    if (mode === 'terkirim' && !namaPenerima.trim()) {
      showToast('Nama penerima wajib diisi')
      return
    }

    setBusy(item.id)
    try {
      let fotoUrl: string | undefined
      if (mode === 'terkirim' && file) {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/lapangan/upload', {
          method: 'POST',
          headers: { 'X-Lapangan-Code': code },
          body: fd,
        })
        const upData = await upRes.json()
        if (!upRes.ok) {
          showToast(upData?.error || 'Upload gagal')
          return
        }
        fotoUrl = upData.url
      }

      const patch: StatusPatch = {
        statusKirim: mode,
        picId: picId || null,
        noKendaraan: noKendaraan.trim() || undefined,
      }
      if (fotoUrl) patch.fotoSerahTerima = fotoUrl
      if (mode === 'terkirim') {
        patch.namaPenerima = namaPenerima.trim()
        patch.noWaPenerima = noWaPenerima.trim() || undefined
        patch.keteranganSerahTerima = keteranganSerahTerima.trim() || undefined
      }

      const updated = await patchStatus(item, patch)
      if (!updated) return

      const finalNamaPenerima = namaPenerima.trim()

      closeConfirm()
      setDetailItem(null)

      if (mode === 'dalam_perjalanan') {
        // Server-side OneSender notification fires automatically; no wa.me popup.
        showToast('Status diperbarui. Notifikasi WA sudah dikirim ke pemesan.')
      } else {
        // 'terkirim' still uses wa.me — server doesn't send for delivered yet.
        const phone = formatPhoneWa(item.noWhatsapp)
        const atasNama = item.atasNama || item.namaPemesan || ''
        const text = `Alhamdulillah, hewan qurban atas nama ${atasNama} sudah tiba dan diterima oleh ${finalNamaPenerima} 🤲. Semoga ibadah qurban Anda diterima Allah ﷻ. Jazakallah khairan! 🐑`
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
      }
    } finally {
      setBusy(null)
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="bg-white border border-brand-muted/10 rounded-[14px] shadow-premium max-w-sm w-full p-7 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-dark flex items-center justify-center">
            <Image src="/logo-gold.png" alt="logo" width={36} height={36} className="object-contain" />
          </div>
          <h1 className="font-serif text-lg font-bold text-brand-dark mb-1">Tim Lapangan</h1>
          <p className="text-xs text-brand-muted mb-5">Masukkan kode akses untuk mulai bekerja.</p>
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[11px] font-semibold text-brand-dark">Kode Akses Tim</label>
            <input
              type="password"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="inp"
              autoFocus
              placeholder="Masukkan kode"
            />
            {loginErr && <div className="text-xs text-red-600">{loginErr}</div>}
            <button
              type="submit"
              disabled={!codeInput.trim() || verifying}
              className="mt-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[10px] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={verifying ? faSpinner : faLock} className={verifying ? 'animate-spin' : ''} />
              {verifying ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center">
            <Image src="/logo-gold.png" alt="logo" width={26} height={26} className="object-contain" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-brand-muted">Tim Lapangan</div>
            <h1 className="font-serif text-lg font-bold text-brand-dark leading-tight">Pengiriman Aktif</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setHelpOpen(true)} className="text-xs text-brand-dark hover:text-brand-accent flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-light">
            <FontAwesomeIcon icon={faCircleQuestion} /> Panduan
          </button>
          <button onClick={handleLogout} className="text-xs text-brand-muted hover:text-brand-dark flex items-center gap-1 px-2 py-1">
            <FontAwesomeIcon icon={faArrowRightFromBracket} /> Keluar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-brand-muted/10 rounded-[12px] p-3 mb-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-brand-dark">Tanggal:</span>
          {[
            { v: '' as DateShortcut, l: 'Semua' },
            { v: 'today' as DateShortcut, l: 'Hari Ini' },
            { v: 'tomorrow' as DateShortcut, l: 'Besok' },
          ].map((b) => (
            <button
              key={b.v}
              onClick={() => applyDateShortcut(b.v)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                dateShortcut === b.v && !date
                  ? 'bg-brand-dark text-brand-accent-light'
                  : (b.v === 'today' && date === todayISO()) || (b.v === 'tomorrow' && date === tomorrowISO()) || (b.v === '' && !date)
                    ? 'bg-brand-dark text-brand-accent-light'
                    : 'bg-brand-light text-brand-dark hover:bg-brand-muted/10'
              }`}
            >
              {b.l}
            </button>
          ))}
          <input
            type="date"
            className="inp text-xs max-w-[150px]"
            value={date}
            onChange={(e) => { setDate(e.target.value); setDateShortcut('') }}
          />
          <button onClick={load} disabled={loading} className="ml-auto text-xs px-2.5 py-1 border border-brand-muted/20 rounded hover:bg-brand-light disabled:opacity-50 flex items-center gap-1">
            <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-brand-dark">PIC:</span>
          <select value={picFilter} onChange={(e) => setPicFilter(e.target.value)} className="inp text-xs max-w-[200px]">
            <option value="">Semua PIC</option>
            <option value="__none__">Belum ada PIC</option>
            {pics.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-brand-dark">Status:</span>
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                statusFilter === opt.value
                  ? 'bg-brand-dark text-brand-accent-light'
                  : 'bg-brand-light text-brand-dark hover:bg-brand-muted/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact list */}
      {loading && items.length === 0 ? (
        <div className="text-center text-sm text-brand-muted py-10">Memuat...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-brand-muted/10 rounded-[12px] py-10 text-center text-sm text-brand-muted">
          Tidak ada pengiriman yang sesuai filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((p) => {
            const tags = asTags(p.nomorTagHewan)
            const firstTag = tags[0]
            const alamat = [p.alamatLengkap, p.kota].filter(Boolean).join(', ') || 'Alamat belum lengkap'
            const badgeCls = CARD_STATUS_CLS[p.statusKirim] ?? 'bg-slate-100 text-slate-700'
            return (
              <div
                key={p.id}
                onClick={() => setDetailItem(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailItem(p) }}
                className="bg-white border border-brand-muted/10 rounded-xl shadow-sm p-4 cursor-pointer hover:border-brand-dark/30 hover:shadow transition"
              >
                {/* Line 1: Nama + status badge */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="font-bold text-sm text-brand-dark truncate">
                    {p.namaPemesan || 'Tanpa Nama'}
                  </div>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeCls}`}>
                    {STATUS_KIRIM_LABEL[p.statusKirim as StatusKirim] ?? p.statusKirim}
                  </span>
                </div>

                {/* Line 2: Alamat singkat */}
                <div className="text-xs text-brand-muted truncate mb-1">
                  📍 {alamat}
                </div>

                {/* Line 3: Hewan · tag pertama · tanggal */}
                <div className="text-xs text-brand-dark flex items-center gap-1.5 flex-wrap">
                  <span>🐑 {p.jumlahHewan}× {p.jenisHewan}</span>
                  {firstTag && (
                    <>
                      <span className="text-brand-muted">·</span>
                      <span className="font-mono">🏷️ {firstTag}</span>
                    </>
                  )}
                  <span className="text-brand-muted">·</span>
                  <span>📅 {formatTanggalShort(p.tanggalKirim)}</span>
                </div>

                {/* Line 4: CTA */}
                <div className="flex justify-end mt-2">
                  <span className="text-[11px] font-medium text-brand-dark border border-brand-muted/20 rounded-full px-2.5 py-0.5 hover:bg-brand-light">
                    Lihat Detail →
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail drawer */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onTransit={(it) => { setDetailItem(null); openConfirm(it, 'dalam_perjalanan') }}
          onDeliver={(it) => { setDetailItem(null); openConfirm(it, 'terkirim') }}
        />
      )}

      {/* Confirm modal */}
      {confirm.open && confirm.item && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeConfirm() }}
        >
          <div className="bg-white rounded-t-[16px] md:rounded-[16px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-brand-muted/10 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-serif text-base font-bold text-brand-dark">
                {confirm.mode === 'terkirim' ? 'Konfirmasi Terkirim' : 'Mulai Pengiriman'}
              </h3>
              <button onClick={closeConfirm} className="w-8 h-8 rounded-full hover:bg-brand-light text-brand-muted">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="text-xs text-brand-muted">
                <strong className="text-brand-dark">{confirm.item.namaPemesan || 'Tanpa Nama'}</strong>
                {' · '}{confirm.item.jumlahHewan}× {confirm.item.jenisHewan}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-dark block mb-1">PIC Pengiriman</label>
                <select
                  className="inp"
                  value={confirm.picId}
                  onChange={(e) => setConfirm((c) => ({ ...c, picId: e.target.value }))}
                >
                  <option value="">— Pilih PIC —</option>
                  {pics.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} — {p.noTelepon}</option>
                  ))}
                </select>
                {pics.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">Belum ada PIC aktif. Hubungi admin.</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-dark block mb-1">No Kendaraan</label>
                <input
                  className="inp"
                  value={confirm.noKendaraan}
                  onChange={(e) => setConfirm((c) => ({ ...c, noKendaraan: e.target.value }))}
                  placeholder="B 1234 ABC"
                />
              </div>

              {confirm.mode === 'terkirim' && (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-brand-dark block mb-1">Diterima Oleh *</label>
                    <input
                      className="inp"
                      value={confirm.namaPenerima}
                      onChange={(e) => setConfirm((c) => ({ ...c, namaPenerima: e.target.value }))}
                      placeholder="Nama penerima di lokasi"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-brand-dark block mb-1">No HP/WA Penerima (opsional)</label>
                    <input
                      className="inp"
                      value={confirm.noWaPenerima}
                      onChange={(e) => setConfirm((c) => ({ ...c, noWaPenerima: e.target.value }))}
                      placeholder="08xxx"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-brand-dark block mb-1">Keterangan Tambahan (opsional)</label>
                    <textarea
                      rows={3}
                      className="inp"
                      value={confirm.keteranganSerahTerima}
                      onChange={(e) => setConfirm((c) => ({ ...c, keteranganSerahTerima: e.target.value }))}
                      placeholder="Kondisi hewan, catatan serah terima, dll"
                    />
                  </div>
                </>
              )}

              {confirm.mode === 'terkirim' && (
                <div>
                  <label className="text-[11px] font-semibold text-brand-dark block mb-1">Foto Serah Terima *</label>
                  <label className={`block border-2 border-dashed border-brand-muted/30 rounded-[10px] px-4 py-5 text-center cursor-pointer hover:bg-brand-light ${confirm.file ? 'bg-emerald-50 border-emerald-300' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null
                        setConfirm((c) => ({ ...c, file: f }))
                        e.target.value = ''
                      }}
                    />
                    <div className="flex flex-col items-center gap-1.5 text-xs">
                      <FontAwesomeIcon icon={faCamera} className="text-brand-accent text-lg" />
                      {confirm.file ? (
                        <span className="text-emerald-700 font-semibold">{confirm.file.name}</span>
                      ) : (
                        <>
                          <span className="text-brand-dark font-semibold">Ambil / pilih foto</span>
                          <span className="text-brand-muted">JPG/PNG/WebP — maks 4MB</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-brand-muted/10 flex gap-2 sticky bottom-0 bg-white">
              <button
                onClick={closeConfirm}
                disabled={busy === confirm.item.id}
                className="flex-1 py-2.5 border border-brand-muted/20 rounded-[10px] text-sm font-medium text-brand-muted hover:bg-brand-light disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={submitConfirm}
                disabled={busy === confirm.item.id}
                className={`flex-1 py-2.5 font-bold text-sm rounded-[10px] flex items-center justify-center gap-2 disabled:opacity-50 ${
                  confirm.mode === 'terkirim'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {busy === confirm.item.id ? (
                  <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Memproses...</>
                ) : confirm.mode === 'terkirim' ? (
                  <><FontAwesomeIcon icon={faCheckDouble} /> Konfirmasi Terkirim</>
                ) : (
                  <><FontAwesomeIcon icon={faTruck} /> Mulai Perjalanan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panduan modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        {toast.msg}
      </div>
    </div>
  )
}

function DetailDrawer({
  item,
  onClose,
  onTransit,
  onDeliver,
}: {
  item: Item
  onClose: () => void
  onTransit: (it: Item) => void
  onDeliver: (it: Item) => void
}) {
  const tags = asTags(item.nomorTagHewan)
  const phone = formatPhoneWa(item.noWhatsapp)

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[150] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-[16px] md:rounded-[16px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-5 py-4 border-b border-brand-muted/10 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-serif text-base font-bold text-brand-dark">Detail Pengiriman</h3>
            <p className="text-[11px] text-brand-muted">{item.jumlahHewan}× {item.jenisHewan}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-brand-light text-brand-muted">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <Section title="📋 Data Pemesan">
            <Row label="Nama" value={item.namaPemesan || '—'} />
            <Row label="WhatsApp" value={
              <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-medium">
                {item.noWhatsapp}
              </a>
            } />
            <Row label="Alamat" value={item.alamatLengkap || '—'} />
            <Row label="Kec / Kota" value={[item.kecamatan, item.kota].filter(Boolean).join(', ') || '—'} />
          </Section>

          <Section title="🐑 Data Hewan">
            <Row label="Jenis" value={`${item.jumlahHewan}× ${item.jenisHewan}`} />
            <Row label="Berat" value={item.beratHewan || '—'} />
            <Row label="Atas Nama" value={item.atasNama || '—'} />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((t) => (
                  <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{t}</span>
                ))}
              </div>
            )}
          </Section>

          <Section title="📅 Jadwal Pengiriman">
            <Row label="Tanggal" value={formatTanggalLong(item.tanggalKirim)} />
            <Row label="Jam" value={item.jamKirim || '—'} />
            <Row label="Status" value={
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_KIRIM_CLS[item.statusKirim as StatusKirim] ?? 'bg-slate-100 text-slate-700'}`}>
                {STATUS_KIRIM_LABEL[item.statusKirim as StatusKirim] ?? item.statusKirim}
              </span>
            } />
          </Section>

          {item.pic && (
            <Section title="👤 PIC Pengiriman">
              <Row label="Nama" value={item.pic.nama} />
              <Row label="No HP" value={
                <a href={`https://wa.me/${formatPhoneWa(item.pic.noTelepon)}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-mono">
                  {item.pic.noTelepon}
                </a>
              } />
              {item.pic.keterangan && <Row label="Ket." value={item.pic.keterangan} />}
            </Section>
          )}

          <Section title="🗺️ Lokasi">
            {item.gmapsPin ? (
              <a href={item.gmapsPin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 font-semibold text-xs rounded-[8px] hover:bg-blue-100 w-fit">
                <FontAwesomeIcon icon={faMapLocationDot} /> Buka Google Maps
              </a>
            ) : (
              <p className="text-xs text-brand-muted italic">Pin Maps belum tersedia.</p>
            )}
            <Row label="Alamat" value={[item.alamatLengkap, item.kecamatan, item.kota].filter(Boolean).join(', ') || '—'} />
          </Section>

          {item.catatan && (
            <Section title="📝 Catatan">
              <p className="text-sm text-brand-dark whitespace-pre-wrap">{item.catatan}</p>
            </Section>
          )}

          {(item.namaPenerima || item.fotoSerahTerima || item.keteranganSerahTerima) && (
            <Section title="📸 Serah Terima">
              {item.namaPenerima && <Row label="Diterima Oleh" value={item.namaPenerima} />}
              {item.noWaPenerima && (
                <Row label="No HP Penerima" value={
                  <a href={`https://wa.me/${formatPhoneWa(item.noWaPenerima)}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-mono">
                    {item.noWaPenerima}
                  </a>
                } />
              )}
              {item.keteranganSerahTerima && (
                <div className="mt-1">
                  <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-0.5">Keterangan</div>
                  <p className="text-sm text-brand-dark whitespace-pre-wrap">{item.keteranganSerahTerima}</p>
                </div>
              )}
              {item.fotoSerahTerima && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.fotoSerahTerima} alt="serah terima" className="w-full max-h-60 object-cover rounded-[8px] mt-2" />
              )}
            </Section>
          )}
        </div>

        <div className="px-5 py-4 border-t border-brand-muted/10 sticky bottom-0 bg-white flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-xs px-3 py-2 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faPaperPlane} /> WA Donatur
            </a>
            {item.gmapsPin && (
              <a
                href={item.gmapsPin}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-xs px-3 py-2 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 flex items-center justify-center gap-1.5"
              >
                <FontAwesomeIcon icon={faMapLocationDot} /> Buka Maps
              </a>
            )}
            {item.pic && (
              <a
                href={`https://wa.me/${formatPhoneWa(item.pic.noTelepon)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-xs px-3 py-2 rounded bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 flex items-center justify-center gap-1.5"
              >
                <FontAwesomeIcon icon={faPhone} /> WA PIC
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onTransit(item)}
              className="flex-1 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-[10px] hover:bg-purple-700 flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faTruck} /> Dalam Perjalanan
            </button>
            <button
              onClick={() => onDeliver(item)}
              className="flex-1 py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-[10px] hover:bg-emerald-600 flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faCheckDouble} /> Sudah Terkirim
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-[16px] md:rounded-[16px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-5 py-4 border-b border-brand-muted/10 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-serif text-base font-bold text-brand-dark flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleQuestion} className="text-brand-accent" /> Panduan Tim Lapangan
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-brand-light text-brand-muted">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 text-sm text-brand-dark">
          <Step n="1️⃣" title="Login">
            Masukkan kode akses yang diberikan koordinator.
          </Step>
          <Step n="2️⃣" title="Cek Daftar Pengiriman">
            <ul className="list-disc list-inside space-y-1 text-xs text-brand-muted">
              <li>Lihat semua pengiriman yang perlu diantar</li>
              <li>Filter berdasarkan tanggal atau nama PIC Anda</li>
              <li>Klik item untuk lihat detail lengkap</li>
            </ul>
          </Step>
          <Step n="3️⃣" title="Sebelum Berangkat">
            <ul className="list-disc list-inside space-y-1 text-xs text-brand-muted">
              <li>Cek tag hewan sesuai dengan nomor di sistem</li>
              <li>Buka Maps untuk cek rute</li>
              <li>Hubungi pemesan via WA untuk konfirmasi kedatangan</li>
            </ul>
          </Step>
          <Step n="4️⃣" title="Saat Berangkat">
            <ul className="list-disc list-inside space-y-1 text-xs text-brand-muted">
              <li>Klik tombol &quot;Dalam Perjalanan&quot;</li>
              <li>Isi PIC dan no kendaraan</li>
              <li>Sistem akan otomatis kirim WA ke pemesan</li>
            </ul>
          </Step>
          <Step n="5️⃣" title="Setelah Tiba">
            <ul className="list-disc list-inside space-y-1 text-xs text-brand-muted">
              <li>Klik &quot;Sudah Terkirim&quot;</li>
              <li>Upload foto serah terima (wajib)</li>
              <li>Pastikan pemesan menerima dengan baik</li>
            </ul>
          </Step>

          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-3 text-xs text-amber-900 leading-relaxed">
            <div className="font-bold mb-1">⚠️ PENTING</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Cocokkan nomor tag hewan sebelum serahkan</li>
              <li>Foto serah terima harus ada pemesan di dalamnya</li>
              <li>Hubungi koordinator jika ada masalah</li>
            </ul>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-brand-muted/10 sticky bottom-0 bg-white">
          <button onClick={onClose} className="w-full py-2.5 bg-brand-dark text-brand-accent-light font-bold text-sm rounded-[10px]">
            Mengerti
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-dark mb-1.5">{title}</h4>
      <div className="flex flex-col gap-1.5 text-sm">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start text-sm">
      <div className="text-[11px] text-brand-muted uppercase tracking-wider mt-0.5">{label}</div>
      <div className="col-span-2 text-brand-dark break-words">{value}</div>
    </div>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="text-2xl shrink-0">{n}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-brand-dark mb-1">{title}</div>
        <div className="text-xs text-brand-muted">{children}</div>
      </div>
    </div>
  )
}
