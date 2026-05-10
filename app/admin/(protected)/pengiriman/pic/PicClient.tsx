'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faPen, faTrash, faXmark, faCircleCheck, faChevronLeft, faUserTie,
} from '@fortawesome/free-solid-svg-icons'

type PIC = {
  id: string
  nama: string
  noTelepon: string
  keterangan: string | null
  aktif: boolean
  createdAt: string
}

const empty = { nama: '', noTelepon: '', keterangan: '', aktif: true }

export default function PicClient({ initialItems }: { initialItems: PIC[] }) {
  const [items, setItems] = useState<PIC[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmDel, setConfirmDel] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  function openAdd() {
    setEditingId(null)
    setForm(empty)
    setModalOpen(true)
  }

  function openEdit(p: PIC) {
    setEditingId(p.id)
    setForm({
      nama: p.nama,
      noTelepon: p.noTelepon,
      keterangan: p.keterangan ?? '',
      aktif: p.aktif,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.noTelepon.trim()) {
      showToast('Nama dan No Telepon wajib diisi')
      return
    }
    const payload = {
      nama: form.nama.trim(),
      noTelepon: form.noTelepon.trim(),
      keterangan: form.keterangan.trim() || null,
      aktif: form.aktif,
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await fetch(`/api/admin/pic/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error()
          const updated = await res.json()
          setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
          showToast('PIC diperbarui')
        } else {
          const res = await fetch('/api/admin/pic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error()
          const created: PIC = await res.json()
          setItems((prev) => [created, ...prev])
          showToast('PIC ditambahkan')
        }
        setModalOpen(false)
      } catch {
        showToast('Gagal menyimpan')
      }
    })
  }

  async function handleDelete() {
    const id = confirmDel.id
    if (!id) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/pic/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id))
        showToast('PIC dihapus')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data?.error || 'Gagal menghapus — mungkin masih dipakai pada pengiriman.')
      }
      setConfirmDel({ open: false, id: '', name: '' })
    })
  }

  return (
    <>
      <div className="px-5 md:px-8 py-5 md:py-6 max-w-[1100px] mx-auto w-full">
        <Link href="/admin/pengiriman" className="text-xs text-brand-muted hover:text-brand-dark inline-flex items-center gap-1 mb-3">
          <FontAwesomeIcon icon={faChevronLeft} /> Kembali ke daftar pengiriman
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-dark flex items-center gap-2">
              <FontAwesomeIcon icon={faUserTie} className="text-brand-accent" />
              Kelola PIC Pengiriman
            </h1>
            <p className="text-xs text-brand-muted mt-1">Daftar penanggung jawab pengiriman yang bisa dipilih saat menjadwalkan kirim hewan.</p>
          </div>
          <button onClick={openAdd} className="px-4 py-2 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center gap-2 shadow-premium">
            <FontAwesomeIcon icon={faPlus} /> Tambah PIC
          </button>
        </div>

        <div className="bg-white rounded-[12px] border border-brand-muted/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-light text-brand-dark text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2.5 w-10">No</th>
                <th className="text-left px-3 py-2.5">Nama</th>
                <th className="text-left px-3 py-2.5">No Telepon</th>
                <th className="text-left px-3 py-2.5">Keterangan</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-brand-muted text-xs">Belum ada PIC.</td></tr>
              ) : items.map((p, idx) => (
                <tr key={p.id} className="border-t border-brand-muted/10 hover:bg-brand-light/50">
                  <td className="px-3 py-2 text-xs text-brand-muted">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-brand-dark">{p.nama}</td>
                  <td className="px-3 py-2 font-mono">{p.noTelepon}</td>
                  <td className="px-3 py-2 text-xs text-brand-muted">{p.keterangan || '—'}</td>
                  <td className="px-3 py-2">
                    {p.aktif ? (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Aktif</span>
                    ) : (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => openEdit(p)} className="px-2 py-1 text-[11px] rounded bg-brand-light text-brand-dark hover:bg-brand-muted/10" aria-label="Edit"><FontAwesomeIcon icon={faPen} /></button>
                      <button onClick={() => setConfirmDel({ open: true, id: p.id, name: p.nama })} className="px-2 py-1 text-[11px] rounded bg-red-50 text-red-600 hover:bg-red-100" aria-label="Hapus"><FontAwesomeIcon icon={faTrash} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-brand-muted/10 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-brand-dark">{editingId ? 'Edit PIC' : 'Tambah PIC'}</h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center text-brand-muted">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-dark block mb-1">Nama *</label>
                <input className="inp" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Pak Slamet" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-brand-dark block mb-1">No Telepon *</label>
                <input className="inp" value={form.noTelepon} onChange={(e) => setForm((f) => ({ ...f, noTelepon: e.target.value }))} placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-brand-dark block mb-1">Keterangan</label>
                <textarea rows={2} className="inp" value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} placeholder="Driver / Kepala tim / dst." />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-dark cursor-pointer select-none">
                <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))} className="w-4 h-4 accent-brand-accent" />
                Aktif (bisa dipilih saat input pengiriman)
              </label>
            </div>
            <div className="px-6 py-4 border-t border-brand-muted/10 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] shadow-premium">Simpan</button>
            </div>
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
            <h3 className="font-serif text-base font-bold text-brand-dark mb-1">Hapus PIC?</h3>
            <p className="text-xs text-brand-muted mb-5">PIC <strong>{confirmDel.name}</strong> akan dihapus permanen.</p>
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
