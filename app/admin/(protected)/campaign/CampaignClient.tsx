'use client'
import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash, faPlus, faXmark, faFloppyDisk, faCloudArrowUp, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createCampaign, updateCampaign, deleteCampaign } from '@/lib/actions/campaigns'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import { VideoUrlInput, type VideoUrlInputHandle } from '@/components/admin/VideoUrlInput'
import BlockEditor from '@/components/admin/BlockEditor'
import CampaignUpdatesEditor from './CampaignUpdatesEditor'
import type { Campaign } from '@prisma/client'

function getFlag(l: string) { return l === 'AFRICA' ? '🌍' : l === 'PALESTINE' ? '🇵🇸' : '🇮🇩' }
function getLocationLabel(l: string) { return l === 'AFRICA' ? 'Afrika Sub-Sahara' : l === 'PALESTINE' ? 'Palestina' : 'Pedalaman Indonesia' }
function getLocationBadgeCls(l: string) { return l === 'AFRICA' ? 'bg-blue-100 text-blue-700' : l === 'PALESTINE' ? 'bg-red-100 text-red-600' : 'bg-brand-accent text-brand-dark' }

const emptyForm = {
  title: '',
  location: 'INDONESIA',
  targetCount: '',
  description: '',
  imageUrl: '',
  animalType: 'domba',
  programType: 'qurban',
  ctaButtonText: '',
  allowShare: 'false',
  richContent: '[]',
  animals: '[]',
  gallery: '[]',
  videoUrls: '[]',
}

const ANIMAL_OPTIONS = [
  { value: 'domba', label: '🐑 Domba' },
  { value: 'kambing', label: '🐐 Kambing' },
  { value: 'sapi', label: '🐄 Sapi' },
  { value: 'unta', label: '🐪 Unta' },
  { value: 'mix', label: '🐑🐄 Mix (Domba & Sapi)' },
]

const PROGRAM_OPTIONS = [
  { value: 'qurban', label: '🐑 Qurban', desc: 'Khusus ibadah qurban' },
  { value: 'sedekah', label: '💝 Sedekah', desc: 'Sedekah / infaq umum' },
  { value: 'keduanya', label: '🐑💝 Qurban & Sedekah', desc: 'Donatur bisa pilih salah satu' },
]

function getAnimalLabel(a: string) {
  return ANIMAL_OPTIONS.find(o => o.value === a)?.label ?? `🐑 ${a}`
}
function getProgramBadge(p: string) {
  if (p === 'sedekah') return { label: 'Sedekah', cls: 'bg-blue-100 text-blue-700' }
  if (p === 'keduanya') return { label: 'Qurban & Sedekah', cls: 'bg-purple-100 text-purple-700' }
  return { label: 'Qurban', cls: 'bg-brand-surface/10 text-brand-surface' }
}

