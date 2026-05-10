'use client'
import { useState, useTransition, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk, faHome, faLink, faBars,
  faInfoCircle, faPlus, faTrash, faGlobe,
  faHandHoldingHeart, faTags, faStar, faUpload, faUser,
  faArrowUp, faArrowDown, faImage,
} from '@fortawesome/free-solid-svg-icons'
import { saveSettings } from '@/lib/actions/settings'
import IconPicker from '@/components/ui/IconPicker'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'

type Tab = 'homepage' | 'penyaluran' | 'katalog' | 'header' | 'footer' | 'tentang'

interface StatItem { value: string; label: string }
interface NavItem { label: string; href: string }

const DEFAULT_STATS_HOME: StatItem[] = [
  { value: '450+', label: 'Hewan Tersedia' },
  { value: '1.2K+', label: 'Kurban Terlaksana' },
  { value: '850+', label: 'Pelanggan Puas' },
  { value: '98%', label: 'Kepuasan Pelanggan' },
]
const DEFAULT_NAV: NavItem[] = [
  { label: 'Homepage', href: '/' },
  { label: 'Katalog', href: '/katalog' },
  { label: 'Penyaluran', href: '/penyaluran' },
  { label: 'Lacak Pesanan', href: '/lacak-pesanan' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
]
const DEFAULT_ABOUT_STATS: StatItem[] = [
  { value: '2019', label: 'Tahun Berdiri' },
  { value: '1.2K+', label: 'Kurban Terlaksana' },
  { value: '850+', label: 'Pelanggan Puas' },
  { value: '98%', label: 'Kepuasan Pelanggan' },
]

function parseJsonOr<T>(val: string | undefined, def: T): T {
  try { const p = JSON.parse(val ?? ''); if (p && (Array.isArray(p) || typeof p === 'object')) return p } catch {}
  return def
}

const inpCls = 'w-full px-3 py-2 rounded-[8px] border border-brand-muted/20 bg-white text-sm text-brand-dark focus:outline-none focus:border-brand-accent'
const labelCls = 'text-xs font-bold text-brand-dark uppercase tracking-wider block mb-1.5'

export default function KontenClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [tab, setTab] = useState<Tab>('homepage')
  const [s, setS] = useState(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState('')

  // Parsed arrays
  const [homeStats, setHomeStats] = useState<StatItem[]>(() => parseJsonOr(initialSettings.home_stats, DEFAULT_STATS_HOME))

  type Feature = { title: string; desc: string; icon?: string }
  type Step = { title: string; desc: string; icon?: string }
  type Testimonial = { name: string; city: string; stars: number; text: string }
  type ImpactStat = { stat: string; label: string }

  const [homeFeatures, setHomeFeatures] = useState<Feature[]>(() => parseJsonOr(initialSettings.home_features, [
    { title: 'Hewan Terseleksi', desc: 'Setiap hewan kurban lolos pemeriksaan kesehatan ketat dan memenuhi syarat syariat Islam.', icon: 'shield' },
    { title: 'Pengiriman Amanah', desc: 'Pengiriman gratis ke lokasi Anda dengan jadwal fleksibel hingga H-1 Idul Adha.', icon: 'truck' },
    { title: 'Laporan Foto & Video', desc: 'Update kondisi hewan dan dokumentasi penyembelihan dikirim langsung via WhatsApp.', icon: 'camera' },
  ]))
  const [homeSteps, setHomeSteps] = useState<Step[]>(() => parseJsonOr(initialSettings.home_steps, [
    { title: 'Pilih Hewan', desc: 'Pilih hewan kurban dari katalog sesuai budget dan kriteria Anda.', icon: 'cow' },
    { title: 'Isi Data & Transfer', desc: 'Isi formulir pemesanan dan selesaikan pembayaran via transfer atau QRIS.', icon: 'invoice' },
    { title: 'Terima & Selesai', desc: 'Hewan diantar ke lokasi Anda, laporan foto/video dikirim via WhatsApp.', icon: 'house' },
  ]))
  const [homeTestimonials, setHomeTestimonials] = useState<Testimonial[]>(() => parseJsonOr(initialSettings.home_testimonials, [
    { name: 'Ahmad Fauzi', city: 'Jakarta', stars: 5, text: 'Pengalaman kurban terbaik! Hewan sehat, pengiriman tepat waktu, dan laporan video sangat memuaskan. Tahun depan pasti pesan lagi.' },
    { name: 'Siti Rahayu', city: 'Surabaya', stars: 5, text: 'Sangat mudah, transparan, dan amanah. Bisa memantau kondisi hewan secara real-time. Sungguh tenang ibadah kurbannya bersama Beyond Qurban.' },
    { name: 'Budi Santoso', city: 'Bandung', stars: 4, text: 'Layanannya profesional dan responsif. Hewan kurban berkualitas baik dan proses pengiriman lancar. Sangat direkomendasikan.' },
  ]))
  type TeamMember = { name: string; role: string; desc: string; imageUrl?: string }
  type WhyItem = { title: string; desc: string }

  const [whyItems, setWhyItems] = useState<WhyItem[]>(() => parseJsonOr(initialSettings.about_why_items, [
    { title: 'Terpercaya', desc: 'Berpengalaman sejak 2019 dengan rekam jejak lebih dari 1.200 kurban terlaksana dan ribuan pelanggan puas.' },
    { title: 'Transparan', desc: 'Update foto dan video kondisi hewan kurban dikirim rutin ke WhatsApp Anda. Lacak pesanan real-time kapan saja.' },
    { title: 'Tersertifikasi MUI', desc: 'Proses penyembelihan dan perawatan hewan sesuai standar MUI. Setiap hewan melalui pemeriksaan dokter hewan bersertifikat.' },
    { title: 'Pengiriman Seluruh Indonesia', desc: 'Layanan pengiriman gratis ke seluruh wilayah Indonesia dengan jadwal fleksibel dan armada terstandar.' },
  ]))
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => parseJsonOr(initialSettings.about_team, [
    { name: 'Ustaz Ahmad Faris', role: 'Direktur Utama', desc: 'Pengasuh pesantren & pakar syariat kurban dengan pengalaman 15 tahun.', imageUrl: '' },
    { name: 'drh. Siti Nurhaliza', role: 'Kepala Veteriner', desc: 'Dokter hewan berlisensi, memastikan setiap hewan sehat dan memenuhi syarat.', imageUrl: '' },
    { name: 'Bapak Ridwan Kamil', role: 'Kepala Operasional', desc: 'Mengawasi proses logistik dan pengiriman ke seluruh wilayah Indonesia.', imageUrl: '' },
    { name: 'Nadia Rahmawati', role: 'Customer Relations', desc: 'Memastikan setiap pelanggan mendapat pengalaman terbaik dari awal hingga akhir.', imageUrl: '' },
  ]))
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  async function handleTeamPhotoUpload(i: number, file: File) {
    setUploadingIdx(i)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'team')
    try {
      const res = await fetch('/api/media-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setTeamMembers(p => p.map((x, idx) => idx === i ? { ...x, imageUrl: data.url } : x))
      }
    } finally {
      setUploadingIdx(null)
    }
  }

  const [brandUploading, setBrandUploading] = useState<'logo' | 'favicon' | null>(null)
  async function handleBrandUpload(kind: 'logo' | 'favicon', file: File) {
    setBrandUploading(kind)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', kind === 'logo' ? 'logo' : 'favicon')
    try {
      const res = await fetch('/api/media-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) {
        showToast(data.error || 'Gagal upload')
        return
      }
      const key = kind === 'logo' ? 'site_logo_url' : 'site_favicon_url'
      set(key, data.url)
      // Persist immediately so the customer site picks it up without waiting for
      // the explicit "Simpan" click — branding assets are small and uploading is
      // already an explicit user action.
      startTransition(async () => {
        await saveSettings({ [key]: data.url })
        showToast(kind === 'logo' ? 'Logo tersimpan!' : 'Favicon tersimpan!')
      })
    } finally {
      setBrandUploading(null)
    }
  }
  const [impactStats, setImpactStats] = useState<ImpactStat[]>(() => parseJsonOr(initialSettings.penyaluran_impact_stats, [
    { stat: '1.247', label: 'Ekor Tersalurkan' },
    { stat: '48', label: 'Desa Terjangkau' },
    { stat: '8.500+', label: 'Penerima Manfaat' },
    { stat: '3 Negara', label: 'Destinasi Aktif' },
  ]))
  const [navItems, setNavItems] = useState<NavItem[]>(() => parseJsonOr(initialSettings.nav_items, DEFAULT_NAV))
  const [aboutStats, setAboutStats] = useState<StatItem[]>(() => parseJsonOr(initialSettings.about_stats, DEFAULT_ABOUT_STATS))

  function set(key: string, value: string) { setS(p => ({ ...p, [key]: value })) }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2800) }

  function save(keys: string[], extra?: Record<string, string>) {
    const toSave: Record<string, string> = { ...extra }
    keys.forEach(k => { if (s[k] !== undefined) toSave[k] = s[k] })
    startTransition(async () => {
      await saveSettings(toSave)
      showToast('Perubahan berhasil disimpan!')
    })
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'homepage',   label: 'Halaman Depan', icon: faHome },
    { key: 'penyaluran', label: 'Penyaluran',    icon: faHandHoldingHeart },
    { key: 'katalog',    label: 'Katalog',        icon: faTags },
    { key: 'header',     label: 'Header & Menu',  icon: faBars },
    { key: 'footer',     label: 'Footer',          icon: faGlobe },
    { key: 'tentang',    label: 'Tentang Kami',   icon: faInfoCircle },
  ]

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Konten Halaman</h1>
          <p className="text-brand-muted text-xs mt-0.5">Edit teks, menu, dan informasi yang tampil di website</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[960px] w-full flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-brand-light border border-brand-muted/20 rounded-[10px] p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[8px] text-sm font-medium transition-all ${
                tab === t.key ? 'bg-brand-surface text-white shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}>
              <FontAwesomeIcon icon={t.icon} className="text-xs" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ HOMEPAGE ═══ */}
        {tab === 'homepage' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Hero Section</h2>
              <div>
                <label className={labelCls}>Badge / Pengumuman</label>
                <input type="text" value={s.home_badge ?? 'Pemesanan Kurban 2025 Dibuka'} onChange={e => set('home_badge', e.target.value)} className={inpCls} placeholder="Pemesanan Kurban 2025 Dibuka" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Judul Baris 1</label>
                  <input type="text" value={s.home_hero_title_1 ?? 'Qurban Mudah,'} onChange={e => set('home_hero_title_1', e.target.value)} className={inpCls} placeholder="Qurban Mudah," />
                </div>
                <div>
                  <label className={labelCls}>Judul Baris 2 (aksen emas)</label>
                  <input type="text" value={s.home_hero_title_2 ?? 'Amanah & Transparan'} onChange={e => set('home_hero_title_2', e.target.value)} className={inpCls} placeholder="Amanah & Transparan" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Deskripsi / Subtitle</label>
                <textarea rows={3} value={s.home_hero_desc ?? ''} onChange={e => set('home_hero_desc', e.target.value)} className={`${inpCls} resize-none`} placeholder="Pilih hewan kurban terbaik, pantau prosesnya..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tombol Utama (teks)</label>
                  <input type="text" value={s.home_cta_primary ?? 'Lihat Katalog'} onChange={e => set('home_cta_primary', e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>Tombol Utama (link)</label>
                  <input type="text" value={s.home_cta_primary_href ?? '/katalog'} onChange={e => set('home_cta_primary_href', e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>Tombol Kedua (teks)</label>
                  <input type="text" value={s.home_cta_secondary ?? 'Lacak Pesanan'} onChange={e => set('home_cta_secondary', e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>Tombol Kedua (link)</label>
                  <input type="text" value={s.home_cta_secondary_href ?? '/lacak-pesanan'} onChange={e => set('home_cta_secondary_href', e.target.value)} className={inpCls} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <h2 className="font-bold text-brand-dark text-base">Statistik / Angka Unggulan</h2>
                <button onClick={() => setHomeStats(p => [...p, { value: '', label: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {homeStats.map((stat, i) => (
                  <div key={i} className="flex gap-2 items-center bg-brand-light rounded-[8px] p-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input type="text" value={stat.value} onChange={e => setHomeStats(p => p.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="450+" className={inpCls} style={{ height: 34 }} />
                      <input type="text" value={stat.label} onChange={e => setHomeStats(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Hewan Tersedia" className={inpCls} style={{ height: 34 }} />
                    </div>
                    <button onClick={() => setHomeStats(p => p.filter((_, idx) => idx !== i))} className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <h2 className="font-bold text-brand-dark text-base">Section &quot;Mengapa Memilih Kami&quot;</h2>
                <button onClick={() => setHomeFeatures(p => [...p, { title: '', desc: '', icon: 'star' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah Card
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul Section</label><input type="text" value={s.home_features_title ?? 'Mengapa Memilih Kami?'} onChange={e => set('home_features_title', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Subtitle</label><input type="text" value={s.home_features_desc ?? ''} onChange={e => set('home_features_desc', e.target.value)} className={inpCls} /></div>
              </div>
              {homeFeatures.map((f, i) => (
                <div key={i} className="bg-brand-light rounded-[8px] p-3 flex flex-col gap-1.5 relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-brand-muted">Card {i + 1}</p>
                    <button onClick={() => setHomeFeatures(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <IconPicker value={f.icon ?? 'shield'} onChange={key => setHomeFeatures(p => p.map((x, idx) => idx === i ? { ...x, icon: key } : x))} />
                    <input type="text" value={f.title} onChange={e => setHomeFeatures(p => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Judul" className={inpCls} style={{ height: 34 }} />
                  </div>
                  <textarea rows={2} value={f.desc} onChange={e => setHomeFeatures(p => p.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} placeholder="Deskripsi" className={`${inpCls} resize-none`} />
                </div>
              ))}
            </div>

            {/* Featured products */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Section &quot;Produk Unggulan&quot;</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul</label><input type="text" value={s.home_featured_title ?? 'Produk Unggulan'} onChange={e => set('home_featured_title', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Subtitle</label><input type="text" value={s.home_featured_desc ?? ''} onChange={e => set('home_featured_desc', e.target.value)} className={inpCls} /></div>
              </div>
              <div className="bg-brand-light rounded-[8px] p-4 flex flex-col gap-3">
                <p className="text-xs font-bold text-brand-dark uppercase tracking-wider">Tab Produk Katalog</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Label Tab Katalog</label>
                    <input type="text" value={s.home_featured_product_label ?? 'Produk Katalog'} onChange={e => set('home_featured_product_label', e.target.value)} className={inpCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Jumlah Produk Tampil</label>
                    <input type="number" min={0} max={12} value={s.home_featured_product_count ?? '4'} onChange={e => set('home_featured_product_count', e.target.value)} className={inpCls} />
                  </div>
                </div>
              </div>
              <div className="bg-brand-light rounded-[8px] p-4 flex flex-col gap-3">
                <p className="text-xs font-bold text-brand-dark uppercase tracking-wider">Tab Campaign Penyaluran</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Label Tab Campaign</label>
                    <input type="text" value={s.home_featured_campaign_label ?? 'Campaign Penyaluran'} onChange={e => set('home_featured_campaign_label', e.target.value)} className={inpCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Jumlah Campaign Tampil</label>
                    <input type="number" min={0} max={12} value={s.home_featured_campaign_count ?? '4'} onChange={e => set('home_featured_campaign_count', e.target.value)} className={inpCls} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-brand-muted">
                Atur jumlah ke <strong>0</strong> untuk menyembunyikan tab. Jika hanya satu tab yang aktif,
                toggle tab disembunyikan otomatis dan konten ditampilkan langsung.
              </p>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <h2 className="font-bold text-brand-dark text-base">Section &quot;Cara Pesan Kurban&quot;</h2>
                <button onClick={() => setHomeSteps(p => [...p, { title: '', desc: '', icon: 'check' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah Langkah
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul</label><input type="text" value={s.home_steps_title ?? 'Cara Pesan Kurban'} onChange={e => set('home_steps_title', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Subtitle</label><input type="text" value={s.home_steps_desc ?? ''} onChange={e => set('home_steps_desc', e.target.value)} className={inpCls} /></div>
              </div>
              {homeSteps.map((step, i) => (
                <div key={i} className="bg-brand-light rounded-[8px] p-3 flex flex-col gap-1.5 relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-brand-muted">Langkah {i + 1}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHomeSteps(p => {
                          if (i === 0) return p
                          const next = [...p]; const tmp = next[i - 1]; next[i - 1] = next[i]; next[i] = tmp; return next
                        })}
                        disabled={i === 0}
                        className="w-6 h-6 flex items-center justify-center text-brand-muted hover:text-brand-dark disabled:opacity-30"
                        aria-label="Naik"
                      >
                        <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                      </button>
                      <button
                        onClick={() => setHomeSteps(p => {
                          if (i === p.length - 1) return p
                          const next = [...p]; const tmp = next[i + 1]; next[i + 1] = next[i]; next[i] = tmp; return next
                        })}
                        disabled={i === homeSteps.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-brand-muted hover:text-brand-dark disabled:opacity-30"
                        aria-label="Turun"
                      >
                        <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                      </button>
                      <button onClick={() => setHomeSteps(p => p.filter((_, idx) => idx !== i))} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600">
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <IconPicker value={step.icon ?? 'check'} onChange={key => setHomeSteps(p => p.map((x, idx) => idx === i ? { ...x, icon: key } : x))} />
                    <input type="text" value={step.title} onChange={e => setHomeSteps(p => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Judul" className={inpCls} style={{ height: 34 }} />
                  </div>
                  <input type="text" value={step.desc} onChange={e => setHomeSteps(p => p.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} placeholder="Deskripsi" className={inpCls} style={{ height: 34 }} />
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <h2 className="font-bold text-brand-dark text-base">Testimoni Pelanggan</h2>
                <button onClick={() => setHomeTestimonials(p => [...p, { name: '', city: '', stars: 5, text: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul Section</label><input type="text" value={s.home_testimonials_title ?? 'Kata Pelanggan Kami'} onChange={e => set('home_testimonials_title', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Subtitle</label><input type="text" value={s.home_testimonials_desc ?? ''} onChange={e => set('home_testimonials_desc', e.target.value)} className={inpCls} /></div>
              </div>
              {homeTestimonials.map((t, i) => (
                <div key={i} className="bg-brand-light rounded-[8px] p-3 flex flex-col gap-1.5 relative">
                  <button onClick={() => setHomeTestimonials(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={t.name} onChange={e => setHomeTestimonials(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Nama" className={inpCls} style={{ height: 34 }} />
                    <input type="text" value={t.city} onChange={e => setHomeTestimonials(p => p.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x))} placeholder="Kota" className={inpCls} style={{ height: 34 }} />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-brand-muted">Bintang:</span>
                      <input type="number" min={1} max={5} value={t.stars} onChange={e => setHomeTestimonials(p => p.map((x, idx) => idx === i ? { ...x, stars: parseInt(e.target.value) || 5 } : x))} className={inpCls} style={{ height: 34 }} />
                    </div>
                  </div>
                  <textarea rows={2} value={t.text} onChange={e => setHomeTestimonials(p => p.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))} placeholder="Isi testimoni" className={`${inpCls} resize-none`} />
                </div>
              ))}
            </div>

            {/* CTA Bottom */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Section CTA Bawah (Tentang Yayasan)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelCls}>Badge</label><input type="text" value={s.home_cta_badge ?? 'Yayasan One Ummah'} onChange={e => set('home_cta_badge', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Judul Baris 1</label><input type="text" value={s.home_cta_title_1 ?? 'Menjaga Amanah,'} onChange={e => set('home_cta_title_1', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Judul Baris 2 (emas)</label><input type="text" value={s.home_cta_title_2 ?? 'Menyempurnakan Ibadah'} onChange={e => set('home_cta_title_2', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Teks Tombol</label><input type="text" value={s.home_cta_btn ?? 'Mulai Pesan Kurban'} onChange={e => set('home_cta_btn', e.target.value)} className={inpCls} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Deskripsi</label><textarea rows={2} value={s.home_cta_desc ?? ''} onChange={e => set('home_cta_desc', e.target.value)} className={`${inpCls} resize-none`} /></div>
                <div><label className={labelCls}>Link Tombol</label><input type="text" value={s.home_cta_btn_href ?? '/katalog'} onChange={e => set('home_cta_btn_href', e.target.value)} className={inpCls} /></div>
              </div>
            </div>

            <button disabled={isPending} onClick={() => save(
              ['home_badge','home_hero_title_1','home_hero_title_2','home_hero_desc','home_cta_primary','home_cta_primary_href','home_cta_secondary','home_cta_secondary_href',
               'home_features_title','home_features_desc','home_featured_title','home_featured_desc',
               'home_featured_product_label','home_featured_product_count',
               'home_featured_campaign_label','home_featured_campaign_count',
               'home_steps_title','home_steps_desc','home_testimonials_title','home_testimonials_desc',
               'home_cta_badge','home_cta_title_1','home_cta_title_2','home_cta_desc','home_cta_btn','home_cta_btn_href'],
              { home_stats: JSON.stringify(homeStats), home_features: JSON.stringify(homeFeatures),
                home_steps: JSON.stringify(homeSteps), home_testimonials: JSON.stringify(homeTestimonials) }
            )} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Halaman Depan
            </button>
          </div>
        )}

        {/* ═══ PENYALURAN ═══ */}
        {tab === 'penyaluran' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Hero Section Penyaluran</h2>
              <div><label className={labelCls}>Badge</label><input type="text" value={s.penyaluran_badge ?? 'Qurban Penyaluran 1447H'} onChange={e => set('penyaluran_badge', e.target.value)} className={inpCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul Baris 1</label><input type="text" value={s.penyaluran_hero_title_1 ?? 'Salurkan Qurban ke'} onChange={e => set('penyaluran_hero_title_1', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Judul Baris 2 (emas)</label><input type="text" value={s.penyaluran_hero_title_2 ?? 'Mereka yang Membutuhkan'} onChange={e => set('penyaluran_hero_title_2', e.target.value)} className={inpCls} /></div>
              </div>
              <div><label className={labelCls}>Deskripsi</label><textarea rows={2} value={s.penyaluran_hero_desc ?? ''} onChange={e => set('penyaluran_hero_desc', e.target.value)} className={`${inpCls} resize-none`} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>Trust Badge 1</label><input type="text" value={s.penyaluran_trust_1 ?? 'Terverifikasi MUI'} onChange={e => set('penyaluran_trust_1', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Trust Badge 2</label><input type="text" value={s.penyaluran_trust_2 ?? '635+ Donatur'} onChange={e => set('penyaluran_trust_2', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Trust Badge 3</label><input type="text" value={s.penyaluran_trust_3 ?? 'Amanah sejak 2019'} onChange={e => set('penyaluran_trust_3', e.target.value)} className={inpCls} /></div>
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base">Dampak Program (Statistik Bawah)</h2>
                  <div><label className={labelCls + ' mt-2'}>Judul Section</label><input type="text" value={s.penyaluran_impact_title ?? 'Dampak Program Sejak 2019'} onChange={e => set('penyaluran_impact_title', e.target.value)} className={inpCls} /></div>
                </div>
                <button onClick={() => setImpactStats(p => [...p, { stat: '', label: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark self-start mt-1">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {impactStats.map((stat, i) => (
                  <div key={i} className="flex gap-2 items-center bg-brand-light rounded-[8px] p-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input type="text" value={stat.stat} onChange={e => setImpactStats(p => p.map((x, idx) => idx === i ? { ...x, stat: e.target.value } : x))} placeholder="1.247" className={inpCls} style={{ height: 34 }} />
                      <input type="text" value={stat.label} onChange={e => setImpactStats(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Ekor Tersalurkan" className={inpCls} style={{ height: 34 }} />
                    </div>
                    <button onClick={() => setImpactStats(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={isPending} onClick={() => save(
              ['penyaluran_badge','penyaluran_hero_title_1','penyaluran_hero_title_2','penyaluran_hero_desc',
               'penyaluran_trust_1','penyaluran_trust_2','penyaluran_trust_3','penyaluran_impact_title'],
              { penyaluran_impact_stats: JSON.stringify(impactStats) }
            )} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Halaman Penyaluran
            </button>
          </div>
        )}

        {/* ═══ KATALOG ═══ */}
        {tab === 'katalog' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Hero Section Katalog</h2>
              <div><label className={labelCls}>Judul Halaman</label><input type="text" value={s.katalog_hero_title ?? 'Katalog Hewan Kurban'} onChange={e => set('katalog_hero_title', e.target.value)} className={inpCls} /></div>
              <div><label className={labelCls}>Subtitle / Deskripsi</label><textarea rows={2} value={s.katalog_hero_desc ?? 'Pilih hewan kurban terbaik — sehat, memenuhi syarat syariat, dan siap diantar ke lokasi Anda.'} onChange={e => set('katalog_hero_desc', e.target.value)} className={`${inpCls} resize-none`} /></div>
            </div>
            <button disabled={isPending} onClick={() => save(['katalog_hero_title','katalog_hero_desc'])}
              className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Halaman Katalog
            </button>
          </div>
        )}

        {/* ═══ HEADER & MENU ═══ */}
        {tab === 'header' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Identitas Brand</h2>
              <div>
                <label className={labelCls}>Nama Toko / Brand</label>
                <input type="text" value={s.store_name ?? 'Beyond Qurban'} onChange={e => set('store_name', e.target.value)} className={inpCls} placeholder="Beyond Qurban" />
              </div>
              {/* Logo + Favicon upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo */}
                <div className="bg-brand-light rounded-[10px] p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-brand-dark border border-brand-muted/20 flex items-center justify-center shrink-0">
                    {s.site_logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.site_logo_url} alt="logo" className="w-full h-full object-contain" />
                      : <FontAwesomeIcon icon={faImage} className="text-brand-muted/40 text-2xl" />
                    }
                    {brandUploading === 'logo' && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-brand-surface border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <label className={labelCls}>Logo Header</label>
                    <p className="text-[11px] text-brand-muted leading-snug">PNG / SVG · maks 2MB · transparan disarankan</p>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-brand-surface hover:text-brand-dark">
                        <FontAwesomeIcon icon={faUpload} className="text-[11px]" /> Upload
                        <input type="file" accept="image/png,image/svg+xml" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleBrandUpload('logo', f) }} />
                      </label>
                      {s.site_logo_url && (
                        <button
                          onClick={() => {
                            set('site_logo_url', '')
                            startTransition(async () => { await saveSettings({ site_logo_url: '' }); showToast('Logo dihapus') })
                          }}
                          className="text-xs text-red-400 hover:text-red-600">Hapus</button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Favicon */}
                <div className="bg-brand-light rounded-[10px] p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-brand-dark border border-brand-muted/20 flex items-center justify-center shrink-0">
                    {s.site_favicon_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.site_favicon_url} alt="favicon" className="w-full h-full object-contain" />
                      : <FontAwesomeIcon icon={faImage} className="text-brand-muted/40 text-2xl" />
                    }
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <label className={labelCls}>Favicon</label>
                    <p className="text-[11px] text-brand-muted leading-snug">ICO / PNG · maks 500KB · disarankan 32×32</p>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-brand-surface hover:text-brand-dark">
                        <FontAwesomeIcon icon={faUpload} className="text-[11px]" /> Upload
                        <input type="file" accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleBrandUpload('favicon', f) }} />
                      </label>
                      {s.site_favicon_url && (
                        <button
                          onClick={() => {
                            set('site_favicon_url', '')
                            startTransition(async () => { await saveSettings({ site_favicon_url: '' }); showToast('Favicon dihapus') })
                          }}
                          className="text-xs text-red-400 hover:text-red-600">Hapus</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Teks Tombol CTA Header</label>
                  <input type="text" value={s.header_cta_text ?? 'Beli Sekarang'} onChange={e => set('header_cta_text', e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>Link Tombol CTA Header</label>
                  <input type="text" value={s.header_cta_href ?? '/katalog'} onChange={e => set('header_cta_href', e.target.value)} className={inpCls} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base">Menu Navigasi</h2>
                  <p className="text-xs text-brand-muted mt-0.5">Urutan dari atas ke bawah</p>
                </div>
                <button onClick={() => setNavItems(p => [...p, { label: '', href: '/' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah Item
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center bg-brand-light rounded-[8px] px-3 py-2">
                    <span className="text-brand-muted text-xs w-5 text-center">{i + 1}</span>
                    <input type="text" value={item.label} onChange={e => setNavItems(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label Menu" className={`${inpCls} flex-1`} style={{ height: 36 }} />
                    <div className="flex items-center gap-1.5 flex-1">
                      <FontAwesomeIcon icon={faLink} className="text-brand-muted text-xs shrink-0" />
                      <input type="text" value={item.href} onChange={e => setNavItems(p => p.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} placeholder="/katalog" className={`${inpCls} flex-1`} style={{ height: 36 }} />
                    </div>
                    <button onClick={() => setNavItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={isPending} onClick={() => save(['store_name','header_cta_text','header_cta_href'], { nav_items: JSON.stringify(navItems) })}
              className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Header & Menu
            </button>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        {tab === 'footer' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Informasi Footer</h2>
              <div>
                <label className={labelCls}>Deskripsi Singkat</label>
                <textarea rows={2} value={s.footer_description ?? 'Menyediakan hewan kurban berkualitas, sehat, dan dirawat sesuai syariat.'} onChange={e => set('footer_description', e.target.value)} className={`${inpCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Alamat</label>
                <input type="text" value={s.footer_address ?? 'Jl. Peternakan Raya No. 12, Lembang, Bandung Barat'} onChange={e => set('footer_address', e.target.value)} className={inpCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nomor Telepon / WA</label>
                  <input type="text" value={s.footer_phone ?? '+62 812-3456-7890'} onChange={e => set('footer_phone', e.target.value)} className={inpCls} placeholder="+62 812-3456-7890" />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={s.footer_email ?? 'info@beyondqurban.com'} onChange={e => set('footer_email', e.target.value)} className={inpCls} placeholder="info@beyondqurban.com" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Teks Copyright</label>
                <input type="text" value={s.footer_copyright ?? '© 2025 Beyond Qurban — Yayasan One Ummah. All Rights Reserved.'} onChange={e => set('footer_copyright', e.target.value)} className={inpCls} />
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Media Sosial</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Link Instagram</label>
                  <input type="text" value={s.footer_instagram ?? '#'} onChange={e => set('footer_instagram', e.target.value)} className={inpCls} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className={labelCls}>Link Facebook</label>
                  <input type="text" value={s.footer_facebook ?? '#'} onChange={e => set('footer_facebook', e.target.value)} className={inpCls} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className={labelCls}>Link WhatsApp</label>
                  <input type="text" value={s.footer_whatsapp ?? 'https://wa.me/6281234567890'} onChange={e => set('footer_whatsapp', e.target.value)} className={inpCls} placeholder="https://wa.me/628..." />
                </div>
              </div>
            </div>

            <button disabled={isPending} onClick={() => save(['footer_description','footer_address','footer_phone','footer_email','footer_copyright','footer_instagram','footer_facebook','footer_whatsapp'])}
              className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Footer
            </button>
          </div>
        )}

        {/* ═══ TENTANG KAMI ═══ */}
        {tab === 'tentang' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Hero Section</h2>
              <div>
                <label className={labelCls}>Badge (label kecil atas)</label>
                <input type="text" value={s.about_badge ?? 'Yayasan One Ummah'} onChange={e => set('about_badge', e.target.value)} className={inpCls} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Judul Baris 1</label>
                  <input type="text" value={s.about_title_1 ?? 'Menjaga Amanah,'} onChange={e => set('about_title_1', e.target.value)} className={inpCls} />
                </div>
                <div>
                  <label className={labelCls}>Judul Baris 2 (aksen emas)</label>
                  <input type="text" value={s.about_title_2 ?? 'Menyempurnakan Ibadah'} onChange={e => set('about_title_2', e.target.value)} className={inpCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea rows={4} value={s.about_description ?? 'Beyond Qurban adalah program Yayasan One Ummah yang hadir untuk memudahkan umat Islam menunaikan ibadah kurban secara benar, transparan, dan penuh amanah sejak 2019.'} onChange={e => set('about_description', e.target.value)} className={`${inpCls} resize-none`} />
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <h2 className="font-bold text-brand-dark text-base">Statistik Pencapaian</h2>
                <button onClick={() => setAboutStats(p => [...p, { value: '', label: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aboutStats.map((stat, i) => (
                  <div key={i} className="flex gap-2 items-center bg-brand-light rounded-[8px] p-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input type="text" value={stat.value} onChange={e => setAboutStats(p => p.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="2019" className={inpCls} style={{ height: 34 }} />
                      <input type="text" value={stat.label} onChange={e => setAboutStats(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Tahun Berdiri" className={inpCls} style={{ height: 34 }} />
                    </div>
                    <button onClick={() => setAboutStats(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Visi & Misi</h2>
              <div>
                <label className={labelCls}>Visi</label>
                <textarea rows={3} value={s.about_vision ?? 'Menjadi platform kurban digital terpercaya yang menghubungkan donatur dengan penerima manfaat secara transparan.'} onChange={e => set('about_vision', e.target.value)} className={`${inpCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Misi</label>
                <textarea rows={4} value={s.about_mission ?? 'Menyediakan hewan kurban berkualitas, memastikan penyembelihan sesuai syariat, mendistribusikan ke masyarakat yang membutuhkan, dan memberikan laporan transparan kepada donatur.'} onChange={e => set('about_mission', e.target.value)} className={`${inpCls} resize-none`} />
              </div>
            </div>

            {/* Kenapa Pilih Kami */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base">Section "Kenapa Pilih Kami"</h2>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><label className={labelCls}>Judul</label><input type="text" value={s.about_why_title ?? 'Kenapa Pilih Kami?'} onChange={e => set('about_why_title', e.target.value)} className={inpCls} /></div>
                    <div><label className={labelCls}>Subtitle</label><input type="text" value={s.about_why_desc ?? ''} onChange={e => set('about_why_desc', e.target.value)} className={inpCls} /></div>
                  </div>
                </div>
                <button onClick={() => setWhyItems(p => [...p, { title: '', desc: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark self-start mt-1">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {whyItems.map((item, i) => (
                  <div key={i} className="bg-brand-light rounded-[8px] p-3 flex flex-col gap-1.5 relative">
                    <button onClick={() => setWhyItems(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button>
                    <input type="text" value={item.title} onChange={e => setWhyItems(p => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Judul" className={inpCls} style={{ height: 34 }} />
                    <textarea rows={2} value={item.desc} onChange={e => setWhyItems(p => p.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} placeholder="Deskripsi" className={`${inpCls} resize-none`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Tim Kami */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-brand-muted/10 pb-3">
                <div>
                  <h2 className="font-bold text-brand-dark text-base">Section "Tim Kami"</h2>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><label className={labelCls}>Judul</label><input type="text" value={s.about_team_title ?? 'Tim Kami'} onChange={e => set('about_team_title', e.target.value)} className={inpCls} /></div>
                    <div><label className={labelCls}>Subtitle</label><input type="text" value={s.about_team_desc ?? ''} onChange={e => set('about_team_desc', e.target.value)} className={inpCls} /></div>
                  </div>
                </div>
                <button onClick={() => setTeamMembers(p => [...p, { name: '', role: '', desc: '' }])}
                  className="flex items-center gap-1.5 text-brand-surface font-semibold text-xs hover:text-brand-dark self-start mt-1">
                  <FontAwesomeIcon icon={faPlus} /> Tambah
                </button>
              </div>
              <p className="text-xs text-brand-muted -mt-2">
                📐 Ukuran foto yang direkomendasikan: <strong>400 × 480px</strong> (rasio 5:6, portrait) · Format JPG/PNG/WebP · Maks 3MB
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamMembers.map((member, i) => (
                  <div key={i} className="bg-brand-light rounded-[10px] p-3 flex gap-3 relative">
                    {/* Foto */}
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                      <div className="w-20 h-24 rounded-[8px] overflow-hidden bg-brand-muted/10 border border-brand-muted/20 flex items-center justify-center relative">
                        {member.imageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                          : <FontAwesomeIcon icon={faUser} className="text-brand-muted/40 text-3xl" />
                        }
                        {uploadingIdx === i && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-brand-surface border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer flex items-center gap-1 text-[10px] font-semibold text-brand-surface hover:text-brand-dark">
                        <FontAwesomeIcon icon={faUpload} className="text-[9px]" />
                        Upload
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleTeamPhotoUpload(i, f) }} />
                      </label>
                      {member.imageUrl && (
                        <button onClick={() => setTeamMembers(p => p.map((x, idx) => idx === i ? { ...x, imageUrl: '' } : x))}
                          className="text-[10px] text-red-400 hover:text-red-600">Hapus</button>
                      )}
                    </div>
                    {/* Fields */}
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <button onClick={() => setTeamMembers(p => p.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                      <input type="text" value={member.name} onChange={e => setTeamMembers(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Nama lengkap" className={inpCls} style={{ height: 32 }} />
                      <input type="text" value={member.role} onChange={e => setTeamMembers(p => p.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} placeholder="Jabatan" className={inpCls} style={{ height: 32 }} />
                      <textarea rows={2} value={member.desc} onChange={e => setTeamMembers(p => p.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} placeholder="Deskripsi singkat" className={`${inpCls} resize-none text-xs`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hubungi Kami */}
            <div className="bg-white rounded-[12px] border border-brand-muted/20 p-6 flex flex-col gap-4">
              <h2 className="font-bold text-brand-dark text-base border-b border-brand-muted/10 pb-3">Section "Hubungi Kami"</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Judul Section</label><input type="text" value={s.about_contact_title ?? 'Hubungi Kami'} onChange={e => set('about_contact_title', e.target.value)} className={inpCls} /></div>
                <div><label className={labelCls}>Subtitle</label><input type="text" value={s.about_contact_desc ?? 'Ada pertanyaan? Tim kami siap membantu Anda.'} onChange={e => set('about_contact_desc', e.target.value)} className={inpCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>Alamat</label><textarea rows={2} value={s.footer_address ?? ''} onChange={e => set('footer_address', e.target.value)} className={`${inpCls} resize-none`} placeholder="Jl. Peternakan Raya No.12..." /></div>
                <div><label className={labelCls}>Telepon / WhatsApp</label><input type="text" value={s.footer_phone ?? ''} onChange={e => set('footer_phone', e.target.value)} className={inpCls} placeholder="+62 812-3456-7890" /></div>
                <div><label className={labelCls}>Email</label><input type="email" value={s.footer_email ?? ''} onChange={e => set('footer_email', e.target.value)} className={inpCls} placeholder="info@beyondqurban.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Link WhatsApp (tombol)</label><input type="text" value={s.footer_whatsapp ?? ''} onChange={e => set('footer_whatsapp', e.target.value)} className={inpCls} placeholder="https://wa.me/628..." /></div>
                <div><label className={labelCls}>Link Instagram (tombol)</label><input type="text" value={s.footer_instagram ?? ''} onChange={e => set('footer_instagram', e.target.value)} className={inpCls} placeholder="https://instagram.com/..." /></div>
              </div>
              <p className="text-xs text-brand-muted">ℹ️ Data ini juga dipakai di Footer website.</p>
            </div>

            <button disabled={isPending} onClick={() => save(
              ['about_badge','about_title_1','about_title_2','about_description','about_vision','about_mission',
               'about_why_title','about_why_desc','about_team_title','about_team_desc',
               'about_contact_title','about_contact_desc',
               'footer_address','footer_phone','footer_email','footer_whatsapp','footer_instagram'],
              { about_stats: JSON.stringify(aboutStats), about_why_items: JSON.stringify(whyItems), about_team: JSON.stringify(teamMembers) }
            )} className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium w-fit disabled:opacity-60">
              <FontAwesomeIcon icon={faFloppyDisk} /> Simpan Tentang Kami
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-[100] bg-brand-dark text-brand-accent-light px-5 py-3 rounded-[10px] text-sm font-medium flex items-center gap-2 shadow-lg transition-all duration-300 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <FontAwesomeIcon icon={faFloppyDisk} className="text-brand-accent" />
        {toast}
      </div>
    </>
  )
}
