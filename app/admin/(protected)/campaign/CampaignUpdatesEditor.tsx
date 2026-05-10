'use client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons'

type CampaignUpdate = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

interface Props {
  campaignId: string
  onToast?: (msg: string) => void
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export default function CampaignUpdatesEditor({ campaignId, onToast }: Props) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/campaign-updates?campaignId=${encodeURIComponent(campaignId)}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setUpdates(Array.isArray(data) ? data : [])
    } catch {
      onToast?.('Gagal memuat kabar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  async function handlePost() {
    if (!title.trim() || !content.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/admin/campaign-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          title: title.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const created = await res.json()
      setUpdates(prev => [created, ...prev])
      setTitle('')
      setContent('')
      setImageUrl('')
      onToast?.('Kabar berhasil diposting')
    } catch {
      onToast?.('Gagal posting kabar')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    if (!confirm('Hapus kabar ini?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/campaign-updates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setUpdates(prev => prev.filter(u => u.id !== id))
      onToast?.('Kabar dihapus')
    } catch {
      onToast?.('Gagal menghapus kabar')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
      else onToast?.(data.error ?? 'Upload gagal')
    } catch {
      onToast?.('Upload gagal')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="border-t border-brand-muted/10 pt-5 mt-2">
      <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wider block mb-2">
        Kabar Terbaru
      </label>
      <p className="text-xs text-brand-muted mb-3">
        Posting update penyaluran. Akan tampil di tab Kabar Terbaru pada halaman detail campaign.
      </p>

      {/* List existing updates */}
      <div className="flex flex-col gap-2 mb-4">
        {loading ? (
          <div className="text-xs text-brand-muted py-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Memuat kabar...
          </div>
        ) : updates.length === 0 ? (
          <div className="text-xs text-brand-muted bg-brand-light rounded-[8px] px-3 py-2.5">
            Belum ada kabar.
          </div>
        ) : (
          updates.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3 bg-brand-light rounded-[8px] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-brand-dark truncate">{u.title}</div>
                <div className="text-[11px] text-brand-muted">{formatDate(u.createdAt)}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(u.id)}
                disabled={deletingId === u.id}
                className="text-red-500 hover:text-red-600 text-xs font-medium px-2 py-1 rounded disabled:opacity-50"
                aria-label="Hapus kabar"
              >
                <FontAwesomeIcon icon={deletingId === u.id ? faSpinner : faTrash} className={deletingId === u.id ? 'animate-spin' : ''} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* New update form */}
      <div className="bg-brand-light rounded-[10px] p-3 flex flex-col gap-2.5">
        <div>
          <label className="text-[11px] font-semibold text-brand-text-dark block mb-1">Judul</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="inp"
            placeholder="Contoh: Hewan qurban tiba di lokasi"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-brand-text-dark block mb-1">Konten</label>
          <textarea
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="inp"
            placeholder="Detail kabar / update..."
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-brand-text-dark block mb-1">Foto (Opsional)</label>
          <div className="flex flex-col gap-2">
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full max-h-40 object-cover rounded-[8px]" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold"
                >
                  ✕ Hapus
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-muted/30 rounded-[8px] cursor-pointer hover:border-brand-accent/50 transition-colors text-xs text-brand-muted">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
                {uploading ? (
                  <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Mengupload...</>
                ) : (
                  <>📷 Upload foto</>
                )}
              </label>
            )}
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="inp text-xs"
              placeholder="Atau paste URL: https://..."
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handlePost}
          disabled={!title.trim() || !content.trim() || posting}
          className="w-full py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={posting ? faSpinner : faPlus} className={posting ? 'animate-spin' : ''} />
          {posting ? 'Memposting...' : 'Posting Kabar'}
        </button>
      </div>
    </div>
  )
}
