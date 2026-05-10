'use client'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faMagnifyingGlass, faPen, faTrash, faLink, faPaperPlane,
  faCircleCheck, faXmark, faFileExport, faTruck, faUserTie, faMobileScreen,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import {
  STATUS_BAYAR, STATUS_KIRIM,
  STATUS_BAYAR_LABEL, STATUS_BAYAR_CLS,
  STATUS_KIRIM_LABEL, STATUS_KIRIM_CLS,
  type StatusBayar, type StatusKirim,
} from '@/lib/pengiriman'

type PIC = {
  id: string
  nama: string
  noTelepon: string
  keterangan: string | null
  aktif: boolean
}

type Pengiriman = {
  id: string
  token: string
  namaPemesan: string | null
  noWhatsapp: string
  alamatLengkap: string | null
  kecamatan: string | null
  kota: string | null
  jenisHewan: string
  jumlahHewan: number
  beratHewan: string | null
  nomorTagHewan: string[] | unknown
  totalHarga: number
  statusBayar: string
  statusKirim: string
  formDiisi: boolean
  formDiisiAt: string | null
  tanggalKirim: string | null
  jamKirim: string | null
  requestTanggalKirim: string | null
  requestJamKirim: string | null
  atasNama: string | null
  catatan: string | null
  gmapsPin: string | null
  picId: string | null
  pic: PIC | null
  noKendaraan: string | null
  createdAt: string
}

/**
 * Customer's slot is auto-mirrored into tanggalKirim when admin hasn't set one.
 * If both date AND session match the request, treat the schedule as
 * "request-only" (admin hasn't actually confirmed).
 */
function isRequestOnly(p: Pengiriman): boolean {
  if (!p.requestTanggalKirim || !p.tanggalKirim) return false
  const sameDay =
    new Date(p.requestTanggalKirim).toISOString().slice(0, 10) ===
    new Date(p.tanggalKirim).toISOString().slice(0, 10)
  const sameSession = (p.requestJamKirim ?? null) === (p.jamKirim ?? null)
  return sameDay && sameSession
}

const emptyForm = {
  namaPemesan: '',
  noWhatsapp: '',
  alamatLengkap: '',
  kecamatan: '',
  kota: '',
  gmapsPin: '',
  catatan: '',
  jenisHewan: 'Domba',
  jumlahHewan: '1',
  beratHewan: '',
  nomorTagHewan: '',
  atasNama: '',
  totalHarga: '0',
  statusBayar: 'belum_bayar' as StatusBayar,
  jumlahDP: '',
  metodeBayar: '',
  tanggalKirim: '',
  jamKirim: '',
  statusKirim: 'menunggu_data' as StatusKirim,
  picId: '',
  noKendaraan: '',
}

function asTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String) } catch {}
  }
  return []
}

function originUrl() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function buildLink(token: string) {
  return `${originUrl()}/pengiriman/${token}`
}

