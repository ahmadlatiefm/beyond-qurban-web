'use client'
import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload, faDownload, faArrowLeft, faCheck, faXmark, faTriangleExclamation,
  faFileCsv, faCircleCheck, faCircleXmark, faRotate, faPlay,
} from '@fortawesome/free-solid-svg-icons'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import type {
  PesananImportRow, PenyaluranImportRow, ImportResult,
} from '@/lib/import/types'

type Tab = 'pesanan' | 'penyaluran'

interface CatalogProduct { id: string; name: string }
interface CatalogCampaign { id: string; title: string }

interface ValidatedRow<T> {
  index: number          // 0-based row index in the body
  raw: T
  status: 'valid' | 'warning' | 'error'
  reason: string | null
  resolved: {
    nama: string
    refLabel: string     // product / campaign name
    total: number
    statusBayar: string
  }
}

const PAYMENT_STATUS_VALID = ['PAID', 'UNPAID', 'EXPIRED', 'REFUNDED']
const PAYMENT_STATUS_ALIAS: Record<string, string> = {
  paid: 'PAID', lunas: 'PAID',
  unpaid: 'UNPAID', belum: 'UNPAID', pending: 'UNPAID',
  expired: 'EXPIRED', kadaluarsa: 'EXPIRED',
  refunded: 'REFUNDED', dikembalikan: 'REFUNDED',
}

