'use client'
import { useState, useTransition, useRef, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faPenToSquare, faTrash, faEye, faUpload, faArrowLeft,
  faCheck, faXmark, faGripVertical, faAlignLeft, faAlignCenter, faAlignRight,
  faCircleCheck, faCircleXmark, faImage, faSignature, faStamp, faFont,
  faRotate, faExpand,
} from '@fortawesome/free-solid-svg-icons'
import { saveTemplateSertifikat, deleteTemplateSertifikat, toggleTemplateAktif } from '@/lib/actions/sertifikat-template'
import {
  AVAILABLE_FIELDS, fieldsForTipe, defaultField, defaultStaticText, defaultImageElement,
  migrateLegacyElements,
  type SertifikatElement, type SertifikatFieldElement,
  type SertifikatStaticTextElement, type SertifikatImageElement,
  type SertifikatImageKind, type SertifikatTipe,
} from '@/lib/sertifikat/types'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'

interface Template {
  id: string
  nama: string
  tipe: SertifikatTipe
  blankoUrl: string
  width: number
  height: number
  fields: SertifikatElement[]
  aktif: boolean
  updatedAt: string
}

type Mode = 'list' | 'edit'

export default function SertifikatTemplateClient({
  initialTemplates,
}: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Template | null>(null)
  const [toast, setToast] = useState<{ show: boolean; msg: string; ok: boolean }>({ show: false, msg: '', ok: true })
  const router = useRouter()

  function showToast(msg: string, ok = true) {
    setToast({ show: true, msg, ok })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }

  function openCreate() {
    setEditing({
      id: '',
      nama: '',
      tipe: 'pembelian',
      blankoUrl: '',
      width: 0,
      height: 0,
      fields: [],
      aktif: true,
      updatedAt: '',
    })
    setMode('edit')
  }

  function openEdit(tpl: Template) {
    setEditing({ ...tpl, fields: migrateLegacyElements(tpl.fields) })
    setMode('edit')
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus template ini?')) return
    try {
      await deleteTemplateSertifikat(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      showToast('Template dihapus')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus', false)
    }
  }

  async function handleToggleAktif(tpl: Template) {
    try {
      await toggleTemplateAktif(tpl.id, !tpl.aktif)
      router.refresh()
      setTemplates(prev =>
        prev.map(t => {
          if (t.id === tpl.id) return { ...t, aktif: !tpl.aktif }
          if (!tpl.aktif && t.tipe === tpl.tipe) return { ...t, aktif: false }
          return t
        }),
      )
      showToast(tpl.aktif ? 'Template dinonaktifkan' : 'Template diaktifkan')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal', false)
    }
  }

  async function handleSaved(tpl: Template) {
    setMode('list')
    setEditing(null)
    router.refresh()
    setTemplates(prev => {
      const exists = prev.some(t => t.id === tpl.id)
      if (exists) return prev.map(t => (t.id === tpl.id ? tpl : t))
      return [tpl, ...prev]
    })
    showToast('Template berhasil disimpan')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <button
              onClick={() => { setMode('list'); setEditing(null) }}
              className="text-brand-muted hover:text-brand-dark text-sm font-medium flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Kembali
            </button>
          )}
          {mode === 'list' && (
            <Link href="/admin/pengaturan" className="text-brand-muted hover:text-brand-dark text-sm font-medium flex items-center gap-1.5">
              <FontAwesomeIcon icon={faArrowLeft} />
              Kembali
            </Link>
          )}
          <div>
            <h1 className="font-serif text-xl font-bold text-brand-dark">
              {mode === 'list' ? 'Template Sertifikat' : (editing?.id ? 'Edit Template' : 'Template Baru')}
            </h1>
            <p className="text-brand-muted text-xs mt-0.5">
              {mode === 'list' ? 'Upload blanko & atur posisi teks dengan drag & drop' : 'Susun field, gambar & teks di atas blanko'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
        {mode === 'list' && (
          <ListView
            templates={templates}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggle={handleToggleAktif}
          />
        )}
        {mode === 'edit' && editing && (
          <EditorView
            initial={editing}
            onSaved={handleSaved}
            onError={msg => showToast(msg, false)}
          />
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

// ─── LIST VIEW ─────────────────────────────────────────────────────────────
function ListView({
  templates, onCreate, onEdit, onDelete, onToggle,
}: {
  templates: Template[]
  onCreate: () => void
  onEdit: (t: Template) => void
  onDelete: (id: string) => void
  onToggle: (t: Template) => void
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-muted">
          Template aktif akan otomatis dipakai saat generate sertifikat dari menu Pesanan & Penyaluran.
        </p>
        <button
          onClick={onCreate}
          className="bg-brand-dark text-brand-accent-light px-4 py-2 rounded-[10px] text-sm font-bold flex items-center gap-2 hover:opacity-90"
        >
          <FontAwesomeIcon icon={faPlus} />
          Template Baru
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="border border-dashed border-brand-muted/30 rounded-[14px] p-12 text-center bg-white">
          <FontAwesomeIcon icon={faUpload} className="text-3xl text-brand-muted mb-3" />
          <p className="text-brand-muted">Belum ada template. Mulai dengan membuat template baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white border border-brand-muted/15 rounded-[14px] overflow-hidden flex flex-col">
              <div className="aspect-[1.4] bg-brand-light/50 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tpl.blankoUrl} alt={tpl.nama} className="w-full h-full object-contain" />
                {tpl.aktif && (
                  <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    AKTIF
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-brand-dark">{tpl.nama}</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-brand-light text-brand-muted rounded-full font-bold">
                    {tpl.tipe}
                  </span>
                </div>
                <p className="text-xs text-brand-muted">{tpl.fields.length} elemen dikonfigurasi</p>
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => onEdit(tpl)}
                    className="flex-1 text-xs font-bold border border-brand-muted/20 text-brand-dark px-3 py-2 rounded-[8px] hover:bg-brand-light flex items-center justify-center gap-1"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Edit
                  </button>
                  <button
                    onClick={() => onToggle(tpl)}
                    className={`flex-1 text-xs font-bold px-3 py-2 rounded-[8px] flex items-center justify-center gap-1 ${tpl.aktif ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-600 text-white'}`}
                  >
                    <FontAwesomeIcon icon={tpl.aktif ? faXmark : faCheck} />
                    {tpl.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => onDelete(tpl.id)}
                    className="text-xs font-bold border border-red-200 text-red-600 px-3 py-2 rounded-[8px] hover:bg-red-50"
                    title="Hapus"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ─── EDITOR VIEW ────────────────────────────────────────────────────────────
function EditorView({
  initial, onSaved, onError,
}: {
  initial: Template
  onSaved: (t: Template) => void
  onError: (msg: string) => void
}) {
  const [nama, setNama] = useState(initial.nama)
  const [tipe, setTipe] = useState<SertifikatTipe>(initial.tipe)
  const [blankoUrl, setBlankoUrl] = useState(initial.blankoUrl)
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: initial.width, h: initial.height })
  const [elements, setElements] = useState<SertifikatElement[]>(initial.fields)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [aktif, setAktif] = useState(initial.aktif)
  const [uploading, setUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [pendingPreview, setPendingPreview] = useState(false)
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{
    key: string
    mode: 'move' | 'resize'
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    aspect: number
  } | null>(null)

  const available = useMemo(() => fieldsForTipe(tipe), [tipe])
  const placedFieldKeys = useMemo(
    () => new Set(elements.filter(e => e.type === 'field').map(e => e.key)),
    [elements],
  )
  const selected = elements.find(e => e.key === selectedKey) || null

  // Fetch site logo on mount (for "use existing logo" button)
  useEffect(() => {
    fetch('/api/admin/sertifikat/site-logo')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.url) setSiteLogoUrl(j.url) })
      .catch(() => {})
  }, [])

  // ─── Upload blanko
  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    setUploading(true)
    try {
      const res = await fetch('/api/admin/sertifikat/upload-blanko', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal upload')
      setBlankoUrl(json.url)
      setImgSize({ w: json.width, h: json.height })
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  // ─── Upload asset (logo, ttd, cap)
  async function handleAssetUpload(file: File, kind: SertifikatImageKind) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    setUploading(true)
    try {
      const res = await fetch('/api/admin/sertifikat/upload-asset', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal upload aset')
      addImageElement(kind, json.url, json.width, json.height)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal upload aset')
    } finally {
      setUploading(false)
    }
  }

  function addImageElement(kind: SertifikatImageKind, url: string, naturalW = 0, naturalH = 0) {
    const key = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const el = defaultImageElement(kind, url, key, 50, 50)
    // Adjust height so the rendered aspect ratio matches the natural image.
    if (naturalW > 0 && naturalH > 0 && imgSize.w > 0 && imgSize.h > 0) {
      const widthPx = (el.width / 100) * imgSize.w
      const heightPx = widthPx * (naturalH / naturalW)
      el.height = (heightPx / imgSize.h) * 100
    }
    setElements(prev => [...prev, el])
    setSelectedKey(key)
  }

  function useExistingLogo() {
    if (!siteLogoUrl) return
    // Try to detect natural size (best-effort).
    const probe = new Image()
    probe.onload = () => addImageElement('logo_utama', siteLogoUrl, probe.naturalWidth, probe.naturalHeight)
    probe.onerror = () => addImageElement('logo_utama', siteLogoUrl)
    probe.src = siteLogoUrl
  }

  function addStaticText() {
    const key = `static-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const el = defaultStaticText(key, 50, 40)
    setElements(prev => [...prev, el])
    setSelectedKey(key)
  }

  // ─── Drag from sidebar (new field)
  function onSidebarFieldDragStart(e: React.DragEvent, key: string) {
    e.dataTransfer.setData('field-key', key)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onCanvasDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('field-key')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function onCanvasDrop(e: React.DragEvent) {
    const fieldKey = e.dataTransfer.getData('field-key')
    if (!fieldKey) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    e.preventDefault()
    const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100)
    const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100)
    if (placedFieldKeys.has(fieldKey)) {
      setElements(prev => prev.map(el =>
        el.type === 'field' && el.key === fieldKey ? { ...el, x: xPct, y: yPct } : el,
      ))
    } else {
      setElements(prev => [...prev, defaultField(fieldKey, xPct, yPct)])
    }
    setSelectedKey(fieldKey)
  }

  // ─── Drag/resize existing element on canvas
  const onMouseMove = useCallback((e: MouseEvent) => {
    const ds = dragStateRef.current
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!ds || !rect) return
    const dxPct = ((e.clientX - ds.startX) / rect.width) * 100
    const dyPct = ((e.clientY - ds.startY) / rect.height) * 100

    if (ds.mode === 'move') {
      const xPct = clamp(ds.origX + dxPct)
      const yPct = clamp(ds.origY + dyPct)
      setElements(prev => prev.map(el => el.key === ds.key ? { ...el, x: xPct, y: yPct } : el))
    } else if (ds.mode === 'resize') {
      const newW = clamp(ds.origW + dxPct, 2, 100)
      const newH = ds.aspect > 0
        ? clamp((newW / 100 * (rect.width / rect.height)) / ds.aspect * 100, 2, 100)
        : clamp(ds.origH + dyPct, 2, 100)
      setElements(prev => prev.map(el => {
        if (el.key !== ds.key || el.type !== 'image') return el
        return { ...el, width: newW, height: newH }
      }))
    }
  }, [])

  const onMouseUp = useCallback(() => {
    dragStateRef.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  function startDrag(
    e: React.MouseEvent,
    key: string,
    mode: 'move' | 'resize',
  ) {
    e.preventDefault()
    e.stopPropagation()
    setSelectedKey(key)
    const el = elements.find(x => x.key === key)
    if (!el) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    let aspect = 0
    if (el.type === 'image') {
      // visual aspect = (widthPct * canvasW) / (heightPct * canvasH)
      const wPx = (el.width / 100) * rect.width
      const hPx = (el.height / 100) * rect.height
      if (wPx > 0 && hPx > 0) aspect = wPx / hPx
    }
    dragStateRef.current = {
      key,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.type === 'image' ? el.width : 0,
      origH: el.type === 'image' ? el.height : 0,
      aspect,
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  useEffect(() => () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove, onMouseUp])

  function updateElement(key: string, patch: Partial<SertifikatElement>) {
    setElements(prev => prev.map(el => el.key === key ? ({ ...el, ...patch } as SertifikatElement) : el))
  }

  function removeElement(key: string) {
    setElements(prev => prev.filter(el => el.key !== key))
    if (selectedKey === key) setSelectedKey(null)
  }

  // ─── Preview
  async function generatePreview() {
    if (!blankoUrl) { onError('Upload blanko dulu'); return }
    if (elements.length === 0) { onError('Belum ada elemen'); return }
    setPendingPreview(true)
    try {
      const res = await fetch('/api/admin/sertifikat/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blankoUrl, fields: elements }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Gagal preview')
      }
      const blob = await res.blob()
      if (previewSrc) URL.revokeObjectURL(previewSrc)
      setPreviewSrc(URL.createObjectURL(blob))
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal preview')
    } finally {
      setPendingPreview(false)
    }
  }

  // ─── Save
  function handleSave() {
    if (!nama.trim()) { onError('Isi nama template'); return }
    if (!blankoUrl) { onError('Upload blanko dulu'); return }
    startTransition(async () => {
      try {
        await saveTemplateSertifikat({
          id: initial.id || undefined,
          nama: nama.trim(),
          tipe,
          blankoUrl,
          width: imgSize.w,
          height: imgSize.h,
          fields: elements,
          aktif,
        })
        onSaved({
          id: initial.id || `tmp-${Date.now()}`,
          nama: nama.trim(),
          tipe,
          blankoUrl,
          width: imgSize.w,
          height: imgSize.h,
          fields: elements,
          aktif,
          updatedAt: new Date().toISOString(),
        })
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Gagal menyimpan')
      }
    })
  }

  // When tipe changes, drop field-elements that no longer apply.
  function onTipeChange(next: SertifikatTipe) {
    setTipe(next)
    const allowed = new Set(fieldsForTipe(next).map(f => f.key))
    setElements(prev => prev.filter(el => el.type !== 'field' || allowed.has(el.key)))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header form */}
      <div className="bg-white border border-brand-muted/15 rounded-[14px] p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-brand-muted mb-1">Nama Template</label>
          <input
            value={nama}
            onChange={e => setNama(e.target.value)}
            placeholder="Sertifikat Pembelian Hewan"
            className="w-full border border-brand-muted/20 rounded-[10px] px-3 py-2 text-sm focus:border-brand-dark focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-muted mb-1">Tipe</label>
          <select
            value={tipe}
            onChange={e => onTipeChange(e.target.value as SertifikatTipe)}
            className="w-full border border-brand-muted/20 rounded-[10px] px-3 py-2 text-sm focus:border-brand-dark focus:outline-none"
          >
            <option value="pembelian">Pembelian</option>
            <option value="qurban">Qurban / Donasi</option>
          </select>
        </div>
        <div className="md:col-span-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={aktif} onChange={e => setAktif(e.target.checked)} />
            <span>Set sebagai template aktif untuk tipe <b>{tipe}</b></span>
          </label>
          <span className="text-xs text-brand-muted">(otomatis menonaktifkan template lain dengan tipe yang sama)</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {!blankoUrl ? (
        <UploadBlanko uploading={uploading} onPick={handleUpload} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">
          {/* Left: palette */}
          <div className="flex flex-col gap-4 min-w-0">
            <ImageElementsPalette
              elements={elements}
              siteLogoUrl={siteLogoUrl}
              uploading={uploading}
              onUpload={handleAssetUpload}
              onUseExistingLogo={useExistingLogo}
            />

            <StaticTextPalette onAdd={addStaticText} />

            <FieldPalette
              available={available}
              placedFieldKeys={placedFieldKeys}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onDragStart={onSidebarFieldDragStart}
            />
          </div>

          {/* Center: canvas */}
          <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4 flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-dark">Editor Posisi</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={pendingPreview}
                  className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-brand-light flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faEye} />
                  {pendingPreview ? 'Render…' : 'Preview'}
                </button>
                <label className="text-xs font-bold border border-brand-muted/20 px-3 py-1.5 rounded-[8px] hover:bg-brand-light flex items-center gap-1.5 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} />
                  Ganti Blanko
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
                  />
                </label>
              </div>
            </div>

            <div
              ref={canvasRef}
              onDragOver={onCanvasDragOver}
              onDrop={onCanvasDrop}
              onClick={e => { if (e.target === e.currentTarget) setSelectedKey(null) }}
              className="relative w-full bg-brand-light rounded-[10px] overflow-hidden select-none"
              style={{ aspectRatio: imgSize.w && imgSize.h ? `${imgSize.w} / ${imgSize.h}` : '1.4' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blankoUrl} alt="blanko" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              {elements.map(el => (
                <CanvasElement
                  key={el.key}
                  element={el}
                  selected={selectedKey === el.key}
                  canvasW={imgSize.w}
                  onMouseDown={e => startDrag(e, el.key, 'move')}
                  onResizeMouseDown={e => startDrag(e, el.key, 'resize')}
                  onSelect={() => setSelectedKey(el.key)}
                  onChangeContent={content =>
                    updateElement(el.key, { content } as Partial<SertifikatStaticTextElement>)
                  }
                />
              ))}
            </div>

            <p className="text-[11px] text-brand-muted">
              Tarik elemen untuk memindahkan posisi. Klik untuk memilih dan atur dari panel kanan.
              Tarik handle pojok untuk resize gambar. Posisi & ukuran disimpan dalam persentase.
            </p>
          </div>

          {/* Right: properties panel */}
          <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4">
            <h3 className="font-bold text-brand-dark text-sm mb-3">Properti Elemen</h3>
            {!selected ? (
              <p className="text-xs text-brand-muted">Klik salah satu elemen di kanvas untuk mengatur tampilannya.</p>
            ) : selected.type === 'image' ? (
              <ImageProperties
                element={selected}
                onChange={patch => updateElement(selected.key, patch)}
                onDelete={() => removeElement(selected.key)}
              />
            ) : (
              <TextProperties
                element={selected}
                onChange={patch => updateElement(selected.key, patch)}
                onDelete={() => removeElement(selected.key)}
              />
            )}
          </div>
        </div>
      )}

      {/* Preview result */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => { if (previewSrc) URL.revokeObjectURL(previewSrc); setPreviewSrc(null) }}>
          <div className="bg-white rounded-[14px] max-w-5xl w-full max-h-[90vh] overflow-auto p-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-brand-dark text-sm">Preview Hasil (data dummy)</h3>
              <button
                onClick={() => { if (previewSrc) URL.revokeObjectURL(previewSrc); setPreviewSrc(null) }}
                className="text-xs text-brand-muted hover:text-brand-dark border border-brand-muted/20 rounded-[8px] px-3 py-1.5"
              >
                Tutup
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="preview" className="w-full object-contain rounded-[8px] border border-brand-muted/15" />
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 bg-white border border-brand-muted/20 rounded-[14px] p-3 flex justify-between items-center shadow-lg">
        <div className="text-xs text-brand-muted">
          {elements.length} elemen dikonfigurasi
          {imgSize.w > 0 && ` · ${imgSize.w}×${imgSize.h}px`}
        </div>
        <button
          onClick={handleSave}
          disabled={pending || uploading}
          className="bg-brand-dark text-brand-accent-light px-5 py-2.5 rounded-[10px] text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faCheck} />
          {pending ? 'Menyimpan…' : 'Simpan Template'}
        </button>
      </div>
    </div>
  )
}

// ─── PALETTE: IMAGE ELEMENTS ────────────────────────────────────────────────
function ImageElementsPalette({
  elements, siteLogoUrl, uploading, onUpload, onUseExistingLogo,
}: {
  elements: SertifikatElement[]
  siteLogoUrl: string | null
  uploading: boolean
  onUpload: (f: File, kind: SertifikatImageKind) => void
  onUseExistingLogo: () => void
}) {
  const placedKinds = new Set(
    elements.filter(e => e.type === 'image').map(e => (e as SertifikatImageElement).imageKind),
  )

  return (
    <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4">
      <h3 className="font-bold text-brand-dark text-sm mb-3">Elemen Gambar</h3>
      <div className="flex flex-col gap-3">
        <ImageCard
          icon={faImage}
          title="Logo Utama"
          placed={placedKinds.has('logo_utama')}
          uploading={uploading}
          accept="image/png,image/jpeg,image/webp"
          onPick={f => onUpload(f, 'logo_utama')}
          extra={
            siteLogoUrl ? (
              <button
                onClick={onUseExistingLogo}
                className="w-full text-[11px] font-bold border border-brand-muted/20 rounded-[8px] px-2 py-1.5 hover:bg-brand-light"
              >
                Pakai logo yang sudah ada
              </button>
            ) : null
          }
        />
        <ImageCard
          icon={faImage}
          title="Logo Tambahan"
          placed={placedKinds.has('logo_tambahan')}
          uploading={uploading}
          accept="image/png,image/jpeg,image/webp"
          onPick={f => onUpload(f, 'logo_tambahan')}
        />
        <ImageCard
          icon={faSignature}
          title="Tanda Tangan"
          placed={placedKinds.has('ttd')}
          uploading={uploading}
          accept="image/png,image/jpeg,image/webp"
          hint="Disarankan PNG transparan"
          onPick={f => onUpload(f, 'ttd')}
        />
        <ImageCard
          icon={faStamp}
          title="Cap / Stempel"
          placed={placedKinds.has('cap')}
          uploading={uploading}
          accept="image/png,image/jpeg,image/webp"
          hint="Disarankan PNG transparan"
          onPick={f => onUpload(f, 'cap')}
        />
      </div>
    </div>
  )
}

function ImageCard({
  icon, title, placed, uploading, accept, hint, onPick, extra,
}: {
  icon: typeof faImage
  title: string
  placed: boolean
  uploading: boolean
  accept: string
  hint?: string
  onPick: (f: File) => void
  extra?: React.ReactNode
}) {
  return (
    <div className="border border-brand-muted/15 rounded-[10px] p-3 bg-brand-light/30 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <FontAwesomeIcon icon={icon} className="text-brand-muted" />
        <span className="font-bold text-brand-dark flex-1">{title}</span>
        {placed && <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-xs" />}
      </div>
      {extra}
      <label className="w-full text-[11px] font-bold bg-brand-dark text-brand-accent-light rounded-[8px] px-2 py-1.5 hover:opacity-90 cursor-pointer text-center">
        <FontAwesomeIcon icon={faUpload} className="mr-1.5" />
        {placed ? 'Upload Lagi' : 'Upload'}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }}
        />
      </label>
      {hint && <p className="text-[10px] text-brand-muted leading-tight">{hint}</p>}
    </div>
  )
}

// ─── PALETTE: STATIC TEXT ───────────────────────────────────────────────────
function StaticTextPalette({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4">
      <h3 className="font-bold text-brand-dark text-sm mb-3">Teks Statis</h3>
      <p className="text-[11px] text-brand-muted mb-3">
        Untuk teks tetap seperti judul, kalimat sambutan, ayat, atau nama organisasi.
      </p>
      <button
        onClick={onAdd}
        className="w-full text-xs font-bold border border-dashed border-brand-muted/40 rounded-[10px] px-3 py-2.5 hover:bg-brand-light flex items-center justify-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} />
        Tambah Teks
      </button>
    </div>
  )
}

// ─── PALETTE: FIELDS ────────────────────────────────────────────────────────
function FieldPalette({
  available, placedFieldKeys, selectedKey, onSelect, onDragStart,
}: {
  available: { key: string; label: string; example: string }[]
  placedFieldKeys: Set<string>
  selectedKey: string | null
  onSelect: (k: string) => void
  onDragStart: (e: React.DragEvent, key: string) => void
}) {
  return (
    <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4">
      <h3 className="font-bold text-brand-dark text-sm mb-1">Daftar Field</h3>
      <p className="text-[11px] text-brand-muted mb-3">Tarik ke kanvas untuk menambah field dinamis</p>
      <div className="flex flex-col gap-2">
        {available.map(f => {
          const placed = placedFieldKeys.has(f.key)
          const isSelected = selectedKey === f.key
          return (
            <div
              key={f.key}
              draggable={!placed}
              onDragStart={e => onDragStart(e, f.key)}
              onClick={() => placed && onSelect(f.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm border ${placed ? `bg-emerald-50 border-emerald-200 cursor-pointer ${isSelected ? 'ring-2 ring-brand-dark' : ''}` : 'bg-brand-light border-brand-muted/15 cursor-grab hover:bg-brand-light/70'}`}
            >
              <FontAwesomeIcon icon={faGripVertical} className="text-brand-muted text-xs" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{f.label}</div>
                <div className="text-[10px] text-brand-muted truncate">{f.example}</div>
              </div>
              {placed && <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-xs" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CANVAS ELEMENT ─────────────────────────────────────────────────────────
function CanvasElement({
  element, selected, canvasW, onMouseDown, onResizeMouseDown, onSelect, onChangeContent,
}: {
  element: SertifikatElement
  selected: boolean
  canvasW: number
  onMouseDown: (e: React.MouseEvent) => void
  onResizeMouseDown: (e: React.MouseEvent) => void
  onSelect: () => void
  onChangeContent: (s: string) => void
}) {
  if (element.type === 'image') {
    const el = element
    return (
      <div
        onMouseDown={onMouseDown}
        onClick={e => { e.stopPropagation(); onSelect() }}
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.width}%`,
          height: `${el.height}%`,
          opacity: (el.opacity ?? 100) / 100,
          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        }}
        className={`absolute cursor-move ${selected ? 'ring-2 ring-brand-dark' : 'ring-1 ring-brand-dark/30 hover:ring-brand-dark/60'}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.url}
          alt={el.imageKind || 'image'}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        {selected && (
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-dark border-2 border-white rounded-sm cursor-se-resize z-10"
            title="Resize"
          />
        )}
      </div>
    )
  }

  const fontSize = `clamp(8px, ${(element.fontSize / (canvasW || 1200)) * 100}vw, ${element.fontSize}px)`
  const baseStyle: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: 'translate(-50%, -50%)',
    color: element.color,
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily || 'serif',
    textAlign: element.align,
    fontSize,
    maxWidth: element.maxWidth ? `${element.maxWidth}%` : undefined,
    whiteSpace: element.maxWidth ? 'normal' : 'nowrap',
  }

  if (element.type === 'static_text') {
    return (
      <div
        onMouseDown={onMouseDown}
        onClick={e => { e.stopPropagation(); onSelect() }}
        style={baseStyle}
        className={`absolute px-1.5 py-0.5 cursor-move rounded ${selected ? 'ring-2 ring-brand-dark bg-blue-100/60' : 'ring-1 ring-blue-400/40 bg-blue-50/30 hover:bg-blue-50/60'}`}
      >
        <span
          contentEditable={selected}
          suppressContentEditableWarning
          onMouseDown={e => { if (selected) e.stopPropagation() }}
          onBlur={e => onChangeContent(e.currentTarget.textContent || '')}
          className="outline-none"
        >
          {element.content}
        </span>
      </div>
    )
  }

  // type === 'field'
  const def = AVAILABLE_FIELDS.find(a => a.key === element.key)
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={e => { e.stopPropagation(); onSelect() }}
      style={baseStyle}
      className={`absolute px-1.5 py-0.5 cursor-move rounded ${selected ? 'ring-2 ring-brand-dark bg-yellow-100/60' : 'ring-1 ring-brand-dark/30 bg-white/40 hover:bg-white/60'}`}
    >
      {def?.example || element.key}
    </div>
  )
}

// ─── PROPERTIES PANELS ──────────────────────────────────────────────────────
function TextProperties({
  element, onChange, onDelete,
}: {
  element: SertifikatFieldElement | SertifikatStaticTextElement
  onChange: (patch: Partial<SertifikatElement>) => void
  onDelete: () => void
}) {
  const isStatic = element.type === 'static_text'
  const label = isStatic
    ? 'Teks Statis'
    : (AVAILABLE_FIELDS.find(a => a.key === element.key)?.label || element.key)

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1 flex items-center gap-1.5">
          <FontAwesomeIcon icon={isStatic ? faFont : faPenToSquare} />
          {isStatic ? 'Tipe' : 'Field'}
        </div>
        <div className="font-bold text-brand-dark">{label}</div>
        {!isStatic && <div className="text-[10px] text-brand-muted">{element.key}</div>}
      </div>

      {isStatic && (
        <div>
          <div className="text-xs font-bold text-brand-muted mb-1">Isi Teks</div>
          <textarea
            value={(element as SertifikatStaticTextElement).content}
            onChange={e => onChange({ content: e.target.value } as Partial<SertifikatStaticTextElement>)}
            rows={3}
            className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5 text-xs"
            placeholder="Tulis isi teks…"
          />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span>Font Size</span>
          <span>{element.fontSize}px</span>
        </div>
        <input
          type="range" min={10} max={120} step={1}
          value={element.fontSize}
          onChange={e => onChange({ fontSize: Number(e.target.value) } as Partial<SertifikatElement>)}
          className="w-full"
        />
      </div>
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1">Font Weight</div>
        <div className="flex gap-1.5">
          {(['normal', 'bold'] as const).map(w => (
            <button
              key={w}
              onClick={() => onChange({ fontWeight: w } as Partial<SertifikatElement>)}
              className={`flex-1 text-xs px-2 py-1.5 rounded-[8px] border ${element.fontWeight === w ? 'bg-brand-dark text-brand-accent-light border-brand-dark' : 'border-brand-muted/20 hover:bg-brand-light'}`}
            >
              {w === 'bold' ? 'Bold' : 'Normal'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1">Alignment</div>
        <div className="flex gap-1.5">
          {[
            { v: 'left', icon: faAlignLeft },
            { v: 'center', icon: faAlignCenter },
            { v: 'right', icon: faAlignRight },
          ].map(a => (
            <button
              key={a.v}
              onClick={() => onChange({ align: a.v as SertifikatFieldElement['align'] } as Partial<SertifikatElement>)}
              className={`flex-1 text-xs px-2 py-1.5 rounded-[8px] border ${element.align === a.v ? 'bg-brand-dark text-brand-accent-light border-brand-dark' : 'border-brand-muted/20 hover:bg-brand-light'}`}
            >
              <FontAwesomeIcon icon={a.icon} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1">Warna</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.color}
            onChange={e => onChange({ color: e.target.value } as Partial<SertifikatElement>)}
            className="w-12 h-9 border border-brand-muted/20 rounded-[8px] cursor-pointer"
          />
          <input
            type="text"
            value={element.color}
            onChange={e => onChange({ color: e.target.value } as Partial<SertifikatElement>)}
            className="flex-1 border border-brand-muted/20 rounded-[8px] px-2 py-1.5 text-xs font-mono"
          />
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1">Font Family</div>
        <select
          value={element.fontFamily || 'serif'}
          onChange={e => onChange({ fontFamily: e.target.value } as Partial<SertifikatElement>)}
          className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5 text-xs"
        >
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>
      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span>Max Width (% lebar blanko)</span>
          <span>{element.maxWidth ?? 0}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1}
          value={element.maxWidth ?? 0}
          onChange={e => onChange({ maxWidth: Number(e.target.value) || undefined } as Partial<SertifikatElement>)}
          className="w-full"
        />
        <div className="text-[10px] text-brand-muted mt-0.5">0 = tanpa wrap (single line)</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="font-bold text-brand-muted mb-1">Posisi X</div>
          <input
            type="number" min={0} max={100} step={0.1}
            value={Number(element.x.toFixed(1))}
            onChange={e => onChange({ x: clamp(Number(e.target.value)) } as Partial<SertifikatElement>)}
            className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5"
          />
        </div>
        <div>
          <div className="font-bold text-brand-muted mb-1">Posisi Y</div>
          <input
            type="number" min={0} max={100} step={0.1}
            value={Number(element.y.toFixed(1))}
            onChange={e => onChange({ y: clamp(Number(e.target.value)) } as Partial<SertifikatElement>)}
            className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5"
          />
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-2 bg-red-50 text-red-600 border border-red-200 rounded-[8px] py-2 text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5"
      >
        <FontAwesomeIcon icon={faTrash} />
        Hapus Elemen
      </button>
    </div>
  )
}

function ImageProperties({
  element, onChange, onDelete,
}: {
  element: SertifikatImageElement
  onChange: (patch: Partial<SertifikatImageElement>) => void
  onDelete: () => void
}) {
  const kindLabel: Record<SertifikatImageKind, string> = {
    logo_utama: 'Logo Utama',
    logo_tambahan: 'Logo Tambahan',
    ttd: 'Tanda Tangan',
    cap: 'Cap / Stempel',
    custom: 'Gambar',
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="text-xs font-bold text-brand-muted mb-1 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faImage} />
          Tipe Gambar
        </div>
        <div className="font-bold text-brand-dark">{kindLabel[element.imageKind || 'custom']}</div>
      </div>

      <div className="bg-brand-light/50 border border-brand-muted/15 rounded-[8px] p-2 flex items-center justify-center max-h-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={element.url} alt="aset" className="max-h-28 object-contain" />
      </div>

      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span><FontAwesomeIcon icon={faExpand} className="mr-1" />Ukuran (% lebar)</span>
          <span>{element.width.toFixed(1)}%</span>
        </div>
        <input
          type="range" min={2} max={100} step={0.5}
          value={element.width}
          onChange={e => {
            const newW = Number(e.target.value)
            // Maintain aspect ratio if current height/width ratio is sensible.
            const ratio = element.width > 0 ? element.height / element.width : 1
            onChange({ width: newW, height: Math.max(2, newW * ratio) })
          }}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span>Tinggi (% tinggi)</span>
          <span>{element.height.toFixed(1)}%</span>
        </div>
        <input
          type="range" min={2} max={100} step={0.5}
          value={element.height}
          onChange={e => onChange({ height: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span><FontAwesomeIcon icon={faRotate} className="mr-1" />Rotasi</span>
          <span>{element.rotation || 0}°</span>
        </div>
        <input
          type="range" min={0} max={360} step={1}
          value={element.rotation || 0}
          onChange={e => onChange({ rotation: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between items-center text-xs font-bold text-brand-muted mb-1">
          <span>Opacity</span>
          <span>{element.opacity ?? 100}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1}
          value={element.opacity ?? 100}
          onChange={e => onChange({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="font-bold text-brand-muted mb-1">Posisi X</div>
          <input
            type="number" min={0} max={100} step={0.1}
            value={Number(element.x.toFixed(1))}
            onChange={e => onChange({ x: clamp(Number(e.target.value)) })}
            className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5"
          />
        </div>
        <div>
          <div className="font-bold text-brand-muted mb-1">Posisi Y</div>
          <input
            type="number" min={0} max={100} step={0.1}
            value={Number(element.y.toFixed(1))}
            onChange={e => onChange({ y: clamp(Number(e.target.value)) })}
            className="w-full border border-brand-muted/20 rounded-[8px] px-2 py-1.5"
          />
        </div>
      </div>

      <button
        onClick={onDelete}
        className="mt-2 bg-red-50 text-red-600 border border-red-200 rounded-[8px] py-2 text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5"
      >
        <FontAwesomeIcon icon={faTrash} />
        Hapus Elemen
      </button>
    </div>
  )
}

function UploadBlanko({ uploading, onPick }: { uploading: boolean; onPick: (f: File) => void }) {
  return (
    <label className="block bg-white border-2 border-dashed border-brand-muted/30 rounded-[14px] p-12 text-center cursor-pointer hover:border-brand-dark/40 hover:bg-brand-light/30 transition-colors">
      <FontAwesomeIcon icon={faUpload} className="text-3xl text-brand-muted mb-3" />
      <div className="font-bold text-brand-dark mb-1">{uploading ? 'Mengupload…' : 'Klik untuk Upload Blanko'}</div>
      <div className="text-xs text-brand-muted">
        PNG / JPG / WebP · maks 5MB · lebar minimal 1200px
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f) }}
      />
    </label>
  )
}

function clamp(v: number, min = 0, max = 100): number {
  if (Number.isNaN(v)) return min
  return Math.max(min, Math.min(max, v))
}
