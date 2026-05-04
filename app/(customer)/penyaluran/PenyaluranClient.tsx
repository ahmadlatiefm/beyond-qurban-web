'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faUsers,
  faClock,
  faHeart,
  faShieldHalved,
  faShareNodes,
  faLink,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import { faFacebookF as faFacebookFIcon, faXTwitter as faXTwitterIcon, faWhatsapp as faWhatsappIcon } from '@fortawesome/free-brands-svg-icons'
import { formatCurrency } from '@/lib/utils'
import type { Campaign } from '@prisma/client'

function getFlag(location: string) {
  if (location === 'AFRICA') return '🌍'
  if (location === 'PALESTINE') return '🇵🇸'
  return '🇮🇩'
}

function getLocationLabel(location: string) {
  if (location === 'AFRICA') return 'Afrika Sub-Sahara'
  if (location === 'PALESTINE') return 'Gaza & Tepi Barat'
  return 'Papua, NTT, Kalimantan'
}

interface Props {
  campaigns: Campaign[]
}

export default function PenyaluranClient({ campaigns }: Props) {
  const [activeTab, setActiveTab] = useState<'keterangan' | 'kabar' | 'donatur'>('keterangan')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(campaigns[0] ?? null)
  const [qty, setQty] = useState(1)

  const total = selectedCampaign ? selectedCampaign.price * qty : 0
  const checkoutUrl = selectedCampaign
    ? `/penyaluran/checkout?campaign=${selectedCampaign.slug}&qty=${qty}`
    : '/penyaluran'

  function decreaseQty() {
    setQty((q) => Math.max(1, q - 1))
  }
  function increaseQty() {
    setQty((q) => q + 1)
  }

  return (
    <div className="pt-20">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT: Campaign content */}
          <div className="flex-1 min-w-0">

            {/* Banner image */}
            <div className="relative w-full rounded-[16px] overflow-hidden mb-6" style={{ aspectRatio: '2/1' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/746f7dfd61-8c39b0a57f6d2d290989.png"
                className="w-full h-full object-cover"
                alt="Campaign banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/30 to-transparent" />
              <div className="absolute top-4 right-4 bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                #BeyondQurban1447H
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-2 bg-brand-surface/70 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                  <span
                    className="w-2 h-2 rounded-full bg-brand-accent inline-block"
                    style={{ animation: 'pulse-dot 1.5s infinite' }}
                  />
                  <span className="text-brand-accent-light text-xs font-semibold uppercase tracking-wider">
                    Campaign Aktif • 2025
                  </span>
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight">
                  Tebar Qurban untuk Mereka yang Membutuhkan
                </h1>
              </div>
            </div>

            {/* Verified org card */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-[12px] border border-brand-muted/10 shadow-[0_2px_12px_rgba(13,51,32,.08)]">
              <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center border-2 border-brand-accent/30 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-gold.png" className="w-8 h-8 object-contain" alt="" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-brand-dark">Beyond Qurban Official</span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" /> Verified Organization
                  </span>
                </div>
                <div className="text-xs text-brand-muted mt-0.5">Yayasan One Ummah • Diverifikasi MUI</div>
              </div>
            </div>

            {/* Tabs card */}
            <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-[0_2px_12px_rgba(13,51,32,.08)] overflow-hidden">
              <div className="flex border-b border-brand-muted/10 overflow-x-auto">
                <button
                  className={`tab-btn${activeTab === 'keterangan' ? ' active' : ''}`}
                  onClick={() => setActiveTab('keterangan')}
                >
                  Keterangan
                </button>
                <button
                  className={`tab-btn${activeTab === 'kabar' ? ' active' : ''}`}
                  onClick={() => setActiveTab('kabar')}
                >
                  Kabar Terbaru{' '}
                  <span className="ml-1 bg-brand-surface text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">20</span>
                </button>
                <button
                  className={`tab-btn${activeTab === 'donatur' ? ' active' : ''}`}
                  onClick={() => setActiveTab('donatur')}
                >
                  Donatur{' '}
                  <span className="ml-1 bg-brand-surface text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">635</span>
                </button>
              </div>

              {/* Tab: Keterangan */}
              {activeTab === 'keterangan' && (
                <div className="p-6 flex flex-col gap-6">
                  {/* About */}
                  <div>
                    <h2 className="font-serif text-lg font-bold text-brand-text-dark mb-3">Tentang Program Ini</h2>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      Program <strong className="text-brand-dark">Beyond Qurban 1447H</strong> adalah inisiatif penyaluran hewan qurban ke daerah-daerah yang paling membutuhkan di Indonesia dan mancanegara. Kami memastikan setiap hewan disembelih sesuai syariat Islam dan dagingnya tersalurkan langsung kepada penerima manfaat.
                    </p>
                    <p className="text-sm text-brand-muted leading-relaxed mt-3">
                      Setiap donatur akan mendapatkan laporan foto & video penyembelihan beserta sertifikat qurban digital yang dikirim via WhatsApp.
                    </p>
                  </div>

                  {/* Destination info cards */}
                  <div>
                    <h3 className="font-bold text-sm text-brand-text-dark uppercase tracking-wider mb-3">Destinasi Penyaluran</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { flag: '🇮🇩', title: 'Indonesia', desc: 'Papua, NTT, Kalimantan, dan daerah 3T lainnya' },
                        { flag: '🌍', title: 'Afrika', desc: 'Somalia, Ethiopia, Nigeria, dan negara sub-Sahara' },
                        { flag: '🇵🇸', title: 'Palestina', desc: 'Gaza dan Tepi Barat — membutuhkan bantuan mendesak' },
                      ].map((dest) => (
                        <div key={dest.title} className="p-4 bg-brand-light rounded-[12px] border border-brand-muted/10">
                          <div className="text-2xl mb-2">{dest.flag}</div>
                          <div className="font-bold text-sm text-brand-dark">{dest.title}</div>
                          <div className="text-xs text-brand-muted mt-1">{dest.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cara Kerja */}
                  <div>
                    <h3 className="font-bold text-sm text-brand-text-dark uppercase tracking-wider mb-3">Cara Kerja Penyaluran</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { step: '1', title: 'Pilih Destinasi', desc: 'Pilih negara atau daerah tujuan qurban Anda' },
                        { step: '2', title: 'Donasi', desc: 'Lakukan pembayaran sesuai harga hewan yang dipilih' },
                        { step: '3', title: 'Penyembelihan', desc: 'Tim kami menyembelih hewan sesuai syariat Islam' },
                        { step: '4', title: 'Laporan', desc: 'Terima foto, video, dan sertifikat qurban via WA' },
                      ].map((item) => (
                        <div key={item.step} className="p-4 bg-brand-light rounded-[12px] border border-brand-muted/10 text-center">
                          <div className="w-8 h-8 rounded-full bg-brand-surface text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">
                            {item.step}
                          </div>
                          <div className="font-bold text-xs text-brand-dark mb-1">{item.title}</div>
                          <div className="text-[11px] text-brand-muted">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Share buttons */}
                  <div>
                    <h3 className="font-bold text-sm text-brand-text-dark uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faShareNodes} className="text-brand-surface" /> Bagikan Campaign
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href="https://wa.me/?text=Yuk%20ikut%20qurban%20bersama%20Beyond%20Qurban%201447H"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity"
                      >
                        <FontAwesomeIcon icon={faWhatsappIcon} /> WhatsApp
                      </a>
                      <a
                        href="https://facebook.com/sharer/sharer.php?u=https://beyondqurban.com/penyaluran"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#1877F2] text-white text-xs font-bold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity"
                      >
                        <FontAwesomeIcon icon={faFacebookFIcon} /> Facebook
                      </a>
                      <a
                        href="https://twitter.com/intent/tweet?text=Yuk%20qurban%20bersama%20Beyond%20Qurban%201447H"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black text-white text-xs font-bold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity"
                      >
                        <FontAwesomeIcon icon={faXTwitterIcon} /> X / Twitter
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(window.location.href).catch(() => {})}
                        className="flex items-center gap-2 bg-brand-light border border-brand-muted/20 text-brand-dark text-xs font-bold px-4 py-2 rounded-[8px] hover:border-brand-accent transition-colors"
                      >
                        <FontAwesomeIcon icon={faLink} /> Salin Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Kabar Terbaru */}
              {activeTab === 'kabar' && (
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex gap-4 p-4 bg-brand-light rounded-[12px] border border-brand-muted/10">
                    <div className="w-20 h-20 rounded-[10px] bg-brand-muted/10 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://storage.googleapis.com/uxpilot-auth.appspot.com/746f7dfd61-8c39b0a57f6d2d290989.png"
                        className="w-full h-full object-cover"
                        alt="Update"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-brand-muted mb-1">28 Mei 2025</div>
                      <div className="font-bold text-sm text-brand-dark mb-1">Penyaluran Tahap 1 di Papua Selesai</div>
                      <div className="text-xs text-brand-muted leading-relaxed">
                        Alhamdulillah, 120 ekor kambing telah berhasil disalurkan ke 3 desa terpencil di Papua Barat. Laporan lengkap tersedia untuk semua donatur.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-brand-light rounded-[12px] border border-brand-muted/10">
                    <div className="w-20 h-20 rounded-[10px] bg-brand-muted/10 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://storage.googleapis.com/uxpilot-auth.appspot.com/746f7dfd61-8c39b0a57f6d2d290989.png"
                        className="w-full h-full object-cover"
                        alt="Update"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-brand-muted mb-1">15 Mei 2025</div>
                      <div className="font-bold text-sm text-brand-dark mb-1">Tim Berangkat ke Gaza</div>
                      <div className="text-xs text-brand-muted leading-relaxed">
                        Tim penyaluran Beyond Qurban telah tiba di perbatasan untuk mempersiapkan penyaluran qurban ke wilayah Gaza.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Donatur */}
              {activeTab === 'donatur' && (
                <div className="p-6 flex flex-col gap-3">
                  {[
                    { name: 'Ahmad F.***', location: 'Jakarta', dest: '🇮🇩 Indonesia', qty: 2, time: '2 jam lalu' },
                    { name: 'Siti R.***', location: 'Surabaya', dest: '🇵🇸 Palestina', qty: 1, time: '5 jam lalu' },
                    { name: 'Muhammad A.***', location: 'Bandung', dest: '🌍 Afrika', qty: 3, time: '1 hari lalu' },
                    { name: 'Fatimah H.***', location: 'Medan', dest: '🇮🇩 Indonesia', qty: 1, time: '1 hari lalu' },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-brand-light rounded-[10px] border border-brand-muted/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-surface/10 border border-brand-surface/20 flex items-center justify-center font-bold text-sm text-brand-surface">
                          {d.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-brand-dark">{d.name}</div>
                          <div className="text-[11px] text-brand-muted">{d.location} • {d.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-brand-surface">{d.dest}</div>
                        <div className="text-[11px] text-brand-muted">{d.qty} ekor</div>
                      </div>
                    </div>
                  ))}
                  <button className="text-center text-xs text-brand-surface font-bold py-2 hover:underline flex items-center justify-center gap-1">
                    Lihat semua donatur <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Donation widget */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="bg-white rounded-[16px] border border-brand-muted/10 shadow-premium sticky top-24">
              {/* Progress section */}
              <div className="p-5 border-b border-brand-muted/10">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="font-serif text-2xl font-bold text-brand-accent">Rp 847 Jt</div>
                    <div className="text-xs text-brand-muted">terkumpul dari target Rp 1,2 Miliar</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-brand-surface">71%</div>
                    <div className="text-xs text-brand-muted">tercapai</div>
                  </div>
                </div>
                <div className="h-2 bg-brand-light rounded-full overflow-hidden">
                  <div
                    style={{
                      width: '71%',
                      height: '100%',
                      borderRadius: '9999px',
                      background: 'linear-gradient(90deg,#1B5E3B,#C8962A)',
                    }}
                  />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-brand-muted">
                  <span>
                    <FontAwesomeIcon icon={faUsers} className="mr-1" />
                    <strong>635</strong> donatur
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    <strong>18 hari</strong> tersisa
                  </span>
                </div>
              </div>

              {/* Destination selection */}
              <div className="p-5 flex flex-col gap-3">
                <div className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">
                  Pilih Destinasi
                </div>

                {campaigns.map((campaign) => {
                  const badge = campaign.location === 'AFRICA'
                    ? { text: '🌐 Internasional', cls: 'bg-blue-100 text-blue-700' }
                    : campaign.location === 'PALESTINE'
                    ? { text: '🚨 Prioritas', cls: 'bg-red-100 text-red-600' }
                    : { text: '🔥 Terpopuler', cls: 'bg-brand-accent text-brand-dark' }
                  return (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`dest-opt${selectedCampaign?.id === campaign.id ? ' selected' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{getFlag(campaign.location)}</span>
                          <div>
                            <div className="font-bold text-sm text-brand-dark">{getLocationLabel(campaign.location)}</div>
                            <div className="text-xs text-brand-muted">{campaign.title}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-brand-accent">
                            Rp {(campaign.price / 1000000).toFixed(1)}Jt
                          </div>
                          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${badge.cls}`}>{badge.text}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Quantity selector */}
                <div className="mt-2">
                  <div className="text-xs font-bold text-brand-text-dark uppercase tracking-wider mb-2">Jumlah Hewan</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decreaseQty}
                      className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xl font-bold text-brand-dark w-8 text-center">{qty}</span>
                    <button
                      onClick={increaseQty}
                      className="w-9 h-9 rounded-[8px] border border-brand-muted/20 text-brand-dark font-bold flex items-center justify-center hover:border-brand-accent transition-colors"
                    >
                      +
                    </button>
                    <span className="text-xs text-brand-muted ml-1">ekor</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-4 mt-2">
                  <span className="text-sm text-brand-muted">Total yang akan dibayar</span>
                  <span className="font-serif text-2xl font-bold text-brand-accent">{formatCurrency(total)}</span>
                </div>

                {/* CTA Button */}
                <Link
                  href={checkoutUrl}
                  className="block w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[14px] shadow-premium hover:scale-[1.02] transition-transform text-center mb-3"
                >
                  <FontAwesomeIcon icon={faHeart} className="mr-2" />Qurban Sekarang!
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-brand-surface" /> Aman &amp; terpercaya · Tersertifikasi MUI
                </div>
              </div>

              {/* Share mini */}
              <div className="px-5 pb-5 flex gap-2 border-t border-brand-muted/10 pt-4">
                <span className="text-xs text-brand-muted self-center">Bagikan:</span>
                <a href="https://wa.me/?text=Yuk+Qurban+Bersama+%23BeyondQurban1447H!" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-white text-xs hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faWhatsappIcon} />
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-xs hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faFacebookFIcon} />
                </a>
                <a href="https://twitter.com/intent/tweet?text=%23BeyondQurban1447H" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faXTwitterIcon} />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
