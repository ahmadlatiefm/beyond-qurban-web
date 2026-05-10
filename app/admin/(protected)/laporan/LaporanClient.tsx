'use client'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faEye, faDownload, faTrash, faPencil, faXmark,
  faImage, faUpload, faFloppyDisk, faFileLines,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { formatDate } from '@/lib/utils'
import { useAppToast } from '@/components/ui/AppToast'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import type { LaporanPenyaluran, Campaign } from '@prisma/client'

type LaporanWithCampaign = LaporanPenyaluran & { campaign: Campaign | null }
type CampaignLite = Pick<Campaign, 'id' | 'title' | 'location'>

interface FormState {
  id?: string
  campaignId: string
  judul: string
  tanggalKirim: string
  lokasi: string
  jumlahHewan: number
  jumlahPenerima: number | ''
  deskripsi: string
  fotoUrls: string[]
  tandaTerima: string
}

const EMPTY_FORM: FormState = {
  campaignId: '',
  judul: '',
  tanggalKirim: new Date().toISOString().slice(0, 10),
  lokasi: '',
  jumlahHewan: 1,
  jumlahPenerima: '',
  deskripsi: '',
  fotoUrls: [],
  tandaTerima: '',
}

function dateInputValue(d: Date | string): string {
  const date = new Date(d)
  return date.toISOString().slice(0, 10)
}

