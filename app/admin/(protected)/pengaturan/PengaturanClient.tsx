'use client'
import { useState, useTransition } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk, faRotateLeft, faPaperPlane, faCreditCard,
  faTag, faCode, faSliders, faCircleInfo, faBell, faEye,
  faCopy, faPlugCircleCheck, faExternalLinkAlt,
  faMinus, faPlus, faTrash, faTruck, faQrcode, faImage, faLock,
} from '@fortawesome/free-solid-svg-icons'
import { DEFAULT_SHIPPING_ZONES } from '@/lib/shipping'
import type { ShippingZone } from '@/lib/shipping'
import { faWhatsapp, faWhatsapp as faWhatsappPrev, faFacebookF, faTiktok } from '@fortawesome/free-brands-svg-icons'
import { saveSettings, changePassword } from '@/lib/actions/settings'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'
import Link from 'next/link'
import { faCertificate } from '@fortawesome/free-solid-svg-icons'

type SectionKey = 'onesender' | 'tripay' | 'diskon' | 'pixel' | 'umum' | 'keamanan' | 'info'

// ─── Major Indonesian Banks ────────────────────────────────────────────────
const ID_BANKS = [
  { code: 'BCA',    name: 'Bank BCA',          abbr: 'BCA',  bg: '#003D86', text: '#FFFFFF' },
  { code: 'MNR',    name: 'Bank Mandiri',       abbr: 'MNR',  bg: '#003087', text: '#FFD700' },
  { code: 'BNI',    name: 'Bank BNI',           abbr: 'BNI',  bg: '#FF6600', text: '#FFFFFF' },
  { code: 'BRI',    name: 'Bank BRI',           abbr: 'BRI',  bg: '#00529B', text: '#FFFFFF' },
  { code: 'BSI',    name: 'Bank BSI',           abbr: 'BSI',  bg: '#007A52', text: '#FFFFFF' },
  { code: 'CIMB',   name: 'CIMB Niaga',         abbr: 'CIMB', bg: '#BE1E2D', text: '#FFFFFF' },
  { code: 'DNN',    name: 'Bank Danamon',        abbr: 'DNN',  bg: '#E40522', text: '#FFFFFF' },
  { code: 'PMT',    name: 'Bank Permata',        abbr: 'PMT',  bg: '#00A651', text: '#FFFFFF' },
  { code: 'BTN',    name: 'Bank BTN',            abbr: 'BTN',  bg: '#009A44', text: '#FFFFFF' },
  { code: 'MEGA',   name: 'Bank Mega',           abbr: 'MEGA', bg: '#1B1464', text: '#FFFFFF' },
  { code: 'OCBC',   name: 'Bank OCBC Indonesia', abbr: 'OCBC', bg: '#EE3124', text: '#FFFFFF' },
  { code: 'PANIN',  name: 'Bank Panin',          abbr: 'PANIN',bg: '#003399', text: '#FFFFFF' },
  { code: 'OTHER',  name: 'Bank Lainnya',        abbr: '🏦',   bg: '#6B7280', text: '#FFFFFF' },
]

interface ManualBankItem { id: string; code: string; name: string; number: string; owner: string }

