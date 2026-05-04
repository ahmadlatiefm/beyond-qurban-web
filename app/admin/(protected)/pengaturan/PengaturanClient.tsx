'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk, faRotateLeft, faPaperPlane, faCreditCard,
  faTag, faCode, faSliders, faCircleInfo, faBell, faEye,
  faCopy, faPlugCircleCheck, faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faWhatsapp as faWhatsappPrev } from '@fortawesome/free-brands-svg-icons'
import { saveSettings } from '@/lib/actions/settings'

type SectionKey = 'onesender' | 'tripay' | 'diskon' | 'pixel' | 'umum' | 'info'

export default function PengaturanClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [activeSection, setActiveSection] = useState<SectionKey>('onesender')
  const [settings, setSettings] = useState(initialSettings)
  const [showKeys, setShowKeys] = useState({ apiKey: false, privKey: false })
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

        {/* === OTHER SECTIONS === */}
        {['diskon', 'pixel', 'info'].includes(activeSection) && (
          <div className="setting-card text-center py-16">
            <div className="text-4xl mb-4 opacity-30">⚙️</div>
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">
              {activeSection === 'diskon' ? 'Manajemen Diskon' : activeSection === 'pixel' ? 'Pixel & Tracking' : 'Info Sistem'}
            </h3>
            <p className="text-brand-muted text-sm">Fitur ini akan tersedia segera.</p>
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