export default function LaporanClient({
  initialItems,
  campaigns,
}: {
  initialItems: LaporanWithCampaign[]
  campaigns: CampaignLite[]
}) {
  const router = useRouter()
  const appToast = useAppToast()
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [waModal, setWaModal] = useState<{ id: string; judul: string; lokasi: string } | null>(null)
  const [waPhone, setWaPhone] = useState('')
  const [waName, setWaName] = useState('')
  const [waAtasNama, setWaAtasNama] = useState('')
  const [uploading, setUploading] = useState(false)

  const stats = useMemo(() => ({
    total: items.length,
    totalHewan: items.reduce((s, l) => s + l.jumlahHewan, 0),
    totalPenerima: items.reduce((s, l) => s + (l.jumlahPenerima ?? 0), 0),
  }), [items])

  function openNewForm() {
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEditForm(item: LaporanWithCampaign) {
    const fotos = Array.isArray(item.fotoUrls) ? (item.fotoUrls as unknown as string[]) : []
    setForm({
      id: item.id,
      campaignId: item.campaignId ?? '',
      judul: item.judul,
      tanggalKirim: dateInputValue(item.tanggalKirim),
      lokasi: item.lokasi,
      jumlahHewan: item.jumlahHewan,
      jumlahPenerima: item.jumlahPenerima ?? '',
      deskripsi: item.deskripsi,
      fotoUrls: fotos,
      tandaTerima: item.tandaTerima ?? '',
    })
    setFormOpen(true)
  }

  async function handleUpload(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'laporan')
    const res = await fetch('/api/media-upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) {
      appToast.error(json.error || 'Upload gagal')
      return null
    }
    return json.url as string
  }

  async function handlePhotosUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (form.fotoUrls.length + files.length > 10) {
      appToast.warning('Maksimal 10 foto')
      return
    }
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const u = await handleUpload(file)
      if (u) urls.push(u)
    }
    setForm(f => ({ ...f, fotoUrls: [...f.fotoUrls, ...urls] }))
    setUploading(false)
  }

  async function handleTandaTerimaUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    const u = await handleUpload(file)
    if (u) setForm(f => ({ ...f, tandaTerima: u }))
    setUploading(false)
  }

  function movePhoto(idx: number, dir: -1 | 1) {
    setForm(f => {
      const next = [...f.fotoUrls]
      const target = idx + dir
      if (target < 0 || target >= next.length) return f
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...f, fotoUrls: next }
    })
  }

  function removePhoto(idx: number) {
    setForm(f => ({ ...f, fotoUrls: f.fotoUrls.filter((_, i) => i !== idx) }))
  }

  function handleSubmit() {
    const j = form.judul.trim()
    const l = form.lokasi.trim()
    const d = form.deskripsi.trim()
    if (!j || !l || !d) { appToast.warning('Judul, lokasi, dan deskripsi wajib diisi'); return }
    if (!Number.isFinite(form.jumlahHewan) || form.jumlahHewan < 1) { appToast.warning('Jumlah hewan minimal 1'); return }

    const payload = {
      campaignId: form.campaignId || null,
      judul: j,
      tanggalKirim: form.tanggalKirim,
      lokasi: l,
      jumlahHewan: Number(form.jumlahHewan),
      jumlahPenerima: form.jumlahPenerima === '' ? null : Number(form.jumlahPenerima),
      deskripsi: d,
      fotoUrls: form.fotoUrls,
      tandaTerima: form.tandaTerima || null,
    }

    startTransition(async () => {
      const url = form.id ? `/api/admin/laporan/${form.id}` : '/api/admin/laporan'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        appToast.error(json.error || 'Gagal menyimpan')
        return
      }
      appToast.success(form.id ? 'Laporan diperbarui' : 'Laporan dibuat. PDF siap diunduh.')
      setFormOpen(false)
      router.refresh()
      // Optimistic refresh from server data
      const fresh = await fetch('/api/admin/laporan').then(r => r.json()).catch(() => null)
      if (fresh?.items) setItems(fresh.items)
    })
  }

  function confirmDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/laporan/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        appToast.error('Gagal menghapus')
        return
      }
      setItems(prev => prev.filter(x => x.id !== deleteId))
      setDeleteId(null)
      appToast.success('Laporan dihapus')
      router.refresh()
    })
  }

  function openWaModal(item: LaporanWithCampaign) {
    setWaModal({ id: item.id, judul: item.judul, lokasi: item.lokasi })
    setWaName('')
    setWaPhone('')
    setWaAtasNama('')
  }

  function buildWaLink(): string {
    if (!waModal) return '#'
    const phoneDigits = waPhone.replace(/\D/g, '').replace(/^62/, '').replace(/^0/, '')
    const phone = phoneDigits ? `62${phoneDigits}` : ''
    const downloadUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/laporan/${waModal.id}/pdf`
    const msg =
`Assalamu'alaikum Kak ${waName || '[nama]'},

Alhamdulillah, berikut laporan penyaluran qurban atas nama ${waAtasNama || '[atas nama]'} yang telah kami salurkan di ${waModal.lokasi}.

Silakan unduh laporan lengkapnya di sini:
${downloadUrl}

Jazakallah khairan atas kepercayaan Kak ${waName || '[nama]'} 🤲`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Laporan Penyaluran</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola laporan distribusi qurban kepada pequrban</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-xs rounded-[8px] shadow-premium"
          >
            <FontAwesomeIcon icon={faPlus} /> Buat Laporan
          </button>
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[14px] p-5 shadow-premium border border-brand-muted/10">
            <div className="text-xs text-brand-muted">Total Laporan</div>
            <div className="font-serif text-2xl font-bold text-brand-dark mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-[14px] p-5 shadow-premium border border-brand-muted/10">
            <div className="text-xs text-brand-muted">Total Hewan Disalurkan</div>
            <div className="font-serif text-2xl font-bold text-brand-surface mt-1">{stats.totalHewan} ekor</div>
          </div>
          <div className="bg-white rounded-[14px] p-5 shadow-premium border border-brand-muted/10">
            <div className="text-xs text-brand-muted">Penerima Manfaat</div>
            <div className="font-serif text-2xl font-bold text-brand-accent mt-1">{stats.totalPenerima.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Judul', 'Campaign', 'Lokasi', 'Tanggal', 'Hewan', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-brand-muted/7 hover:bg-brand-light/40 transition-colors ${i % 2 === 1 ? 'bg-brand-light/20' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-brand-dark text-sm">{item.judul}</div>
                      {Array.isArray(item.fotoUrls) && (item.fotoUrls as unknown as string[]).length > 0 && (
                        <div className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
                          <FontAwesomeIcon icon={faImage} /> {(item.fotoUrls as unknown as string[]).length} foto
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-brand-dark">{item.campaign?.title ?? '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-muted">{item.lokasi}</td>
                    <td className="px-5 py-3.5 text-xs text-brand-muted">{formatDate(item.tanggalKirim)}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-dark font-bold">{item.jumlahHewan} ekor</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/api/admin/laporan/${item.id}/pdf`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-surface hover:text-brand-accent border border-brand-surface/30 hover:border-brand-accent px-3 py-1.5 rounded-[8px] transition-colors"
                          title="Preview/Download PDF"
                        >
                          <FontAwesomeIcon icon={faEye} /> PDF
                        </a>
                        <button
                          onClick={() => openWaModal(item)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#25D366] border border-[#25D366]/30 px-2.5 py-1.5 rounded-[8px] hover:bg-[#25D366] hover:text-white transition-colors"
                          title="Kirim via WhatsApp"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} /> Kirim WA
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="w-8 h-8 flex items-center justify-center bg-brand-light text-brand-muted hover:bg-brand-surface/10 hover:text-brand-surface border border-brand-muted/20 rounded-[8px]"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPencil} className="text-xs" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-[8px] hover:bg-red-100"
                          title="Hapus"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FontAwesomeIcon icon={faFileLines} className="text-3xl text-brand-muted/40" />
                      <p className="text-sm text-brand-muted">Belum ada laporan. Klik &quot;Buat Laporan&quot; untuk memulai.</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== FORM MODAL ===== */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setFormOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-3xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/15">
              <h2 className="font-serif text-lg font-bold text-brand-dark">
                {form.id ? 'Edit Laporan' : 'Buat Laporan Penyaluran'}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-brand-muted hover:text-brand-dark">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Section 1 — Info Dasar */}
              <section>
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">1. Info Dasar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-brand-muted mb-1">Judul Laporan *</label>
                    <input
                      type="text"
                      value={form.judul}
                      onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                      placeholder="Contoh: Penyaluran Qurban Pelosok Papua 1446 H"
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-muted mb-1">Link ke Campaign</label>
                    <select
                      value={form.campaignId}
                      onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm bg-white focus:outline-none focus:border-brand-surface"
                    >
                      <option value="">— Tidak terhubung —</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-brand-muted mb-1">Tanggal Penyaluran *</label>
                    <input
                      type="date"
                      value={form.tanggalKirim}
                      onChange={e => setForm(f => ({ ...f, tanggalKirim: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-brand-muted mb-1">Lokasi Penyaluran *</label>
                    <input
                      type="text"
                      value={form.lokasi}
                      onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                      placeholder="Desa Wamena, Kab. Jayawijaya, Papua"
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-muted mb-1">Jumlah Hewan *</label>
                    <input
                      type="number" min={1}
                      value={form.jumlahHewan}
                      onChange={e => setForm(f => ({ ...f, jumlahHewan: parseInt(e.target.value || '0') }))}
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-muted mb-1">Jumlah Penerima Manfaat</label>
                    <input
                      type="number" min={0}
                      value={form.jumlahPenerima}
                      onChange={e => setForm(f => ({ ...f, jumlahPenerima: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                      placeholder="Opsional"
                      className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 — Konten */}
              <section>
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">2. Konten Laporan</h3>
                <label className="block text-xs text-brand-muted mb-1">Deskripsi/Narasi Penyaluran *</label>
                <textarea
                  rows={8}
                  value={form.deskripsi}
                  onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  placeholder="Ceritakan proses penyaluran, kondisi penerima, perjalanan tim, dll. Pisahkan paragraf dengan baris kosong."
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                />
              </section>

              {/* Section 3 — Foto */}
              <section>
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">3. Foto Lapangan ({form.fotoUrls.length}/10)</h3>
                {form.fotoUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                    {form.fotoUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-[8px] overflow-hidden border border-brand-muted/20 bg-brand-light">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button onClick={() => movePhoto(idx, -1)} className="w-7 h-7 bg-white text-brand-dark rounded-full text-xs">←</button>
                          )}
                          {idx < form.fotoUrls.length - 1 && (
                            <button onClick={() => movePhoto(idx, 1)} className="w-7 h-7 bg-white text-brand-dark rounded-full text-xs">→</button>
                          )}
                          <button onClick={() => removePhoto(idx)} className="w-7 h-7 bg-red-500 text-white rounded-full text-xs"><FontAwesomeIcon icon={faXmark} /></button>
                        </div>
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">#{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-muted/30 rounded-[8px] cursor-pointer hover:bg-brand-light/50 text-sm text-brand-muted">
                  <FontAwesomeIcon icon={faUpload} />
                  {uploading ? 'Mengupload...' : 'Klik untuk upload foto (JPG/PNG/WebP, maks 3MB)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    disabled={uploading || form.fotoUrls.length >= 10}
                    onChange={e => { handlePhotosUpload(e.target.files); e.target.value = '' }}
                  />
                </label>
              </section>

              {/* Section 4 — Tanda Terima */}
              <section>
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">4. Tanda Terima (Opsional)</h3>
                {form.tandaTerima ? (
                  <div className="relative inline-block rounded-[8px] overflow-hidden border border-brand-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.tandaTerima} alt="Tanda terima" className="w-48 h-32 object-cover" />
                    <button
                      onClick={() => setForm(f => ({ ...f, tandaTerima: '' }))}
                      className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full text-xs"
                    ><FontAwesomeIcon icon={faXmark} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-muted/30 rounded-[8px] cursor-pointer hover:bg-brand-light/50 text-sm text-brand-muted max-w-sm">
                    <FontAwesomeIcon icon={faUpload} /> Upload foto tanda terima
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={e => { handleTandaTerimaUpload(e.target.files?.[0] ?? null); e.target.value = '' }}
                    />
                  </label>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-muted/15 flex gap-3 justify-end">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light"
              >
                Batal
              </button>
              {form.id && (
                <a
                  href={`/api/admin/laporan/${form.id}/pdf`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 border border-brand-surface/30 text-brand-surface rounded-[8px] text-sm font-bold hover:bg-brand-surface/5 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faEye} /> Preview PDF
                </a>
              )}
              <button
                onClick={handleSubmit}
                disabled={isPending || uploading}
                className="px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center gap-2 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> {isPending ? 'Menyimpan...' : 'Simpan & Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Hapus Laporan?</h3>
            <p className="text-brand-muted text-sm mb-6">Laporan ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px] hover:bg-red-600 disabled:opacity-60">
                {isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== KIRIM WA MODAL ===== */}
      {waModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setWaModal(null) }}>
          <div className="bg-white rounded-[16px] w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-brand-dark">Kirim Laporan via WhatsApp</h3>
              <button onClick={() => setWaModal(null)} className="text-brand-muted hover:text-brand-dark">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-brand-muted mb-1">No. WhatsApp Pequrban</label>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Nama Pequrban</label>
                <input
                  type="text"
                  value={waName}
                  onChange={e => setWaName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Atas Nama Qurban</label>
                <input
                  type="text"
                  value={waAtasNama}
                  onChange={e => setWaAtasNama(e.target.value)}
                  placeholder="Nama untuk niat qurban"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                />
              </div>
              <a
                href={buildWaLink()}
                target="_blank" rel="noopener noreferrer"
                onClick={() => setWaModal(null)}
                className={`mt-2 py-2.5 rounded-[8px] text-sm font-bold text-center flex items-center justify-center gap-2 ${
                  waPhone.replace(/\D/g, '').length >= 9
                    ? 'bg-[#25D366] text-white hover:bg-[#1ea857]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                <FontAwesomeIcon icon={faWhatsapp} /> Buka WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
