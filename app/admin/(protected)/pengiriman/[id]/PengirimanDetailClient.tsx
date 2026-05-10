'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft, faLink, faPaperPlane, faMapLocationDot, faCircleCheck,
  faTruck, faCheckDouble, faRotateRight, faMobileScreen, faBell,
} from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '@/lib/utils'
import {
  STATUS_BAYAR_LABEL, STATUS_BAYAR_CLS,
  STATUS_KIRIM_LABEL, STATUS_KIRIM_CLS,
  type StatusBayar, type StatusKirim,
} from '@/lib/pengiriman'

type Pic = {
  id: string
  nama: string
  noTelepon: string
  keterangan: string | null
  aktif: boolean
}

type Item = {
  id: string
  token: string
  namaPemesan: string | null
  noWhatsapp: string
  alamatLengkap: string | null
  kecamatan: string | null
  kota: string | null
  gmapsPin: string | null
  catatan: string | null
  jenisHewan: string
  jumlahHewan: number
  beratHewan: string | null
  nomorTagHewan: unknown
  atasNama: string | null
  totalHarga: number
  statusBayar: string
  jumlahDP: number | null
  sisaPembayaran: number | null
  metodeBayar: string | null
  tanggalBayar: string | null
  buktiTransfer: string | null
  tanggalKirim: string | null
  jamKirim: string | null
  requestTanggalKirim: string | null
  requestJamKirim: string | null
  statusKirim: string
  namaPengirim: string | null
  noKendaraan: string | null
  namaPenerima: string | null
  noWaPenerima: string | null
  keteranganSerahTerima: string | null
  fotoSerahTerima: string | null
  picId: string | null
  pic: Pic | null
  formDiisi: boolean
  formDiisiAt: string | null
  sumber: string
  createdAt: string
}

function asTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String) } catch {}
  }
  return []
}

function phoneNumber(s: string) {
  return s.replace(/\D/g, '').replace(/^0/, '62')
}

function getMapsEmbedUrl(url: string): string | null {
  // Short URLs (goo.gl, maps.app.goo.gl) cannot be embedded directly — they must be resolved client-side
  if (/goo\.gl|maps\.app/i.test(url)) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
}

