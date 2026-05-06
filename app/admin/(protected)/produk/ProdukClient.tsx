'use client'
import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faPlus, faDownload, faPen, faTrash,
  faFloppyDisk, faXmark, faBell, faCloudArrowUp, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/products'
import type { Product } from '@prisma/client'

interface Props { initialProducts: Product[] }

const emptyForm = { name: '', weight: '', price: '', stock: '', description: '', imageUrl: '', status: true }

export default function ProdukClient({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const router = useRouter()

  // Sync state setiap kali initialProducts berubah (setelah router.refresh)
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryFileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Tampilkan preview LANGSUNG dari file lokal (blob URL), tanpa tunggu upload
    const localUrl = URL.createObjectURL(file)
    setPreviewImg(localUrl)

    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads?folder=produk', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setForm(f => ({ ...f, imageUrl: data.url }))
        setPreviewImg(data.url) // Ganti ke server URL setelah upload selesai
      } else {
        showToast(data.error || 'Upload gagal.')
        URL.revokeObjectURL(localUrl)
        setPreviewImg(null)
      }
    } catch {
      showToast('Upload gagal, coba lagi.')
      URL.revokeObjectURL(localUrl)
      setPreviewImg(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setIsUploadingGallery(true)
    try {
      const results = await Promise.all(files.map(async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/uploads?folder=produk', { method: 'POST', body: fd })
        const data = await res.json()
        return data.url as string | undefined
      }))
      const urls = results.filter(Boolean) as string[]
      if (urls.length) setGalleryImages(prev => [...prev, ...urls])
      else showToast('Beberapa foto gagal diupload.')
    } catch {
      showToast('Upload gagal, coba lagi.')
    } finally {
      setIsUploadingGallery(false)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
    }
  }

  function removeGalleryImage(url: string) {
    setGalleryImages(prev => prev.filter(u => u !== url))
  }

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2800)
  }

  // Filtered products
  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'aktif' ? p.status === 'ACTIVE' : p.status === 'INACTIVE')
    return matchSearch && matchStatus
  }), [products, search, filterStatus])

  // Open modal to add
  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setPreviewImg(null)
    setGalleryImages([])
    setModalOpen(true)
  }

  // Open modal to edit
  function openEdit(p: Product) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      weight: p.weight.toString(),
      price: p.price.toString(),
      stock: p.stock.toString(),
      description: p.description,
      imageUrl: p.imageUrl,
      status: p.status === 'ACTIVE',
    })
    setPreviewImg(p.imageUrl)
    setGalleryImages(p.images.filter(img => img !== p.imageUrl))
    setModalOpen(true)
  }

  // Save (create or update)
  function handleSave() {
    const fd = new FormData()
    fd.set('name', form.name)
    fd.set('weight', form.weight)
    fd.set('price', form.price)
    fd.set('stock', form.stock)
    fd.set('description', form.description)
    fd.set('imageUrl', form.imageUrl)
    fd.set('status', form.status ? 'true' : 'false')
    fd.set('images', JSON.stringify(galleryImages))

    startTransition(async () => {
      if (editingId) {
        await updateProduct(editingId, fd)
        setProducts(prev => prev.map(p => p.id === editingId ? {
          ...p, name: form.name, weight: parseFloat(form.weight), price: parseInt(form.price),
          stock: parseInt(form.stock), description: form.description, imageUrl: form.imageUrl || p.imageUrl,
          status: form.status ? 'ACTIVE' : 'INACTIVE',
        } : p))
        showToast('Produk berhasil diperbarui!')
      } else {
        await createProduct(fd)
        router.refresh() // Re-fetch server component → update initialProducts → useEffect sync products state
        showToast('Produk baru berhasil ditambahkan!')
      }
      setModalOpen(false)
    })
  }

  // Delete
  function handleDelete() {
    const id = deleteModal.id
    startTransition(async () => {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteModal({ open: false, id: '', name: '' })
      showToast('Produk berhasil dihapus.')
    })
  }

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Manajemen Produk</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola daftar hewan kurban yang tersedia</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-full bg-white border border-brand-muted/20 flex items-center justify-center text-brand-muted shadow-sm">
            <FontAwesomeIcon icon={faBell} className="text-sm" />
          </button>
          <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">A</div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-light p-4 rounded-[12px] border border-brand-muted/20 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="pl-9 pr-4 py-2 w-56 rounded-[8px] bg-white border border-brand-muted/20 text-sm focus:outline-none focus:border-brand-surface"
              />
            </div>
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 border border-brand-muted/20 rounded-[8px] text-sm bg-white text-brand-dark focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <button className="h-9 px-4 border border-brand-muted/20 rounded-[8px] text-sm bg-white text-brand-dark hover:bg-brand-surface hover:text-white hover:border-brand-surface transition-colors font-medium">
              Filter
            </button>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[10px] shadow-premium hover:scale-[1.02] transition-transform whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} /> Tambah Produk
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[12px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="p-4 border-b border-brand-muted/10 flex items-center justify-between">
            <p className="text-sm font-medium text-brand-dark"><span className="font-bold">{filtered.length}</span> produk ditemukan</p>
            <button className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark border border-brand-muted/20 px-3 py-1.5 rounded-[8px]">
              <FontAwesomeIcon icon={faDownload} className="text-xs" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-brand-surface text-brand-light border-b border-brand-surface/30">
                  <th className="py-4 px-6 font-medium text-sm w-12 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-brand-muted/30" />
                  </th>
                  <th className="py-4 px-6 font-medium text-sm">Produk</th>
                  <th className="py-4 px-6 font-medium text-sm w-32">Tipe</th>
                  <th className="py-4 px-6 font-medium text-sm w-24">Berat</th>
                  <th className="py-4 px-6 font-medium text-sm w-40">Harga (Inline)</th>
                  <th className="py-4 px-6 font-medium text-sm w-24">Stok</th>
                  <th className="py-4 px-6 font-medium text-sm w-32">Status</th>
                  <th className="py-4 px-6 font-medium text-sm w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const tipe = p.name.toLowerCase().includes('sapi') ? 'Sapi' : p.name.toLowerCase().includes('kambing') ? 'Kambing' : 'Domba'
                  return (
                    <tr key={p.id} className="hover:bg-brand-surface/5 transition-colors group border-b border-brand-muted/10">
                      {/* Checkbox */}
                      <td className="py-3 px-6 text-center">
                        <input type="checkbox" className="w-4 h-4 rounded border-brand-muted/30 text-brand-surface" />
                      </td>
                      {/* Product */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-[12px] overflow-hidden border border-brand-muted/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                          </div>
                          <div>
                            <p className="font-bold text-brand-dark text-sm">{p.name}</p>
                            <p className="text-xs text-brand-muted">{p.description.substring(0, 40)}...</p>
                          </div>
                        </div>
                      </td>
                      {/* Tipe */}
                      <td className="py-3 px-6 text-sm text-brand-muted">{tipe}</td>
                      {/* Berat */}
                      <td className="py-3 px-6 text-sm text-brand-muted">{p.weight} kg</td>
                      {/* Harga inline */}
                      <td className="py-3 px-6">
                        <div className="relative group/edit">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted text-sm">Rp</span>
                          <input
                            type="text"
                            defaultValue={p.price.toLocaleString('id-ID')}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value.replace(/\./g, '').replace(/,/g, ''))
                              if (!isNaN(val) && val !== p.price) {
                                const fd = new FormData()
                                fd.set('price', val.toString())
                                updateProduct(p.id, fd)
                              }
                            }}
                            className="w-full pl-8 pr-2 py-1.5 text-sm font-bold text-brand-accent bg-transparent border border-transparent hover:border-brand-accent/30 focus:border-brand-accent focus:bg-brand-light rounded-[8px] transition-all outline-none"
                          />
                        </div>
                      </td>
                      {/* Stok inline */}
                      <td className="py-3 px-6">
                        <input
                          type="number"
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val) && val !== p.stock) {
                              const fd = new FormData()
                              fd.set('stock', val.toString())
                              updateProduct(p.id, fd)
                            }
                          }}
                          className="w-16 px-2 py-1.5 text-sm text-brand-dark bg-transparent border border-transparent hover:border-brand-accent/30 focus:border-brand-accent focus:bg-brand-light rounded-[8px] transition-all outline-none text-center"
                        />
                      </td>
                      {/* Status toggle */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={p.status === 'ACTIVE'}
                              onChange={() => {
                                const fd = new FormData()
                                fd.set('status', p.status === 'ACTIVE' ? 'false' : 'true')
                                updateProduct(p.id, fd)
                                setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: p.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const } : x))
                              }}
                            />
                            <span className="toggle-slider" />
                          </label>
                          <span className={`px-2.5 py-1 rounded-[20px] text-xs font-bold ${p.status === 'ACTIVE' ? 'bg-brand-surface/10 text-brand-surface' : 'bg-brand-muted/10 text-brand-muted'}`}>
                            {p.status === 'ACTIVE' ? 'Tersedia' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      {/* Aksi */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-[7px] bg-brand-surface/8 hover:bg-brand-surface hover:text-white text-brand-surface flex items-center justify-center transition-colors border border-brand-surface/20 text-xs"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: p.id, name: p.name })}
                            className="w-8 h-8 rounded-[7px] bg-red-50 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-colors border border-red-100 text-xs"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-brand-muted">Tidak ada produk ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-white rounded-[16px] w-full max-w-[560px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-brand-muted/10">
              <h2 className="font-serif text-xl font-bold text-brand-dark">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-brand-muted hover:text-brand-dark w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center">
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>
            <div className="p-7 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
              {/* Image preview/URL */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Foto Produk</label>
                <div className="flex gap-2 mb-2">
                  {previewImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewImg} className="w-20 h-20 rounded-[8px] object-cover border border-brand-muted/20 shrink-0" alt="" />
                  ) : (
                    <div className="flex items-center justify-center w-20 h-20 rounded-[8px] bg-brand-light border border-dashed border-brand-muted/30 shrink-0">
                      <FontAwesomeIcon icon={faCloudArrowUp} className="text-brand-muted text-2xl opacity-40" />
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setPreviewImg(e.target.value || null) }}
                    placeholder="https://... (URL gambar)"
                    className="inp flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-muted">atau upload langsung:</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brand-surface/40 text-brand-surface rounded-[8px] hover:bg-brand-surface hover:text-white transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
                    {isUploading ? 'Mengupload...' : 'Pilih File'}
                  </button>
                  <span className="text-xs text-brand-muted">JPG, PNG, WebP · maks. 2MB</span>
                </div>
              </div>

              {/* Gallery images */}
              <div>
                <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Foto Tambahan (Gallery)</label>
                {galleryImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {galleryImages.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} className="w-full h-full object-cover rounded-[8px] border border-brand-muted/20" alt="" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(url)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] hover:bg-red-600 transition-colors"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    ))}
                    {isUploadingGallery && (
                      <div className="w-16 h-16 rounded-[8px] border border-dashed border-brand-muted/30 bg-brand-light flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-brand-muted animate-pulse">...</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brand-surface/40 text-brand-surface rounded-[8px] hover:bg-brand-surface hover:text-white transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
                    {isUploadingGallery ? 'Mengupload...' : 'Tambah Foto'}
                  </button>
                  <span className="text-xs text-brand-muted">Bisa pilih beberapa sekaligus</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nama */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Nama Produk *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="inp" placeholder="Contoh: Domba Garut Super" />
                </div>
                {/* Berat */}
                <div>
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Berat (kg) *</label>
                  <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="inp" placeholder="35" min="1" />
                </div>
                {/* Harga */}
                <div>
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Harga (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="inp" placeholder="3500000" min="0" />
                </div>
                {/* Stok */}
                <div>
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Jumlah Stok *</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="inp" placeholder="10" min="0" />
                </div>
                {/* Deskripsi */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">Deskripsi</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="inp" placeholder="Deskripsi kondisi hewan..." />
                </div>
                {/* Status toggle */}
                <div className="col-span-2 flex items-center justify-between p-3 bg-brand-light rounded-[8px] border border-brand-muted/10">
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Status Aktif</div>
                    <div className="text-xs text-brand-muted">Tampilkan di katalog publik</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
            <div className="px-7 py-5 border-t border-brand-muted/10 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] shadow-premium hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteModal({ open: false, id: '', name: '' }) }}>
          <div className="bg-white rounded-[16px] w-full max-w-sm p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Hapus Produk?</h3>
            <p className="text-brand-muted text-sm mb-6">Produk <strong className="text-brand-dark">{deleteModal.name}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false, id: '', name: '' })} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm rounded-[8px] hover:bg-red-600 transition-colors disabled:opacity-60">
                {isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <FontAwesomeIcon icon={faCircleCheck} className="text-brand-accent" />
        {toast.msg}
      </div>
    </>
  )
}