function waLinkInvite(p: Pengiriman) {
  const link = buildLink(p.token)
  const nama = p.namaPemesan || 'Kak'
  const text = `Assalamu'alaikum Kak ${nama}, mohon lengkapi data pengiriman hewan qurban Anda melalui link berikut:\n${link}\nJazakallah khairan 🐑`
  const phone = p.noWhatsapp.replace(/\D/g, '').replace(/^0/, '62')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export default function PengirimanClient({
  initialItems,
  initialPics,
}: {
  initialItems: Pengiriman[]
  initialPics: PIC[]
}) {
  const [items, setItems] = useState<Pengiriman[]>(initialItems)
  const [pics] = useState<PIC[]>(initialPics)
  const activePics = useMemo(() => pics.filter((p) => p.aktif), [pics])
  const [search, setSearch] = useState('')
  const [filterBayar, setFilterBayar] = useState<string>('')
  const [filterKirim, setFilterKirim] = useState<string>('')
  const [filterTanggal, setFilterTanggal] = useState<string>('')
  const [filterPic, setFilterPic] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; item: Pengiriman | null }>({ open: false, item: null })
  const [confirmDel, setConfirmDel] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return items.filter((p) => {
      if (s) {
        const hay = `${p.namaPemesan ?? ''} ${p.noWhatsapp} ${p.atasNama ?? ''}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (filterBayar && p.statusBayar !== filterBayar) return false
      if (filterKirim && p.statusKirim !== filterKirim) return false
      if (filterTanggal) {
        if (!p.tanggalKirim) return false
        const d = new Date(p.tanggalKirim).toISOString().slice(0, 10)
        if (d !== filterTanggal) return false
      }
      if (filterPic) {
        if (filterPic === '__none__') {
          if (p.picId) return false
        } else if (p.picId !== filterPic) return false
      }
      return true
    })
  }, [items, search, filterBayar, filterKirim, filterTanggal, filterPic])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: Pengiriman) {
    setEditingId(p.id)
    setForm({
      namaPemesan: p.namaPemesan ?? '',
      noWhatsapp: p.noWhatsapp,
      alamatLengkap: p.alamatLengkap ?? '',
      kecamatan: p.kecamatan ?? '',
      kota: p.kota ?? '',
      gmapsPin: p.gmapsPin ?? '',
      catatan: p.catatan ?? '',
      jenisHewan: p.jenisHewan,
      jumlahHewan: String(p.jumlahHewan),
      beratHewan: p.beratHewan ?? '',
      nomorTagHewan: asTags(p.nomorTagHewan).join(', '),
      atasNama: p.atasNama ?? '',
      totalHarga: String(p.totalHarga),
      statusBayar: p.statusBayar as StatusBayar,
      jumlahDP: '',
      metodeBayar: '',
      tanggalKirim: p.tanggalKirim ? new Date(p.tanggalKirim).toISOString().slice(0, 10) : '',
      jamKirim: p.jamKirim ?? '',
      statusKirim: p.statusKirim as StatusKirim,
      picId: p.picId ?? '',
      noKendaraan: p.noKendaraan ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.noWhatsapp.trim()) {
      showToast('No WhatsApp wajib diisi')
      return
    }
    const payload = {
      ...form,
      jumlahHewan: Number(form.jumlahHewan) || 1,
      totalHarga: Number(form.totalHarga) || 0,
      jumlahDP: form.jumlahDP ? Number(form.jumlahDP) : null,
      tanggalKirim: form.tanggalKirim || null,
      picId: form.picId || null,
      noKendaraan: form.noKendaraan.trim() || null,
      nomorTagHewan: form.nomorTagHewan
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await fetch(`/api/admin/pengiriman/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error()
          const updated = await res.json()
          setItems((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)))
          showToast('Data pengiriman diperbarui')
          setModalOpen(false)
        } else {
          const res = await fetch('/api/admin/pengiriman', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error()
          const created: Pengiriman = await res.json()
          setItems((prev) => [created, ...prev])
          setModalOpen(false)
          setLinkDialog({ open: true, item: created })
        }
      } catch {
        showToast('Gagal menyimpan')
      }
    })
  }

  async function handleDelete() {
    const id = confirmDel.id
    if (!id) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/pengiriman/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id))
        showToast('Data dihapus')
      } else {
        showToast('Gagal menghapus')
      }
      setConfirmDel({ open: false, id: '', name: '' })
    })
  }

  async function notifyPic(id: string) {
    try {
      const res = await fetch('/api/admin/pengiriman/notify-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengirimanId: id, mode: 'task' }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data?.error || 'Gagal generate pesan')
        return
      }
      window.open(data.url, '_blank')
      showToast('Link WA PIC dibuka')
    } catch {
      showToast('Gagal terhubung')
    }
  }

  function copyLink(token: string) {
    const url = buildLink(token)
    navigator.clipboard.writeText(url).then(
      () => showToast('Link disalin'),
      () => showToast('Gagal menyalin'),
    )
  }

  function exportExcel() {
    const headers = [
      'Nama', 'WhatsApp', 'Hewan', 'Jumlah', 'Tag',
      'Total', 'Status Bayar', 'Status Kirim', 'PIC', 'No Kendaraan',
      'Tanggal Kirim', 'Form Diisi', 'Alamat',
    ]
    const rows = filtered.map((p) => [
      p.namaPemesan ?? '',
      p.noWhatsapp,
      p.jenisHewan,
      p.jumlahHewan,
      asTags(p.nomorTagHewan).join('|'),
      p.totalHarga,
      STATUS_BAYAR_LABEL[p.statusBayar as StatusBayar] ?? p.statusBayar,
      STATUS_KIRIM_LABEL[p.statusKirim as StatusKirim] ?? p.statusKirim,
      p.pic ? `${p.pic.nama} (${p.pic.noTelepon})` : '',
      p.noKendaraan ?? '',
      p.tanggalKirim ? new Date(p.tanggalKirim).toLocaleDateString('id-ID') : '',
      p.formDiisi ? 'Ya' : 'Belum',
      [p.alamatLengkap, p.kecamatan, p.kota].filter(Boolean).join(', '),
    ])
    const csv =
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pengiriman-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div className="px-5 md:px-8 py-5 md:py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-dark flex items-center gap-2">
              <FontAwesomeIcon icon={faTruck} className="text-brand-accent" />
              Pengiriman
            </h1>
            <p className="text-xs text-brand-muted mt-1">Kelola pengiriman hewan qurban — offline & online.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/pengiriman/pic" className="px-3 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-dark hover:bg-brand-light flex items-center gap-2">
              <FontAwesomeIcon icon={faUserTie} /> Kelola PIC
            </Link>
            <button onClick={exportExcel} className="px-3 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-dark hover:bg-brand-light flex items-center gap-2">
              <FontAwesomeIcon icon={faFileExport} /> Export
            </button>
            <button onClick={openAdd} className="px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center gap-2 shadow-premium">
              <FontAwesomeIcon icon={faPlus} /> Tambah
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[12px] border border-brand-muted/10 p-3 md:p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / WA / atas nama..."
              className="inp pl-8"
            />
          </div>
          <select value={filterBayar} onChange={(e) => setFilterBayar(e.target.value)} className="inp">
            <option value="">Semua status bayar</option>
            {STATUS_BAYAR.map((s) => (
              <option key={s} value={s}>{STATUS_BAYAR_LABEL[s]}</option>
            ))}
          </select>
          <select value={filterKirim} onChange={(e) => setFilterKirim(e.target.value)} className="inp">
            <option value="">Semua status kirim</option>
            {STATUS_KIRIM.map((s) => (
              <option key={s} value={s}>{STATUS_KIRIM_LABEL[s]}</option>
            ))}
          </select>
          <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="inp" />
          <select value={filterPic} onChange={(e) => setFilterPic(e.target.value)} className="inp">
            <option value="">Semua PIC</option>
            <option value="__none__">Belum ada PIC</option>
            {pics.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}{p.aktif ? '' : ' (nonaktif)'}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[12px] border border-brand-muted/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-light text-brand-dark text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2.5 w-10">No</th>
                <th className="text-left px-3 py-2.5">Nama</th>
                <th className="text-left px-3 py-2.5">WA</th>
                <th className="text-left px-3 py-2.5">Hewan</th>
                <th className="text-left px-3 py-2.5">Tag</th>
                <th className="text-right px-3 py-2.5">Total</th>
                <th className="text-left px-3 py-2.5">Bayar</th>
                <th className="text-left px-3 py-2.5">Kirim</th>
                <th className="text-left px-3 py-2.5">PIC</th>
                <th className="text-left px-3 py-2.5">Form</th>
                <th className="text-left px-3 py-2.5">Tgl Kirim</th>
                <th className="text-left px-3 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-brand-muted text-xs">
                    Belum ada data pengiriman.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const tags = asTags(p.nomorTagHewan)
                  const phone = p.noWhatsapp.replace(/\D/g, '').replace(/^0/, '62')
                  return (
                    <tr key={p.id} className="border-t border-brand-muted/10 hover:bg-brand-light/50">
                      <td className="px-3 py-2 text-xs text-brand-muted">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-brand-dark">{p.namaPemesan || '—'}</div>
                        <div className="text-[11px] text-brand-muted">{p.atasNama ? `a/n ${p.atasNama}` : ''}</div>
                      </td>
                      <td className="px-3 py-2">
                        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="text-brand-accent hover:underline">{p.noWhatsapp}</a>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.jumlahHewan}× {p.jenisHewan}</td>
                      <td className="px-3 py-2">
                        {tags.length === 0 ? <span className="text-xs text-brand-muted">—</span> : (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((t) => (
                              <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{t}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(p.totalHarga)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BAYAR_CLS[p.statusBayar as StatusBayar] ?? 'bg-slate-100 text-slate-700'}`}>
                          {STATUS_BAYAR_LABEL[p.statusBayar as StatusBayar] ?? p.statusBayar}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_KIRIM_CLS[p.statusKirim as StatusKirim] ?? 'bg-slate-100 text-slate-700'}`}>
                          {STATUS_KIRIM_LABEL[p.statusKirim as StatusKirim] ?? p.statusKirim}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {p.pic ? (
                          <span className="text-xs text-brand-dark font-medium">{p.pic.nama}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {p.formDiisi ? (
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Sudah ✓</span>
                        ) : (
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Belum ⏳</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {p.tanggalKirim ? (
                          isRequestOnly(p) ? (
                            <span className="text-blue-700 italic" title="Request konsumen — belum dikonfirmasi admin">
                              Req: {new Date(p.tanggalKirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {p.jamKirim ? ` · ${p.jamKirim}` : ''}
                            </span>
                          ) : (
                            <span>{new Date(p.tanggalKirim).toLocaleDateString('id-ID')}{p.jamKirim ? ` · ${p.jamKirim}` : ''}</span>
                          )
                        ) : (
                          <span className="text-brand-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Link href={`/admin/pengiriman/${p.id}`} className="px-2 py-1 text-[11px] rounded bg-brand-light text-brand-dark hover:bg-brand-muted/10">Detail</Link>
                          <button onClick={() => openEdit(p)} className="px-2 py-1 text-[11px] rounded bg-brand-light text-brand-dark hover:bg-brand-muted/10" aria-label="Edit"><FontAwesomeIcon icon={faPen} /></button>
                          <button onClick={() => copyLink(p.token)} className="px-2 py-1 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100" aria-label="Salin Link"><FontAwesomeIcon icon={faLink} /></button>
                          <a href={waLinkInvite(p)} target="_blank" rel="noreferrer" className="px-2 py-1 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100" aria-label="Kirim WA ke konsumen" title="Kirim WA ke konsumen"><FontAwesomeIcon icon={faPaperPlane} /></a>
                          {p.picId && (
                            <button onClick={() => notifyPic(p.id)} className="px-2 py-1 text-[11px] rounded bg-amber-50 text-amber-700 hover:bg-amber-100" aria-label="Kirim notif ke PIC" title="Kirim notif ke PIC"><FontAwesomeIcon icon={faMobileScreen} /></button>
                          )}
                          <button onClick={() => setConfirmDel({ open: true, id: p.id, name: p.namaPemesan || p.noWhatsapp })} className="px-2 py-1 text-[11px] rounded bg-red-50 text-red-600 hover:bg-red-100" aria-label="Hapus"><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-brand-muted/10 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-serif text-lg font-bold text-brand-dark">{editingId ? 'Edit Pengiriman' : 'Tambah Pengiriman'}</h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center text-brand-muted">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Identitas Pemesan" full>
                <Field label="Nama Pemesan">
                  <input className="inp" value={form.namaPemesan} onChange={(e) => setForm((f) => ({ ...f, namaPemesan: e.target.value }))} />
                </Field>
                <Field label="No WhatsApp *">
                  <input className="inp" value={form.noWhatsapp} onChange={(e) => setForm((f) => ({ ...f, noWhatsapp: e.target.value }))} placeholder="08xxxxxxxxxx" />
                </Field>
                <Field label="Atas Nama Qurban">
                  <input className="inp" value={form.atasNama} onChange={(e) => setForm((f) => ({ ...f, atasNama: e.target.value }))} />
                </Field>
                <Field label="Alamat Lengkap" wide>
                  <textarea rows={2} className="inp" value={form.alamatLengkap} onChange={(e) => setForm((f) => ({ ...f, alamatLengkap: e.target.value }))} />
                </Field>
                <Field label="Kecamatan">
                  <input className="inp" value={form.kecamatan} onChange={(e) => setForm((f) => ({ ...f, kecamatan: e.target.value }))} />
                </Field>
                <Field label="Kota">
                  <input className="inp" value={form.kota} onChange={(e) => setForm((f) => ({ ...f, kota: e.target.value }))} />
                </Field>
                <Field label="Pin Google Maps" wide>
                  <input className="inp" value={form.gmapsPin} onChange={(e) => setForm((f) => ({ ...f, gmapsPin: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
                </Field>
                <Field label="Catatan" wide>
                  <textarea rows={2} className="inp" value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
                </Field>
              </Section>

              <Section title="Data Hewan" full>
                <Field label="Jenis Hewan">
                  <input className="inp" value={form.jenisHewan} onChange={(e) => setForm((f) => ({ ...f, jenisHewan: e.target.value }))} />
                </Field>
                <Field label="Jumlah">
                  <input type="number" min={1} className="inp" value={form.jumlahHewan} onChange={(e) => setForm((f) => ({ ...f, jumlahHewan: e.target.value }))} />
                </Field>
                <Field label="Berat">
                  <input className="inp" value={form.beratHewan} onChange={(e) => setForm((f) => ({ ...f, beratHewan: e.target.value }))} placeholder="25 kg" />
                </Field>
                <Field label="Nomor Tag (pisahkan dengan koma)" wide>
                  <input className="inp" value={form.nomorTagHewan} onChange={(e) => setForm((f) => ({ ...f, nomorTagHewan: e.target.value }))} placeholder="TAG-001, TAG-002" />
                </Field>
              </Section>

              <Section title="Pembayaran" full>
                <Field label="Total Harga">
                  <input type="number" className="inp" value={form.totalHarga} onChange={(e) => setForm((f) => ({ ...f, totalHarga: e.target.value }))} />
                </Field>
                <Field label="Status Bayar">
                  <select className="inp" value={form.statusBayar} onChange={(e) => setForm((f) => ({ ...f, statusBayar: e.target.value as StatusBayar }))}>
                    {STATUS_BAYAR.map((s) => (
                      <option key={s} value={s}>{STATUS_BAYAR_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Jumlah DP">
                  <input type="number" className="inp" value={form.jumlahDP} onChange={(e) => setForm((f) => ({ ...f, jumlahDP: e.target.value }))} />
                </Field>
                <Field label="Metode">
                  <input className="inp" value={form.metodeBayar} onChange={(e) => setForm((f) => ({ ...f, metodeBayar: e.target.value }))} placeholder="Transfer BCA / Cash" />
                </Field>
              </Section>

              <Section title="Pengiriman" full>
                <Field label="Tanggal Kirim">
                  <input type="date" className="inp" value={form.tanggalKirim} onChange={(e) => setForm((f) => ({ ...f, tanggalKirim: e.target.value }))} />
                </Field>
                <Field label="Jam Kirim">
                  <input type="time" className="inp" value={form.jamKirim} onChange={(e) => setForm((f) => ({ ...f, jamKirim: e.target.value }))} />
                </Field>
                <Field label="PIC Pengiriman" wide>
                  <select className="inp" value={form.picId} onChange={(e) => setForm((f) => ({ ...f, picId: e.target.value }))}>
                    <option value="">— Pilih PIC —</option>
                    {activePics.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama} — {p.noTelepon}</option>
                    ))}
                  </select>
                  {activePics.length === 0 && (
                    <p className="text-[11px] text-amber-700 mt-1">Belum ada PIC aktif. <Link href="/admin/pengiriman/pic" className="underline">Kelola PIC</Link></p>
                  )}
                </Field>
                <Field label="No Kendaraan">
                  <input className="inp" value={form.noKendaraan} onChange={(e) => setForm((f) => ({ ...f, noKendaraan: e.target.value }))} placeholder="B 1234 ABC" />
                </Field>
                <Field label="Status Kirim" wide>
                  <select className="inp" value={form.statusKirim} onChange={(e) => setForm((f) => ({ ...f, statusKirim: e.target.value as StatusKirim }))}>
                    {STATUS_KIRIM.map((s) => (
                      <option key={s} value={s}>{STATUS_KIRIM_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
              </Section>
            </div>
            <div className="px-6 py-4 border-t border-brand-muted/10 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] shadow-premium">
                {editingId ? 'Simpan' : 'Buat & Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link dialog after create */}
      {linkDialog.open && linkDialog.item && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLinkDialog({ open: false, item: null }) }}>
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
              <h3 className="font-serif text-lg font-bold text-brand-dark">Link konsumen sudah dibuat!</h3>
            </div>
            <p className="text-xs text-brand-muted mb-3">Bagikan link ini agar konsumen bisa melengkapi data pengiriman.</p>
            <div className="bg-brand-light rounded-[8px] px-3 py-2 text-xs font-mono break-all mb-4">
              {buildLink(linkDialog.item.token)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyLink(linkDialog.item!.token)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium hover:bg-brand-light flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faLink} /> Copy Link
              </button>
              <a href={waLinkInvite(linkDialog.item)} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-[8px] flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faPaperPlane} /> Kirim via WA
              </a>
            </div>
            <button onClick={() => setLinkDialog({ open: false, item: null })} className="w-full mt-3 text-xs text-brand-muted hover:text-brand-dark">Tutup</button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel.open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDel({ open: false, id: '', name: '' }) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faTrash} className="text-red-500" />
            </div>
            <h3 className="font-serif text-base font-bold text-brand-dark mb-1">Hapus Data?</h3>
            <p className="text-xs text-brand-muted mb-5">Data pengiriman <strong>{confirmDel.name}</strong> akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel({ open: false, id: '', name: '' })} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px]">Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faCircleCheck} className="text-brand-accent" /> {toast.msg}
      </div>
    </>
  )
}

function Section({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-brand-dark block mb-1">{label}</label>
      {children}
    </div>
  )
}