function formatId(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PengirimanDetailClient({ item: initial }: { item: Item }) {
  const [item, setItem] = useState<Item>(initial)
  const [toast, setToast] = useState({ show: false, msg: '' })

  function showToast(msg: string) {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  const link = typeof window !== 'undefined' ? `${window.location.origin}/pengiriman/${item.token}` : `/pengiriman/${item.token}`
  const tags = asTags(item.nomorTagHewan)
  const phone = phoneNumber(item.noWhatsapp)

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => showToast('Link disalin'))
  }

  function waInvite() {
    const text = `Assalamu'alaikum Kak ${item.namaPemesan || ''}, mohon lengkapi data pengiriman hewan qurban Anda melalui link berikut:\n${link}\nJazakallah khairan 🐑`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  function waScheduled() {
    const tgl = item.tanggalKirim ? new Date(item.tanggalKirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
    const tagStr = tags.length ? `\nTag hewan: ${tags.join(', ')}` : ''
    const picStr = item.pic ? `\n👤 Penanggung Jawab: ${item.pic.nama}\n📞 No. HP PIC: ${item.pic.noTelepon}` : ''
    const text = `Assalamu'alaikum Kak ${item.namaPemesan || ''} 🤲\n\nPengiriman hewan qurban Anda dijadwalkan:\n📅 ${tgl}${item.jamKirim ? `\n🕐 Pukul ${item.jamKirim}` : ''}${tagStr}${picStr}\n\nMohon pastikan ada penerima di lokasi. Terima kasih 🐑`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  function waDelivered() {
    const text = `Alhamdulillah, hewan qurban atas nama ${item.atasNama || item.namaPemesan || ''} telah kami kirim dan diterima. Semoga ibadah qurban Anda diterima Allah ﷻ. Jazakallah khairan! 🐑`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  async function notifyPic(mode: 'task' | 'reminder') {
    try {
      const res = await fetch('/api/admin/pengiriman/notify-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengirimanId: item.id, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data?.error || 'Gagal generate pesan')
        return
      }
      window.open(data.url, '_blank')
      showToast('Link WA sudah dibuka')
    } catch {
      showToast('Gagal terhubung')
    }
  }

  async function patch(data: Partial<Item>) {
    const res = await fetch(`/api/admin/pengiriman/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      showToast('Gagal memperbarui')
      return
    }
    const updated = await res.json()
    setItem(updated)
    showToast('Status diperbarui')
  }

  return (
    <>
      <div className="px-5 md:px-8 py-5 md:py-6 max-w-[1100px] mx-auto w-full">
        <Link href="/admin/pengiriman" className="text-xs text-brand-muted hover:text-brand-dark inline-flex items-center gap-1 mb-3">
          <FontAwesomeIcon icon={faChevronLeft} /> Kembali ke daftar
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-dark">{item.namaPemesan || 'Tanpa Nama'}</h1>
            <p className="text-xs text-brand-muted mt-0.5">Token: <span className="font-mono">{item.token}</span> · Sumber: {item.sumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyLink} className="px-3 py-2 border border-brand-muted/20 rounded-[8px] text-xs font-medium hover:bg-brand-light flex items-center gap-2">
              <FontAwesomeIcon icon={faLink} /> Salin Link
            </button>
            <a href={waInvite()} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-500 text-white rounded-[8px] text-xs font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faPaperPlane} /> Kirim Ulang via WA
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Identitas Pemesan">
            <Row label="Nama" value={item.namaPemesan || '—'} />
            <Row label="WhatsApp" value={<a className="text-brand-accent hover:underline" target="_blank" rel="noreferrer" href={`https://wa.me/${phone}`}>{item.noWhatsapp}</a>} />
            <Row label="Atas Nama" value={item.atasNama || '—'} />
            <Row label="Alamat" value={item.alamatLengkap || '—'} />
            <Row label="Kecamatan / Kota" value={[item.kecamatan, item.kota].filter(Boolean).join(', ') || '—'} />
            <Row label="Catatan" value={item.catatan || '—'} />
            <div className="mt-2 pt-2 border-t border-brand-muted/10">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Status Form Konsumen</div>
              {item.formDiisi ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[8px] px-2.5 py-1.5">
                  ✓ Diisi {formatId(item.formDiisiAt)}
                </div>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[8px] px-2.5 py-1.5">
                  ⏳ Belum diisi konsumen
                </div>
              )}
            </div>
            {item.gmapsPin && (
              <div className="mt-3">
                <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Lokasi</div>
                <a href={item.gmapsPin} target="_blank" rel="noreferrer" className="block bg-brand-light rounded-[8px] px-3 py-2 text-xs text-brand-dark hover:bg-brand-muted/10 flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faMapLocationDot} className="text-brand-accent" />
                  <span className="truncate flex-1">{item.gmapsPin}</span>
                  <span className="text-brand-accent font-medium">Buka</span>
                </a>
                {(() => {
                  const embedUrl = getMapsEmbedUrl(item.gmapsPin!)
                  return embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full rounded-[8px] border border-brand-muted/10"
                      style={{ height: 200 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <p className="text-[11px] text-brand-muted italic">Preview tidak tersedia untuk short URL — klik "Buka" untuk melihat di Google Maps.</p>
                  )
                })()}
              </div>
            )}
          </Card>

          <Card title="Data Hewan">
            <Row label="Jenis" value={`${item.jumlahHewan}× ${item.jenisHewan}`} />
            <Row label="Berat" value={item.beratHewan || '—'} />
            <div className="mt-1">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Tag Hewan</div>
              {tags.length === 0 ? (
                <div className="text-xs text-brand-muted">Belum di-tag</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="text-xs font-mono px-2 py-1 rounded bg-emerald-100 text-emerald-700">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="Pembayaran">
            <Row label="Total" value={formatCurrency(item.totalHarga)} />
            <Row label="Status Bayar" value={
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_BAYAR_CLS[item.statusBayar as StatusBayar] ?? 'bg-slate-100 text-slate-700'}`}>
                {STATUS_BAYAR_LABEL[item.statusBayar as StatusBayar] ?? item.statusBayar}
              </span>
            } />
            {item.jumlahDP != null && <Row label="DP" value={formatCurrency(item.jumlahDP)} />}
            {item.sisaPembayaran != null && <Row label="Sisa" value={formatCurrency(item.sisaPembayaran)} />}
            <Row label="Metode" value={item.metodeBayar || '—'} />
            <Row label="Tgl Bayar" value={formatId(item.tanggalBayar)} />
            {item.buktiTransfer && (
              <div className="mt-2">
                <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Bukti Transfer</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.buktiTransfer} alt="bukti" className="w-full max-h-60 object-contain rounded-[8px] bg-brand-light" />
              </div>
            )}
          </Card>

          <Card title="Pengiriman">
            <Row label="Tanggal" value={item.tanggalKirim ? new Date(item.tanggalKirim).toLocaleDateString('id-ID') : '—'} />
            <Row label="Jam" value={item.jamKirim || '—'} />
            {item.requestTanggalKirim && (
              <Row label="Request Konsumen" value={
                <span className="text-blue-700 italic">
                  {new Date(item.requestTanggalKirim).toLocaleDateString('id-ID')}
                  {item.requestJamKirim ? ` · ${item.requestJamKirim}` : ''}
                </span>
              } />
            )}
            <Row label="Status Kirim" value={
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_KIRIM_CLS[item.statusKirim as StatusKirim] ?? 'bg-slate-100 text-slate-700'}`}>
                {STATUS_KIRIM_LABEL[item.statusKirim as StatusKirim] ?? item.statusKirim}
              </span>
            } />
            <Row label="PIC" value={
              item.pic ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-brand-dark">{item.pic.nama}</span>
                  <a href={`https://wa.me/${item.pic.noTelepon.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="text-xs text-brand-accent hover:underline font-mono">{item.pic.noTelepon}</a>
                  {!item.pic.aktif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Nonaktif</span>}
                </span>
              ) : item.namaPengirim || '—'
            } />
            <Row label="Kendaraan" value={item.noKendaraan || '—'} />

            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => patch({ statusKirim: 'dijadwalkan' })} className="px-3 py-1.5 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faRotateRight} /> Dijadwalkan
              </button>
              <button onClick={() => patch({ statusKirim: 'dalam_perjalanan' })} className="px-3 py-1.5 text-xs rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTruck} /> Dalam Perjalanan
              </button>
              <button onClick={() => patch({ statusKirim: 'terkirim' })} className="px-3 py-1.5 text-xs rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCheckDouble} /> Terkirim
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <a href={waScheduled()} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs rounded bg-brand-light text-brand-dark hover:bg-brand-muted/10 font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPaperPlane} /> WA Dijadwalkan
              </a>
              <a href={waDelivered()} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs rounded bg-brand-light text-brand-dark hover:bg-brand-muted/10 font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPaperPlane} /> WA Terkirim
              </a>
            </div>

            {item.pic && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-muted/10">
                <button
                  onClick={() => notifyPic('task')}
                  className="px-3 py-1.5 text-xs rounded bg-amber-500 text-white font-bold hover:bg-amber-600 flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faMobileScreen} /> 📲 Kirim Tugas ke PIC
                </button>
                <button
                  onClick={() => notifyPic('reminder')}
                  className="px-3 py-1.5 text-xs rounded bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 flex items-center gap-1.5 border border-amber-200"
                >
                  <FontAwesomeIcon icon={faBell} /> 🔔 Kirim Pengingat ke PIC
                </button>
              </div>
            )}

            {(item.namaPenerima || item.fotoSerahTerima || item.keteranganSerahTerima) && (
              <div className="mt-3">
                <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Serah Terima</div>
                {item.namaPenerima && (
                  <div className="text-sm text-brand-dark mb-1">
                    Diterima oleh: <strong>{item.namaPenerima}</strong>
                    {item.noWaPenerima && (
                      <>
                        {' · '}
                        <a
                          href={`https://wa.me/${item.noWaPenerima.replace(/\D/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-accent hover:underline font-mono text-xs"
                        >
                          {item.noWaPenerima}
                        </a>
                      </>
                    )}
                  </div>
                )}
                {item.keteranganSerahTerima && (
                  <div className="text-xs text-brand-dark whitespace-pre-wrap bg-brand-light rounded-[8px] px-3 py-2 mb-2">
                    {item.keteranganSerahTerima}
                  </div>
                )}
                {item.fotoSerahTerima && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.fotoSerahTerima} alt="serah terima" className="w-full max-h-60 object-cover rounded-[8px] bg-brand-light" />
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faCircleCheck} className="text-brand-accent" /> {toast.msg}
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-brand-muted/10 rounded-[12px] p-5 shadow-premium">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-dark mb-3">{title}</h2>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <div className="text-[11px] text-brand-muted uppercase tracking-wider mt-0.5">{label}</div>
      <div className="col-span-2 text-brand-dark text-sm break-words">{value}</div>
    </div>
  )
}
