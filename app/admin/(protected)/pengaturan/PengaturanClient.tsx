'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk, faRotateLeft, faPaperPlane, faCreditCard,
  faTag, faCode, faSliders, faCircleInfo, faBell, faEye,
  faCopy, faPlugCircleCheck, faExternalLinkAlt,
  faMinus, faPlus, faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faWhatsapp as faWhatsappPrev, faFacebookF, faTiktok } from '@fortawesome/free-brands-svg-icons'
import { saveSettings } from '@/lib/actions/settings'

type SectionKey = 'onesender' | 'tripay' | 'diskon' | 'pixel' | 'umum' | 'info'

export default function PengaturanClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [activeSection, setActiveSection] = useState<SectionKey>('onesender')
  const [settings, setSettings] = useState(initialSettings)
  const [showKeys, setShowKeys] = useState({ apiKey: false, privKey: false, fbToken: false })
  const [voucherModal, setVoucherModal] = useState(false)
  const [vouchers, setVouchers] = useState([
    { code: 'IDULADHA25', disc: 10, minBuy: 2000000, maxUse: 100, used: 34 },
    { code: 'NEWUSER', disc: 5, minBuy: 1500000, maxUse: 50, used: 12 },
    { code: 'RAMADAN24', disc: 15, minBuy: 3000000, maxUse: 200, used: 200 },
  ])
  const [newVoucher, setNewVoucher] = useState({ code: '', disc: 10, minBuy: 0, maxUse: 100 })
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  function showToast(msg: string) {
    setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 2800)
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function handleSave(sectionKeys: string[]) {
    const toSave: Record<string, string> = {}
    sectionKeys.forEach(k => { if (settings[k] !== undefined) toSave[k] = settings[k] })
    startTransition(async () => {
      await saveSettings(toSave)
      showToast('Pengaturan berhasil disimpan!')
    })
  }

  const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
    { key: 'onesender', label: 'OneSender', icon: faWhatsapp },
    { key: 'tripay', label: 'Tripay', icon: faCreditCard },
    { key: 'diskon', label: 'Manajemen Diskon', icon: faTag },
    { key: 'pixel', label: 'Pixel & Tracking', icon: faCode },
    { key: 'umum', label: 'Umum', icon: faSliders },
    { key: 'info', label: 'Info Sistem', icon: faCircleInfo },
  ]

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/20 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Pengaturan</h1>
          <p className="text-brand-muted text-xs mt-0.5">Konfigurasi sistem, integrasi, dan template pesan</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-full bg-brand-light border border-brand-muted/20 flex items-center justify-center text-brand-muted">
            <FontAwesomeIcon icon={faBell} />
          </button>
          <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">A</div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full">
        {/* Section tabs */}
        <div className="flex gap-2 flex-wrap mb-8 bg-brand-light border border-brand-muted/15 rounded-[12px] p-2">
          {SECTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`sec-tab${activeSection === key ? ' active' : ''}`}
            >
              <FontAwesomeIcon icon={icon} className="mr-1.5 text-sm" />{label}
            </button>
          ))}
        </div>

        {/* === ONESENDER === */}
        {activeSection === 'onesender' && (
          <div className="flex flex-col gap-6">
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <h2 className="font-bold text-brand-dark text-base mb-1">Konfigurasi API</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Konfigurasi API OneSender untuk WhatsApp otomatis.</p>
                </div>
                <div className="flex-1 flex flex-col gap-5">
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div>
                      <div className="font-semibold text-sm text-brand-dark">Enable WA API</div>
                      <div className="text-xs text-brand-muted mt-0.5">Aktifkan pengiriman pesan WhatsApp otomatis</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.onesender_enabled === 'true'} onChange={e => set('onesender_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Link API OneSender</label>
                    <input type="url" value={settings.onesender_url ?? ''} onChange={e => set('onesender_url', e.target.value)} className="inp" placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">API Key</label>
                    <input type="password" value={settings.onesender_api_key ?? ''} onChange={e => set('onesender_api_key', e.target.value)} className="inp" placeholder="sk_live_..." />
                  </div>
                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    <button onClick={() => handleSave(['onesender_enabled', 'onesender_url', 'onesender_api_key'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
                      <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Pengaturan
                    </button>
                    <button className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors">
                      <FontAwesomeIcon icon={faPaperPlane} /> Test API
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pesan Pertama */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <h2 className="font-bold text-brand-dark text-base mb-1">Pesan Pertama</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Template pesan yang dikirim otomatis saat pesanan baru masuk.</p>
                  <div className="mt-3 p-3 bg-brand-accent-light/60 rounded-[8px] border border-brand-accent/20">
                    <p className="text-xs text-brand-text-dark/70 font-medium mb-1">Variabel tersedia:</p>
                    <div className="flex flex-col gap-1 text-xs font-mono text-brand-surface">
                      <span>{'{{nama}}'}</span>
                      <span>{'{{nomor_pesanan}}'}</span>
                      <span>{'{{produk}}'}</span>
                      <span>{'{{total}}'}</span>
                      <span>{'{{tanggal_kirim}}'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Pesan</label>
                    <textarea
                      value={settings.msg_first ?? `Halo Kak {{nama}}, 👋\n\nTerima kasih telah memesan kurban di *Beyond Qurban* 🐑\n\nBerikut detail pesanan Anda:\n📋 No. Pesanan: *{{nomor_pesanan}}*\n🐑 Produk: {{produk}}\n💰 Total: *{{total}}*\n🚚 Jadwal Kirim: {{tanggal_kirim}}\n\nSegera selesaikan pembayaran Anda ya, Kak!\n\n_Beyond Qurban — Amanah & Berkualitas_`}
                      onChange={e => set('msg_first', e.target.value)}
                      className="inp"
                      rows={10}
                      style={{ height: 'auto' }}
                    />
                  </div>
                  {/* WA Preview */}
                  <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                    <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                    </div>
                    <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                      <p className="text-xs text-brand-text-dark whitespace-pre-line">
                        {(settings.msg_first ?? '').replace('{{nama}}', 'Ahmad').replace('{{nomor_pesanan}}', 'BQ-2025-001').replace('{{produk}}', 'Domba Garut').replace('{{total}}', 'Rp 3.500.000').replace('{{tanggal_kirim}}', '14 Juni 2025')}
                      </p>
                      <div className="text-[10px] text-brand-muted text-right mt-1">✓✓</div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleSave(['msg_first'])}
                      disabled={isPending}
                      className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Template
                    </button>
                    <button className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors">
                      <FontAwesomeIcon icon={faEye} /> Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pesan Follow Up */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <h2 className="font-bold text-brand-dark text-base mb-1">Pesan Follow Up</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Template pesan follow up untuk mengingatkan pelanggan yang belum membayar.</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kirim otomatis setelah</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.followup_hours ?? '6'}
                        onChange={e => set('followup_hours', e.target.value)}
                        className="inp"
                        style={{ width: 72 }}
                        min={1} max={48}
                      />
                      <span className="text-sm text-brand-muted">jam</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.followup_enabled !== 'false'}
                          onChange={e => set('followup_enabled', e.target.checked ? 'true' : 'false')}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <span className="text-xs text-brand-dark font-medium">Aktifkan auto follow up</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Follow Up</label>
                    <textarea
                      value={settings.msg_followup ?? `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa pesanan kurban Anda *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n⏰ *Batas waktu: 24 jam sejak pemesanan*\n\nNominal tepat: *{{total}}*\n\nTerima kasih, semoga dimudahkan 🤲\n\n_Beyond Qurban_`}
                      onChange={e => set('msg_followup', e.target.value)}
                      className="inp"
                      rows={10}
                      style={{ height: 'auto' }}
                    />
                  </div>
                  {/* WA Preview */}
                  <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                    <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                    </div>
                    <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                      <p className="text-xs text-brand-text-dark whitespace-pre-line">
                        {(settings.msg_followup ?? '').replace('{{nama}}', 'Ahmad').replace('{{nomor_pesanan}}', 'BQ-2025-001').replace('{{total}}', 'Rp 3.500.000')}
                      </p>
                      <div className="text-[10px] text-brand-muted text-right mt-1">✓✓</div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleSave(['msg_followup', 'followup_hours', 'followup_enabled'])}
                      disabled={isPending}
                      className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TRIPAY === */}
        {activeSection === 'tripay' && (
          <div className="flex flex-col gap-6">

            {/* Konfigurasi Tripay card */}
            <div className="setting-card">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-bold text-brand-dark text-base mb-1">Konfigurasi Tripay</h2>
                  <p className="text-sm text-brand-muted">Masukkan kredensial Tripay untuk mengaktifkan payment gateway.</p>
                  <a href="https://tripay.co.id/register" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-surface font-semibold hover:text-brand-accent flex items-center gap-1 mt-1">
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" /> Daftar akun Tripay sekarang
                  </a>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings.tripay_mode === 'production' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {settings.tripay_mode === 'production' ? 'LIVE' : 'SANDBOX'}
                </span>
              </div>

              {/* Mode selector */}
              <div className="mb-5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-1">Tripay Mode</label>
                <p className="text-xs text-brand-muted mb-3">Gunakan mode Sandbox untuk uji coba dan LIVE jika sistem sudah berjalan.</p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => set('tripay_mode', 'sandbox')}
                    className={`radio-mode${settings.tripay_mode !== 'production' ? ' selected' : ''}`}
                  >
                    <div className="dot" /> Sandbox
                  </button>
                  <button
                    onClick={() => set('tripay_mode', 'production')}
                    className={`radio-mode${settings.tripay_mode === 'production' ? ' selected' : ''}`}
                  >
                    <div className="dot" /> LIVE (Production)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* API Key */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      Tripay API Key — {settings.tripay_mode === 'production' ? 'Production' : 'Sandbox'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(p => ({ ...p, apiKey: !p.apiKey }))}
                      className="text-brand-surface text-xs font-semibold hover:text-brand-accent"
                    >
                      {showKeys.apiKey ? 'hide' : 'show'}
                    </button>
                  </div>
                  <input
                    type={showKeys.apiKey ? 'text' : 'password'}
                    value={settings.tripay_api_key ?? ''}
                    onChange={e => set('tripay_api_key', e.target.value)}
                    className="inp"
                    placeholder="DEV-..."
                  />
                </div>

                {/* Private Key */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      Tripay Private Key — {settings.tripay_mode === 'production' ? 'Production' : 'Sandbox'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeys(p => ({ ...p, privKey: !p.privKey }))}
                      className="text-brand-surface text-xs font-semibold hover:text-brand-accent"
                    >
                      {showKeys.privKey ? 'hide' : 'show'}
                    </button>
                  </div>
                  <input
                    type={showKeys.privKey ? 'text' : 'password'}
                    value={settings.tripay_private_key ?? ''}
                    onChange={e => set('tripay_private_key', e.target.value)}
                    className="inp"
                    placeholder="xxxxx-xxxxx-xxxxx"
                  />
                </div>

                {/* Merchant Code */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Kode Merchant — {settings.tripay_mode === 'production' ? 'Production' : 'Sandbox'}
                  </label>
                  <input
                    type="text"
                    value={settings.tripay_merchant_code ?? ''}
                    onChange={e => set('tripay_merchant_code', e.target.value)}
                    className="inp"
                    placeholder="T12345"
                  />
                </div>

                {/* Callback URL */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">URL Callback</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'}/api/tripay/callback`}
                      className="inp flex-1 bg-brand-light text-brand-muted cursor-default"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'}/api/tripay/callback`).catch(() => {})}
                      className="flex items-center gap-1.5 px-4 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-surface hover:bg-brand-surface hover:text-white transition-colors bg-white shrink-0"
                    >
                      <FontAwesomeIcon icon={faCopy} /> Copy
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={() => handleSave(['tripay_api_key', 'tripay_private_key', 'tripay_merchant_code', 'tripay_mode'])}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Pengaturan
                  </button>
                  <button className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faPlugCircleCheck} /> Test Koneksi
                  </button>
                </div>
              </div>
            </div>

            {/* Channel Pembayaran card */}
            <div className="setting-card">
              <h2 className="font-bold text-brand-dark text-base mb-1">Channel Pembayaran</h2>
              <p className="text-sm text-brand-muted mb-5">Pilih channel pembayaran yang aktif ditampilkan ke pelanggan.</p>

              {/* Virtual Account */}
              <div className="mb-5">
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Virtual Account</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'BCA', label: 'BCA Virtual Account', sub: 'Transfer Bank BCA', abbr: 'BCA', color: 'text-blue-700' },
                    { key: 'Mandiri', label: 'Mandiri Virtual Account', sub: 'Transfer Bank Mandiri', abbr: 'MNR', color: 'text-yellow-700' },
                    { key: 'BNI', label: 'BNI Virtual Account', sub: 'Transfer Bank BNI', abbr: 'BNI', color: 'text-orange-600' },
                    { key: 'BRI', label: 'BRI Virtual Account', sub: 'Transfer Bank BRI', abbr: 'BRI', color: 'text-blue-500', defaultOff: true },
                  ].map(({ key, label, sub, abbr, color, defaultOff }) => {
                    const settingKey = `ch_${key.toLowerCase()}`
                    const isOn = settings[settingKey] !== 'false' && !defaultOff || settings[settingKey] === 'true'
                    return (
                      <div key={key} className={`channel-card${isOn ? ' on' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-brand-light rounded-[8px] border border-brand-muted/15 flex items-center justify-center font-bold text-xs ${color}`}>{abbr}</div>
                          <div><div className="font-semibold text-sm text-brand-dark">{label}</div><div className="text-xs text-brand-muted">{sub}</div></div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" checked={isOn} onChange={e => set(settingKey, e.target.checked ? 'true' : 'false')} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* E-Wallet */}
              <div className="mb-5">
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">E-Wallet</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'qris', label: 'QRIS', sub: 'Semua e-wallet mendukung QRIS', abbr: 'QRIS', bg: 'bg-[#00AED6]/10', color: 'text-[#00AED6]' },
                    { key: 'ovo', label: 'OVO', sub: 'E-wallet OVO', abbr: 'OVO', bg: 'bg-[#4C3494]/10', color: 'text-[#4C3494]' },
                    { key: 'dana', label: 'DANA', sub: 'E-wallet DANA', abbr: 'DANA', bg: 'bg-[#108EE9]/10', color: 'text-[#108EE9]' },
                    { key: 'shopeepay', label: 'ShopeePay', sub: 'E-wallet ShopeePay', abbr: 'SPay', bg: 'bg-[#EE4D2D]/10', color: 'text-[#EE4D2D]', defaultOff: true },
                  ].map(({ key, label, sub, abbr, bg, color, defaultOff }) => {
                    const settingKey = `ch_${key}`
                    const isOn = settings[settingKey] !== 'false' && !defaultOff || settings[settingKey] === 'true'
                    return (
                      <div key={key} className={`channel-card${isOn ? ' on' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${bg} rounded-[8px] border border-brand-muted/15 flex items-center justify-center font-bold text-xs ${color}`}>{abbr}</div>
                          <div><div className="font-semibold text-sm text-brand-dark">{label}</div><div className="text-xs text-brand-muted">{sub}</div></div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" checked={isOn} onChange={e => set(settingKey, e.target.checked ? 'true' : 'false')} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ritel & Lainnya */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Ritel &amp; Lainnya</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'alfamart', label: 'Alfamart', sub: 'Bayar di gerai Alfamart', abbr: 'Alfa', bg: 'bg-orange-50', color: 'text-orange-500' },
                    { key: 'indomaret', label: 'Indomaret', sub: 'Bayar di gerai Indomaret', abbr: 'Indo', bg: 'bg-red-50', color: 'text-red-500', defaultOff: true },
                  ].map(({ key, label, sub, abbr, bg, color, defaultOff }) => {
                    const settingKey = `ch_${key}`
                    const isOn = settings[settingKey] !== 'false' && !defaultOff || settings[settingKey] === 'true'
                    return (
                      <div key={key} className={`channel-card${isOn ? ' on' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${bg} rounded-[8px] border border-brand-muted/15 flex items-center justify-center font-bold text-xs ${color}`}>{abbr}</div>
                          <div><div className="font-semibold text-sm text-brand-dark">{label}</div><div className="text-xs text-brand-muted">{sub}</div></div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" checked={isOn} onChange={e => set(settingKey, e.target.checked ? 'true' : 'false')} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleSave(Object.keys(settings).filter(k => k.startsWith('ch_')))}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Perubahan
                </button>
              </div>
            </div>

            {/* Manual Transfer Config */}
            <div className="setting-card">
              <h2 className="font-bold text-brand-dark text-base mb-1">Transfer Manual</h2>
              <p className="text-sm text-brand-muted mb-5">Tambahkan opsi transfer langsung ke rekening bank tanpa melalui Tripay.</p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                  <div>
                    <div className="font-semibold text-sm text-brand-dark">Aktifkan Transfer Manual</div>
                    <div className="text-xs text-brand-muted mt-0.5">Tampilkan opsi ini di form checkout</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.manual_transfer_enabled === 'true'} onChange={e => set('manual_transfer_enabled', e.target.checked ? 'true' : 'false')} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Nama Bank</label>
                    <input type="text" value={settings.manual_bank_name ?? ''} onChange={e => set('manual_bank_name', e.target.value)} className="inp" placeholder="Bank BCA" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Nomor Rekening</label>
                    <input type="text" value={settings.manual_bank_number ?? ''} onChange={e => set('manual_bank_number', e.target.value)} className="inp" placeholder="1234567890" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Atas Nama</label>
                    <input type="text" value={settings.manual_bank_owner ?? ''} onChange={e => set('manual_bank_owner', e.target.value)} className="inp" placeholder="Yayasan One Ummah" />
                  </div>
                </div>

                <button
                  onClick={() => handleSave(['manual_transfer_enabled', 'manual_bank_name', 'manual_bank_number', 'manual_bank_owner'])}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === UMUM === */}
        {activeSection === 'umum' && (
          <div className="setting-card flex flex-col gap-5">
            <h2 className="font-bold text-brand-dark text-base">Pengaturan Umum</h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Nama Toko</label>
              <input type="text" value={settings.store_name ?? ''} onChange={e => set('store_name', e.target.value)} className="inp" placeholder="Beyond Qurban" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Nomor WhatsApp CS</label>
              <input type="text" value={settings.store_whatsapp ?? ''} onChange={e => set('store_whatsapp', e.target.value)} className="inp" placeholder="6281234567890" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Email</label>
              <input type="email" value={settings.store_email ?? ''} onChange={e => set('store_email', e.target.value)} className="inp" placeholder="info@beyondqurban.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Alamat</label>
              <input type="text" value={settings.store_address ?? ''} onChange={e => set('store_address', e.target.value)} className="inp" placeholder="Jl. Contoh No. 1, Bandung" />
            </div>
            <button onClick={() => handleSave(['store_name', 'store_whatsapp', 'store_email', 'store_address'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan
            </button>
          </div>
        )}

        {/* === PIXEL & TRACKING === */}
        {activeSection === 'pixel' && (
          <div className="flex flex-col gap-6">

            {/* Facebook / Meta Pixel */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#1877F2] flex items-center justify-center">
                      <FontAwesomeIcon icon={faFacebookF} className="text-white text-sm" />
                    </div>
                    <h2 className="font-bold text-brand-dark text-base">Facebook / Meta Pixel</h2>
                  </div>
                  <p className="text-brand-muted text-sm leading-relaxed">Tambahkan satu atau beberapa Pixel ID untuk tracking konversi dan remarketing di Meta Ads.</p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-[8px] text-xs text-blue-700">
                    <FontAwesomeIcon icon={faCircleInfo} className="mr-1" />Gunakan Secret Token untuk Conversions API (server-side tracking).
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  {/* Pixel #1 */}
                  <div className="flex flex-col gap-3 p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Pixel #1</span>
                      <button className="text-red-400 hover:text-red-600 text-sm"><FontAwesomeIcon icon={faMinus} /></button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Pixel ID</label>
                        <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                      </div>
                      <input type="text" value={settings.fb_pixel_id ?? ''} onChange={e => set('fb_pixel_id', e.target.value)} className="inp" placeholder="8676065248B3158" />
                      <p className="text-xs text-brand-muted">Temukan di Meta Business Suite → Events Manager → Pixel</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Secret Token</label>
                          <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                        </div>
                        <button type="button" onClick={() => setShowKeys(p => ({ ...p, fbToken: !p.fbToken }))} className="text-brand-surface text-xs font-semibold hover:text-brand-accent">
                          {(showKeys as any).fbToken ? 'hide' : 'show'}
                        </button>
                      </div>
                      <input type={(showKeys as any).fbToken ? 'text' : 'password'} value={settings.fb_secret_token ?? ''} onChange={e => set('fb_secret_token', e.target.value)} className="inp" placeholder="••••••••••••••••" />
                      <p className="text-xs text-brand-muted">Untuk Conversions API → server-side event tracking</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Test Event Code</label>
                        <span className="text-[10px] bg-brand-muted/20 text-brand-muted px-1.5 py-0.5 rounded font-bold">Opsional</span>
                      </div>
                      <input type="text" value={settings.fb_test_code ?? ''} onChange={e => set('fb_test_code', e.target.value)} className="inp" placeholder="TEST54184" />
                      <p className="text-xs text-brand-muted">Hanya untuk testing — kosongkan saat LIVE</p>
                    </div>
                  </div>

                  {/* Add pixel button */}
                  <button className="flex items-center gap-2 text-brand-surface font-bold text-sm border-2 border-dashed border-brand-surface/30 hover:border-brand-surface px-4 py-2.5 rounded-[8px] transition-colors w-fit">
                    <FontAwesomeIcon icon={faPlus} /> Tambah Pixel ID
                  </button>

                  {/* Event Mapping */}
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-3">Event Mapping per Halaman</label>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Page Campaign', sub: 'qurban-penyaluran.html', key: 'fb_event_campaign', options: ['ViewContent', 'PageView', 'Lead', 'Purchase', 'Donate', 'AddToCart', 'InitiateCheckout'], default: 'ViewContent' },
                        { label: 'Page Form / Checkout', sub: 'Checkout _ Form P.html', key: 'fb_event_checkout', options: ['AddToCart', 'InitiateCheckout', 'Lead', 'ViewContent'], default: 'AddToCart' },
                        { label: 'Page Invoice / Pembayaran', sub: 'Detail pembayaran', key: 'fb_event_payment', options: ['Purchase', 'InitiateCheckout', 'Lead'], default: 'Purchase' },
                        { label: 'Page Sukses Pembayaran', sub: 'Setelah konfirmasi bayar', key: 'fb_event_success', options: ['Donate', 'Purchase', 'Lead', 'CompleteRegistration'], default: 'Donate' },
                      ].map(({ label, sub, key, options, default: def }) => (
                        <div key={key} className="grid grid-cols-2 items-center gap-3 p-3 bg-brand-light rounded-[8px] border border-brand-muted/10">
                          <div>
                            <div className="text-sm font-semibold text-brand-dark">{label}</div>
                            <div className="text-xs text-brand-muted">{sub}</div>
                          </div>
                          <select
                            value={settings[key] ?? def}
                            onChange={e => set(key, e.target.value)}
                            className="inp"
                            style={{ height: 38, fontSize: '.8rem' }}
                          >
                            {options.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSave(['fb_pixel_id', 'fb_secret_token', 'fb_test_code', 'fb_event_campaign', 'fb_event_checkout', 'fb_event_payment', 'fb_event_success'])}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Pengaturan Pixel
                  </button>
                </div>
              </div>
            </div>

            {/* TikTok Pixel */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-[8px] bg-black flex items-center justify-center">
                      <FontAwesomeIcon icon={faTiktok} className="text-white text-sm" />
                    </div>
                    <h2 className="font-bold text-brand-dark text-base">TikTok Pixel</h2>
                  </div>
                  <p className="text-brand-muted text-sm leading-relaxed">Pasang TikTok Pixel untuk mengukur performa iklan dan membuat custom audience di TikTok Ads.</p>
                  <div className="mt-3 p-3 bg-brand-light border border-brand-muted/10 rounded-[8px] text-xs text-brand-muted">
                    <FontAwesomeIcon icon={faCircleInfo} className="mr-1 text-brand-accent" />Pixel ID tersedia di TikTok Ads Manager → Assets → Events.
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div className="font-semibold text-sm text-brand-dark">Aktifkan TikTok Pixel</div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.tiktok_enabled !== 'false'} onChange={e => set('tiktok_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Pixel ID</label>
                      <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                    </div>
                    <input type="text" value={settings.tiktok_pixel_id ?? ''} onChange={e => set('tiktok_pixel_id', e.target.value)} className="inp" placeholder="CO5GPMRC77UDHQA4UGI0" />
                    <p className="text-xs text-brand-muted mt-0.5">Format: 20 karakter alfanumerik</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleSave(['tiktok_enabled', 'tiktok_pixel_id'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
                      <FontAwesomeIcon icon={faFloppyDisk} /> Simpan
                    </button>
                    <button className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors">
                      <FontAwesomeIcon icon={faPlugCircleCheck} /> Test Pixel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Tag Manager */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#246FDB] flex items-center justify-center font-bold text-white text-xs">GTM</div>
                    <h2 className="font-bold text-brand-dark text-base">Google Tag Manager</h2>
                  </div>
                  <p className="text-brand-muted text-sm leading-relaxed">Pasang GTM Container ID untuk mengelola semua tag tracking dari satu dashboard tanpa ubah kode.</p>
                  <div className="mt-3 p-3 bg-brand-light border border-brand-muted/10 rounded-[8px] text-xs text-brand-muted">
                    <FontAwesomeIcon icon={faCircleInfo} className="mr-1 text-brand-accent" />GTM ID tersedia di tagmanager.google.com, format: GTM-XXXXXXX.
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div className="font-semibold text-sm text-brand-dark">Aktifkan Google Tag Manager</div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.gtm_enabled !== 'false'} onChange={e => set('gtm_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">GTM Container ID</label>
                      <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                    </div>
                    <input type="text" value={settings.gtm_id ?? ''} onChange={e => set('gtm_id', e.target.value)} className="inp" placeholder="GTM-XXXXXXX" />
                    <p className="text-xs text-brand-muted mt-0.5">Format: GTM- diikuti 7 karakter</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Google Analytics 4 (Opsional)</label>
                    <input type="text" value={settings.ga4_id ?? ''} onChange={e => set('ga4_id', e.target.value)} className="inp" placeholder="G-XXXXXXXXXX" />
                    <p className="text-xs text-brand-muted mt-0.5">Jika sudah dikelola via GTM, kosongkan field ini.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleSave(['gtm_enabled', 'gtm_id', 'ga4_id'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
                      <FontAwesomeIcon icon={faFloppyDisk} /> Simpan
                    </button>
                    <button className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors">
                      <FontAwesomeIcon icon={faPlugCircleCheck} /> Test GTM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === MANAJEMEN DISKON === */}
        {activeSection === 'diskon' && (
          <div className="flex flex-col gap-6">

            {/* Diskon Global */}
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <h2 className="font-bold text-brand-dark text-base mb-1">Diskon Global</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Aktifkan diskon untuk semua produk sekaligus dengan periode tertentu.</p>
                </div>
                <div className="flex-1 flex flex-col gap-5">
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div>
                      <div className="font-semibold text-sm text-brand-dark">Aktifkan Diskon Global</div>
                      <div className="text-xs text-brand-muted mt-0.5">Terapkan diskon ke semua produk</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.diskon_global_enabled === 'true'} onChange={e => set('diskon_global_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {/* Tipe Diskon */}
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-3">Tipe Diskon</label>
                    <div className="flex gap-3">
                      <button onClick={() => set('diskon_type', 'persen')} className={`radio-mode${(settings.diskon_type ?? 'persen') === 'persen' ? ' selected' : ''}`}>
                        <div className="dot" /> Persentase (%)
                      </button>
                      <button onClick={() => set('diskon_type', 'nominal')} className={`radio-mode${settings.diskon_type === 'nominal' ? ' selected' : ''}`}>
                        <div className="dot" /> Nominal (Rp)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">
                        {settings.diskon_type === 'nominal' ? 'Besar Diskon (Rp)' : 'Besar Diskon (%)'}
                      </label>
                      <div className="relative">
                        <input type="number" value={settings.diskon_value ?? '10'} onChange={e => set('diskon_value', e.target.value)} className="inp pr-10" placeholder="10" min="0" max={settings.diskon_type === 'nominal' ? undefined : 100} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-bold">
                          {settings.diskon_type === 'nominal' ? '' : '%'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Tanggal Mulai</label>
                      <input type="date" value={settings.diskon_start ?? ''} onChange={e => set('diskon_start', e.target.value)} className="inp" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Tanggal Berakhir</label>
                      <input type="date" value={settings.diskon_end ?? ''} onChange={e => set('diskon_end', e.target.value)} className="inp" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div>
                      <div className="font-semibold text-sm text-brand-dark">Tampilkan Banner Diskon</div>
                      <div className="text-xs text-brand-muted mt-0.5">Tampilkan banner promo di homepage</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.diskon_banner_enabled !== 'false'} onChange={e => set('diskon_banner_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Teks Banner</label>
                    <input type="text" value={settings.diskon_banner_text ?? '🎯 Promo Idul Adha — Diskon 10% untuk semua hewan kurban!'} onChange={e => set('diskon_banner_text', e.target.value)} className="inp" placeholder="🎯 Promo Idul Adha..." />
                  </div>

                  <button onClick={() => handleSave(['diskon_global_enabled','diskon_type','diskon_value','diskon_start','diskon_end','diskon_banner_enabled','diskon_banner_text'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
                    <FontAwesomeIcon icon={faFloppyDisk} /> Simpan
                  </button>
                </div>
              </div>
            </div>

            {/* Harga & Diskon Penyaluran */}
            <div className="setting-card">
              <h2 className="font-bold text-brand-dark text-base mb-1">Harga &amp; Diskon Penyaluran</h2>
              <p className="text-sm text-brand-muted mb-5">Atur harga dan diskon per destinasi <span className="text-brand-surface font-semibold">program penyaluran qurban</span>.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Destinasi', 'Harga Normal', 'Diskon (%)', 'Harga Akhir', 'Aktif'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: '🇮🇩', label: 'Pedalaman Indonesia', priceKey: 'penyaluran_harga_indonesia', discKey: 'penyaluran_disc_indonesia', defaultPrice: '1900000' },
                      { flag: '🌍', label: 'Afrika Sub-Sahara', priceKey: 'penyaluran_harga_africa', discKey: 'penyaluran_disc_africa', defaultPrice: '2500000' },
                      { flag: '🇵🇸', label: 'Palestina', priceKey: 'penyaluran_harga_palestine', discKey: 'penyaluran_disc_palestine', defaultPrice: '1900000' },
                    ].map(({ flag, label, priceKey, discKey, defaultPrice }) => {
                      const price = parseInt(settings[priceKey] ?? defaultPrice)
                      const disc = parseInt(settings[discKey] ?? '0')
                      const final = Math.round(price * (1 - disc / 100))
                      return (
                        <tr key={label} className="border-b border-brand-muted/8">
                          <td className="px-4 py-3 font-medium text-sm">{flag} {label}</td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs">Rp</span>
                              <input type="number" value={settings[priceKey] ?? defaultPrice} onChange={e => set(priceKey, e.target.value)} className="inp pl-8 text-sm" style={{ height: 36 }} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input type="number" value={settings[discKey] ?? '0'} onChange={e => set(discKey, e.target.value)} className="inp text-sm" style={{ height: 36, width: 80 }} min={0} max={100} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted text-xs">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-brand-accent text-sm">
                            Rp {final.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            <label className="toggle" style={{ width: 40, height: 22 }}>
                              <input type="checkbox" defaultChecked />
                              <span className="toggle-slider" />
                            </label>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => handleSave(['penyaluran_harga_indonesia','penyaluran_disc_indonesia','penyaluran_harga_africa','penyaluran_disc_africa','penyaluran_harga_palestine','penyaluran_disc_palestine'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Perubahan
                </button>
              </div>
            </div>

            {/* Diskon Per Kategori Hewan */}
            <div className="setting-card">
              <h2 className="font-bold text-brand-dark text-base mb-1">Diskon Per Kategori Hewan</h2>
              <p className="text-sm text-brand-muted mb-5">Atur diskon berbeda untuk setiap jenis hewan kurban.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Kategori', 'Diskon (%)', 'Berlaku Hingga', 'Aktif'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Sapi', discKey: 'disc_sapi', defaultDisc: '5' },
                      { label: 'Kambing', discKey: 'disc_kambing', defaultDisc: '0' },
                      { label: 'Domba', discKey: 'disc_domba', defaultDisc: '10' },
                      { label: 'Unta', discKey: 'disc_unta', defaultDisc: '0' },
                    ].map(({ label, discKey, defaultDisc }) => (
                      <tr key={label} className="border-b border-brand-muted/8">
                        <td className="px-4 py-3 font-medium text-sm text-brand-dark">{label}</td>
                        <td className="px-4 py-3">
                          <input type="number" value={settings[discKey] ?? defaultDisc} onChange={e => set(discKey, e.target.value)} className="inp text-sm" style={{ height: 36, width: 80 }} min={0} max={100} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="date" value={settings[`${discKey}_until`] ?? ''} onChange={e => set(`${discKey}_until`, e.target.value)} className="inp text-sm" style={{ height: 36, width: 160 }} />
                        </td>
                        <td className="px-4 py-3">
                          <label className="toggle" style={{ width: 40, height: 22 }}>
                            <input type="checkbox" defaultChecked={parseInt(settings[discKey] ?? defaultDisc) > 0} />
                            <span className="toggle-slider" />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => handleSave(['disc_sapi','disc_kambing','disc_domba','disc_unta'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Perubahan
                </button>
              </div>
            </div>

            {/* Kode Voucher / Kupon */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-brand-dark text-base mb-0.5">Kode Voucher / Kupon</h2>
                  <p className="text-sm text-brand-muted">Kelola kode diskon yang bisa digunakan <span className="text-brand-surface font-semibold">pelanggan</span> saat checkout.</p>
                </div>
                <button onClick={() => setVoucherModal(true)} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-4 py-2 rounded-[8px] shadow-premium hover:scale-[1.02] transition-transform">
                  <FontAwesomeIcon icon={faPlus} /> Tambah Voucher
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Kode', 'Diskon', 'Min. Pembelian', 'Maks. Pakai', 'Terpakai', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v, i) => (
                      <tr key={i} className="border-b border-brand-muted/8 hover:bg-brand-light/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-sm text-brand-surface">{v.code}</td>
                        <td className="px-4 py-3 text-sm font-bold text-brand-accent">{v.disc}%</td>
                        <td className="px-4 py-3 text-sm text-brand-muted">Rp {v.minBuy.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-sm text-brand-muted">{v.maxUse}x</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={v.used >= v.maxUse ? 'text-red-500 font-bold' : 'text-brand-dark'}>
                            {v.used}
                          </span>
                          <span className="text-brand-muted">/{v.maxUse}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-[20px] ${v.used >= v.maxUse ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                            {v.used >= v.maxUse ? 'Habis' : 'Aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setVouchers(prev => prev.filter((_, idx) => idx !== i))} className="w-8 h-8 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-[7px] flex items-center justify-center border border-red-100 transition-colors">
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vouchers.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-brand-muted">Belum ada voucher</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === INFO SISTEM === */}
        {activeSection === 'info' && (
          <div className="setting-card text-center py-16">
            <div className="text-4xl mb-4 opacity-30">⚙️</div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">Info Sistem</h3>
            <p className="text-brand-muted text-sm">Fitur ini akan tersedia segera.</p>
          </div>
        )}

        {/* Voucher Modal */}
        {voucherModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setVoucherModal(false) }}>
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/10">
                <h3 className="font-serif text-lg font-bold text-brand-dark">Tambah Voucher Baru</h3>
                <button onClick={() => setVoucherModal(false)} className="text-brand-muted hover:text-brand-dark">
                  <FontAwesomeIcon icon={faMinus} className="text-lg" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Kode Voucher *</label>
                    <input type="text" value={newVoucher.code} onChange={e => setNewVoucher(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="inp" placeholder="IDULADHA25" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Diskon (%)</label>
                    <input type="number" value={newVoucher.disc} onChange={e => setNewVoucher(p => ({ ...p, disc: parseInt(e.target.value) || 0 }))} className="inp" placeholder="10" min={1} max={100} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Min. Pembelian (Rp)</label>
                    <input type="number" value={newVoucher.minBuy || ''} onChange={e => setNewVoucher(p => ({ ...p, minBuy: parseInt(e.target.value) || 0 }))} className="inp" placeholder="2000000" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Maks. Penggunaan</label>
                    <input type="number" value={newVoucher.maxUse || ''} onChange={e => setNewVoucher(p => ({ ...p, maxUse: parseInt(e.target.value) || 0 }))} className="inp" placeholder="100" />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setVoucherModal(false)} className="flex-1 py-2.5 border border-brand-muted/20 rounded-[8px] text-sm font-medium text-brand-muted hover:bg-brand-light">Batal</button>
                <button
                  onClick={() => {
                    if (newVoucher.code) {
                      setVouchers(prev => [...prev, { ...newVoucher, used: 0 }])
                      setNewVoucher({ code: '', disc: 10, minBuy: 0, maxUse: 100 })
                      setVoucherModal(false)
                    }
                  }}
                  className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} /> Tambah Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <FontAwesomeIcon icon={faFloppyDisk} className="text-brand-accent" />
        {toast.msg}
      </div>
    </>
  )
}
