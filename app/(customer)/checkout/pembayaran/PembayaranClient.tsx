'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuildingColumns, faQrcode,
  faListOl, faTriangleExclamation,
  faWeightScale, faArrowRight, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { faCopy, faClock } from '@fortawesome/free-regular-svg-icons'
import { formatCurrency } from '@/lib/utils'
import { trackEvent } from '@/lib/tracking-client'
import { usePixelEventMapping } from '@/hooks/usePixelEventMapping'

interface Props {
  orderNumber: string
  whatsapp: string
  totalAmount: number
  productPrice: number    // totalAmount - shippingCost
  shippingCost: number    // separate so summary shows correct breakdown
  productName: string
  productImage: string
  productWeight: number
  createdAt: string
  paymentMethod: string
  payCode: string | null
  manualBank?: {
    bankName: string; accountNumber: string; accountOwner: string
    banks?: {id:string;code:string;name:string;number:string;owner:string}[]
  } | null
  manualQris?: { image: string; bank: string; label: string } | null
  tripayPaymentUrl?: string | null
}

export default function PembayaranClient({
  orderNumber, whatsapp, totalAmount, productPrice, shippingCost,
  productName, productImage, productWeight, createdAt,
  paymentMethod, payCode, manualBank, manualQris, tripayPaymentUrl,
}: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('23:59:00')
  const [proofUrl, setProofUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Scroll ke atas saat halaman pembayaran pertama kali muncul
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Pixel event for /checkout/pembayaran is admin-configurable via
  // /admin/pengaturan (key: fb_event_payment). Default: AddToCart.
  // eventId = orderNumber so the event dedups with any matching server-side
  // CAPI event sent in createOrder.
  const pixelMap = usePixelEventMapping()
  const paymentInfoFiredRef = useRef(false)
  useEffect(() => {
    if (paymentInfoFiredRef.current) return
    if (!pixelMap.page_pembayaran) return
    paymentInfoFiredRef.current = true
    trackEvent(pixelMap.page_pembayaran, {
      eventId: orderNumber,
      value: totalAmount,
      currency: 'IDR',
      content_type: 'product',
      content_ids: [orderNumber],
      content_name: productName,
      num_items: 1,
    })
  }, [pixelMap.page_pembayaran, orderNumber, totalAmount, productName])

  // Countdown: 24h from createdAt
  useEffect(() => {
    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
    const tick = () => {
      const diff = deadline - Date.now()
      if (diff <= 0) { setCountdown('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [createdAt])

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text.replace(/\s/g, '')).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProof(true)
    setUploadError('')
    setSubmitError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('orderNumber', orderNumber)
    const res = await fetch('/api/proof-upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploadingProof(false)
    if (data.url) {
      setProofUrl(data.url)
    } else {
      setUploadError(data.error ?? 'Upload gagal. Coba lagi.')
    }
  }

  async function handleConfirm() {
    if (!proofUrl) {
      setSubmitError('Mohon upload bukti transfer terlebih dahulu.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/orders/save-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, proofUrl, whatsapp }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? 'Gagal menyimpan bukti. Coba lagi.')
        setSubmitting(false)
        return
      }
      router.push(`/terimakasih?order=${orderNumber}&type=regular`)
    } catch {
      setSubmitError('Tidak dapat terhubung ke server. Coba lagi.')
      setSubmitting(false)
    }
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-7 items-start">
      {/* LEFT: Payment instructions */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Single payment instructions card */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 overflow-hidden flex-1">
          <div className="p-5 border-b border-brand-muted/10">
            <h2 className="font-serif text-lg font-bold text-brand-text-dark">Instruksi Pembayaran</h2>
            <p className="text-xs text-brand-muted mt-1">Selesaikan pembayaran sebelum batas waktu habis</p>
            <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm mt-2">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              Bayar sebelum: <span className="font-mono ml-1">{countdown}</span>
            </div>
          </div>

          <div className="p-5">
            {/* VA methods — all virtual account channels */}
            {['BCAVA','MANDIRIVA','BNIVA','BRIVA','PERMATAVA','MUAMALATVA','CIMBVA','BSIVA'].includes(paymentMethod) && (
              <div className="flex flex-col gap-4">
                {/* Bank card */}
                {(() => {
                  const VA_INFO: Record<string, { abbr: string; name: string; color: string }> = {
                    BCAVA:      { abbr: 'BCA',  name: 'Bank BCA',          color: 'text-blue-700' },
                    MANDIRIVA:  { abbr: 'MNR',  name: 'Bank Mandiri',      color: 'text-yellow-700' },
                    BNIVA:      { abbr: 'BNI',  name: 'Bank BNI',          color: 'text-orange-600' },
                    BRIVA:      { abbr: 'BRI',  name: 'Bank BRI',          color: 'text-blue-500' },
                    PERMATAVA:  { abbr: 'PMT',  name: 'Bank Permata',      color: 'text-emerald-600' },
                    MUAMALATVA: { abbr: 'MMT',  name: 'Bank Muamalat',     color: 'text-emerald-700' },
                    CIMBVA:     { abbr: 'CIMB', name: 'CIMB Niaga',        color: 'text-red-700' },
                    BSIVA:      { abbr: 'BSI',  name: 'Bank BSI',          color: 'text-emerald-700' },
                  }
                  const info = VA_INFO[paymentMethod] ?? { abbr: paymentMethod, name: paymentMethod, color: 'text-brand-dark' }
                  return (
                    <div className="p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 bg-white rounded-[10px] border border-brand-muted/15 flex items-center justify-center font-bold text-sm shadow-sm ${info.color}`}>
                          {info.abbr}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-brand-dark">{info.name}</div>
                          <div className="text-xs text-brand-muted">Virtual Account</div>
                        </div>
                      </div>
                      <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">Nomor Virtual Account</label>
                      <div className="inp-copy">
                        <input type="text" value={payCode ?? 'Menunggu...'} readOnly />
                        <button className={`copy-btn${copied === 'va' ? ' copied' : ''}`} onClick={() => copyText(payCode ?? '', 'va')}>
                          <FontAwesomeIcon icon={faCopy} className="mr-1" />
                          {copied === 'va' ? 'Disalin!' : 'Salin'}
                        </button>
                      </div>
                      <div className="text-xs text-brand-muted mt-2">A/N: <strong className="text-brand-dark">Yayasan One Ummah</strong></div>
                    </div>
                  )
                })()}

                {/* Instructions */}
                <div className="bg-brand-light rounded-[10px] border border-brand-muted/10 p-4">
                  <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Transfer
                  </h3>
                  <ol className="flex flex-col gap-2.5">
                    {['Buka aplikasi mobile banking atau ATM Anda',
                      'Pilih menu Transfer Virtual Account, masukkan nomor VA di atas',
                      'Pastikan nama penerima Yayasan One Ummah dan nominal sesuai',
                      'Selesaikan transfer lalu upload bukti pembayaran di bawah',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                        <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
                  <p className="text-xs text-brand-muted">Transfer <strong className="text-brand-dark">tepat sesuai nominal</strong>. Jangan dibulatkan.</p>
                </div>
              </div>
            )}

            {/* QRIS */}
            {['QRIS','QRIS2'].includes(paymentMethod) && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-brand-muted">Scan QR Code menggunakan aplikasi e-wallet atau mobile banking yang mendukung QRIS</p>
                <div className="w-52 h-52 bg-brand-light border-2 border-brand-surface/30 rounded-[14px] flex items-center justify-center mx-auto">
                  <FontAwesomeIcon icon={faQrcode} className="text-7xl text-brand-dark/25" />
                </div>
                <div className="bg-brand-light rounded-[10px] border border-brand-muted/15 p-3 w-full">
                  <div className="text-xs text-brand-muted mb-1">Total yang harus dibayar</div>
                  <div className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</div>
                </div>
              </div>
            )}

            {/* E-Wallet Redirect (OVO, DANA, ShopeePay) */}
            {['OVO','DANA','SHOPEEPAY'].includes(paymentMethod) && (
              <div className="flex flex-col items-center gap-5 text-center p-4">
                <div className="w-20 h-16 rounded-[10px] flex items-center justify-center font-bold text-base"
                  style={{
                    background: paymentMethod === 'OVO' ? '#4C3494' : paymentMethod === 'DANA' ? '#108EE9' : '#EE4D2D',
                    color: '#fff'
                  }}>
                  {paymentMethod === 'SHOPEEPAY' ? 'SPAY' : paymentMethod}
                </div>
                <p className="text-sm text-brand-muted">Klik tombol di bawah untuk melanjutkan pembayaran melalui {paymentMethod === 'SHOPEEPAY' ? 'ShopeePay' : paymentMethod}</p>
                <a
                  href={tripayPaymentUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 font-bold text-white rounded-[10px] flex items-center justify-center gap-2 text-sm"
                  style={{
                    background: paymentMethod === 'OVO' ? '#4C3494' : paymentMethod === 'DANA' ? '#108EE9' : '#EE4D2D'
                  }}
                >
                  Bayar via {paymentMethod === 'SHOPEEPAY' ? 'ShopeePay' : paymentMethod} →
                </a>
                <p className="text-xs text-brand-muted">Anda akan diarahkan ke aplikasi {paymentMethod === 'SHOPEEPAY' ? 'ShopeePay' : paymentMethod} untuk menyelesaikan pembayaran</p>
              </div>
            )}

            {/* Kasir / Minimarket (ALFAMART, INDOMARET, ALFAMIDI) */}
            {['ALFAMART','INDOMARET','ALFAMIDI'].includes(paymentMethod) && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                  {(() => {
                    const KASIR_INFO: Record<string, { abbr: string; name: string; bg: string }> = {
                      ALFAMART:  { abbr: 'Alfa', name: 'Alfamart',  bg: '#E8192C' },
                      INDOMARET: { abbr: 'Indo', name: 'Indomaret', bg: '#CC0000' },
                      ALFAMIDI:  { abbr: 'Midi', name: 'Alfamidi',  bg: '#0063A7' },
                    }
                    const info = KASIR_INFO[paymentMethod]!
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-[10px] flex items-center justify-center font-bold text-sm text-white shadow-sm"
                            style={{ background: info.bg }}>{info.abbr}</div>
                          <div>
                            <div className="font-bold text-sm text-brand-dark">{info.name}</div>
                            <div className="text-xs text-brand-muted">Bayar di kasir</div>
                          </div>
                        </div>
                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">Kode Pembayaran</label>
                        <div className="inp-copy">
                          <input type="text" value={payCode ?? 'Menunggu...'} readOnly />
                          <button className={`copy-btn${copied === 'kasir' ? ' copied' : ''}`} onClick={() => copyText(payCode ?? '', 'kasir')}>
                            <FontAwesomeIcon icon={faCopy} className="mr-1" />
                            {copied === 'kasir' ? 'Disalin!' : 'Salin'}
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div className="bg-brand-light rounded-[10px] border border-brand-muted/10 p-4">
                  <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Bayar
                  </h3>
                  <ol className="flex flex-col gap-2.5">
                    {[`Pergi ke gerai ${paymentMethod === 'ALFAMART' ? 'Alfamart' : paymentMethod === 'INDOMARET' ? 'Indomaret' : 'Alfamidi'} terdekat`,
                      'Tunjukkan kode pembayaran di atas ke kasir',
                      'Sebutkan nominal pembayaran yang harus dibayar',
                      'Simpan struk pembayaran sebagai bukti',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                        <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Manual QRIS — display QR code image to scan */}
            {paymentMethod === 'MANUAL_QRIS' && manualQris && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-brand-light rounded-[10px] border border-brand-muted/10 flex flex-col items-center text-center">
                  <div className="flex items-center gap-3 mb-3 self-start">
                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center font-bold text-xs text-white shadow-sm" style={{ background: '#00AED6' }}>QRIS</div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-brand-dark">QRIS{manualQris.bank ? ` — ${manualQris.bank}` : ''}</div>
                      <div className="text-xs text-brand-muted">{manualQris.label || 'Scan QR untuk pembayaran'}</div>
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={manualQris.image}
                    alt={`QRIS ${manualQris.bank}`}
                    className="w-full max-w-[280px] aspect-square object-contain rounded-[10px] border border-brand-muted/15 bg-white"
                  />
                  <div className="bg-white rounded-[10px] border border-brand-muted/15 px-4 py-2 mt-3 w-full max-w-[280px]">
                    <div className="text-xs text-brand-muted">Total yang harus dibayar</div>
                    <div className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>

                <div className="bg-brand-light rounded-[10px] border border-brand-muted/10 p-4">
                  <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Bayar
                  </h3>
                  <ol className="flex flex-col gap-2.5">
                    {[
                      'Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) atau m-banking yang mendukung QRIS',
                      'Pilih menu Scan QRIS lalu arahkan kamera ke gambar QR di atas',
                      `Pastikan nominal sesuai total: ${formatCurrency(totalAmount)}`,
                      'Selesaikan pembayaran lalu upload bukti transfer di bawah',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                        <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
                  <p className="text-xs text-brand-muted">Transfer <strong className="text-brand-dark">tepat sesuai nominal</strong>. Jangan dibulatkan.</p>
                </div>
              </div>
            )}

            {/* Manual Transfer — show only the selected bank account */}
            {paymentMethod.startsWith('MANUAL_') && paymentMethod !== 'MANUAL_QRIS' && manualBank && (() => {
              const banks = manualBank.banks && manualBank.banks.length > 0
                ? manualBank.banks
                : [{ id:'0', code:'', name: manualBank.bankName, number: manualBank.accountNumber, owner: manualBank.accountOwner }]
              const idx = parseInt(paymentMethod.slice('MANUAL_'.length))
              const b = banks[isNaN(idx) ? 0 : idx] ?? banks[0]
              if (!b) return null
              const BANK_COLORS: Record<string, {bg:string;text:string}> = {
                BCA:   {bg:'#003D86',text:'#fff'}, MNR:  {bg:'#003087',text:'#FFD700'},
                BNI:   {bg:'#FF6600',text:'#fff'}, BRI:  {bg:'#00529B',text:'#fff'},
                BSI:   {bg:'#007A52',text:'#fff'}, CIMB: {bg:'#BE1E2D',text:'#fff'},
                DNN:   {bg:'#E40522',text:'#fff'}, PMT:  {bg:'#00A651',text:'#fff'},
                BTN:   {bg:'#009A44',text:'#fff'}, MEGA: {bg:'#1B1464',text:'#fff'},
                OCBC:  {bg:'#EE3124',text:'#fff'}, PANIN:{bg:'#003399',text:'#fff'},
              }
              const colors = BANK_COLORS[b.code] ?? {bg:'#1B5E3B', text:'#fff'}
              const abbr = b.code || b.name.split(' ').pop()?.substring(0,4).toUpperCase() || 'BANK'
              return (
                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-14 h-10 rounded-[8px] flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm leading-none"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {abbr}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-brand-dark">{b.name}</div>
                        <div className="text-xs text-brand-muted">Transfer Manual</div>
                      </div>
                    </div>
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">Nomor Rekening</label>
                    <div className="inp-copy">
                      <input type="text" value={b.number} readOnly />
                      <button className={`copy-btn${copied === 'manual' ? ' copied' : ''}`} onClick={() => copyText(b.number, 'manual')}>
                        <FontAwesomeIcon icon={faCopy} className="mr-1" />
                        {copied === 'manual' ? 'Disalin!' : 'Salin'}
                      </button>
                    </div>
                    <div className="text-xs text-brand-muted mt-2">A/N: <strong className="text-brand-dark">{b.owner}</strong></div>
                  </div>
                  <div className="bg-brand-light rounded-[10px] border border-brand-muted/10 p-4">
                    <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Transfer
                    </h3>
                    <ol className="flex flex-col gap-2.5">
                      {['Buka aplikasi mobile banking atau ATM Anda, pilih Transfer Antar Bank',
                        `Transfer ke rekening ${b.name} nomor ${b.number}`,
                        `Pastikan nama penerima ${b.owner} dan nominal tepat`,
                        'Simpan bukti transfer lalu upload di bawah',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                          <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
                    <p className="text-xs text-brand-muted">Transfer <strong className="text-brand-dark">tepat sesuai nominal</strong>. Jangan dibulatkan.</p>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Payment Proof Upload */}
          <div className="p-5 border-t border-brand-muted/10">
            <h3 className="font-bold text-sm text-brand-dark mb-3">📎 Upload Bukti Pembayaran</h3>
            {proofUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl} alt="Bukti transfer" className="w-full h-36 object-cover rounded-[10px] border border-brand-muted/20" />
                <button
                  onClick={() => setProofUrl('')}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold"
                >
                  ✕ Hapus
                </button>
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  ✓ Bukti transfer berhasil diupload
                </p>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-[10px] cursor-pointer transition-colors ${uploadingProof ? 'border-brand-surface/30 bg-brand-surface/5' : 'border-brand-muted/30 hover:border-brand-accent/50 hover:bg-brand-accent/[0.02]'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingProof}
                  onChange={handleProofUpload}
                />
                <div className="text-center">
                  <div className="text-xl mb-0.5">{uploadingProof ? '⏳' : '📷'}</div>
                  <div className="text-xs font-medium text-brand-dark">{uploadingProof ? 'Mengupload...' : 'Klik untuk upload bukti transfer'}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">JPG, PNG · Max 5MB</div>
                </div>
              </label>
            )}
            {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
          </div>
        </div>
      </div>

      {/* RIGHT: Order summary */}
      <div className="w-full lg:w-[380px] shrink-0">
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 overflow-hidden sticky top-24">
          <div className="p-5 border-b border-brand-muted/10">
            <h3 className="font-serif text-base font-bold text-brand-dark">Ringkasan Pesanan</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-brand-light shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImage} className="w-full h-full object-cover" alt={productName} />
              </div>
              <div>
                <div className="font-bold text-sm text-brand-dark mb-1">{productName}</div>
                <div className="text-xs text-brand-muted flex items-center gap-1">
                  <FontAwesomeIcon icon={faWeightScale} /> {productWeight} kg
                </div>
              </div>
            </div>
            <div className="border-t border-brand-muted/10 pt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal Produk</span>
                <span>{formatCurrency(productPrice)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Ongkos Kirim</span>
                {shippingCost > 0
                  ? <span className="font-semibold text-brand-dark">+{formatCurrency(shippingCost)}</span>
                  : <span className="text-[#25D366] font-semibold">Gratis</span>
                }
              </div>
            </div>
            <div className="border-t border-brand-muted/10 pt-3 flex justify-between items-center">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</span>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-cta-gradient text-brand-text-dark font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Memproses...' : <>Sudah Transfer <FontAwesomeIcon icon={faArrowRight} /></>}
            </button>
            {submitError && <p className="text-xs text-red-600 text-center">{submitError}</p>}
            <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
              <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" /> Transaksi aman &amp; terenkripsi
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Sticky bottom bar — selalu terlihat saat scroll ── */}
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand-muted/15 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-brand-muted leading-none">Total Pembayaran</span>
          <span className="font-serif text-xl font-bold text-brand-accent leading-tight">{formatCurrency(totalAmount)}</span>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="ml-auto flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold px-6 py-3 rounded-[12px] shadow-premium hover:opacity-90 transition-opacity text-sm whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Memproses...' : <>Sudah Bayar <FontAwesomeIcon icon={faArrowRight} /></>}
        </button>
      </div>
    </div>
    {/* Spacer so content isn't hidden behind sticky bar */}
    <div className="h-20" />
    </>
  )
}