function normalizeWa(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

function isValidWa(raw: string): boolean {
  const n = normalizeWa(raw)
  return n.length >= 10 && n.length <= 15
}

function parseInt0(raw: string | number | undefined | null): number {
  if (raw == null) return 0
  if (typeof raw === 'number') return Math.floor(raw)
  const cleaned = String(raw).replace(/[^\d-]/g, '')
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function ImportClient({
  products, campaigns,
}: {
  products: CatalogProduct[]
  campaigns: CatalogCampaign[]
}) {
  const [tab, setTab] = useState<Tab>('pesanan')
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [filename, setFilename] = useState<string>('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const productByName = useMemo(
    () => new Map(products.map(p => [p.name.toLowerCase().trim(), p])),
    [products],
  )
  const productById = useMemo(
    () => new Map(products.map(p => [p.id, p])),
    [products],
  )
  const campaignByTitle = useMemo(
    () => new Map(campaigns.map(c => [c.title.toLowerCase().trim(), c])),
    [campaigns],
  )
  const campaignById = useMemo(
    () => new Map(campaigns.map(c => [c.id, c])),
    [campaigns],
  )

  // Validate every row in the client (no DB lookups; matches against
  // catalog data that the server passed in).
  const validated = useMemo<ValidatedRow<PesananImportRow | PenyaluranImportRow>[]>(() => {
    if (rawRows.length === 0) return []
    if (tab === 'pesanan') return rawRows.map((row, i) => validatePesanan(row as unknown as PesananImportRow, i))
    return rawRows.map((row, i) => validatePenyaluran(row as unknown as PenyaluranImportRow, i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRows, tab, products, campaigns])

  function validatePesanan(row: PesananImportRow, index: number): ValidatedRow<PesananImportRow> {
    const reasons: string[] = []
    const warnings: string[] = []

    const namaPembeli = (row.nama_pembeli || '').trim()
    if (!namaPembeli) reasons.push('nama_pembeli kosong')

    const wa = (row.no_whatsapp || '').trim()
    if (!wa) reasons.push('no_whatsapp kosong')
    else if (!isValidWa(wa)) warnings.push('format no_whatsapp mencurigakan')

    let productName = ''
    const pid = (row.produk_id || '').trim()
    if (pid && productById.has(pid)) {
      productName = productById.get(pid)!.name
    } else if (row.nama_produk) {
      const found = productByName.get(row.nama_produk.toLowerCase().trim())
      if (found) productName = found.name
    }
    if (!productName) reasons.push('produk tidak ditemukan')

    const totalHarga = parseInt0(row.total_harga)
    if (totalHarga <= 0) reasons.push('total_harga tidak valid')

    const sb = (row.status_bayar || '').toLowerCase().trim()
    let statusBayar = ''
    if (!sb) {
      statusBayar = 'UNPAID'
      warnings.push('status_bayar kosong → default UNPAID')
    } else {
      statusBayar = PAYMENT_STATUS_ALIAS[sb] || (PAYMENT_STATUS_VALID.includes(sb.toUpperCase()) ? sb.toUpperCase() : '')
      if (!statusBayar) {
        statusBayar = 'UNPAID'
        warnings.push(`status_bayar "${row.status_bayar}" tidak dikenali → UNPAID`)
      }
    }

    let status: ValidatedRow<PesananImportRow>['status'] = 'valid'
    let reason: string | null = null
    if (reasons.length > 0) { status = 'error'; reason = reasons.join('; ') }
    else if (warnings.length > 0) { status = 'warning'; reason = warnings.join('; ') }

    return {
      index, raw: row, status, reason,
      resolved: {
        nama: namaPembeli || '—',
        refLabel: productName || '—',
        total: totalHarga,
        statusBayar,
      },
    }
  }

  function validatePenyaluran(row: PenyaluranImportRow, index: number): ValidatedRow<PenyaluranImportRow> {
    const reasons: string[] = []
    const warnings: string[] = []

    const namaDonatur = (row.nama_donatur || '').trim()
    if (!namaDonatur) reasons.push('nama_donatur kosong')

    const wa = (row.no_whatsapp || '').trim()
    if (!wa) reasons.push('no_whatsapp kosong')
    else if (!isValidWa(wa)) warnings.push('format no_whatsapp mencurigakan')

    let campaignTitle = ''
    const cid = (row.campaign_id || '').trim()
    if (cid && campaignById.has(cid)) {
      campaignTitle = campaignById.get(cid)!.title
    } else if (row.nama_campaign) {
      const found = campaignByTitle.get(row.nama_campaign.toLowerCase().trim())
      if (found) campaignTitle = found.title
    }
    if (!campaignTitle) reasons.push('campaign tidak ditemukan')

    const jumlahDonasi = parseInt0(row.jumlah_donasi)
    if (jumlahDonasi <= 0) reasons.push('jumlah_donasi tidak valid')

    const sb = (row.status_bayar || '').toLowerCase().trim()
    let statusBayar = ''
    if (!sb) {
      statusBayar = 'UNPAID'
      warnings.push('status_bayar kosong → default UNPAID')
    } else {
      statusBayar = PAYMENT_STATUS_ALIAS[sb] || (PAYMENT_STATUS_VALID.includes(sb.toUpperCase()) ? sb.toUpperCase() : '')
      if (!statusBayar) {
        statusBayar = 'UNPAID'
        warnings.push(`status_bayar "${row.status_bayar}" tidak dikenali → UNPAID`)
      }
    }

    let status: ValidatedRow<PenyaluranImportRow>['status'] = 'valid'
    let reason: string | null = null
    if (reasons.length > 0) { status = 'error'; reason = reasons.join('; ') }
    else if (warnings.length > 0) { status = 'warning'; reason = warnings.join('; ') }

    return {
      index, raw: row, status, reason,
      resolved: {
        nama: namaDonatur || '—',
        refLabel: campaignTitle || '—',
        total: jumlahDonasi,
        statusBayar,
      },
    }
  }

  const counts = useMemo(() => {
    const c = { valid: 0, warning: 0, error: 0 }
    for (const v of validated) c[v.status]++
    return c
  }, [validated])

  const importable = counts.valid + counts.warning

  function reset() {
    setRawRows([])
    setFilename('')
    setParseError(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFile(file: File) {
    setParseError(null)
    setImportResult(null)
    setFilename(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeKey,
      transform: (val) => (typeof val === 'string' ? val.trim() : val),
      complete: (res) => {
        if (res.errors && res.errors.length > 0) {
          setParseError(`Parse error: ${res.errors[0].message}`)
          setRawRows([])
          return
        }
        setRawRows(res.data || [])
      },
      error: (err) => {
        setParseError(err.message || 'Gagal parse CSV')
        setRawRows([])
      },
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    const importableRows = validated
      .filter(v => v.status !== 'error')
      .map(v => v.raw)

    if (importableRows.length === 0) {
      alert('Tidak ada baris yang valid untuk diimport')
      return
    }

    if (!confirm(`Import ${importableRows.length} baris ke ${tab === 'pesanan' ? 'Pesanan' : 'Penyaluran'}?`)) return

    startTransition(async () => {
      try {
        const url = tab === 'pesanan'
          ? '/api/admin/import/pesanan'
          : '/api/admin/import/penyaluran'
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: importableRows }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal import')
        setImportResult(json as ImportResult)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Gagal import')
      }
    })
  }

  function downloadTemplate() {
    window.location.href = `/api/admin/import/template?tipe=${tab}`
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-brand-muted hover:text-brand-dark text-sm font-medium flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArrowLeft} />
            Kembali
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold text-brand-dark">Import Data CSV</h1>
            <p className="text-brand-muted text-xs mt-0.5">
              Upload massal pesanan & donasi dari spreadsheet
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-5">
        {/* Tabs */}
        <div className="bg-white border border-brand-muted/15 rounded-[14px] p-1.5 flex gap-1 w-fit">
          {([
            { v: 'pesanan', label: 'Pesanan' },
            { v: 'penyaluran', label: 'Penyaluran / Donasi' },
          ] as const).map(t => (
            <button
              key={t.v}
              onClick={() => { if (t.v !== tab) { setTab(t.v); reset() } }}
              className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${tab === t.v ? 'bg-brand-dark text-brand-accent-light' : 'text-brand-muted hover:bg-brand-light'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Step 1: file picker */}
        {rawRows.length === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">
                Format header CSV harus sesuai template. Header dinormalisasi (lowercase, snake_case).
              </p>
              <button
                onClick={downloadTemplate}
                className="text-xs font-bold border border-brand-muted/20 px-3 py-2 rounded-[10px] hover:bg-brand-light flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Template CSV
              </button>
            </div>
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`block border-2 border-dashed rounded-[14px] p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-dark bg-brand-light/40' : 'border-brand-muted/30 bg-white hover:border-brand-dark/40 hover:bg-brand-light/30'}`}
            >
              <FontAwesomeIcon icon={faFileCsv} className="text-3xl text-brand-muted mb-3" />
              <div className="font-bold text-brand-dark mb-1">Drag & drop file CSV di sini</div>
              <div className="text-xs text-brand-muted">atau klik untuk pilih file</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </label>
            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-[10px] p-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleXmark} />
                {parseError}
              </div>
            )}
          </div>
        )}

        {/* Step 2: preview */}
        {rawRows.length > 0 && !importResult && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-brand-muted/15 rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-bold text-brand-dark flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileCsv} />
                  {filename}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span className="text-brand-muted">{rawRows.length} baris</span>
                  <span className="text-emerald-600 font-bold">{counts.valid} valid</span>
                  <span className="text-amber-600 font-bold">{counts.warning} warning</span>
                  <span className="text-red-600 font-bold">{counts.error} error</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reset}
                  className="text-xs font-bold border border-brand-muted/20 px-3 py-2 rounded-[10px] hover:bg-brand-light flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faRotate} />
                  Ganti File
                </button>
                <button
                  onClick={handleImport}
                  disabled={pending || importable === 0}
                  className="bg-brand-dark text-brand-accent-light px-4 py-2 rounded-[10px] text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  {pending ? 'Mengimport…' : `Import ${importable} baris`}
                </button>
              </div>
            </div>

            <div className="bg-white border border-brand-muted/15 rounded-[14px] overflow-hidden">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-xs">
                  <thead className="bg-brand-light sticky top-0 z-10">
                    <tr className="text-left text-brand-muted">
                      <th className="px-3 py-2 font-bold w-12">Baris</th>
                      <th className="px-3 py-2 font-bold w-20">Status</th>
                      <th className="px-3 py-2 font-bold">Nama</th>
                      <th className="px-3 py-2 font-bold">{tab === 'pesanan' ? 'Produk' : 'Campaign'}</th>
                      <th className="px-3 py-2 font-bold w-32">Total</th>
                      <th className="px-3 py-2 font-bold w-24">Bayar</th>
                      <th className="px-3 py-2 font-bold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validated.map(v => (
                      <tr
                        key={v.index}
                        title={v.reason || ''}
                        className={
                          v.status === 'error' ? 'bg-red-50/50 border-b border-red-100' :
                          v.status === 'warning' ? 'bg-amber-50/50 border-b border-amber-100' :
                          'border-b border-brand-muted/10'
                        }
                      >
                        <td className="px-3 py-2 font-mono">{v.index + 1}</td>
                        <td className="px-3 py-2">
                          {v.status === 'valid' && <span className="text-emerald-600"><FontAwesomeIcon icon={faCircleCheck} /> valid</span>}
                          {v.status === 'warning' && <span className="text-amber-600"><FontAwesomeIcon icon={faTriangleExclamation} /> warning</span>}
                          {v.status === 'error' && <span className="text-red-600"><FontAwesomeIcon icon={faCircleXmark} /> error</span>}
                        </td>
                        <td className="px-3 py-2 font-medium text-brand-dark">{v.resolved.nama}</td>
                        <td className="px-3 py-2 text-brand-muted truncate max-w-[200px]">{v.resolved.refLabel}</td>
                        <td className="px-3 py-2 font-mono">{v.resolved.total > 0 ? formatRupiah(v.resolved.total) : '—'}</td>
                        <td className="px-3 py-2 font-mono">{v.resolved.statusBayar}</td>
                        <td className="px-3 py-2 text-[11px] text-brand-muted truncate max-w-[260px]">{v.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: result */}
        {importResult && (
          <div className="flex flex-col gap-3">
            <div className={`border rounded-[14px] p-5 ${importResult.failed.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon
                  icon={importResult.failed.length === 0 ? faCheck : faTriangleExclamation}
                  className={importResult.failed.length === 0 ? 'text-emerald-600 text-xl' : 'text-amber-600 text-xl'}
                />
                <div>
                  <div className="font-bold text-brand-dark text-lg">Hasil Import</div>
                  <div className="text-sm text-brand-muted">
                    Berhasil: <b className="text-emerald-700">{importResult.success}</b>
                    {' · '}
                    Gagal: <b className="text-red-700">{importResult.failed.length}</b>
                  </div>
                </div>
              </div>
              {importResult.failed.length > 0 && (
                <div className="bg-white border border-red-200 rounded-[10px] p-3 mt-3">
                  <div className="text-xs font-bold text-red-700 mb-2">Detail kegagalan:</div>
                  <div className="flex flex-col gap-1 text-xs max-h-60 overflow-auto">
                    {importResult.failed.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-mono text-brand-muted shrink-0">Baris #{f.row}</span>
                        <span className="text-red-700">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={reset}
                className="bg-brand-dark text-brand-accent-light px-4 py-2 rounded-[10px] text-sm font-bold flex items-center gap-2 hover:opacity-90"
              >
                <FontAwesomeIcon icon={faUpload} />
                Import Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
