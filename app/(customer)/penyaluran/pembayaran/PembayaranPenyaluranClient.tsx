'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuildingColumns,
  faQrcode,
  faWallet,
  faListOl,
  faTriangleExclamation,
  faDownload,
  faArrowRight,
  faShieldHalved,
  faHandHoldingHeart,
} from '@fortawesome/free-solid-svg-icons'
import { faCopy, faClock } from '@fortawesome/free-regular-svg-icons'
import { formatCurrency } from '@/lib/utils'

interface Props {
  orderNumber: string
  totalAmount: number
  campaignTitle: string
  campaignLocation: string
  quantity: number
  createdAt: string
  paymentMethod: string
  payCode: string | null
}

function getFlag(loc: string) {
  if (loc === 'AFRICA') return '🌍'
  if (loc === 'PALESTINE') return '🇵🇸'
  return '🇮🇩'
}

export default function PembayaranPenyaluranClient({
  orderNumber,
  totalAmount,
  campaignTitle,
  campaignLocation,
  quantity,
  createdAt,
  paymentMethod,
  payCode,
}: Props) {
  const [activeTab, setActiveTab] = useState<'transfer' | 'qris' | 'ewallet'>(() => {
    if (['BVAI', 'MANDIRIVA', 'BNIVA', 'BRIVA'].includes(paymentMethod)) return 'transfer'
    if (['QRIS', 'QRISC'].includes(paymentMethod)) return 'qris'
    return 'ewallet'
  })
  const [copied, setCopied] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('23:59:00')

  useEffect(() => {
    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
    const tick = () => {
      const diff = deadline - Date.now()
      if (diff <= 0) {
        setCountdown('00:00:00')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
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

  const bankLabel =
    paymentMethod === 'BVAI' ? 'Bank BCA' :
    paymentMethod === 'MANDIRIVA' ? 'Bank Mandiri' :
    paymentMethod === 'BNIVA' ? 'Bank BNI' :
    paymentMethod === 'BRIVA' ? 'Bank BRI' : paymentMethod

  const bankCode =
    paymentMethod === 'BVAI' ? 'BCA' :
    paymentMethod === 'MANDIRIVA' ? 'MNR' :
    paymentMethod === 'BNIVA' ? 'BNI' :
    paymentMethod === 'BRIVA' ? 'BRI' : paymentMethod

  const bankColor =
    paymentMethod === 'BVAI' ? 'text-blue-700' :
    paymentMethod === 'MANDIRIVA' ? 'text-yellow-700' :
    paymentMethod === 'BNIVA' ? 'text-orange-600' :
    paymentMethod === 'BRIVA' ? 'text-blue-500' : 'text-brand-dark'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: Payment instructions */}
      <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 overflow-hidden">
        <div className="p-5 border-b border-brand-muted/10">
          <h2 className="font-serif text-lg font-bold text-brand-text-dark">Instruksi Pembayaran</h2>
          <p className="text-xs text-brand-muted mt-1">Pilih metode dan selesaikan dalam batas waktu</p>
          <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm mt-2">
            <FontAwesomeIcon icon={faClock} className="text-xs" />
            Batas:{' '}
            <span className="font-mono ml-1">{countdown}</span>
          </div>
        </div>
        <div className="flex border-b border-brand-muted/10 overflow-x-auto">
          {(['transfer', 'qris', 'ewallet'] as const).map((tab) => {
            const labels = { transfer: 'Transfer Bank', qris: 'QRIS', ewallet: 'E-Wallet' }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pay-tab${activeTab === tab ? ' active' : ''}`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {activeTab === 'transfer' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-white rounded-[8px] border border-brand-muted/20 flex items-center justify-center font-bold text-xs ${bankColor}`}>
                  {bankCode}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-brand-muted">{bankLabel} — Virtual Account</div>
                </div>
              </div>
              <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">Nomor Virtual Account</label>
              <div className="inp-copy">
                <input type="text" value={payCode ?? '—'} readOnly />
                <button
                  onClick={() => copyText(payCode ?? '', 'va')}
                  className={`copy-btn${copied === 'va' ? ' copied' : ''}`}
                >
                  <FontAwesomeIcon icon={faCopy} /> {copied === 'va' ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <div className="text-xs text-brand-muted mt-2">
                A/N: <strong className="text-brand-dark">Yayasan One Ummah</strong>
              </div>
            </div>
            {/* Transfer instructions */}
            <div className="bg-brand-light rounded-[10px] border border-brand-muted/10 p-4">
              <h3 className="font-bold text-sm text-brand-dark mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faListOl} className="text-brand-surface text-xs" /> Cara Transfer
              </h3>
              <ol className="flex flex-col gap-2.5">
                {[
                  'Buka aplikasi mobile banking atau ATM Anda',
                  'Pilih menu Transfer Virtual Account, masukkan nomor VA di atas',
                  'Pastikan nama penerima Yayasan One Ummah dan nominal sesuai',
                  'Selesaikan transfer lalu upload bukti pembayaran',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                    <span className="w-6 h-6 rounded-full bg-brand-surface/15 text-brand-surface font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[8px] p-3 mt-1">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
              <p className="text-xs text-brand-muted">
                Transfer <strong className="text-brand-dark">tepat nominal</strong>. Jangan dibulatkan.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'qris' && (
          <div className="p-5 text-center flex flex-col items-center gap-4">
            <div className="w-44 h-44 mx-auto bg-brand-light border-2 border-brand-surface rounded-[12px] flex items-center justify-center mb-2">
              <FontAwesomeIcon icon={faQrcode} className="text-7xl text-brand-dark/30" />
            </div>
            <p className="text-xs text-brand-muted">
              Scan dengan GoPay, OVO, DANA, ShopeePay, atau mobile banking manapun
            </p>
            <button className="flex items-center gap-1.5 text-brand-surface text-xs font-bold border border-brand-surface/30 px-4 py-2 rounded-[8px] mx-auto hover:bg-brand-surface hover:text-white transition-colors">
              <FontAwesomeIcon icon={faDownload} /> Unduh QR Code
            </button>
          </div>
        )}

        {activeTab === 'ewallet' && (
          <div className="p-5 flex flex-col gap-3">
            {['GoPay', 'OVO', 'DANA', 'ShopeePay'].map((w) => (
              <div
                key={w}
                className="border-2 border-brand-muted/15 rounded-[10px] p-3.5 cursor-pointer hover:border-brand-accent/40 transition-all bg-white flex items-center gap-3"
              >
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

      {/* RIGHT: Donation summary */}
      <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 overflow-hidden h-fit sticky top-24">
        <div className="p-5 bg-brand-surface text-brand-light">
          <div className="flex items-center gap-2 mb-1">
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-brand-accent" />
            <span className="font-bold text-sm">Ringkasan Donasi</span>
          </div>
          <div className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3 p-3 bg-brand-light rounded-[10px]">
            <span className="text-2xl">{getFlag(campaignLocation)}</span>
            <div>
              <div className="font-bold text-sm text-brand-dark">{campaignTitle}</div>
              <div className="text-xs text-brand-muted">{quantity} ekor hewan qurban</div>
            </div>
          </div>
          <div className="flex justify-between text-sm border-t border-brand-muted/10 pt-3">
            <span className="font-bold text-brand-dark">Total Donasi</span>
            <span className="font-serif text-xl font-bold text-brand-accent">{formatCurrency(totalAmount)}</span>
          </div>
          <Link
            href={`/terimakasih?order=${orderNumber}&type=penyaluran&dest=${campaignLocation.toLowerCase()}`}
            className="w-full bg-cta-gradient text-brand-text-dark font-bold py-3.5 rounded-[12px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm"
          >
            Sudah Transfer <FontAwesomeIcon icon={faArrowRight} />
          </Link>
          <div className="flex items-center justify-center gap-1.5 text-brand-muted/50 text-xs">
            <FontAwesomeIcon icon={faShieldHalved} className="text-brand-accent/50" /> Transaksi aman &amp; amanah
          </div>
        </div>
      </div>
    </div>
  )
}
