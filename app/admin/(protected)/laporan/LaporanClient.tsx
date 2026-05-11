'use client'
import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faEye, faTrash, faPencil, faXmark, faImage, faUpload, faFloppyDisk,
  faFileLines, faGear, faArrowLeft, faArrowRight, faCheck, faUsers,
  faCamera, faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { formatDate } from '@/lib/utils'
import { useAppToast } from '@/components/ui/AppToast'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import type { LaporanPenyaluran, Campaign } from '@prisma/client'

type LaporanWithMeta = LaporanPenyaluran & {
  campaign: Campaign | null
  donaturCount: number
  donaturWithFotoCount: number
}
type CampaignLite = Pick<Campaign, 'id' | 'title' | 'location' | 'animalType'>

interface DonaturPaid {
  id: string
  orderNumber: string
  nama: string
  noWa: string
  jumlah: number
  atasNama: string
  animalType: string
}

interface EditFormState {
  id: string
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

interface WizardState {
  step: 1 | 2 | 3
  judul: string
  campaignId: string
  tanggalKirim: string
  lokasi: string
  deskripsi: string
  jumlahPenerima: number | ''
  fotoUrls: string[]
  donaturPaid: DonaturPaid[]
  campaignTotalHewan: number
  loadingDonatur: boolean
}

const EMPTY_WIZARD: WizardState = {
  step: 1,
  judul: '',
  campaignId: '',
  tanggalKirim: new Date().toISOString().slice(0, 10),
  lokasi: '',
  deskripsi: '',
  jumlahPenerima: '',
  fotoUrls: [],
  donaturPaid: [],
  campaignTotalHewan: 0,
  loadingDonatur: false,
}

const LOCATION_LABEL: Record<string, string> = {
  INDONESIA: 'Pelosok Indonesia',
  AFRICA: 'Afrika Sub-Sahara',
  PALESTINE: 'Palestina',
}

function dateInputValue(d: Date | string): string {
  const date = new Date(d)
  return date.toISOString().slice(0, 10)
}

export default function LaporanClient({
  initialItems,
  campaigns,
}: {
  initialItems: LaporanWithMeta[]
  campaigns: CampaignLite[]
}) {
  const router = useRouter()
  const appToast = useAppToast()
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()

  // Wizard (Buat Laporan)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizard, setWizard] = useState<WizardState>(EMPTY_WIZARD)

  // Edit modal
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [editUploading, setEditUploading] = useState(false)

  // Delete & WA modals
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [waModal, setWaModal] = useState<{ id: string; judul: string; lokasi: string } | null>(null)
  const [waPhone, setWaPhone] = useState('')
  const [waName, setWaName] = useState('')
  const [waAtasNama, setWaAtasNama] = useState('')

  const [uploading, setUploading] = useState(false)

  // PDF Semua confirmation
  const [pdfAllConfirm, setPdfAllConfirm] = useState<{ id: string; donaturCount: number } | null>(null)
  const [pdfAllSending, setPdfAllSending] = useState(false)

  const stats = useMemo(() => ({
    total: items.length,
    totalHewan: items.reduce((s, l) => s + l.jumlahHewan, 0),
    totalPenerima: items.reduce((s, l) => s + (l.jumlahPenerima ?? 0), 0),
  }), [items])

  // ─── Buat Laporan (wizard) ────────────────────────────────────────────────
  function openWizard() {
    setWizard({ ...EMPTY_WIZARD, tanggalKirim: new Date().toISOString().slice(0, 10) })
    setWizardOpen(true)
  }

  function closeWizard() {
    setWizardOpen(false)
  }

  async function loadDonaturForCampaign(campaignId: string) {
    if (!campaignId) {
      setWizard(w => ({ ...w, donaturPaid: [], campaignTotalHewan: 0 }))
      return
    }
    setWizard(w => ({ ...w, loadingDonatur: true }))
    try {
      const res = await fetch(`/api/admin/campaign/${campaignId}/donatur-paid`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat donatur')
      setWizard(w => ({
        ...w,
        donaturPaid: json.donatur as DonaturPaid[],
        campaignTotalHewan: Number(json.totalHewan ?? 0),
        loadingDonatur: false,
      }))
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : 'Gagal memuat donatur')
      setWizard(w => ({ ...w, loadingDonatur: false, donaturPaid: [], campaignTotalHewan: 0 }))
    }
  }

  function onWizardCampaignChange(id: string) {
    const c = campaigns.find(x => x.id === id)
    const lokasiDefault = c ? (LOCATION_LABEL[c.location] ?? c.title) : ''
    setWizard(w => ({
      ...w,
      campaignId: id,
      lokasi: w.lokasi || lokasiDefault,
    }))
    loadDonaturForCampaign(id)
  }

  async function uploadOne(file: File): Promise<string | null> {
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

  async function wizardHandleFotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = 4 - wizard.fotoUrls.length
    if (remaining <= 0) {
      appToast.warning('Maksimal 4 foto distribusi')
      return
    }
    const slice = Array.from(files).slice(0, remaining)
    setUploading(true)
    const urls: string[] = []
    for (const f of slice) {
      const u = await uploadOne(f)
      if (u) urls.push(u)
    }
    setWizard(w => ({ ...w, fotoUrls: [...w.fotoUrls, ...urls] }))
    setUploading(false)
  }

  function wizardRemoveFoto(idx: number) {
    setWizard(w => ({ ...w, fotoUrls: w.fotoUrls.filter((_, i) => i !== idx) }))
  }

  function wizardCanProceed1(): boolean {
    return !!(wizard.judul.trim() && wizard.campaignId && wizard.tanggalKirim && wizard.lokasi.trim())
  }
  function wizardCanProceed2(): boolean {
    return wizard.fotoUrls.length >= 2
  }

  function wizardNext() {
    if (wizard.step === 1) {
      if (!wizardCanProceed1()) {
        appToast.warning('Lengkapi judul, campaign, tanggal & lokasi')
        return
      }
      if (wizard.donaturPaid.length === 0) {
        appToast.warning('Belum ada donatur PAID di campaign ini')
        return
      }
      setWizard(w => ({ ...w, step: 2 }))
    } else if (wizard.step === 2) {
      if (!wizardCanProceed2()) {
        appToast.warning('Upload minimal 2 foto distribusi')
        return
      }
      setWizard(w => ({ ...w, step: 3 }))
    }
  }

  function wizardBack() {
    setWizard(w => ({ ...w, step: (Math.max(1, w.step - 1)) as 1 | 2 | 3 }))
  }

  async function wizardSubmit() {
    const totalHewan = wizard.donaturPaid.reduce((s, d) => s + d.jumlah, 0)
    const payload = {
      campaignId: wizard.campaignId,
      judul: wizard.judul.trim(),
      tanggalKirim: wizard.tanggalKirim,
      lokasi: wizard.lokasi.trim(),
      jumlahHewan: totalHewan || 1,
      jumlahPenerima: wizard.jumlahPenerima === '' ? null : Number(wizard.jumlahPenerima),
      deskripsi: wizard.deskripsi.trim() || `Penyaluran qurban di ${wizard.lokasi.trim()}`,
      fotoUrls: wizard.fotoUrls,
      tandaTerima: null,
      autoLinkDonatur: true,
    }

    startTransition(async () => {
      const res = await fetch('/api/admin/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        appToast.error(json.error || 'Gagal membuat laporan')
        return
      }
      const laporan = json.item || json.laporan
      const count = Number(json.donaturCount ?? 0)
      appToast.success(`Laporan dibuat! ${count} donatur ditemukan.`)
      setWizardOpen(false)
      router.push(`/admin/laporan/assign?campaignId=${wizard.campaignId}&laporanId=${laporan.id}`)
    })
  }

  // ─── Edit Laporan ─────────────────────────────────────────────────────────
  function openEdit(item: LaporanWithMeta) {
    const fotos = Array.isArray(item.fotoUrls) ? (item.fotoUrls as unknown as string[]) : []
    setEditForm({
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
  }

  async function editUploadFoto(files: FileList | null) {
    if (!editForm || !files || files.length === 0) return
    const remaining = 10 - editForm.fotoUrls.length
    if (remaining <= 0) { appToast.warning('Maksimal 10 foto'); return }
    setEditUploading(true)
    const urls: string[] = []
    for (const f of Array.from(files).slice(0, remaining)) {
      const u = await uploadOne(f)
      if (u) urls.push(u)
    }
    setEditForm(f => f ? { ...f, fotoUrls: [...f.fotoUrls, ...urls] } : f)
    setEditUploading(false)
  }

  function editMoveFoto(idx: number, dir: -1 | 1) {
    setEditForm(f => {
      if (!f) return f
      const next = [...f.fotoUrls]
      const target = idx + dir
      if (target < 0 || target >= next.length) return f
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...f, fotoUrls: next }
    })
  }

  function editRemoveFoto(idx: number) {
    setEditForm(f => f ? { ...f, fotoUrls: f.fotoUrls.filter((_, i) => i !== idx) } : f)
  }

  async function editUploadTandaTerima(file: File | null) {
    if (!editForm || !file) return
    setEditUploading(true)
    const u = await uploadOne(file)
    if (u) setEditForm(f => f ? { ...f, tandaTerima: u } : f)
    setEditUploading(false)
  }

  function editSubmit() {
    if (!editForm) return
    const payload = {
      campaignId: editForm.campaignId || null,
      judul: editForm.judul.trim(),
      tanggalKirim: editForm.tanggalKirim,
      lokasi: editForm.lokasi.trim(),
      jumlahHewan: Number(editForm.jumlahHewan),
      jumlahPenerima: editForm.jumlahPenerima === '' ? null : Number(editForm.jumlahPenerima),
      deskripsi: editForm.deskripsi.trim(),
      fotoUrls: editForm.fotoUrls,
      tandaTerima: editForm.tandaTerima || null,
    }
    if (!payload.judul || !payload.lokasi) {
      appToast.warning('Judul dan lokasi wajib diisi')
      return
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/laporan/${editForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        appToast.error(json.error || 'Gagal menyimpan')
        return
      }
      appToast.success('Laporan diperbarui')
      setEditForm(null)
      router.refresh()
      const fresh = await fetch('/api/admin/laporan').then(r => r.json()).catch(() => null)
      if (fresh?.items) refreshItemsFromResponse(fresh.items)
    })
  }

  function refreshItemsFromResponse(rawItems: unknown[]) {
    const mapped: LaporanWithMeta[] = (rawItems as Array<LaporanPenyaluran & { campaign: Campaign | null; laporanDonatur?: Array<{ id: string; fotoPenyembelihan: unknown }> }>).map(it => {
      const linked = it.laporanDonatur ?? []
      const fotoCount = linked.filter(ld => {
        const arr = (ld.fotoPenyembelihan as unknown as string[]) ?? []
        return Array.isArray(arr) && arr.length > 0
      }).length
      const rest = { ...it }
      delete (rest as { laporanDonatur?: unknown }).laporanDonatur
      return {
        ...(rest as LaporanPenyaluran & { campaign: Campaign | null }),
        donaturCount: linked.length,
        donaturWithFotoCount: fotoCount,
      }
    })
    setItems(mapped)
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/laporan/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) { appToast.error('Gagal menghapus'); return }
      setItems(prev => prev.filter(x => x.id !== deleteId))
      setDeleteId(null)
      appToast.success('Laporan dihapus')
      router.refresh()
    })
  }

  // ─── PDF Semua ────────────────────────────────────────────────────────────
  async function sendAllPdf(laporanId: string) {
    const laporan = items.find(it => it.id === laporanId)
    if (!laporan?.campaignId) {
      appToast.error('Laporan ini tidak terhubung dengan campaign')
      return
    }
    setPdfAllSending(true)
    try {
      const res = await fetch('/api/admin/laporan/kirim-semua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: laporan.campaignId, laporanId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim')
      const berhasil = json.berhasil ?? 0
      const gagal = json.gagal ?? 0
      appToast.success(`Selesai. ${berhasil} terkirim, ${gagal} gagal.`)
      setPdfAllConfirm(null)
      router.refresh()
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : 'Gagal mengirim')
    } finally {
      setPdfAllSending(false)
    }
  }

  // ─── WA Kirim Laporan ─────────────────────────────────────────────────────
  function openWaModal(item: LaporanWithMeta) {
    setWaModal({ id: item.id, judul: item.judul, lokasi: item.lokasi })
    setWaName(''); setWaPhone(''); setWaAtasNama('')
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Laporan Penyaluran</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola laporan distribusi qurban kepada pequrban</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pengaturan/laporan"
            className="flex items-center gap-2 px-4 py-2 border border-brand-muted/20 text-brand-dark font-bold text-xs rounded-[8px] hover:bg-brand-light"
          >
            <FontAwesomeIcon icon={faGear} /> Edit Template
          </Link>
          <button
            onClick={openWizard}
            className="flex items-center gap-2 px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-xs rounded-[8px] shadow-premium"
          >
            <FontAwesomeIcon icon={faPlus} /> Buat Laporan
          </button>
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6">
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

        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Judul', 'Campaign', 'Lokasi', 'Tanggal', 'Hewan', 'Donatur', 'Foto Sembelih', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const fotosCount = Array.isArray(item.fotoUrls) ? (item.fotoUrls as unknown as string[]).length : 0
                  return (
                    <tr key={item.id} className={`border-b border-brand-muted/7 hover:bg-brand-light/40 transition-colors ${i % 2 === 1 ? 'bg-brand-light/20' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-brand-dark text-sm">{item.judul}</div>
                        {fotosCount > 0 && (
                          <div className="text-[11px] text-brand-muted mt-0.5 flex items-center gap-1">
                            <FontAwesomeIcon icon={faImage} /> {fotosCount} foto distribusi
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-brand-dark">{item.campaign?.title ?? '-'}</td>
                      <td className="px-4 py-3.5 text-sm text-brand-muted">{item.lokasi}</td>
                      <td className="px-4 py-3.5 text-xs text-brand-muted">{formatDate(item.tanggalKirim)}</td>
                      <td className="px-4 py-3.5 text-sm text-brand-dark font-bold">{item.jumlahHewan} ekor</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-brand-dark">{item.donaturCount}</span>
                        <span className="text-xs text-brand-muted"> ter-link</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.donaturCount > 0 ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.donaturWithFotoCount === item.donaturCount ? 'bg-emerald-100 text-emerald-700' : item.donaturWithFotoCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {item.donaturWithFotoCount}/{item.donaturCount}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/admin/laporan/assign?campaignId=${item.campaignId ?? ''}&laporanId=${item.id}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-brand-dark bg-brand-accent-light/40 border border-brand-accent-light px-2.5 py-1.5 rounded-[8px] hover:bg-brand-accent-light"
                            title="Assign Foto Penyembelihan"
                          >
                            <FontAwesomeIcon icon={faCamera} /> Assign Foto
                          </Link>
                          <button
                            onClick={() => setPdfAllConfirm({ id: item.id, donaturCount: item.donaturCount })}
                            disabled={item.donaturCount === 0}
                            className="flex items-center gap-1 text-[11px] font-bold text-brand-surface border border-brand-surface/30 px-2.5 py-1.5 rounded-[8px] hover:bg-brand-surface/5 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Kirim PDF ke semua donatur"
                          >
                            <FontAwesomeIcon icon={faPaperPlane} /> PDF Semua
                          </button>
                          <a
                            href={`/api/admin/laporan/${item.id}/pdf`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-brand-dark border border-brand-muted/20 px-2.5 py-1.5 rounded-[8px] hover:bg-brand-light"
                            title="Preview PDF Laporan"
                          >
                            <FontAwesomeIcon icon={faEye} /> Preview
                          </a>
                          <button
                            onClick={() => openWaModal(item)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#25D366] border border-[#25D366]/30 px-2.5 py-1.5 rounded-[8px] hover:bg-[#25D366] hover:text-white"
                            title="Kirim via WhatsApp manual"
                          >
                            <FontAwesomeIcon icon={faWhatsapp} /> WA
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="w-7 h-7 flex items-center justify-center bg-brand-light text-brand-muted hover:bg-brand-surface/10 hover:text-brand-surface border border-brand-muted/20 rounded-[8px]"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faPencil} className="text-[11px]" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-[8px] hover:bg-red-100"
                            title="Hapus"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center">
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

      {wizardOpen && (
        <WizardModal
          state={wizard}
          campaigns={campaigns}
          uploading={uploading}
          submitting={isPending}
          onChange={setWizard}
          onCampaignChange={onWizardCampaignChange}
          onFotoUpload={wizardHandleFotoUpload}
          onFotoRemove={wizardRemoveFoto}
          onNext={wizardNext}
          onBack={wizardBack}
          onSubmit={wizardSubmit}
          onClose={closeWizard}
        />
      )}

      {editForm && (
        <EditModal
          form={editForm}
          campaigns={campaigns}
          uploading={editUploading}
          submitting={isPending}
          onChange={setEditForm}
          onFotoUpload={editUploadFoto}
          onMoveFoto={editMoveFoto}
          onRemoveFoto={editRemoveFoto}
          onUploadTandaTerima={editUploadTandaTerima}
          onSubmit={editSubmit}
          onClose={() => setEditForm(null)}
        />
      )}

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

      {pdfAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setPdfAllConfirm(null) }}>
          <div className="bg-white rounded-[16px] w-full max-w-md p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Kirim PDF ke Semua Donatur?</h3>
            <p className="text-brand-muted text-sm mb-4">
              Sistem akan generate PDF laporan untuk <b>{pdfAllConfirm.donaturCount} donatur</b> dan mengirimkan via WhatsApp.
              Pastikan foto penyembelihan sudah di-assign untuk setiap donatur.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPdfAllConfirm(null)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button
                onClick={() => sendAllPdf(pdfAllConfirm.id)}
                disabled={pdfAllSending}
                className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPaperPlane} /> {pdfAllSending ? 'Mengirim...' : 'Kirim Semua'}
              </button>
            </div>
          </div>
        </div>
      )}

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

// ─── WIZARD MODAL ───────────────────────────────────────────────────────────
function WizardModal({
  state, campaigns, uploading, submitting,
  onChange, onCampaignChange, onFotoUpload, onFotoRemove,
  onNext, onBack, onSubmit, onClose,
}: {
  state: WizardState
  campaigns: CampaignLite[]
  uploading: boolean
  submitting: boolean
  onChange: (next: WizardState | ((w: WizardState) => WizardState)) => void
  onCampaignChange: (id: string) => void
  onFotoUpload: (files: FileList | null) => void
  onFotoRemove: (idx: number) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  onClose: () => void
}) {
  const totalHewan = state.donaturPaid.reduce((s, d) => s + d.jumlah, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-[16px] w-full max-w-3xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/15">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-bold text-brand-dark">Buat Laporan Penyaluran</h2>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3] as const).map(n => (
                <div
                  key={n}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    n < state.step ? 'bg-emerald-600 text-white'
                    : n === state.step ? 'bg-brand-dark text-brand-accent-light'
                    : 'bg-brand-light text-brand-muted border border-brand-muted/20'
                  }`}
                >
                  {n < state.step ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : n}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark">
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {state.step === 1 && (
            <>
              <div>
                <h3 className="text-sm font-bold text-brand-dark mb-1">Step 1 — Pilih Sumber Data</h3>
                <p className="text-xs text-brand-muted">Tentukan info dasar laporan dan pilih campaign sumber donatur.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-brand-muted mb-1">Judul Laporan *</label>
                  <input
                    type="text"
                    value={state.judul}
                    onChange={e => onChange(w => ({ ...w, judul: e.target.value }))}
                    placeholder="Penyaluran Qurban Pelosok Papua 1446 H"
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-brand-muted mb-1">Campaign *</label>
                  <select
                    value={state.campaignId}
                    onChange={e => onCampaignChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm bg-white focus:outline-none focus:border-brand-surface"
                  >
                    <option value="">— Pilih campaign —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-muted mb-1">Tanggal Penyembelihan *</label>
                  <input
                    type="date"
                    value={state.tanggalKirim}
                    onChange={e => onChange(w => ({ ...w, tanggalKirim: e.target.value }))}
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-muted mb-1">Jumlah Penerima Manfaat</label>
                  <input
                    type="number" min={0}
                    value={state.jumlahPenerima}
                    onChange={e => onChange(w => ({ ...w, jumlahPenerima: e.target.value === '' ? '' : parseInt(e.target.value) }))}
                    placeholder="Opsional"
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-brand-muted mb-1">Lokasi Distribusi *</label>
                  <input
                    type="text"
                    value={state.lokasi}
                    onChange={e => onChange(w => ({ ...w, lokasi: e.target.value }))}
                    placeholder="Desa Wamena, Kab. Jayawijaya, Papua"
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                  />
                  <p className="text-[11px] text-brand-muted mt-1">Auto-fill dari campaign — bisa diedit</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-brand-muted mb-1">Narasi / Deskripsi (opsional)</label>
                  <textarea
                    rows={3}
                    value={state.deskripsi}
                    onChange={e => onChange(w => ({ ...w, deskripsi: e.target.value }))}
                    placeholder="Ceritakan proses penyaluran, kondisi penerima, dst."
                    className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
                  />
                </div>
              </div>

              {state.campaignId && (
                <div className="bg-brand-light/60 border border-brand-muted/15 rounded-[10px] p-4">
                  {state.loadingDonatur ? (
                    <p className="text-sm text-brand-muted flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-brand-dark/40 border-t-brand-dark rounded-full animate-spin" />
                      Memuat data donatur...
                    </p>
                  ) : state.donaturPaid.length === 0 ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faXmark} />
                      Belum ada donatur PAID di campaign ini.
                    </p>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faUsers} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-brand-dark font-bold">
                          Ditemukan {state.donaturPaid.length} donatur yang sudah PAID dari campaign ini
                        </p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          Total {totalHewan} ekor hewan akan dilaporkan secara otomatis ter-link ke laporan ini.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {state.step === 2 && (
            <>
              <div>
                <h3 className="text-sm font-bold text-brand-dark mb-1">Step 2 — Upload Foto Distribusi</h3>
                <p className="text-xs text-brand-muted">
                  Upload 2-4 foto distribusi/implementasi. Foto ini akan muncul di kanan laporan SEMUA donatur.
                </p>
              </div>

              {state.fotoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {state.fotoUrls.map((url, idx) => (
                    <div key={idx} className="relative group rounded-[8px] overflow-hidden border border-brand-muted/20 bg-brand-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => onFotoRemove(idx)} className="w-8 h-8 bg-red-500 text-white rounded-full">
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">#{idx + 1}</div>
                    </div>
                  ))}
                </div>
              )}
              {state.fotoUrls.length < 4 && (
                <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-brand-muted/30 rounded-[8px] cursor-pointer hover:bg-brand-light/50 text-sm text-brand-muted">
                  <FontAwesomeIcon icon={faUpload} />
                  {uploading ? 'Mengupload...' : `Upload foto (${state.fotoUrls.length}/4) — minimal 2`}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={e => { onFotoUpload(e.target.files); e.target.value = '' }}
                  />
                </label>
              )}
            </>
          )}

          {state.step === 3 && (
            <>
              <div>
                <h3 className="text-sm font-bold text-brand-dark mb-1">Step 3 — Review & Konfirmasi</h3>
                <p className="text-xs text-brand-muted">Pastikan data sudah benar sebelum membuat laporan.</p>
              </div>

              <div className="bg-brand-light/50 border border-brand-muted/15 rounded-[10px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <Field label="Judul" value={state.judul} />
                <Field label="Campaign" value={campaigns.find(c => c.id === state.campaignId)?.title ?? '-'} />
                <Field label="Tanggal" value={state.tanggalKirim} />
                <Field label="Lokasi" value={state.lokasi} />
                <Field label="Donatur PAID" value={`${state.donaturPaid.length} orang`} />
                <Field label="Total Hewan" value={`${totalHewan} ekor`} />
                <Field label="Foto Distribusi" value={`${state.fotoUrls.length} foto`} />
                <Field label="Penerima Manfaat" value={state.jumlahPenerima === '' ? '-' : `${state.jumlahPenerima} orang`} />
              </div>

              <div>
                <div className="text-xs font-bold text-brand-muted mb-2">Foto Distribusi</div>
                <div className="grid grid-cols-4 gap-2">
                  {state.fotoUrls.map((url, idx) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img key={idx} src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover rounded-[6px] border border-brand-muted/15" />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-brand-muted mb-2">Donatur yang akan ter-link ({state.donaturPaid.length})</div>
                <div className="max-h-48 overflow-y-auto border border-brand-muted/15 rounded-[8px] bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-brand-light sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold text-brand-muted">Nama</th>
                        <th className="text-left px-3 py-2 font-bold text-brand-muted">Atas Nama</th>
                        <th className="text-left px-3 py-2 font-bold text-brand-muted">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.donaturPaid.map(d => (
                        <tr key={d.id} className="border-t border-brand-muted/10">
                          <td className="px-3 py-1.5">{d.nama}</td>
                          <td className="px-3 py-1.5 text-brand-muted">{d.atasNama}</td>
                          <td className="px-3 py-1.5">{d.jumlah} ekor</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-muted/15 flex gap-3 justify-between">
          <button
            onClick={state.step === 1 ? onClose : onBack}
            className="px-4 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light flex items-center gap-2"
          >
            <FontAwesomeIcon icon={state.step === 1 ? faXmark : faArrowLeft} />
            {state.step === 1 ? 'Batal' : 'Kembali'}
          </button>
          {state.step < 3 ? (
            <button
              onClick={onNext}
              className="px-5 py-2 bg-brand-dark text-brand-accent-light rounded-[8px] text-sm font-bold flex items-center gap-2"
            >
              Lanjut <FontAwesomeIcon icon={faArrowRight} />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center gap-2 disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faCheck} /> {submitting ? 'Membuat...' : 'Buat Laporan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-brand-muted font-bold">{label}</div>
      <div className="text-sm text-brand-dark mt-0.5">{value || '-'}</div>
    </div>
  )
}

// ─── EDIT MODAL ─────────────────────────────────────────────────────────────
function EditModal({
  form, campaigns, uploading, submitting,
  onChange, onFotoUpload, onMoveFoto, onRemoveFoto, onUploadTandaTerima, onSubmit, onClose,
}: {
  form: EditFormState
  campaigns: CampaignLite[]
  uploading: boolean
  submitting: boolean
  onChange: (next: EditFormState | ((f: EditFormState | null) => EditFormState | null)) => void
  onFotoUpload: (files: FileList | null) => void
  onMoveFoto: (idx: number, dir: -1 | 1) => void
  onRemoveFoto: (idx: number) => void
  onUploadTandaTerima: (file: File | null) => void
  onSubmit: () => void
  onClose: () => void
}) {
  function set<K extends keyof EditFormState>(key: K, val: EditFormState[K]) {
    onChange(f => f ? { ...f, [key]: val } : f)
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-[16px] w-full max-w-3xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/15">
          <h2 className="font-serif text-lg font-bold text-brand-dark">Edit Laporan</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark">
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-brand-muted mb-1">Judul Laporan *</label>
              <input
                type="text"
                value={form.judul}
                onChange={e => set('judul', e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Campaign</label>
              <select
                value={form.campaignId}
                onChange={e => set('campaignId', e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm bg-white focus:outline-none focus:border-brand-surface"
              >
                <option value="">— Tidak terhubung —</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Tanggal *</label>
              <input
                type="date"
                value={form.tanggalKirim}
                onChange={e => set('tanggalKirim', e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-brand-muted mb-1">Lokasi *</label>
              <input
                type="text"
                value={form.lokasi}
                onChange={e => set('lokasi', e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Jumlah Hewan *</label>
              <input
                type="number" min={1}
                value={form.jumlahHewan}
                onChange={e => set('jumlahHewan', parseInt(e.target.value || '0'))}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Penerima Manfaat</label>
              <input
                type="number" min={0}
                value={form.jumlahPenerima}
                onChange={e => set('jumlahPenerima', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Deskripsi</label>
            <textarea
              rows={6}
              value={form.deskripsi}
              onChange={e => set('deskripsi', e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Foto Lapangan ({form.fotoUrls.length}/10)</div>
            {form.fotoUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {form.fotoUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-[8px] overflow-hidden border border-brand-muted/20 bg-brand-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {idx > 0 && <button onClick={() => onMoveFoto(idx, -1)} className="w-7 h-7 bg-white text-brand-dark rounded-full text-xs">←</button>}
                      {idx < form.fotoUrls.length - 1 && <button onClick={() => onMoveFoto(idx, 1)} className="w-7 h-7 bg-white text-brand-dark rounded-full text-xs">→</button>}
                      <button onClick={() => onRemoveFoto(idx)} className="w-7 h-7 bg-red-500 text-white rounded-full text-xs"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">#{idx + 1}</div>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-muted/30 rounded-[8px] cursor-pointer hover:bg-brand-light/50 text-sm text-brand-muted">
              <FontAwesomeIcon icon={faUpload} />
              {uploading ? 'Mengupload...' : 'Klik untuk upload foto'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={uploading || form.fotoUrls.length >= 10}
                onChange={e => { onFotoUpload(e.target.files); e.target.value = '' }}
              />
            </label>
          </div>

          <div>
            <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Tanda Terima (Opsional)</div>
            {form.tandaTerima ? (
              <div className="relative inline-block rounded-[8px] overflow-hidden border border-brand-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.tandaTerima} alt="Tanda terima" className="w-48 h-32 object-cover" />
                <button
                  onClick={() => set('tandaTerima', '')}
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
                  onChange={e => { onUploadTandaTerima(e.target.files?.[0] ?? null); e.target.value = '' }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-brand-muted/15 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
          <a
            href={`/api/admin/laporan/${form.id}/pdf`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 border border-brand-surface/30 text-brand-surface rounded-[8px] text-sm font-bold hover:bg-brand-surface/5 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faEye} /> Preview PDF
          </a>
          <button
            onClick={onSubmit}
            disabled={submitting || uploading}
            className="px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center gap-2 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faFloppyDisk} /> {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