// ─── Media Picker Modal ──────────────────────────────────────────────────────
function MediaPickerModal({
  currentUrl,
  onSelect,
  onClose,
}: {
  currentUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'gallery' | 'upload' | 'url'>('gallery')
  const [galleryFiles, setGalleryFiles] = useState<string[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    setLoadingGallery(true)
    fetch('/api/uploads/list')
      .then(r => r.json())
      .then(d => setGalleryFiles(d.files ?? []))
      .finally(() => setLoadingGallery(false))
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/uploads', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) {
      setGalleryFiles(prev => [data.url, ...prev])
      onSelect(data.url)
    } else {
      setUploadError(data.error ?? 'Upload gagal')
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[16px] w-full max-w-xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-muted/10 shrink-0">
          <h3 className="font-serif text-base font-bold text-brand-dark">Pilih Foto</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark w-7 h-7 rounded-full hover:bg-brand-light flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-muted/10 shrink-0">
          {([
            { key: 'gallery', label: '🖼️ Galeri' },
            { key: 'upload', label: '📤 Upload Baru' },
            { key: 'url', label: '🔗 URL' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-brand-surface text-brand-surface font-bold' : 'text-brand-muted hover:text-brand-dark'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="overflow-y-auto p-5 flex-1">

          {/* Gallery Tab */}
          {tab === 'gallery' && (
            <div>
              {loadingGallery ? (
                <div className="text-center py-8 text-brand-muted text-sm">Memuat galeri...</div>
              ) : galleryFiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-brand-muted text-sm">Belum ada foto di galeri</p>
                  <button onClick={() => setTab('upload')} className="mt-3 text-brand-surface text-sm font-bold hover:underline">
                    Upload foto pertama →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {galleryFiles.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => { onSelect(url); onClose() }}
                      className={`aspect-square rounded-[8px] overflow-hidden border-2 transition-all hover:scale-[1.02] ${currentUrl === url ? 'border-brand-accent ring-2 ring-brand-accent/30' : 'border-transparent hover:border-brand-accent/40'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div className="flex flex-col gap-4">
              <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-[12px] cursor-pointer transition-colors ${uploading ? 'border-brand-surface/30 bg-brand-surface/5' : 'border-brand-muted/30 hover:border-brand-accent/50 hover:bg-brand-accent/[0.02]'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFileUpload}
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">{uploading ? '⏳' : '📤'}</div>
                  <div className="text-sm font-medium text-brand-dark">
                    {uploading ? 'Mengupload...' : 'Klik untuk pilih foto'}
                  </div>
                  <div className="text-[11px] text-brand-muted mt-1">JPG, PNG, WebP · Max 2MB</div>
                </div>
              </label>
              {uploadError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[8px] p-3">⚠️ {uploadError}</div>
              )}
              <p className="text-xs text-brand-muted text-center">Setelah upload, foto akan otomatis terpilih</p>
            </div>
          )}

          {/* URL Tab */}
          {tab === 'url' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">URL Foto</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="inp"
                  placeholder="https://contoh.com/foto-hewan.jpg"
                />
              </div>
              {urlInput && (
                <div className="rounded-[8px] overflow-hidden border border-brand-muted/20 h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlInput} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <button
                type="button"
                onClick={() => { if (urlInput) { onSelect(urlInput); onClose() } }}
                disabled={!urlInput}
                className="w-full py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] shadow-premium disabled:opacity-40"
              >
                Gunakan URL Ini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Animals Editor ───────────────────────────────────────────────────────────
interface AnimalItem {
  id: string; name: string; weight: string
  originalPrice: number; price: number; imageUrl: string; stock: number
}

function AnimalsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [items, setItems] = useState<AnimalItem[]>(() => {
    try { return JSON.parse(value) } catch { return [] }
  })
  const [pickerIdx, setPickerIdx] = useState<number | null>(null)

  useEffect(() => {
    try { setItems(JSON.parse(value)) } catch { setItems([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === '[]' ? value : undefined])

  function update(newItems: AnimalItem[]) {
    setItems(newItems)
    onChange(JSON.stringify(newItems))
  }

  function addAnimal() {
    const newId = Date.now().toString()
    update([...items, { id: newId, name: 'Domba/Kambing Jantan', weight: '23-25 Kg', originalPrice: 0, price: 0, imageUrl: '', stock: 10 }])
  }

  function removeAnimal(idx: number) { update(items.filter((_, i) => i !== idx)) }

  function updateAnimal(idx: number, partial: Partial<AnimalItem>) {
    update(items.map((item, i) => i === idx ? { ...item, ...partial } : item))
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div key={item.id} className="border border-brand-muted/20 rounded-[10px] p-4 bg-brand-light relative">
          <button type="button" onClick={() => removeAnimal(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
          <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">🐑 Hewan #{idx + 1}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Nama Hewan *</label>
              <input type="text" value={item.name} onChange={e => updateAnimal(idx, { name: e.target.value })} className="inp text-sm" placeholder="Contoh: Domba Garut Jantan" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Berat (Range)</label>
              <input type="text" value={item.weight} onChange={e => updateAnimal(idx, { weight: e.target.value })} className="inp text-sm" placeholder="23-25 Kg" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Stok</label>
              <input type="number" value={item.stock} onChange={e => updateAnimal(idx, { stock: parseInt(e.target.value) || 0 })} className="inp text-sm" min="0" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Harga Asli (Rp)</label>
              <input type="number" value={item.originalPrice || ''} onChange={e => updateAnimal(idx, { originalPrice: parseInt(e.target.value) || 0 })} className="inp text-sm" placeholder="Kosongkan jika tidak ada coret" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Harga Jual (Rp) *</label>
              <input type="number" value={item.price || ''} onChange={e => updateAnimal(idx, { price: parseInt(e.target.value) || 0 })} className="inp text-sm" placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Foto Hewan</label>
              <div className="flex gap-2 items-start">
                {/* Preview */}
                <div className="w-16 h-14 rounded-[8px] overflow-hidden border border-brand-muted/20 shrink-0 bg-brand-light">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐑</div>
                  )}
                </div>
                {/* Buttons */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerIdx(idx)}
                    className="w-full py-1.5 bg-brand-surface text-white text-xs font-bold rounded-[6px] hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5"
                  >
                    🖼️ Upload / Pilih Foto
                  </button>
                  <input
                    type="text"
                    value={item.imageUrl}
                    onChange={e => updateAnimal(idx, { imageUrl: e.target.value })}
                    className="inp text-xs"
                    placeholder="atau paste URL..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addAnimal} className="py-2.5 border-2 border-dashed border-brand-muted/30 text-brand-muted hover:border-brand-surface hover:text-brand-surface rounded-[8px] text-xs font-medium transition-colors">
        + Tambah Pilihan Hewan
      </button>

      {/* Media Picker Modal */}
      {pickerIdx !== null && items[pickerIdx] && (
        <MediaPickerModal
          currentUrl={items[pickerIdx].imageUrl}
          onSelect={url => updateAnimal(pickerIdx, { imageUrl: url })}
          onClose={() => setPickerIdx(null)}
        />
      )}
    </div>
  )
}

function GalleryEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [urls, setUrls] = useState<string[]>(() => {
    try { return JSON.parse(value) } catch { return [] }
  })

  function update(newUrls: string[]) { setUrls(newUrls); onChange(JSON.stringify(newUrls)) }
  function removePhoto(i: number) { update(urls.filter((_, idx) => idx !== i)) }
  function addUrl(url: string) { if (url) update([...urls, url]) }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover rounded-[8px]" />
            <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">✕</button>
          </div>
        ))}
        {urls.length < 5 && (
          <label className="aspect-square border-2 border-dashed border-brand-muted/30 rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:border-brand-surface/40 transition-colors bg-brand-light">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                const data = await res.json()
                if (data.url) addUrl(data.url)
              }}
            />
            <div className="text-brand-muted text-center">
              <div className="text-xl mb-0.5">+</div>
              <div className="text-[10px]">Foto</div>
            </div>
          </label>
        )}
      </div>
    </div>
  )
}

export default function CampaignClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' })
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState({ show: false, msg: '' })
  const videoInputRef = useRef<VideoUrlInputHandle>(null)

  // Sync state setiap kali initialCampaigns berubah (setelah router.refresh)
  useEffect(() => {
    setCampaigns(initialCampaigns)
  }, [initialCampaigns])

  function showToast(msg: string) { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 2800) }

  function openAdd() { setEditingId(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(c: Campaign) {
    setEditingId(c.id)
    setForm({
      title: c.title,
      location: c.location,
      targetCount: c.targetCount.toString(),
      description: c.description,
      imageUrl: c.imageUrl,
      animalType: (c as any).animalType ?? 'domba',
      programType: (c as any).programType ?? 'qurban',
      ctaButtonText: (c as any).ctaButtonText ?? '',
      allowShare: (c as any).allowShare ? 'true' : 'false',
      richContent: (c as any).richContent ?? '[]',
      animals: (c as any).animals ?? '[]',
      gallery: (c as any).gallery ?? '[]',
      videoUrls: JSON.stringify((c as any).videoUrls ?? []),
    })
    setModalOpen(true)
  }

  function handleSave() {
    // Validate: at least 1 animal card with name + price
    let parsedAnimals: { name?: string; price?: number }[] = []
    try { parsedAnimals = JSON.parse(form.animals || '[]') } catch {}
    if (!Array.isArray(parsedAnimals) || parsedAnimals.length === 0) {
      showToast('Minimal 1 pilihan hewan wajib ditambahkan')
      return
    }
    if (parsedAnimals.some(a => !a.name || !a.price || a.price <= 0)) {
      showToast('Setiap pilihan hewan wajib memiliki nama dan harga')
      return
    }

    // Commit any URL the user typed but didn't click "+ Tambah" on
    const flushedVideos = videoInputRef.current?.flush()
      ?? (() => { try { return JSON.parse(form.videoUrls || '[]') as string[] } catch { return [] } })()
    const videoUrlsJson = JSON.stringify(flushedVideos)

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))
    fd.set('videoUrls', videoUrlsJson)
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCampaign(editingId, fd)
          setCampaigns(prev => prev.map(c => c.id === editingId ? {
            ...c, ...form,
            targetCount: parseInt(form.targetCount),
            location: form.location as any,
            allowShare: form.allowShare === 'true',
            videoUrls: flushedVideos,
          } : c))
          showToast('Campaign berhasil diperbarui!')
        } else {
          await createCampaign(fd)
          router.refresh()
          showToast('Campaign baru berhasil dibuat!')
        }
        setModalOpen(false)
      } catch (err: any) {
        showToast(err?.message || 'Gagal menyimpan campaign')
      }
    })
  }

  function toggleActive(c: Campaign) {
    const fd = new FormData()
    fd.set('isActive', (!c.isActive).toString())
    startTransition(async () => {
      await updateCampaign(c.id, fd)
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x))
      showToast(c.isActive ? 'Campaign dinonaktifkan' : 'Campaign diaktifkan')
    })
  }

  function handleDelete() {
    const id = deleteConfirm.id
    startTransition(async () => {
      try {
        const res = await deleteCampaign(id)
        if (res && res.success === false) {
          setDeleteConfirm({ open: false, id: '', title: '' })
          showToast(res.error || 'Gagal menghapus campaign.')
          return
        }
        setCampaigns(prev => prev.filter(c => c.id !== id))
        setDeleteConfirm({ open: false, id: '', title: '' })
        const extra = res?.deletedDonations ? ` (${res.deletedDonations} donasi terkait dihapus)` : ''
        showToast('Campaign berhasil dihapus.' + extra)
      } catch (err) {
        console.error('[CampaignClient.handleDelete]', err)
        setDeleteConfirm({ open: false, id: '', title: '' })
        showToast('Terjadi kesalahan. Silakan coba lagi.')
      }
    })
  }

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Manajemen Campaign</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola program qurban penyaluran</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[10px] shadow-premium hover:scale-[1.02] transition-transform">
            <FontAwesomeIcon icon={faPlus} /> Tambah Campaign
          </button>
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium p-16 text-center">
            <div className="text-5xl mb-4">🐑</div>
            <h3 className="font-serif text-xl font-bold text-brand-dark mb-2">Belum ada campaign</h3>
            <p className="text-brand-muted text-sm mb-6">Buat campaign penyaluran pertama Anda</p>
            <button onClick={openAdd} className="inline-flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold px-6 py-3 rounded-[10px] shadow-premium">
              <FontAwesomeIcon icon={faPlus} /> Tambah Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-[14px] border border-brand-muted/10 shadow-premium overflow-hidden">
                {/* Image */}
                <div className="relative h-44 bg-brand-light overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.title} />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-[20px] ${getLocationBadgeCls(c.location)}`}>
                      {getFlag(c.location)} {getLocationLabel(c.location)}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${c.isActive ? 'bg-emerald-500 text-white' : 'bg-brand-muted/50 text-white'}`}>
                      {c.isActive ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-serif text-base font-bold text-brand-dark mb-2">{c.title}</h3>
                  {/* Animal + Program badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-light border border-brand-muted/20 text-brand-dark">
                      {getAnimalLabel((c as any).animalType ?? 'domba')}
                    </span>
                    {(() => { const b = getProgramBadge((c as any).programType ?? 'qurban'); return (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                    )})()}
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-brand-muted mb-4">
                    {(() => {
                      let parsed: { price?: number }[] = []
                      try { parsed = JSON.parse((c as any).animals ?? '[]') } catch {}
                      const count = Array.isArray(parsed) ? parsed.length : 0
                      return (
                        <span>🐑 <strong className="text-brand-dark">{count}</strong> pilihan hewan</span>
                      )
                    })()}
                    <span>🎯 Target: <strong className="text-brand-dark">{c.targetCount}</strong> ekor</span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-brand-muted/10">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-surface/8 hover:bg-brand-surface hover:text-white text-brand-surface text-xs font-bold rounded-[8px] border border-brand-surface/20 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPen} /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={isPending}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-[8px] border transition-colors disabled:opacity-60 ${c.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                    >
                      {c.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, id: c.id, title: c.title })}
                      className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-[8px] border border-red-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-[560px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-brand-muted/10">
              <h2 className="font-serif text-xl font-bold text-brand-dark">{editingId ? 'Edit Campaign' : 'Tambah Campaign'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-brand-muted hover:text-brand-dark w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>
            <div className="p-7 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
              {/* Cover Image */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Cover Campaign *</label>
                <div className="flex flex-col gap-2">
                  {form.imageUrl ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="" className="w-full h-36 object-cover rounded-[10px]" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-brand-muted/30 rounded-[10px] cursor-pointer hover:border-brand-accent/50 transition-colors bg-brand-light">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const fd = new FormData()
                          fd.append('file', file)
                          const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                          const data = await res.json()
                          if (data.url) setForm(f => ({ ...f, imageUrl: data.url }))
                        }}
                      />
                      <div className="text-brand-muted text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-xs font-medium">Upload Cover (650×350)</div>
                        <div className="text-[10px] text-brand-muted/60 mt-0.5">JPG, PNG, WebP · Max 2MB</div>
                      </div>
                    </label>
                  )}
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="inp text-xs"
                    placeholder="Atau paste URL langsung: https://..."
                  />
                </div>
              </div>

              {/* Gallery Photos */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Foto Gallery Campaign (Opsional)</label>
                <p className="text-xs text-brand-muted mb-2">Tambahkan foto-foto tambahan kampanye untuk ditampilkan di halaman detail.</p>
                <GalleryEditor
                  value={form.gallery ?? '[]'}
                  onChange={v => setForm(f => ({ ...f, gallery: v }))}
                />
              </div>

              {/* Judul */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Judul Campaign *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="inp" placeholder="Contoh: Qurban Afrika 2025" />
              </div>

              {/* Lokasi */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Lokasi Penyaluran *</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="inp" style={{ height: 42 }}>
                  <option value="INDONESIA">🇮🇩 Pedalaman Indonesia</option>
                  <option value="AFRICA">🌍 Afrika Sub-Sahara</option>
                  <option value="PALESTINE">🇵🇸 Palestina</option>
                </select>
              </div>

              {/* Jenis Hewan */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Jenis Hewan yang Disalurkan</label>
                <select value={form.animalType} onChange={e => setForm(f => ({ ...f, animalType: e.target.value }))} className="inp" style={{ height: 42 }}>
                  {ANIMAL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Animals Editor — required, min 1 with name + price */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Pilihan Hewan Qurban <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-brand-muted mb-3">
                  Wajib tambahkan minimal 1 pilihan hewan beserta harga. Donatur akan memilih hewan langsung dari halaman campaign.
                </p>
                <AnimalsEditor
                  value={form.animals ?? '[]'}
                  onChange={v => setForm(f => ({ ...f, animals: v }))}
                />
                {(() => {
                  let parsed: any[] = []
                  try { parsed = JSON.parse(form.animals || '[]') } catch {}
                  const count = Array.isArray(parsed) ? parsed.length : 0
                  if (count === 0) {
                    return <p className="text-[11px] text-red-600 mt-2">⚠ Tambahkan minimal 1 pilihan hewan</p>
                  }
                  return null
                })()}
              </div>

              {/* Tipe Program */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Tipe Program</label>
                <div className="flex flex-col gap-2">
                  {PROGRAM_OPTIONS.map(o => (
                    <label
                      key={o.value}
                      className={`flex items-center gap-3 border-2 rounded-[8px] p-3 cursor-pointer transition-all ${form.programType === o.value ? 'border-brand-accent bg-brand-accent/[0.03]' : 'border-brand-muted/20 hover:border-brand-accent/40'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${form.programType === o.value ? 'border-brand-accent bg-brand-accent' : 'border-brand-muted/40'}`}>
                        {form.programType === o.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <input type="radio" name="programType" value={o.value} checked={form.programType === o.value} onChange={() => setForm(f => ({ ...f, programType: o.value }))} className="sr-only" />
                      <div>
                        <div className="text-sm font-bold text-brand-dark">{o.label}</div>
                        <div className="text-[11px] text-brand-muted">{o.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Target Jumlah Hewan</label>
                <input type="number" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: e.target.value }))} className="inp" placeholder="100" min="0" />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Deskripsi</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="inp" placeholder="Deskripsi program penyaluran..." />
              </div>

              {/* Teks Tombol CTA */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Teks Tombol CTA (Opsional)
                </label>
                <input
                  type="text"
                  value={form.ctaButtonText ?? ''}
                  onChange={e => setForm(f => ({ ...f, ctaButtonText: e.target.value }))}
                  className="inp"
                  placeholder="Kosongkan untuk default (Qurban/Sedekah Sekarang)"
                />
              </div>

              {/* Allow 1/7 sapi toggle */}
              {form.animalType === 'sapi' && (
                <div className="flex items-center justify-between p-3 bg-brand-light rounded-[8px] border border-brand-muted/10">
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Aktifkan Opsi 1/7 Bagian Sapi</div>
                    <div className="text-xs text-brand-muted mt-0.5">Donatur bisa pilih 1/7 bagian dari seekor sapi</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={form.allowShare === 'true'} onChange={e => setForm(f => ({ ...f, allowShare: e.target.checked ? 'true' : 'false' }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              )}

              {/* Rich Content Editor */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Konten Cerita Program (Opsional)
                </label>
                <p className="text-xs text-brand-muted mb-3">Tambah blok teks, foto, atau video. Bisa diatur ulang urutannya. Akan tampil di halaman detail campaign.</p>
                <BlockEditor
                  value={form.richContent ?? '[]'}
                  onChange={v => setForm(f => ({ ...f, richContent: v }))}
                />
              </div>

              {/* Video Gallery URLs */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
                  Gallery Video (Opsional)
                </label>
                <p className="text-xs text-brand-muted mb-3">Tambah video YouTube atau Google Drive untuk ditampilkan di halaman detail campaign.</p>
                <VideoUrlInput
                  ref={videoInputRef}
                  value={(() => { try { return JSON.parse(form.videoUrls || '[]') as string[] } catch { return [] } })()}
                  onChange={urls => setForm(f => ({ ...f, videoUrls: JSON.stringify(urls) }))}
                />
              </div>

              {/* Kabar Terbaru — only available after campaign is created */}
              {editingId && (
                <CampaignUpdatesEditor
                  campaignId={editingId}
                  onToast={showToast}
                />
              )}
            </div>

            <div className="px-7 py-5 border-t border-brand-muted/10 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button
                onClick={handleSave}
                disabled={isPending || !form.title || (() => {
                  try { return (JSON.parse(form.animals || '[]') as any[]).length === 0 } catch { return true }
                })()}
                className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] shadow-premium hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm.open && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm({ open: false, id: '', title: '' }) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Hapus Campaign?</h3>
            <p className="text-brand-muted text-sm mb-6">Campaign <strong className="text-brand-dark">{deleteConfirm.title}</strong> akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({ open: false, id: '', title: '' })} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px] hover:bg-red-600 transition-colors disabled:opacity-60">
                {isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <FontAwesomeIcon icon={faCircleCheck} className="text-brand-accent" /> {toast.msg}
      </div>
    </>
  )
}
