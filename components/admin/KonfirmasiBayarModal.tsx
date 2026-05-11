'use client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faCircleCheck, faSpinner, faImage, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons'

export type KonfirmasiKind = 'order' | 'donation'

interface Props {
  kind: KonfirmasiKind
  id: string
  customerName: string
  totalAmount: number
  sisaPembayaran: number | null
  jumlahDP: number | null
  onClose: () => void
  onSuccess: (id: string, linkForm: string | null) => void
}

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function KonfirmasiBayarModal({
  kind, id, customerName, totalAmount, sisaPembayaran, jumlahDP, onClose, onSuccess,
}: Props) {
  const defaultJumlah = sisaPembayaran != null && sisaPembayaran > 0
    ? sisaPembayaran
    : (jumlahDP != null ? totalAmount - jumlahDP : totalAmount)

  const [buktiUrl, setBuktiUrl] = useState<string>('')
  const [jumlahBayar, setJumlahBayar] = useState<string>(String(defaultJumlah))
  const [tanggalBayar, setTanggalBayar] = useState<string>(todayLocalISO())
  const [metodeBayar, setMetodeBayar] = useState<string>('Transfer')
  const [catatan, setCatatan] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/proof-upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal upload bukti')
      setBuktiUrl(json.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal upload bukti')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    setError(null)
    const jumlah = Number(jumlahBayar.replace(/[^\d]/g, ''))
    if (!Number.isFinite(jumlah) || jumlah <= 0) {
      setError('Jumlah dibayar wajib diisi (> 0)')
      return
    }
    if (!tanggalBayar) {
      setError('Tanggal bayar wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const endpoint = kind === 'order'
        ? `/api/admin/orders/${id}/konfirmasi-bayar`
        : `/api/admin/donations/${id}/konfirmasi-bayar`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buktiUrl: buktiUrl || null,
          jumlahBayar: jumlah,
          tanggalBayar,
          metodeBayar: metodeBayar.trim() || null,
          catatan: catatan.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal konfirmasi')
      onSuccess(id, json.linkForm ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal konfirmasi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !submitting) onClose() }}>
      <div className="bg-white rounded-[16px] w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-600" />
            <h3 className="font-serif text-lg font-bold text-brand-dark">Konfirmasi Bayar</h3>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-brand-muted hover:text-brand-dark disabled:opacity-40">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <p className="text-xs text-brand-muted mb-4">
          {customerName} · Total {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmount)}
          {jumlahDP != null && jumlahDP > 0 && (
            <> · DP sudah dibayar {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(jumlahDP)}</>
          )}
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-brand-dark mb-1 block">Upload Bukti Transfer</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading || submitting}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
              className="text-xs w-full"
            />
            {uploading && (
              <div className="text-xs text-brand-muted mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faSpinner} spin /> Upload…
              </div>
            )}
            {buktiUrl && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <FontAwesomeIcon icon={faImage} className="text-emerald-600" />
                <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className="text-brand-surface underline truncate">{buktiUrl}</a>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark mb-1 block">Jumlah Dibayar *</label>
            <input
              type="text"
              inputMode="numeric"
              value={jumlahBayar}
              onChange={e => setJumlahBayar(e.target.value)}
              className="w-full border border-brand-muted/20 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-surface/30"
              placeholder="1000000"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark mb-1 block">Tanggal Bayar *</label>
            <input
              type="date"
              value={tanggalBayar}
              onChange={e => setTanggalBayar(e.target.value)}
              className="w-full border border-brand-muted/20 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-surface/30"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark mb-1 block">Metode Bayar</label>
            <select
              value={metodeBayar}
              onChange={e => setMetodeBayar(e.target.value)}
              className="w-full border border-brand-muted/20 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-surface/30"
              disabled={submitting}
            >
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark mb-1 block">Catatan</label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={2}
              className="w-full border border-brand-muted/20 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-surface/30"
              placeholder="opsional"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-[8px] p-2">{error}</div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light disabled:opacity-60"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-[8px] hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {submitting ? <><FontAwesomeIcon icon={faSpinner} spin /> Proses…</> : <><FontAwesomeIcon icon={faCircleCheck} /> Konfirmasi Lunas</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
