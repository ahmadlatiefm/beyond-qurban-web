'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapLocationDot, faCircleCheck, faPenToSquare, faCalendarDays } from '@fortawesome/free-solid-svg-icons'

type Item = {
  id: string
  token: string
  namaPemesan: string | null
  noWhatsapp: string
  alamatLengkap: string | null
  kecamatan: string | null
  kota: string | null
  gmapsPin: string | null
  atasNama: string | null
  catatan: string | null
  jenisHewan: string
  jumlahHewan: number
  tanggalKirim: string | null
  jamKirim: string | null
  requestTanggalKirim: string | null
  requestJamKirim: string | null
  formDiisi: boolean
  formDiisiAt: string | null
}

const SESI_OPTIONS = [
  { id: 'pagi', label: 'Pagi', range: '07.00-10.00' },
  { id: 'siang', label: 'Siang', range: '10.00-13.00' },
  { id: 'sore', label: 'Sore', range: '13.00-16.00' },
  { id: 'sore_akhir', label: 'Sore Akhir', range: '16.00-18.00' },
] as const

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function formatTanggalLong(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PengirimanFormClient({ item: initial, locked }: { item: Item; locked: boolean }) {
  const [item, setItem] = useState<Item>(initial)
  const [editing, setEditing] = useState(!initial.formDiisi)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    namaPemesan: initial.namaPemesan ?? '',
    noWhatsapp: initial.noWhatsapp ?? '',
    alamatLengkap: initial.alamatLengkap ?? '',
    kecamatan: initial.kecamatan ?? '',
    kota: initial.kota ?? '',
    gmapsPin: initial.gmapsPin ?? '',
    atasNama: initial.atasNama ?? '',
    catatan: initial.catatan ?? '',
    requestTanggalKirim: initial.requestTanggalKirim ? new Date(initial.requestTanggalKirim).toISOString().slice(0, 10) : '',
    requestJamKirim: initial.requestJamKirim ?? '',
  })

  // Customer can choose a delivery slot only when admin hasn't already scheduled one.
  const adminScheduled = !!initial.tanggalKirim
  const isValidMaps = !!form.gmapsPin && /^https?:\/\//i.test(form.gmapsPin)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    if (!form.namaPemesan.trim() || !form.noWhatsapp.trim() || !form.alamatLengkap.trim()) {
      setError('Nama, WhatsApp, dan Alamat wajib diisi.')
      return
    }
    // If customer is allowed to pick a slot but only filled one of the two, nudge them.
    if (!adminScheduled) {
      const hasDate = !!form.requestTanggalKirim
      const hasSesi = !!form.requestJamKirim
      if (hasDate !== hasSesi) {
        setError('Mohon lengkapi tanggal dan sesi pengiriman, atau kosongkan keduanya.')
        return
      }
    }
    setError('')
    setSubmitting(true)
    try {
      // Don't send the request fields if admin already locked a schedule —
      // the server ignores them anyway, but cleaner to omit.
      const payload = adminScheduled
        ? { ...form, requestTanggalKirim: undefined, requestJamKirim: undefined }
        : form
      const res = await fetch(`/api/pengiriman/${item.token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Gagal menyimpan data')
        setSubmitting(false)
        return
      }
      setItem((prev) => ({ ...prev, ...data }))
      setSuccess(true)
      setEditing(false)
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  // Sukses screen — only on first submit
  if (success) {
    return (
      <div className="min-h-screen px-5 py-10 flex items-center justify-center">
        <div className="bg-white border border-brand-muted/10 rounded-[14px] shadow-premium max-w-md w-full text-center p-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600 text-2xl" />
          </div>
          <h1 className="font-serif text-xl font-bold text-brand-dark mb-2">Terima kasih!</h1>
          <p className="text-sm text-brand-muted mb-5 leading-relaxed">
            Data pengiriman Anda sudah kami terima.<br />Tim kami akan menghubungi Anda sebelum hewan tiba. 🐑
          </p>
          <button
            onClick={() => { setSuccess(false); setEditing(false) }}
            className="px-4 py-2 bg-brand-dark text-brand-accent-light rounded-[8px] text-sm font-medium"
          >
            Lihat Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:py-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
          <Image src="/logo-gold.png" alt="Beyond Qurban" width={32} height={32} className="object-contain" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-brand-muted">Beyond Qurban</div>
          <h1 className="font-serif text-xl font-bold text-brand-dark leading-tight">Form Data Pengiriman Qurban</h1>
        </div>
      </div>
      <p className="text-sm text-brand-muted mb-5">Halo! Lengkapi data pengiriman hewan qurban Anda.</p>

      {/* Summary card */}
      <div className="bg-white border border-brand-muted/10 rounded-[12px] p-4 mb-5 text-sm">
        <div className="flex items-center justify-between text-xs text-brand-muted mb-1.5">
          <span>Pesanan Anda</span>
          {item.formDiisi && (
            <span className="text-emerald-600 font-medium">✓ Form sudah diisi</span>
          )}
        </div>
        <div className="text-brand-dark font-semibold">{item.jumlahHewan}× {item.jenisHewan}</div>
        {item.tanggalKirim && (
          <div className="text-xs text-brand-muted mt-0.5">
            Jadwal kirim: {new Date(item.tanggalKirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            {item.jamKirim ? ` · ${item.jamKirim}` : ''}
          </div>
        )}
      </div>

      {/* If already filled and not editing, show summary view */}
      {!editing ? (
        <div className="bg-white border border-brand-muted/10 rounded-[12px] p-5 shadow-premium">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-bold text-brand-dark">Data Pengiriman</h2>
            {!locked && (
              <button onClick={() => setEditing(true)} className="text-xs text-brand-accent font-semibold hover:underline flex items-center gap-1">
                <FontAwesomeIcon icon={faPenToSquare} /> Edit Data
              </button>
            )}
          </div>
          {locked && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2 mb-3">
              Form dikunci karena pengiriman kurang dari 3 hari. Hubungi CS untuk perubahan data.
            </div>
          )}
          <ReadOnlyRow label="Nama Lengkap" value={item.namaPemesan} />
          <ReadOnlyRow label="No WhatsApp" value={item.noWhatsapp} />
          <ReadOnlyRow label="Atas Nama Qurban" value={item.atasNama} />
          <ReadOnlyRow label="Alamat" value={item.alamatLengkap} />
          <ReadOnlyRow label="Kecamatan / Kota" value={[item.kecamatan, item.kota].filter(Boolean).join(', ')} />
          {item.gmapsPin && (
            <div className="mt-2">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Pin Maps</div>
              <a href={item.gmapsPin} target="_blank" rel="noreferrer" className="block bg-brand-light rounded-[8px] px-3 py-2 text-xs hover:bg-brand-muted/10 flex items-center gap-2">
                <FontAwesomeIcon icon={faMapLocationDot} className="text-brand-accent" />
                <span className="truncate flex-1">{item.gmapsPin}</span>
                <span className="text-brand-accent font-medium">Buka</span>
              </a>
            </div>
          )}
          <ReadOnlyRow label="Catatan" value={item.catatan} />
          {(item.tanggalKirim || item.requestTanggalKirim) && (
            <div className="mt-2 pt-2 border-t border-brand-muted/10">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Waktu Pengiriman</div>
              {item.tanggalKirim ? (
                <div className="text-sm text-brand-dark">
                  📅 <strong>{formatTanggalLong(item.tanggalKirim)}</strong>
                  {item.jamKirim ? ` · ${item.jamKirim}` : ''}
                </div>
              ) : (
                <div className="text-sm text-brand-dark">
                  Diminta: <strong>{formatTanggalLong(item.requestTanggalKirim!)}</strong>
                  {item.requestJamKirim ? ` · ${item.requestJamKirim}` : ''}
                  <div className="text-[11px] text-brand-muted italic mt-0.5">Menunggu konfirmasi tim kami via WhatsApp.</div>
                </div>
              )}
            </div>
          )}
          {item.formDiisiAt && (
            <p className="text-[11px] text-brand-muted mt-3">Diisi pada {new Date(item.formDiisiAt).toLocaleString('id-ID')}</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-brand-muted/10 rounded-[12px] p-5 shadow-premium flex flex-col gap-4">
          <Field label="Nama Lengkap *">
            <input className="inp" value={form.namaPemesan} onChange={(e) => setForm((f) => ({ ...f, namaPemesan: e.target.value }))} required />
          </Field>
          <Field label="No WhatsApp *">
            <input className="inp" value={form.noWhatsapp} onChange={(e) => setForm((f) => ({ ...f, noWhatsapp: e.target.value }))} required placeholder="08xxxxxxxxxx" />
          </Field>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">Alamat Pengiriman</h3>
            <div className="flex flex-col gap-3">
              <Field label="Alamat Lengkap *">
                <textarea rows={3} className="inp" value={form.alamatLengkap} onChange={(e) => setForm((f) => ({ ...f, alamatLengkap: e.target.value }))} required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kecamatan">
                  <input className="inp" value={form.kecamatan} onChange={(e) => setForm((f) => ({ ...f, kecamatan: e.target.value }))} />
                </Field>
                <Field label="Kota">
                  <input className="inp" value={form.kota} onChange={(e) => setForm((f) => ({ ...f, kota: e.target.value }))} />
                </Field>
              </div>
              <Field label="Pin Google Maps">
                <input className="inp" value={form.gmapsPin} onChange={(e) => setForm((f) => ({ ...f, gmapsPin: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
                <p className="text-[11px] text-brand-muted mt-1">Buka Google Maps → tahan lokasi → salin link, lalu paste di sini.</p>
                {isValidMaps && (
                  <a href={form.gmapsPin} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-accent font-semibold hover:underline">
                    <FontAwesomeIcon icon={faMapLocationDot} /> Buka Maps
                  </a>
                )}
              </Field>
            </div>
          </div>

          <Field label="Atas Nama Qurban">
            <input className="inp" value={form.atasNama} onChange={(e) => setForm((f) => ({ ...f, atasNama: e.target.value }))} placeholder="Nama yang akan dicantumkan di sertifikat" />
          </Field>

          {adminScheduled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDays} className="text-emerald-700" />
              <span>📅 Jadwal kirim: <strong>{formatTanggalLong(initial.tanggalKirim!)}</strong>{initial.jamKirim ? ` · ${initial.jamKirim}` : ''}</span>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">Waktu Pengiriman</h3>
              <div className="flex flex-col gap-3">
                <Field label="Pilih tanggal yang Anda inginkan">
                  <input
                    type="date"
                    className="inp"
                    min={todayISO()}
                    value={form.requestTanggalKirim}
                    onChange={(e) => setForm((f) => ({ ...f, requestTanggalKirim: e.target.value }))}
                  />
                </Field>
                <div>
                  <label className="text-[11px] font-semibold text-brand-dark block mb-1.5">Sesi Pengiriman</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SESI_OPTIONS.map((s) => {
                      const active = form.requestJamKirim === s.range
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, requestJamKirim: active ? '' : s.range }))}
                          className={`px-3 py-2.5 rounded-[10px] border text-xs font-medium text-left transition ${
                            active
                              ? 'bg-brand-dark text-brand-accent-light border-brand-dark'
                              : 'bg-white border-brand-muted/20 text-brand-dark hover:border-brand-dark/40'
                          }`}
                        >
                          <div className="font-semibold">{s.label}</div>
                          <div className={`text-[11px] mt-0.5 ${active ? 'text-brand-accent-light/80' : 'text-brand-muted'}`}>{s.range}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-brand-muted italic">Jadwal final akan dikonfirmasi tim kami via WhatsApp.</p>
              </div>
            </div>
          )}

          <Field label="Catatan tambahan (opsional)">
            <textarea rows={2} className="inp" value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
          </Field>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[10px] shadow-premium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Data Pengiriman ✓'}
          </button>

          {item.formDiisi && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-brand-muted hover:text-brand-dark"
            >
              Batal
            </button>
          )}
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-brand-dark block mb-1">{label}</label>
      {children}
    </div>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-brand-muted/10 last:border-0">
      <div className="text-[11px] text-brand-muted uppercase tracking-wider mt-0.5">{label}</div>
      <div className="col-span-2 text-sm text-brand-dark break-words">{value || '—'}</div>
    </div>
  )
}
