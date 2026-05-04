'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash, faPlus, faXmark, faFloppyDisk, faCloudArrowUp, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { createCampaign, updateCampaign, deleteCampaign } from '@/lib/actions/campaigns'
import type { Campaign } from '@prisma/client'

function getFlag(l: string) { return l === 'AFRICA' ? '🌍' : l === 'PALESTINE' ? '🇵🇸' : '🇮🇩' }
function getLocationLabel(l: string) { return l === 'AFRICA' ? 'Afrika Sub-Sahara' : l === 'PALESTINE' ? 'Palestina' : 'Pedalaman Indonesia' }
function getLocationBadgeCls(l: string) { return l === 'AFRICA' ? 'bg-blue-100 text-blue-700' : l === 'PALESTINE' ? 'bg-red-100 text-red-600' : 'bg-brand-accent text-brand-dark' }

const emptyForm = {
  title: '',
  location: 'INDONESIA',
  price: '',
  targetCount: '',
  description: '',
  imageUrl: '',
  animalType: 'domba',
  programType: 'qurban',
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

export default function CampaignClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' })
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState({ show: false, msg: '' })

  function showToast(msg: string) { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 2800) }

  function openAdd() { setEditingId(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(c: Campaign) {
    setEditingId(c.id)
    setForm({
      title: c.title,
      location: c.location,
      price: c.price.toString(),
      targetCount: c.targetCount.toString(),
      description: c.description,
      imageUrl: c.imageUrl,
      animalType: (c as any).animalType ?? 'domba',
      programType: (c as any).programType ?? 'qurban',
    })
    setModalOpen(true)
  }

  function handleSave() {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))
    startTransition(async () => {
      if (editingId) {
        await updateCampaign(editingId, fd)
        setCampaigns(prev => prev.map(c => c.id === editingId ? {
          ...c, ...form,
          price: parseInt(form.price),
          targetCount: parseInt(form.targetCount),
          location: form.location as any,
        } : c))
        showToast('Campaign berhasil diperbarui!')
      } else {
        await createCampaign(fd)
        showToast('Campaign baru berhasil dibuat!')
      }
      setModalOpen(false)
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
      await deleteCampaign(id)
      setCampaigns(prev => prev.filter(c => c.id !== id))
      setDeleteConfirm({ open: false, id: '', title: '' })
      showToast('Campaign berhasil dihapus.')
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
          <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">A</div>
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
                    <span>💰 <strong className="text-brand-accent">{formatCurrency(c.price)}</strong>/ekor</span>
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
              {/* Foto URL */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">URL Foto Campaign</label>
                <div className="flex gap-2 mb-2">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} className="w-20 h-20 rounded-[8px] object-cover border border-brand-muted/20 shrink-0" alt="" />
                  ) : (
                    <div className="flex items-center justify-center w-20 h-20 rounded-[8px] bg-brand-light border border-dashed border-brand-muted/30 shrink-0">
                      <FontAwesomeIcon icon={faCloudArrowUp} className="text-brand-muted text-2xl opacity-40" />
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://... (URL foto campaign)"
                    className="inp flex-1"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                {/* Harga */}
                <div>
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Harga / Ekor (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="inp" placeholder="1900000" min="0" />
                </div>
                {/* Target */}
                <div>
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Target Jumlah Hewan</label>
                  <input type="number" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: e.target.value }))} className="inp" placeholder="100" min="0" />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Deskripsi</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="inp" placeholder="Deskripsi program penyaluran..." />
              </div>
            </div>

            <div className="px-7 py-5 border-t border-brand-muted/10 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button
                onClick={handleSave}
                disabled={isPending || !form.title || !form.price}
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
