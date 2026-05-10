'use client'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { isValidVideoUrl } from '@/lib/video-utils'

interface VideoUrlInputProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxVideos?: number
}

export interface VideoUrlInputHandle {
  /** Commit any text currently in the input field. Returns the resulting array (synchronous, bypasses React state batching). */
  flush: () => string[]
}

export const VideoUrlInput = forwardRef<VideoUrlInputHandle, VideoUrlInputProps>(
  function VideoUrlInput({ value, onChange, maxVideos = 5 }, ref) {
    const [input, setInput] = useState('')
    const [error, setError] = useState('')

    const commit = (raw: string, current: string[]): string[] | null => {
      const trimmed = raw.trim()
      if (!trimmed) return null
      if (!isValidVideoUrl(trimmed)) {
        setError('URL tidak valid. Gunakan link YouTube atau Google Drive.')
        return null
      }
      if (current.length >= maxVideos) {
        setError(`Maksimal ${maxVideos} video.`)
        return null
      }
      if (current.includes(trimmed)) return null
      return [...current, trimmed]
    }

    const handleAdd = () => {
      const next = commit(input, value)
      if (next) {
        onChange(next)
        setInput('')
        setError('')
      }
    }

    useImperativeHandle(ref, () => ({
      flush: () => {
        const next = commit(input, value)
        if (next) {
          onChange(next)
          setInput('')
          setError('')
          return next
        }
        return value
      },
    }), [input, value, maxVideos])

    const handleRemove = (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    }

    const getLabel = (url: string) => {
      if (url.includes('youtube') || url.includes('youtu.be')) return '▶ YouTube'
      if (url.includes('drive.google')) return '▶ Google Drive'
      return '▶ Video'
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onBlur={handleAdd}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Paste URL YouTube atau Google Drive..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={value.length >= maxVideos}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium
                       disabled:opacity-50 whitespace-nowrap"
          >
            + Tambah
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        {input.trim() && !error && (
          <p className="text-amber-600 text-xs">
            ⚠ Klik <strong>+ Tambah</strong> dulu sebelum menyimpan, atau URL akan hilang.
          </p>
        )}
        {value.map((url, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-xs text-green-700 font-medium">{getLabel(url)}</span>
            <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-red-400 hover:text-red-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        ))}
        <p className="text-xs text-gray-400">{value.length}/{maxVideos} video ditambahkan</p>
      </div>
    )
  }
)
