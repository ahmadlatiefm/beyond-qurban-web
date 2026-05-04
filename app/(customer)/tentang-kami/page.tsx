import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye, faBullseye, faCheck, faShieldHalved, faCamera,
  faStarAndCrescent, faTruckFast, faUser,
  faLocationDot, faPhone, faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons'

export default function TentangKamiPage() {
  return (
    <main className="pt-20">
      {/* HERO */}
      <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-surface/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-brand-accent/8 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-brand-accent font-bold text-xs uppercase tracking-widest border border-brand-accent/40 px-4 py-1.5 rounded-full inline-block mb-6">Yayasan One Ummah</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-light leading-tight mb-5">
              Menjaga Amanah,<br /><span className="text-brand-accent">Menyempurnakan Ibadah</span>
            </h1>
            <p className="text-brand-accent-light/75 text-lg font-light leading-relaxed mb-8">Beyond Qurban adalah program Yayasan One Ummah yang hadir untuk memudahkan umat Islam menunaikan ibadah kurban secara benar, transparan, dan penuh amanah sejak 2019.</p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/katalog" className="bg-cta-gradient text-brand-text-dark font-bold py-3 px-7 rounded-[20px] shadow-premium hover:scale-105 transition-transform text-sm flex items-center gap-2">
                Lihat Katalog
              </Link>
              <a href="#kontak" className="border border-brand-surface-light text-brand-light hover:border-brand-accent hover:text-brand-accent font-medium py-3 px-7 rounded-[20px] transition-all text-sm">
                Hubungi Kami
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: '2019', label: 'Tahun Berdiri' },
              { stat: '1.2K+', label: 'Kurban Terlaksana' },
              { stat: '850+', label: 'Pelanggan Puas' },
              { stat: '98%', label: 'Kepuasan Pelanggan' },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-brand-surface/40 border border-brand-surface-light/30 rounded-[14px] p-6 backdrop-blur-sm">
                <div className="font-serif text-4xl font-bold text-brand-accent mb-1">{stat}</div>
                <div className="text-brand-accent-light/70 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '50px' }}>
            <path d="M0,40 C300,80 900,0 1200,40 L1200,60 L0,60 Z" fill="#FAFAF8" />
          </svg>
        </div>
      </section>

      {/* VISI & MISI */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="bg-brand-dark rounded-[16px] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-surface/20 rounded-bl-full" />
              <div className="w-12 h-12 bg-brand-accent/20 rounded-[12px] flex items-center justify-center mb-5 relative z-10">
                <FontAwesomeIcon icon={faEye} className="text-brand-accent text-xl" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-brand-light mb-4 relative z-10">Visi</h2>
              <p className="text-brand-accent-light/80 leading-relaxed relative z-10">Menjadi platform kurban digital terpercaya di Indonesia yang menghubungkan umat Islam dengan peternakan terbaik, memastikan setiap ibadah kurban terlaksana sesuai syariat Islam dengan penuh transparansi dan amanah.</p>
            </div>
            <div className="bg-brand-surface rounded-[16px] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-surface-light/20 rounded-bl-full" />
              <div className="w-12 h-12 bg-brand-accent/20 rounded-[12px] flex items-center justify-center mb-5 relative z-10">
                <FontAwesomeIcon icon={faBullseye} className="text-brand-accent text-xl" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-brand-light mb-4 relative z-10">Misi</h2>
              <ul className="text-brand-accent-light/80 leading-relaxed relative z-10 flex flex-col gap-3">
                {['Menyediakan hewan kurban berkualitas yang memenuhi standar syariat dan kesehatan','Memberikan transparansi penuh melalui dokumentasi foto dan video real-time','Memudahkan proses pemesanan dan pengiriman kurban ke seluruh Indonesia','Memperluas program penyaluran kurban ke daerah terpencil dan negara membutuhkan'].map((m) => (
                  <li key={m} className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faCheck} className="text-brand-accent mt-0.5 text-sm shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* KENAPA PILIH KAMI */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg,#FAFAF8,#E8F4EE)' }}>
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">Kenapa Pilih Kami?</h2>
            <p className="text-brand-muted max-w-xl mx-auto">Empat alasan utama mengapa ribuan keluarga mempercayakan ibadah kurban mereka kepada Beyond Qurban.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: faShieldHalved, title: 'Terpercaya', desc: 'Berpengalaman sejak 2019 dengan rekam jejak lebih dari 1.200 kurban terlaksana dan ribuan pelanggan puas.' },
              { icon: faCamera, title: 'Transparan', desc: 'Update foto dan video kondisi hewan kurban dikirim rutin ke WhatsApp Anda. Lacak pesanan real-time kapan saja.' },
              { icon: faStarAndCrescent, title: 'Tersertifikasi MUI', desc: 'Proses penyembelihan dan perawatan hewan sesuai standar MUI. Setiap hewan melalui pemeriksaan dokter hewan bersertifikat.' },
              { icon: faTruckFast, title: 'Pengiriman Seluruh Indonesia', desc: 'Layanan pengiriman gratis ke seluruh wilayah Indonesia dengan jadwal fleksibel dan armada terstandar.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-[14px] p-7 shadow-premium border border-brand-muted/10 flex flex-col items-start gap-4">
                <div className="w-14 h-14 rounded-[14px] bg-brand-dark flex items-center justify-center">
                  <FontAwesomeIcon icon={icon} className="text-brand-accent text-2xl" />
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-dark">{title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIM KAMI */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-3">Tim Kami</h2>
            <p className="text-brand-muted">Orang-orang berdedikasi di balik layanan Beyond Qurban.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Ustaz Ahmad Faris', role: 'Direktur Utama', desc: 'Pengasuh pesantren & pakar syariat kurban dengan pengalaman 15 tahun.', gradient: 'from-brand-surface to-brand-dark' },
              { name: 'drh. Siti Nurhaliza', role: 'Kepala Veteriner', desc: 'Dokter hewan berlisensi, memastikan setiap hewan sehat dan memenuhi syarat.', gradient: 'from-brand-surface-light to-brand-surface' },
              { name: 'Bapak Ridwan Kamil', role: 'Kepala Operasional', desc: 'Mengawasi proses logistik dan pengiriman ke seluruh wilayah Indonesia.', gradient: 'from-brand-accent/60 to-brand-dark' },
              { name: 'Nadia Rahmawati', role: 'Customer Relations', desc: 'Memastikan setiap pelanggan mendapat pengalaman terbaik dari awal hingga akhir.', gradient: 'from-brand-surface to-brand-surface-light' },
            ].map(({ name, role, desc, gradient }) => (
              <div key={name} className="bg-white rounded-[14px] overflow-hidden shadow-premium border border-brand-muted/10 text-center">
                <div className={`h-52 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <FontAwesomeIcon icon={faUser} className="text-5xl text-brand-accent/30" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-bold text-brand-dark">{name}</h3>
                  <p className="text-brand-accent text-xs font-semibold uppercase tracking-wider mt-1 mb-2">{role}</p>
                  <p className="text-brand-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-light mb-3">Hubungi Kami</h2>
            <p className="text-brand-accent-light/70">Ada pertanyaan? Tim kami siap membantu Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: faLocationDot, label: 'Alamat', value: 'Jl. Peternakan Raya No. 12\nLembang, Bandung Barat' },
              { icon: faPhone, label: 'Telepon / WhatsApp', value: '+62 812-3456-7890' },
              { icon: faEnvelope, label: 'Email', value: 'info@beyondqurban.com' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-brand-surface/30 border border-brand-surface-light/20 rounded-[14px] p-6 text-center">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={icon} className="text-brand-accent" />
                </div>
                <h3 className="font-bold text-brand-light text-sm mb-2">{label}</h3>
                <p className="text-brand-accent-light/70 text-sm whitespace-pre-line">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-10">
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white font-bold py-3 px-6 rounded-[20px] hover:bg-[#1ea855] transition-colors">
              <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
            </a>
            <a href="https://instagram.com/beyondqurban" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-brand-surface border border-brand-surface-light text-brand-light font-bold py-3 px-6 rounded-[20px] hover:border-brand-accent transition-colors">
              <FontAwesomeIcon icon={faInstagram} /> Instagram
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
