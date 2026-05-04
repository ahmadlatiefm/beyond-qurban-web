'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuildingColumns, faQrcode, faWallet,
  faListOl, faTriangleExclamation, faDownload,
  faWeightScale, faArrowRight, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { faCopy, faClock } from '@fortawesome/free-regular-svg-icons'
import { formatCurrency } from '@/lib/utils'

interface Props {
  orderNumber: string
  totalAmount: number
  productName: string
  productImage: string
  productWeight: number
  createdAt: string
}

const VA_ACCOUNTS = [
  { bank: 'BCA', color: 'text-blue-700', va: '1234 5678 9012 3456', id: 'va-bca' },
  { bank: 'MNR', color: 'text-yellow-700', va: '8900 0123 4567 8901', id: 'va-mandiri', label: 'Bank Mandiri' },
]

export default function PembayaranClient({
  orderNumber, totalAmount, productName, productImage, productWeight, createdAt,
}: Props) {
  const [activeTab, setActiveTab] = useState<'transfer' | 'qris' | 'ewallet'>('transfer')
  const [copied, setCopied] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('23:59:00')

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

  return (
    <div className="flex flex-col lg:flex-row gap-7 items-start">
      {/* LEFT: Payment methods */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Countdown */}
        <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm">
          <FontAwesomeIcon icon={faClock} className="text-xs" />
          Bayar sebelum: <span className="font-mono ml-1">{countdown}</span>
        </div>

        {/* Tabs card */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-brand-muted/10">
            <h2 className="font-serif text-lg font-bold text-brand-text-dark">Pilih Metode Pembayaran</h2>
            <p className="text-xs text-brand-muted mt-1">Selesaikan pembayaran sebelum batas waktu habis</p>
          </div>
          <div className="flex border-b border-brand-muted/10 overflow-x-auto">
            {(['transfer', 'qris', 'ewallet'] as const).map((tab) => {
              const labels = { transfer: 'Transfer Bank', qris: 'QRIS', ewallet: 'E-Wallet' }
              const icons = { transfer: faBuildingColumns, qris: faQrcode, ewallet: faWallet }
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pay-tab${activeTab === tab ? ' active' : ''}`}
                >
                  <FontAwesomeIcon icon={icons[tab]} className="mr-1.5 text-xs" />{labels[tab]}
                </button>
              )
            })}
          </div>

          {/* Transfer tab */}
          {activeTab === 'transfer' && (
            <div className="p-5 md:p-6 flex flex-col gap-5">
              {VA_ACCOUNTS.map((acc) => (
                <div key={acc.id} className="bg-brand-light rounded-[12px] border border-brand-muted/10 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-white rounded-[10px] border border-brand-muted/15 flex items-center justify-center font-bold text-sm ${acc.color} shadow-sm`}>{acc.bank}</div>
                    <div>
                      <div className="font-bold text-sm text-brand-dark">{acc.label || `Bank ${acc.bank}`}</div>
                      <div className="text-xs text-brand-muted">Virtual Account</div>
                    </div>
                  </div>
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">Nomor Virtual Account</label>
                  <div className="inp-copy">
                    <input type="text" value={acc.va} readOnly />
                    <button
                      className={`copy-btn${copied === acc.id ? ' copied' : ''}`}
                      onClick={() => copyText(acc.va, acc.id)}
                    >
                      <FontAwesomeIcon icon={faCopy} className="mr-1" />
                      {copied === acc.id ? 'Disalin!' : 'Salin'}
                    </button>
                  </div>
                  <div className="text-xs text-brand-muted mt-2">A/N: <strong className="text-brand-dark">Yayasan One Ummah</strong></div>
                </div>
              ))}

              <div className="bg-brand-light rounded-[12px] border border-brand-muted/10 p-4">
                <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Transfer
                </h3>
                <ol className="flex flex-col gap-2.5">
                  {['Buka aplikasi mobile banking atau ATM Anda, pilih menu <strong class="text-brand-dark">Transfer Virtual Account</strong>',
                    'Masukkan nomor VA di atas, pastikan nama penerima <strong class="text-brand-dark">Yayasan One Ummah</strong> dan nominal sesuai',
                    'Selesaikan transfer lalu upload bukti pembayaran'].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                      <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <span dangerouslySetInnerHTML={{ __html: step }} />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
                <p className="text-xs text-brand-muted">Transfer <strong className="text-brand-dark">tepat sesuai nominal</strong> di bawah. Jangan dibulatkan atau dikurangi.</p>
              </div>
            </div>
          )}

          {/* QRIS tab */}
          {activeTab === 'qris' && (
            <div className="p-5 md:p-6 flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-brand-muted max-w-xs">Scan QR Code menggunakan aplikasi e-wallet atau mobile banking apa saja yang mendukung QRIS</p>
              <div className="w-52 h-52 bg-brand-light border-2 border-brand-surface/30 rounded-[14px] flex items-center justify-center mx-auto">
                <FontAwesomeIcon icon={faQrcode} className="text-[80px] text-brand-dark/25" />
              </div>
              <div className="bg-brand-light rounded-[10px] border border-brand-muted/15 p-3 w-full max-w-xs">
                <div className="text-xs text-brand-muted mb-1">Total yang harus dibayar</div>
                <div className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</div>
              </div>
              <button className="flex items-center gap-2 text-brand-surface font-bold text-sm border-2 border-brand-surface/30 hover:bg-brand-surface hover:text-white px-5 py-2.5 rounded-[10px] transition-colors">
                <FontAwesomeIcon icon={faDownload} /> Simpan QR Code
              </button>
            </div>
          )}

          {/* E-Wallet tab */}
          {activeTab === 'ewallet' && (
            <div className="p-5 md:p-6 flex flex-col gap-3">
              <p className="text-sm text-brand-muted">Pilih aplikasi e-wallet Anda:</p>
              {['GoPay', 'OVO', 'DANA', 'ShopeePay'].map((w) => (
                <div key={w} className="border-2 border-brand-muted/15 rounded-[10px] p-3.5 cursor-pointer hover:border-brand-accent/40 transition-all bg-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                    <FontAwesomeIcon icon={faWallet} className="text-brand-surface" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-brand-dark">{w}</div>
                    <div className="text-xs text-brand-muted">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <div className="flex justify-between text-brand-muted"><span>Subtotal</span><span>{formatCurrency(totalAmount)}</span></div>
              <div className="flex justify-between text-brand-muted"><span>Ongkir</span><span className="text-[#25D366] font-semibold">Gratis</span></div>
            </div>
            <div className="border-t border-brand-muted/10 pt-3 flex justify-between items-center">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</span>
            </div>
            <Link
              href={`/terimakasih?order=${orderNumber}&type=regular`}
              className="w-full bg-cta-gradient text-brand-text-dark font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm"
            >
              Sudah Transfer <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
              <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" /> Transaksi aman &amp; terenkripsi
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