function BankBadge({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' | 'lg' }) {
  const bank = ID_BANKS.find(b => b.code === code) ?? ID_BANKS[ID_BANKS.length - 1]
  const dim = size === 'sm' ? 'w-8 h-7 text-[9px]' : size === 'lg' ? 'w-14 h-12 text-xs' : 'w-11 h-9 text-[10px]'
  return (
    <div
      className={`${dim} rounded-[6px] flex items-center justify-center font-bold shrink-0 leading-none`}
      style={{ background: bank.bg, color: bank.text }}
    >
      {bank.abbr}
    </div>
  )
}

function ManualBanksEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [banks, setBanks] = useState<ManualBankItem[]>(() => {
    try { return JSON.parse(value) } catch { return [] }
  })
  const [showPresets, setShowPresets] = useState<number | null>(null)

  function update(newBanks: ManualBankItem[]) {
    setBanks(newBanks)
    onChange(JSON.stringify(newBanks))
  }

  function addBank() {
    const newId = Date.now().toString()
    update([...banks, { id: newId, code: 'BCA', name: 'Bank BCA', number: '', owner: 'Yayasan One Ummah' }])
  }

  function removeBank(idx: number) { update(banks.filter((_, i) => i !== idx)) }

  function updateBank(idx: number, partial: Partial<ManualBankItem>) {
    update(banks.map((b, i) => i === idx ? { ...b, ...partial } : b))
  }

  function pickPreset(idx: number, bankCode: string) {
    const preset = ID_BANKS.find(b => b.code === bankCode)
    if (preset) updateBank(idx, { code: preset.code, name: preset.name })
    setShowPresets(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {banks.map((bank, idx) => (
        <div key={bank.id} className="border border-brand-muted/20 rounded-[12px] overflow-hidden">
          {/* Bank header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-light border-b border-brand-muted/15">
            <BankBadge code={bank.code} />
            <div className="flex-1">
              <div className="font-bold text-sm text-brand-dark">{bank.name}</div>
              <div className="text-xs text-brand-muted">{bank.number || 'Nomor rekening belum diisi'}</div>
            </div>
            {/* Preset picker toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(showPresets === idx ? null : idx)}
                className="text-xs text-brand-surface font-bold border border-brand-surface/30 px-2.5 py-1 rounded-[6px] hover:bg-brand-surface hover:text-white transition-colors"
              >
                Ganti Bank
              </button>
              {showPresets === idx && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-brand-muted/20 rounded-[10px] shadow-premium z-20 w-64 overflow-hidden">
                  <div className="p-2 grid grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                    {ID_BANKS.map(preset => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => pickPreset(idx, preset.code)}
                        className={`flex items-center gap-2 px-2 py-2 rounded-[6px] text-left hover:bg-brand-light transition-colors ${bank.code === preset.code ? 'bg-brand-accent/10' : ''}`}
                      >
                        <BankBadge code={preset.code} size="sm" />
                        <span className="text-xs font-medium text-brand-dark truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => removeBank(idx)} className="text-red-400 hover:text-red-600 font-bold text-sm w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center">✕</button>
          </div>

          {/* Fields */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Nomor Rekening *</label>
              <input
                type="text"
                value={bank.number}
                onChange={e => updateBank(idx, { number: e.target.value })}
                className="inp text-sm"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Atas Nama *</label>
              <input
                type="text"
                value={bank.owner}
                onChange={e => updateBank(idx, { owner: e.target.value })}
                className="inp text-sm"
                placeholder="Yayasan One Ummah"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBank}
        className="py-3 border-2 border-dashed border-brand-muted/30 text-brand-muted hover:border-brand-surface hover:text-brand-surface rounded-[10px] text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} /> Tambah Bank Lainnya
      </button>

      {banks.length > 0 && (
        <p className="text-xs text-brand-muted">
          💡 Semua rekening di atas akan ditampilkan di halaman instruksi pembayaran
        </p>
      )}
    </div>
  )
}

export default function PengaturanClient({ initialSettings, adminEmail }: { initialSettings: Record<string, string>; adminEmail: string }) {
  const [activeSection, setActiveSection] = useState<SectionKey>('onesender')
  const [settings, setSettings] = useState(initialSettings)
  const [showKeys, setShowKeys] = useState({ apiKey: false, privKey: false, fbToken: false })
  const [voucherModal, setVoucherModal] = useState(false)
  // Load vouchers from DB (initialSettings.vouchers is JSON), fall back to demo data on first run
  const [vouchers, setVouchers] = useState<{ code: string; disc: number; minBuy: number; maxUse: number; used: number }[]>(() => {
    try {
      const parsed = JSON.parse(initialSettings.vouchers ?? '[]')
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return []
  })
  const [newVoucher, setNewVoucher] = useState({ code: '', disc: 10, minBuy: 0, maxUse: 100 })
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>(() => {
    try {
      const parsed = JSON.parse(initialSettings.shipping_zones ?? '[]')
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return DEFAULT_SHIPPING_ZONES
  })
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })
  const [qrisUploading, setQrisUploading] = useState(false)
  const [qrisUploadError, setQrisUploadError] = useState('')
  const [firstTab, setFirstTab] = useState<'product' | 'donation'>('product')
  const [followupTab, setFollowupTab] = useState<'product' | 'donation'>('product')
  const [testWaOpen, setTestWaOpen] = useState(false)
  const [testWaTo, setTestWaTo] = useState('')
  const [testWaSending, setTestWaSending] = useState(false)
  const [testWaResult, setTestWaResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwResult, setPwResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwResult(null)
    if (pwNew !== pwConfirm) {
      setPwResult({ ok: false, msg: 'Konfirmasi password tidak sama dengan password baru.' })
      return
    }
    if (pwNew.length < 8) {
      setPwResult({ ok: false, msg: 'Password baru minimal 8 karakter.' })
      return
    }
    setPwSubmitting(true)
    try {
      const res = await changePassword(pwOld, pwNew)
      if (res.success) {
        setPwResult({ ok: true, msg: 'Password berhasil diganti. Gunakan password baru di login berikutnya.' })
        setPwOld(''); setPwNew(''); setPwConfirm('')
      } else {
        setPwResult({ ok: false, msg: res.error || 'Gagal mengganti password.' })
      }
    } catch (err) {
      setPwResult({ ok: false, msg: err instanceof Error ? err.message : 'Gagal mengganti password.' })
    } finally {
      setPwSubmitting(false)
    }
  }

  async function handleTestWa() {
    setTestWaSending(true)
    setTestWaResult(null)
    try {
      const res = await fetch('/api/onesender/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testWaTo }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        setTestWaResult({ ok: true, msg: `Pesan test terkirim ke ${data.normalizedPhone ?? testWaTo}` })
      } else {
        setTestWaResult({ ok: false, msg: data.error || 'Gagal mengirim pesan test' })
      }
    } catch (err) {
      setTestWaResult({ ok: false, msg: err instanceof Error ? err.message : 'Gagal mengirim' })
    } finally {
      setTestWaSending(false)
    }
  }

  function showToast(msg: string) {
    setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 2800)
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisUploading(true)
    setQrisUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'qris')
      const res = await fetch('/api/media-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        set('manual_qris_image', data.url)
      } else {
        setQrisUploadError(data.error ?? 'Upload gagal')
      }
    } catch {
      setQrisUploadError('Upload gagal — coba lagi')
    } finally {
      setQrisUploading(false)
      e.target.value = ''
    }
  }

  function handleSave(sectionKeys: string[]) {
    const toSave: Record<string, string> = {}
    sectionKeys.forEach(k => { if (settings[k] !== undefined) toSave[k] = settings[k] })
    startTransition(async () => {
      await saveSettings(toSave)
      showToast('Pengaturan berhasil disimpan!')
    })
  }

  // Default templates
  const DEFAULT_FIRST_PRODUCT  = `Halo Kak {{nama}}, 👋\n\nTerima kasih telah memesan kurban di *Beyond Qurban* 🐑\n\nBerikut detail pesanan Anda:\n📋 No. Pesanan: *{{nomor_pesanan}}*\n🐑 Produk: {{produk}}\n💰 Total: *{{total}}*\n🚚 Jadwal Kirim: {{tanggal_kirim}}\n💳 Metode: {{metode_bayar}}\n🏦 Rekening: {{rekening}}\n\nSegera selesaikan pembayaran Anda ya, Kak!\n\n_Beyond Qurban — Amanah & Berkualitas_`
  const DEFAULT_FIRST_DONATION = `Halo Kak {{nama}}, 🤝\nJazakallah khairan telah berqurban melalui *Beyond Qurban* 🐑\n\nDetail donasi Anda:\n📋 No. Pesanan: *{{nomor_pesanan}}*\n🌍 Program: {{campaign}}\n🐑 Hewan: {{hewan}}\n👤 Atas Nama: {{atas_nama}}\n💰 Total: *{{total}}*\n💳 Metode: {{metode_bayar}}\n🏦 Rekening: {{rekening}}\n\nTim kami akan menghubungi setelah pembayaran dikonfirmasi. 🙏`
  const DEFAULT_FOLLOWUP_PRODUCT  = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa pesanan kurban Anda *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n⏰ *Batas waktu: 24 jam sejak pemesanan*\n\nNominal tepat: *{{total}}*\n\nTerima kasih, semoga dimudahkan 🤲\n\n_Beyond Qurban_`
  const DEFAULT_FOLLOWUP_DONATION = `Halo Kak {{nama}}, 😊\n\nKami ingin mengingatkan bahwa donasi qurban Anda untuk program *{{campaign}}* dengan nomor *{{nomor_pesanan}}* masih menunggu pembayaran.\n\n💰 Nominal: *{{total}}*\n⏰ Segera selesaikan pembayaran agar hewan kurban Anda bisa segera disiapkan.\n\nTerima kasih, semoga dimudahkan 🤲`

  const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
    { key: 'onesender', label: 'OneSender', icon: faWhatsapp },
    { key: 'tripay', label: 'Tripay', icon: faCreditCard },
    { key: 'diskon', label: 'Manajemen Diskon', icon: faTag },
    { key: 'pixel', label: 'Pixel & Tracking', icon: faCode },
    { key: 'umum', label: 'Umum', icon: faSliders },
    { key: 'keamanan', label: 'Keamanan Akun', icon: faLock },
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
          <AdminNotifBell />
          <AdminProfileMenu />
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
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-[10px] p-3 text-xs text-blue-900 leading-relaxed">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <strong>Notifikasi otomatis</strong> dikirim via OneSender API saat order dibuat (pesan pertama) dan saat cron follow-up jalan.{' '}
                      <strong>Tombol WA</strong> di halaman /admin/pesanan, /admin/penyaluran, dan /admin/konfirmasi adalah follow-up <strong>MANUAL</strong> yang membuka WhatsApp di perangkat kamu — tidak via OneSender.
                    </div>
                  </div>
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
                    <button
                      type="button"
                      onClick={() => setTestWaOpen(o => !o)}
                      className="flex items-center gap-2 text-brand-surface font-bold text-sm px-5 py-2.5 rounded-[8px] border-2 border-brand-surface hover:bg-brand-surface hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faPaperPlane} /> Test Kirim
                    </button>
                  </div>

                  {testWaOpen && (
                    <div className="mt-2 p-4 bg-brand-light rounded-[10px] border border-brand-muted/15 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kirim Pesan Test ke Nomor WA</label>
                        <p className="text-xs text-brand-muted">Pastikan OneSender sudah disimpan terlebih dulu. Pesan: "Halo! Ini pesan test dari Beyond Qurban ✅"</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="tel"
                          value={testWaTo}
                          onChange={e => setTestWaTo(e.target.value)}
                          className="inp flex-1"
                          placeholder="08123456789 atau 628123456789"
                          style={{ minWidth: 200 }}
                        />
                        <button
                          type="button"
                          onClick={handleTestWa}
                          disabled={testWaSending || !testWaTo.trim()}
                          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-sm px-4 py-2 rounded-[8px] disabled:opacity-60"
                        >
                          <FontAwesomeIcon icon={faPaperPlane} /> {testWaSending ? 'Mengirim...' : 'Kirim Test'}
                        </button>
                      </div>
                      {testWaResult && (
                        <div className={`text-xs px-3 py-2 rounded-[6px] font-medium ${testWaResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {testWaResult.ok ? '✅ ' : '❌ '}{testWaResult.msg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pesan Pertama */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base mb-1">Pesan Pertama</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Template pesan yang dikirim otomatis saat pesanan baru masuk.</p>
                </div>
                <div className="flex bg-brand-light border border-brand-muted/20 rounded-[8px] p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFirstTab('product')}
                    className={`px-3 py-1.5 rounded-[6px] transition-colors ${firstTab === 'product' ? 'bg-white text-brand-surface shadow-sm' : 'text-brand-muted hover:text-brand-dark'}`}
                  >
                    Produk Katalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setFirstTab('donation')}
                    className={`px-3 py-1.5 rounded-[6px] transition-colors ${firstTab === 'donation' ? 'bg-white text-brand-surface shadow-sm' : 'text-brand-muted hover:text-brand-dark'}`}
                  >
                    Donasi Penyaluran
                  </button>
                </div>
              </div>

              {firstTab === 'product' ? (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-[220px] shrink-0">
                    <div className="p-3 bg-brand-accent-light/60 rounded-[8px] border border-brand-accent/20">
                      <p className="text-xs text-brand-text-dark/70 font-medium mb-1">Variabel tersedia:</p>
                      <div className="flex flex-col gap-1 text-xs font-mono text-brand-surface">
                        <span>{'{{nama}}'}</span>
                        <span>{'{{nomor_pesanan}}'}</span>
                        <span>{'{{produk}}'}</span>
                        <span>{'{{total}}'}</span>
                        <span>{'{{tanggal_kirim}}'}</span>
                        <span>{'{{metode_bayar}}'}</span>
                        <span>{'{{rekening}}'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Pesan — Produk Katalog</label>
                      <textarea
                        value={settings.msg_first ?? DEFAULT_FIRST_PRODUCT}
                        onChange={e => set('msg_first', e.target.value)}
                        className="inp"
                        rows={10}
                        style={{ height: 'auto' }}
                      />
                    </div>
                    <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                      <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                      </div>
                      <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                        <p className="text-xs text-brand-text-dark whitespace-pre-line">
                          {(settings.msg_first ?? DEFAULT_FIRST_PRODUCT)
                            .replace(/\{\{nama\}\}/g, 'Ahmad')
                            .replace(/\{\{nomor_pesanan\}\}/g, 'BQ-2025-001')
                            .replace(/\{\{produk\}\}/g, 'Domba Garut')
                            .replace(/\{\{total\}\}/g, 'Rp 3.500.000')
                            .replace(/\{\{tanggal_kirim\}\}/g, '14 Juni 2025')
                            .replace(/\{\{metode_bayar\}\}/g, 'QRIS BSI')
                            .replace(/\{\{rekening\}\}/g, 'BSI 8210049787 A/N Qurban Movement')}
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-[220px] shrink-0">
                    <div className="p-3 bg-brand-accent-light/60 rounded-[8px] border border-brand-accent/20">
                      <p className="text-xs text-brand-text-dark/70 font-medium mb-1">Variabel tersedia:</p>
                      <div className="flex flex-col gap-1 text-xs font-mono text-brand-surface">
                        <span>{'{{nama}}'}</span>
                        <span>{'{{nomor_pesanan}}'}</span>
                        <span>{'{{campaign}}'}</span>
                        <span>{'{{hewan}}'}</span>
                        <span>{'{{atas_nama}}'}</span>
                        <span>{'{{total}}'}</span>
                        <span>{'{{metode_bayar}}'}</span>
                        <span>{'{{rekening}}'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Pesan — Donasi Penyaluran</label>
                      <textarea
                        value={settings.wa_template_donation_first ?? DEFAULT_FIRST_DONATION}
                        onChange={e => set('wa_template_donation_first', e.target.value)}
                        className="inp"
                        rows={10}
                        style={{ height: 'auto' }}
                      />
                    </div>
                    <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                      <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                      </div>
                      <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                        <p className="text-xs text-brand-text-dark whitespace-pre-line">
                          {(settings.wa_template_donation_first ?? DEFAULT_FIRST_DONATION)
                            .replace(/\{\{nama\}\}/g, 'Ahmad')
                            .replace(/\{\{nomor_pesanan\}\}/g, 'BQ-DON-2025-001')
                            .replace(/\{\{campaign\}\}/g, 'Qurban Pedalaman Indonesia')
                            .replace(/\{\{hewan\}\}/g, 'Kambing')
                            .replace(/\{\{atas_nama\}\}/g, 'Keluarga Ahmad')
                            .replace(/\{\{total\}\}/g, 'Rp 2.500.000')
                            .replace(/\{\{metode_bayar\}\}/g, 'QRIS BSI')
                            .replace(/\{\{rekening\}\}/g, 'BSI 8210049787 A/N Qurban Movement')}
                        </p>
                        <div className="text-[10px] text-brand-muted text-right mt-1">✓✓</div>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleSave(['wa_template_donation_first'])}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Template
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pesan Follow Up */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base mb-1">Pesan Follow Up</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Template pesan follow up untuk pelanggan yang belum membayar.</p>
                </div>
                <div className="flex bg-brand-light border border-brand-muted/20 rounded-[8px] p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFollowupTab('product')}
                    className={`px-3 py-1.5 rounded-[6px] transition-colors ${followupTab === 'product' ? 'bg-white text-brand-surface shadow-sm' : 'text-brand-muted hover:text-brand-dark'}`}
                  >
                    Produk Katalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowupTab('donation')}
                    className={`px-3 py-1.5 rounded-[6px] transition-colors ${followupTab === 'donation' ? 'bg-white text-brand-surface shadow-sm' : 'text-brand-muted hover:text-brand-dark'}`}
                  >
                    Donasi Penyaluran
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0 flex flex-col gap-3">
                  {/* Auto follow-up settings — shared antara produk & donasi */}
                  {(() => {
                    // Read total minutes — fallback ke followup_hours legacy, default 6 jam (360 menit)
                    const totalMin = settings.followup_minutes !== undefined
                      ? (parseInt(settings.followup_minutes) || 0)
                      : (parseInt(settings.followup_hours ?? '6') * 60)
                    const safeTotal = Math.max(0, Math.min(48 * 60, totalMin))
                    const fhours = Math.floor(safeTotal / 60)
                    const fmins = safeTotal % 60
                    const updateTotal = (h: number, m: number) => {
                      const total = Math.max(0, Math.min(48 * 60, h * 60 + m))
                      set('followup_minutes', String(total))
                    }
                    return (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kirim otomatis setelah</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="number"
                            value={fhours}
                            onChange={e => updateTotal(parseInt(e.target.value) || 0, fmins)}
                            className="inp"
                            style={{ width: 72 }}
                            min={0} max={48}
                          />
                          <span className="text-sm text-brand-muted">jam</span>
                          <select
                            value={fmins}
                            onChange={e => updateTotal(fhours, parseInt(e.target.value) || 0)}
                            className="inp"
                            style={{ width: 80 }}
                          >
                            <option value={0}>0</option>
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={45}>45</option>
                          </select>
                          <span className="text-sm text-brand-muted">menit</span>
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
                        <p className="text-[10px] text-brand-muted mt-1">Minimum 30 menit. Berlaku untuk produk &amp; donasi penyaluran.</p>
                      </div>
                    )
                  })()}

                  {/* Variable hint per tab */}
                  <div className="p-3 bg-brand-accent-light/60 rounded-[8px] border border-brand-accent/20">
                    <p className="text-xs text-brand-text-dark/70 font-medium mb-1">Variabel tersedia:</p>
                    <div className="flex flex-col gap-1 text-xs font-mono text-brand-surface">
                      {followupTab === 'product' ? (
                        <>
                          <span>{'{{nama}}'}</span>
                          <span>{'{{nomor_pesanan}}'}</span>
                          <span>{'{{produk}}'}</span>
                          <span>{'{{total}}'}</span>
                          <span>{'{{tanggal_kirim}}'}</span>
                          <span>{'{{metode_bayar}}'}</span>
                          <span>{'{{rekening}}'}</span>
                        </>
                      ) : (
                        <>
                          <span>{'{{nama}}'}</span>
                          <span>{'{{nomor_pesanan}}'}</span>
                          <span>{'{{campaign}}'}</span>
                          <span>{'{{hewan}}'}</span>
                          <span>{'{{atas_nama}}'}</span>
                          <span>{'{{total}}'}</span>
                          <span>{'{{metode_bayar}}'}</span>
                          <span>{'{{rekening}}'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  {followupTab === 'product' ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Follow Up — Produk Katalog</label>
                        <textarea
                          value={settings.msg_followup ?? DEFAULT_FOLLOWUP_PRODUCT}
                          onChange={e => set('msg_followup', e.target.value)}
                          className="inp"
                          rows={10}
                          style={{ height: 'auto' }}
                        />
                      </div>
                      <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                        <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                        </div>
                        <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                          <p className="text-xs text-brand-text-dark whitespace-pre-line">
                            {(settings.msg_followup ?? DEFAULT_FOLLOWUP_PRODUCT)
                              .replace(/\{\{nama\}\}/g, 'Ahmad')
                              .replace(/\{\{nomor_pesanan\}\}/g, 'BQ-2025-001')
                              .replace(/\{\{total\}\}/g, 'Rp 3.500.000')}
                          </p>
                          <div className="text-[10px] text-brand-muted text-right mt-1">✓✓</div>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleSave(['msg_followup', 'followup_minutes', 'followup_enabled'])}
                          disabled={isPending}
                          className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                        >
                          <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Template
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Template Follow Up — Donasi Penyaluran</label>
                        <textarea
                          value={settings.wa_template_donation_followup ?? DEFAULT_FOLLOWUP_DONATION}
                          onChange={e => set('wa_template_donation_followup', e.target.value)}
                          className="inp"
                          rows={10}
                          style={{ height: 'auto' }}
                        />
                      </div>
                      <div className="bg-[#ece5dd] rounded-[12px] p-4 border border-brand-muted/10">
                        <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faWhatsappPrev} className="text-[#25D366]" /> Preview WhatsApp
                        </div>
                        <div className="bg-white rounded-[10px] p-3 shadow-sm max-w-xs ml-auto">
                          <p className="text-xs text-brand-text-dark whitespace-pre-line">
                            {(settings.wa_template_donation_followup ?? DEFAULT_FOLLOWUP_DONATION)
                              .replace(/\{\{nama\}\}/g, 'Ahmad')
                              .replace(/\{\{nomor_pesanan\}\}/g, 'BQ-DON-2025-001')
                              .replace(/\{\{campaign\}\}/g, 'Qurban Pedalaman Indonesia')
                              .replace(/\{\{total\}\}/g, 'Rp 2.500.000')}
                          </p>
                          <div className="text-[10px] text-brand-muted text-right mt-1">✓✓</div>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleSave(['wa_template_donation_followup', 'followup_minutes', 'followup_enabled'])}
                          disabled={isPending}
                          className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                        >
                          <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Template
                        </button>
                      </div>
                    </>
                  )}
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

              {/* Master Tripay toggle */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 mb-5 bg-brand-light border border-brand-muted/20 rounded-[10px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[8px] bg-white border border-brand-muted/15 flex items-center justify-center text-brand-surface shrink-0">
                    <FontAwesomeIcon icon={faCreditCard} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-brand-dark">Tripay Payment Gateway</div>
                    <div className="text-xs text-brand-muted">Aktifkan untuk menampilkan semua channel Tripay (VA, QRIS, E-wallet) di checkout</div>
                  </div>
                </div>
                <label className="toggle shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.tripay_enabled !== 'false'}
                    onChange={e => set('tripay_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Virtual Account */}
              <div className="mb-5">
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Virtual Account</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'BCAVA',      label: 'BCA Virtual Account',        sub: 'Transfer Bank BCA',      abbr: 'BCA',  color: 'text-blue-700' },
                    { key: 'MANDIRIVA',  label: 'Mandiri Virtual Account',     sub: 'Transfer Bank Mandiri',  abbr: 'MNR',  color: 'text-yellow-700' },
                    { key: 'BNIVA',      label: 'BNI Virtual Account',         sub: 'Transfer Bank BNI',      abbr: 'BNI',  color: 'text-orange-600' },
                    { key: 'BRIVA',      label: 'BRI Virtual Account',         sub: 'Transfer Bank BRI',      abbr: 'BRI',  color: 'text-blue-500' },
                    { key: 'PERMATAVA',  label: 'Permata Virtual Account',     sub: 'Transfer Bank Permata',  abbr: 'PMT',  color: 'text-emerald-600', defaultOff: true },
                    { key: 'MUAMALATVA', label: 'Muamalat Virtual Account',    sub: 'Transfer Bank Muamalat', abbr: 'MMT',  color: 'text-emerald-700', defaultOff: true },
                    { key: 'CIMBVA',     label: 'CIMB Niaga Virtual Account',  sub: 'Transfer Bank CIMB',     abbr: 'CIMB', color: 'text-red-700',     defaultOff: true },
                    { key: 'BSIVA',      label: 'BSI Virtual Account',         sub: 'Transfer Bank BSI',      abbr: 'BSI',  color: 'text-emerald-700', defaultOff: true },
                  ].map(({ key, label, sub, abbr, color, defaultOff }) => {
                    const settingKey = `ch_${key.toLowerCase()}`
                    const isOn = defaultOff ? settings[settingKey] === 'true' : settings[settingKey] !== 'false'
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

              {/* QRIS & E-Wallet */}
              <div className="mb-5">
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">QRIS &amp; E-Wallet</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'QRIS',      label: 'QRIS',       sub: 'Semua e-wallet mendukung QRIS',   abbr: 'QRIS', bg: 'bg-[#00AED6]/10', color: 'text-[#00AED6]' },
                    { key: 'QRIS2',     label: 'QRIS 2',     sub: 'Provider QRIS alternatif',        abbr: 'QRIS', bg: 'bg-[#00AED6]/10', color: 'text-[#00AED6]', defaultOff: true },
                    { key: 'OVO',       label: 'OVO',        sub: 'E-wallet OVO (Redirect)',          abbr: 'OVO',  bg: 'bg-[#4C3494]/10', color: 'text-[#4C3494]', defaultOff: true },
                    { key: 'DANA',      label: 'DANA',       sub: 'E-wallet DANA (Redirect)',         abbr: 'DANA', bg: 'bg-[#108EE9]/10', color: 'text-[#108EE9]', defaultOff: true },
                    { key: 'SHOPEEPAY', label: 'ShopeePay',  sub: 'E-wallet ShopeePay (Redirect)',    abbr: 'SPAY', bg: 'bg-[#EE4D2D]/10', color: 'text-[#EE4D2D]', defaultOff: true },
                  ].map(({ key, label, sub, abbr, bg, color, defaultOff }) => {
                    const settingKey = `ch_${key.toLowerCase()}`
                    const isOn = defaultOff ? settings[settingKey] === 'true' : settings[settingKey] !== 'false'
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

              {/* Minimarket / Kasir */}
              <div>
                <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Minimarket / Kasir</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'ALFAMART',  label: 'Alfamart',  sub: 'Bayar di gerai Alfamart',  abbr: 'Alfa', bg: 'bg-[#E8192C]/10', color: 'text-[#E8192C]', defaultOff: true },
                    { key: 'INDOMARET', label: 'Indomaret', sub: 'Bayar di gerai Indomaret', abbr: 'Indo', bg: 'bg-[#CC0000]/10', color: 'text-[#CC0000]', defaultOff: true },
                    { key: 'ALFAMIDI',  label: 'Alfamidi',  sub: 'Bayar di gerai Alfamidi',  abbr: 'Midi', bg: 'bg-[#0063A7]/10', color: 'text-[#0063A7]', defaultOff: true },
                  ].map(({ key, label, sub, abbr, bg, color, defaultOff }) => {
                    const settingKey = `ch_${key.toLowerCase()}`
                    const isOn = defaultOff ? settings[settingKey] === 'true' : settings[settingKey] !== 'false'
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
                  onClick={() => handleSave([
                    'tripay_enabled',
                    'ch_bcava','ch_mandiriva','ch_bniva','ch_briva','ch_permatava','ch_muamalatva','ch_cimbva','ch_bsiva',
                    'ch_qris','ch_qris2','ch_ovo','ch_dana','ch_shopeepay',
                    'ch_alfamart','ch_indomaret','ch_alfamidi',
                  ])}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Perubahan
                </button>
              </div>
            </div>

            {/* QRIS Manual Config */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-brand-dark text-base flex items-center gap-2">
                  <FontAwesomeIcon icon={faQrcode} className="text-brand-surface text-sm" /> QRIS Manual
                </h2>
                <label className="toggle">
                  <input type="checkbox" checked={settings.manual_qris_enabled === 'true'} onChange={e => set('manual_qris_enabled', e.target.checked ? 'true' : 'false')} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <p className="text-sm text-brand-muted mb-5">Upload QR code statis dari bank Anda. Pelanggan akan scan QR ini lalu upload bukti transfer.</p>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
                {/* QR Code uploader */}
                <div>
                  <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-2">Gambar QR Code</label>
                  {settings.manual_qris_image ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.manual_qris_image} alt="QRIS" className="w-full aspect-square object-contain rounded-[10px] border border-brand-muted/20 bg-white" />
                      <button
                        type="button"
                        onClick={() => set('manual_qris_image', '')}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded font-bold"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-[10px] cursor-pointer transition-colors ${qrisUploading ? 'border-brand-surface/30 bg-brand-surface/5' : 'border-brand-muted/30 hover:border-brand-accent/50 hover:bg-brand-accent/[0.02]'}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={qrisUploading}
                        onChange={handleQrisUpload}
                      />
                      <FontAwesomeIcon icon={faImage} className="text-2xl text-brand-muted/50 mb-2" />
                      <div className="text-xs font-medium text-brand-dark text-center px-2">
                        {qrisUploading ? 'Mengupload...' : 'Klik untuk upload QR'}
                      </div>
                      <div className="text-[10px] text-brand-muted mt-0.5">JPG, PNG · Max 3MB</div>
                    </label>
                  )}
                  {qrisUploadError && <p className="text-xs text-red-600 mt-1">{qrisUploadError}</p>}
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Nama Bank QRIS *</label>
                    <input
                      type="text"
                      value={settings.manual_qris_bank ?? ''}
                      onChange={e => set('manual_qris_bank', e.target.value)}
                      className="inp"
                      placeholder="Contoh: BCA, Mandiri, BSI"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block mb-1">Keterangan (opsional)</label>
                    <input
                      type="text"
                      value={settings.manual_qris_label ?? ''}
                      onChange={e => set('manual_qris_label', e.target.value)}
                      className="inp"
                      placeholder='Contoh: "Scan QRIS BCA"'
                    />
                  </div>
                  <p className="text-xs text-brand-muted">
                    💡 Saat aktif, opsi pembayaran <strong>QRIS — {settings.manual_qris_bank || '[nama bank]'}</strong> akan tampil di checkout sebelum Transfer Manual.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSave(['manual_qris_enabled', 'manual_qris_image', 'manual_qris_bank', 'manual_qris_label'])}
                disabled={isPending}
                className="mt-5 flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> Simpan QRIS Manual
              </button>
            </div>

            {/* Manual Transfer Config — multi-bank */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-brand-dark text-base">Transfer Manual</h2>
                <label className="toggle">
                  <input type="checkbox" checked={settings.manual_transfer_enabled === 'true'} onChange={e => set('manual_transfer_enabled', e.target.checked ? 'true' : 'false')} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <p className="text-sm text-brand-muted mb-5">Tambahkan satu atau lebih rekening bank untuk transfer langsung tanpa Tripay.</p>

              <ManualBanksEditor
                value={settings.manual_banks ?? '[]'}
                onChange={v => set('manual_banks', v)}
              />

              <button
                onClick={() => handleSave(['manual_transfer_enabled', 'manual_banks'])}
                disabled={isPending}
                className="mt-5 flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Semua
              </button>
            </div>
          </div>
        )}

        {/* === UMUM === */}
        {activeSection === 'umum' && (
          <div className="flex flex-col gap-6">
            {/* Template Sertifikat */}
            <div className="setting-card">
              <Link
                href="/admin/pengaturan/sertifikat"
                className="flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[10px] bg-cta-gradient flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCertificate} className="text-brand-text-dark text-lg" />
                  </div>
                  <div>
                    <h2 className="font-bold text-brand-dark text-base">Template Sertifikat</h2>
                    <p className="text-sm text-brand-muted mt-0.5">Upload blanko & atur posisi teks dengan drag &amp; drop</p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-brand-muted group-hover:text-brand-dark transition-colors" />
              </Link>
            </div>

            {/* Info Toko */}
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

            {/* Tim Lapangan */}
            <div className="setting-card flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-brand-dark text-base flex items-center gap-2">
                  <FontAwesomeIcon icon={faTruck} className="text-brand-surface text-sm" /> Tim Lapangan
                </h2>
                <p className="text-sm text-brand-muted mt-1">Kode akses untuk halaman tim lapangan di <span className="font-mono">/lapangan</span>. Bagikan kode ini ke kurir/tim pengiriman.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kode Akses Tim Lapangan</label>
                <input
                  type="text"
                  value={settings.lapangan_access_code ?? ''}
                  onChange={e => set('lapangan_access_code', e.target.value)}
                  className="inp font-mono"
                  placeholder="QURBAN2026"
                />
                <p className="text-[11px] text-brand-muted">Kode default: QURBAN2026 — ganti agar lebih aman.</p>
              </div>
              <button onClick={() => handleSave(['lapangan_access_code'])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
                <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Kode
              </button>
            </div>

            {/* Zona Pengiriman */}
            <div className="setting-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-brand-dark text-base flex items-center gap-2">
                    <FontAwesomeIcon icon={faTruck} className="text-brand-surface text-sm" /> Zona Pengiriman
                  </h2>
                  <p className="text-sm text-brand-muted mt-1">Atur area pengiriman dan biaya ongkos kirim. Kota di luar zona ini tidak bisa checkout.</p>
                </div>
                <button
                  onClick={() => {
                    const newZone: ShippingZone = { id: Date.now().toString(), name: '', keywords: '', cost: 0 }
                    setShippingZones(prev => [...prev, newZone])
                  }}
                  className="flex items-center gap-2 bg-brand-surface text-white text-sm font-bold px-4 py-2 rounded-[8px] hover:bg-brand-dark transition-colors shrink-0"
                >
                  <FontAwesomeIcon icon={faPlus} /> Tambah Zona
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Nama Zona', 'Kata Kunci (pisah koma)', 'Ongkir (Rp)', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-bold text-brand-muted uppercase tracking-wider bg-brand-light border-b border-brand-muted/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shippingZones.map((zone, i) => (
                      <tr key={zone.id} className="border-b border-brand-muted/8">
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={zone.name}
                            onChange={e => setShippingZones(prev => prev.map((z, idx) => idx === i ? { ...z, name: e.target.value } : z))}
                            placeholder="Bandung Raya"
                            className="inp text-sm"
                            style={{ height: 36 }}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={zone.keywords}
                            onChange={e => setShippingZones(prev => prev.map((z, idx) => idx === i ? { ...z, keywords: e.target.value } : z))}
                            placeholder="bandung,cimahi,sumedang"
                            className="inp text-sm font-mono"
                            style={{ height: 36, minWidth: 220 }}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div
                            className="flex items-stretch border border-brand-muted/20 rounded-[8px] bg-brand-light overflow-hidden focus-within:border-brand-accent focus-within:shadow-[0_0_0_1px_#C8962A]"
                            style={{ width: 140, height: 36 }}
                          >
                            <span className="px-2.5 text-xs font-bold text-brand-muted bg-white border-r border-brand-muted/20 flex items-center shrink-0">
                              Rp
                            </span>
                            <input
                              type="number"
                              value={zone.cost}
                              min={0}
                              step={10000}
                              onChange={e => setShippingZones(prev => prev.map((z, idx) => idx === i ? { ...z, cost: parseInt(e.target.value) || 0 } : z))}
                              className="flex-1 min-w-0 px-2 text-sm bg-transparent focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                          {zone.cost === 0 && <span className="text-[10px] text-emerald-600 font-bold">GRATIS</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => setShippingZones(prev => prev.filter((_, idx) => idx !== i))}
                            className="w-8 h-8 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-[7px] flex items-center justify-center border border-red-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {shippingZones.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-brand-muted">Belum ada zona. Klik "Tambah Zona" untuk mulai.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await saveSettings({ shipping_zones: JSON.stringify(shippingZones) })
                      showToast('Zona pengiriman berhasil disimpan!')
                    })
                  }}
                  className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Zona
                </button>
                <p className="text-xs text-brand-muted">Perubahan langsung berlaku di halaman checkout pelanggan.</p>
              </div>
            </div>
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
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[10px] border border-brand-muted/10">
                    <div className="font-semibold text-sm text-brand-dark">Aktifkan Meta Pixel</div>
                    <label className="toggle">
                      <input type="checkbox" checked={settings.fb_pixel_enabled !== 'false'} onChange={e => set('fb_pixel_enabled', e.target.checked ? 'true' : 'false')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
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
                      {(() => {
                        const EVENT_OPTIONS = [
                          'ViewContent',
                          'PageView',
                          'InitiateCheckout',
                          'AddToCart',
                          'AddPaymentInfo',
                          'Purchase',
                          'Lead',
                          'Donate',
                        ]
                        return [
                          { label: 'Page Campaign', sub: 'qurban-penyaluran.html', key: 'fb_event_campaign', options: EVENT_OPTIONS, default: 'ViewContent' },
                          { label: 'Page Form / Checkout', sub: 'Checkout _ Form P.html', key: 'fb_event_checkout', options: EVENT_OPTIONS, default: 'InitiateCheckout' },
                          { label: 'Page Invoice / Pembayaran', sub: 'Detail pembayaran', key: 'fb_event_payment', options: EVENT_OPTIONS, default: 'AddToCart' },
                          { label: 'Page Sukses Pembayaran', sub: 'Setelah konfirmasi bayar', key: 'fb_event_success', options: EVENT_OPTIONS, default: 'Purchase' },
                        ]
                      })().map(({ label, sub, key, options, default: def }) => (
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
                    onClick={() => handleSave(['fb_pixel_enabled', 'fb_pixel_id', 'fb_secret_token', 'fb_test_code', 'fb_event_campaign', 'fb_event_checkout', 'fb_event_payment', 'fb_event_success'])}
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
                            <div className="flex items-center rounded-[8px] border border-brand-muted/20 overflow-hidden bg-white focus-within:border-brand-accent" style={{ height: 36 }}>
                              <span className="px-2.5 text-xs font-bold text-brand-muted bg-brand-light border-r border-brand-muted/20 h-full flex items-center shrink-0">Rp</span>
                              <input type="number" value={settings[priceKey] ?? defaultPrice} onChange={e => set(priceKey, e.target.value)} className="flex-1 px-3 text-sm text-brand-dark bg-white outline-none min-w-0" style={{ height: 36 }} />
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
                      { label: 'Sapi', cat: 'sapi', defaultDisc: '5' },
                      { label: 'Kambing', cat: 'kambing', defaultDisc: '0' },
                      { label: 'Domba', cat: 'domba', defaultDisc: '10' },
                      { label: 'Unta', cat: 'unta', defaultDisc: '0' },
                    ].map(({ label, cat, defaultDisc }) => {
                      const discKey = `disc_${cat}`
                      const untilKey = `disc_${cat}_until`
                      const activeKey = `discount_category_${cat}_active`
                      const active = (settings[activeKey] ?? 'true') === 'true'
                      return (
                        <tr key={label} className="border-b border-brand-muted/8">
                          <td className="px-4 py-3 font-medium text-sm text-brand-dark">{label}</td>
                          <td className="px-4 py-3">
                            <input type="number" value={settings[discKey] ?? defaultDisc} onChange={e => set(discKey, e.target.value)} className="inp text-sm" style={{ height: 36, width: 80 }} min={0} max={100} disabled={!active} />
                          </td>
                          <td className="px-4 py-3">
                            <input type="date" value={settings[untilKey] ?? ''} onChange={e => set(untilKey, e.target.value)} className="inp text-sm" style={{ height: 36, width: 160 }} disabled={!active} />
                          </td>
                          <td className="px-4 py-3">
                            <label className="toggle">
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={e => set(activeKey, e.target.checked ? 'true' : 'false')}
                                aria-label={`Aktifkan diskon ${label}`}
                              />
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
                <button onClick={() => handleSave([
                  'disc_sapi','disc_kambing','disc_domba','disc_unta',
                  'disc_sapi_until','disc_kambing_until','disc_domba_until','disc_unta_until',
                  'discount_category_sapi_active','discount_category_kambing_active','discount_category_domba_active','discount_category_unta_active',
                ])} disabled={isPending} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60">
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
                          <button onClick={() => {
                            const updated = vouchers.filter((_, idx) => idx !== i)
                            setVouchers(updated)
                            // Auto-save to DB when deleting
                            startTransition(async () => {
                              await saveSettings({ vouchers: JSON.stringify(updated) })
                              showToast('Voucher dihapus!')
                            })
                          }} className="w-8 h-8 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-[7px] flex items-center justify-center border border-red-100 transition-colors">
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vouchers.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-brand-muted">Belum ada voucher. Tambahkan voucher baru.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === KEAMANAN AKUN === */}
        {activeSection === 'keamanan' && (
          <div className="flex flex-col gap-6">
            <div className="setting-card">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-[220px] shrink-0">
                  <h2 className="font-bold text-brand-dark text-base mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLock} className="text-brand-surface text-sm" /> Ganti Password
                  </h2>
                  <p className="text-brand-muted text-sm leading-relaxed">Untuk keamanan, ganti password admin secara berkala. Minimal 8 karakter.</p>
                </div>
                <div className="flex-1">
                  <form onSubmit={handleChangePassword} autoComplete="off" className="flex flex-col gap-4 max-w-md">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Email Saat Ini</label>
                      <input
                        type="email"
                        value={adminEmail}
                        readOnly
                        className="inp opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Password Lama</label>
                      <input
                        type="password"
                        value={pwOld}
                        onChange={e => setPwOld(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="inp"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Password Baru</label>
                      <input
                        type="password"
                        value={pwNew}
                        onChange={e => setPwNew(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className="inp"
                        placeholder="Min. 8 karakter"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        value={pwConfirm}
                        onChange={e => setPwConfirm(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className={`inp ${pwConfirm.length > 0 && pwConfirm !== pwNew ? 'border-red-400' : ''}`}
                        placeholder="Ulangi password baru"
                      />
                      {pwConfirm.length > 0 && pwConfirm !== pwNew && (
                        <p className="text-xs text-red-600 font-medium">Konfirmasi tidak cocok dengan password baru.</p>
                      )}
                    </div>

                    {pwResult && (
                      <div className={`text-xs px-3 py-2 rounded-[6px] font-medium ${pwResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {pwResult.ok ? '✅ ' : '❌ '}{pwResult.msg}
                      </div>
                    )}

                    <div>
                      <button
                        type="submit"
                        disabled={pwSubmitting || !pwOld || !pwNew || !pwConfirm}
                        className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} /> {pwSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                      </button>
                    </div>
                  </form>
                </div>
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
                  disabled={isPending}
                  onClick={() => {
                    if (!newVoucher.code) return
                    const updated = [...vouchers, { ...newVoucher, used: 0 }]
                    setVouchers(updated)
                    setNewVoucher({ code: '', disc: 10, minBuy: 0, maxUse: 100 })
                    setVoucherModal(false)
                    // Save to DB
                    startTransition(async () => {
                      await saveSettings({ vouchers: JSON.stringify(updated) })
                      showToast('Voucher berhasil disimpan!')
                    })
                  }}
                  className="flex-1 py-2.5 bg-cta-gradient text-brand-text-dark font-bold text-sm rounded-[8px] flex items-center justify-center gap-2 disabled:opacity-60"
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
