import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCow, faHouse, faMagnifyingGlass, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'

export default function NotFound() {
  return (
    <div className="font-sans antialiased min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-brand-surface/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Floating sheep icon */}
        <div className="float mb-8">
          <div className="w-40 h-40 bg-brand-surface/40 rounded-full border-2 border-brand-surface-light/30 flex items-center justify-center backdrop-blur-sm">
            <FontAwesomeIcon icon={faCow} className="text-7xl text-brand-accent/60" />
          </div>
        </div>

        {/* 404 */}
        <div className="font-serif text-[120px] font-bold leading-none mb-2 shimmer-text">404</div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-light mb-4">
          Aduh, Halaman Tersesat!
        </h1>
        <p className="text-brand-accent-light/65 text-base leading-relaxed mb-10">
          Sepertinya domba yang Anda cari sedang berkeliaran di padang rumput lain. Halaman yang dituju tidak ditemukan atau sudah dipindahkan.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/" className="flex items-center justify-center gap-2 bg-cta-gradient text-brand-text-dark font-bold py-3.5 px-8 rounded-[20px] shadow-lg hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faHouse} /> Kembali ke Homepage
          </Link>
          <Link href="/katalog" className="flex items-center justify-center gap-2 bg-brand-surface/40 backdrop-blur-md border border-brand-surface-light text-brand-light hover:border-brand-accent hover:text-brand-accent font-medium py-3.5 px-8 rounded-[20px] transition-all">
            <FontAwesomeIcon icon={faCow} /> Lihat Katalog
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link href="/lacak-pesanan" className="text-brand-accent-light/50 hover:text-brand-accent text-sm transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" /> Lacak Pesanan
          </Link>
          <span className="text-brand-surface-light/40">·</span>
          <Link href="/tentang-kami" className="text-brand-accent-light/50 hover:text-brand-accent text-sm transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCircleInfo} className="text-xs" /> Tentang Kami
          </Link>
          <span className="text-brand-surface-light/40">·</span>
          <a href="https://wa.me/6281234567890" className="text-brand-accent-light/50 hover:text-brand-accent text-sm transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faWhatsapp} className="text-xs" /> Hubungi Admin
          </a>
        </div>

        <p className="mt-8 text-brand-accent-light/30 text-xs">© 2025 Beyond Qurban — Yayasan One Ummah</p>
      </div>
    </div>
  )
}
