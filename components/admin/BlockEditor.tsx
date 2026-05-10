'use client'
import { useEffect, useRef, useState } from 'react'
import { getEmbedUrl, isValidVideoUrl, getYoutubeThumbnail } from '@/lib/video-utils'

export type BlockType = 'text' | 'image' | 'video'

export interface ContentBlock {
  type: BlockType
  value: string
  caption?: string
}

function ImageBlockBody({
  block,
  onChange,
}: {
  block: ContentBlock
  onChange: (partial: Partial<ContentBlock>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const localUrl = URL.createObjectURL(file)
    onChange({ value: localUrl })
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads?folder=campaign', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        URL.revokeObjectURL(localUrl)
        onChange({ value: data.url })
      } else {
        setUploadError(data.error ?? 'Upload gagal')
        URL.revokeObjectURL(localUrl)
        onChange({ value: '' })
      }
    } catch {
      setUploadError('Upload gagal, coba lagi')
      URL.revokeObjectURL(localUrl)
      onChange({ value: '' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const hasImage = !!block.value

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-stretch">
        <div className="w-24 h-24 rounded-[8px] border border-brand-muted/20 bg-white flex items-center justify-center overflow-hidden shrink-0">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl opacity-40">🖼️</span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 text-xs font-bold border-2 border-dashed border-brand-surface/40 text-brand-surface rounded-[8px] hover:bg-brand-surface hover:text-white hover:border-brand-surface transition-colors disabled:opacity-50"
          >
            {uploading ? '⏳ Mengupload...' : hasImage ? '🔄 Ganti Foto' : '📤 Pilih File'}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={() => onChange({ value: '' })}
              className="px-3 py-1.5 text-[11px] text-red-500 border border-red-200 rounded-[8px] hover:bg-red-50"
            >
              ✕ Hapus foto
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
          atau tempel URL gambar
        </label>
        <input
          type="text"
          value={block.value}
          onChange={e => onChange({ value: e.target.value })}
          className="inp text-xs"
          placeholder="https://..."
        />
      </div>

      <input
        type="text"
        value={block.caption || ''}
        onChange={e => onChange({ caption: e.target.value })}
        className="inp text-xs"
        placeholder="Keterangan foto (opsional)"
      />
      {uploadError && <p className="text-[11px] text-red-600">⚠ {uploadError}</p>}
    </div>
  )
}

function VideoBlockBody({
  block,
  onChange,
}: {
  block: ContentBlock
  onChange: (partial: Partial<ContentBlock>) => void
}) {
  const [touched, setTouched] = useState(false)
  const trimmed = block.value.trim()
  const valid = trimmed ? isValidVideoUrl(trimmed) : false
  const embed = valid ? getEmbedUrl(trimmed) : null
  const thumb = valid ? getYoutubeThumbnail(trimmed) : null

  function getSourceLabel(url: string) {
    if (url.includes('youtube') || url.includes('youtu.be')) return '▶ YouTube'
    if (url.includes('drive.google')) return '▶ Google Drive'
    return '▶ Video'
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={block.value}
        onChange={e => { onChange({ value: e.target.value }); setTouched(true) }}
        onBlur={() => setTouched(true)}
        className="inp text-xs"
        placeholder="URL YouTube atau Google Drive..."
      />
      {touched && trimmed && !valid && (
        <p className="text-[11px] text-red-600">
          ⚠ URL tidak valid. Gunakan link YouTube (watch/shorts/youtu.be) atau Google Drive.
        </p>
      )}

      {valid && (
        <div className="rounded-[8px] overflow-hidden border border-brand-muted/20 bg-black">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full max-h-48 object-cover" />
          ) : embed ? (
            <iframe src={embed} className="w-full aspect-video" allow="autoplay; encrypted-media" />
          ) : null}
        </div>
      )}

      {valid && (
        <div className="text-[11px] text-brand-muted flex items-center gap-1.5">
          <span className="text-brand-surface font-medium">{getSourceLabel(trimmed)}</span>
          <span className="truncate">{trimmed}</span>
        </div>
      )}

      <input
        type="text"
        value={block.caption || ''}
        onChange={e => onChange({ caption: e.target.value })}
        className="inp text-xs"
        placeholder="Keterangan video (opsional)"
      />
    </div>
  )
}

export default function BlockEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })

  // Re-sync only when the editor opens with a fresh value (e.g. switching campaigns)
  useEffect(() => {
    try {
      const parsed = JSON.parse(value)
      setBlocks(Array.isArray(parsed) ? parsed : [])
    } catch { setBlocks([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === '[]' ? value : undefined])

  function commit(next: ContentBlock[]) {
    setBlocks(next)
    onChange(JSON.stringify(next))
  }

  function addBlock(type: BlockType) {
    const newBlock: ContentBlock =
      type === 'text' ? { type: 'text', value: '' }
      : type === 'image' ? { type: 'image', value: '', caption: '' }
      : { type: 'video', value: '', caption: '' }
    commit([...blocks, newBlock])
  }

  function removeBlock(i: number) { commit(blocks.filter((_, idx) => idx !== i)) }

  function updateBlock(i: number, partial: Partial<ContentBlock>) {
    commit(blocks.map((b, idx) => idx === i ? { ...b, ...partial } : b))
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = blocks.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    commit(next)
  }

  function blockMeta(t: BlockType) {
    if (t === 'image') return { icon: '📷', label: 'Gambar' }
    if (t === 'video') return { icon: '🎬', label: 'Video' }
    return { icon: '📝', label: 'Teks' }
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-brand-muted/20 rounded-[8px] bg-brand-light">
          <div className="text-2xl mb-1 opacity-50">✨</div>
          <p className="text-xs text-brand-muted">Belum ada blok. Tambahkan blok pertama di bawah.</p>
        </div>
      )}

      {blocks.map((block, i) => {
        const meta = blockMeta(block.type)
        return (
          <div key={i} className="border border-brand-muted/20 rounded-[8px] p-3 bg-brand-light relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                {meta.icon} {meta.label} <span className="opacity-60">#{i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveBlock(i, -1)}
                  disabled={i === 0}
                  title="Pindah ke atas"
                  className="w-6 h-6 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(i, 1)}
                  disabled={i === blocks.length - 1}
                  title="Pindah ke bawah"
                  className="w-6 h-6 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  title="Hapus blok"
                  className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            {block.type === 'text' ? (
              <textarea
                value={block.value}
                onChange={e => updateBlock(i, { value: e.target.value })}
                rows={4}
                className="inp w-full"
                placeholder="Tulis cerita di sini..."
              />
            ) : block.type === 'image' ? (
              <ImageBlockBody block={block} onChange={p => updateBlock(i, p)} />
            ) : (
              <VideoBlockBody block={block} onChange={p => updateBlock(i, p)} />
            )}
          </div>
        )
      })}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => addBlock('text')}
          className="py-2 border-2 border-dashed border-brand-muted/30 text-brand-muted hover:border-brand-surface hover:text-brand-surface rounded-[8px] text-xs font-medium transition-colors"
        >
          + Tambah Teks
        </button>
        <button
          type="button"
          onClick={() => addBlock('image')}
          className="py-2 border-2 border-dashed border-brand-muted/30 text-brand-muted hover:border-brand-surface hover:text-brand-surface rounded-[8px] text-xs font-medium transition-colors"
        >
          + Tambah Foto
        </button>
        <button
          type="button"
          onClick={() => addBlock('video')}
          className="py-2 border-2 border-dashed border-brand-muted/30 text-brand-muted hover:border-brand-surface hover:text-brand-surface rounded-[8px] text-xs font-medium transition-colors"
        >
          + Tambah Video
        </button>
      </div>
    </div>
  )
}
