'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faHeart, faMagnifyingGlassLocation, faHouse, faLink } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faFacebookF, faXTwitter } from '@fortawesome/free-brands-svg-icons'

function TerimakasihContent() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || 'BQ-2025-0001'
  const type = params.get('type') || 'regular' // 'regular' | 'penyaluran'
  const dest = params.get('dest') || '' // 'indonesia' | 'afrika' | 'palestina'
  const nama = params.get('nama') || 'Bapak/Ibu'

  const isPenyaluran = type === 'penyaluran'

  const destLabels: Record<string, string> = {
    indonesia: '🇮🇩 Pedalaman Indonesia',
    afrika: '🌍 Afrika Sub-Sahara',
    palestina: '🇵🇸 Palestina',
  }

  const badgeText = isPenyaluran ? 'Donasi Diterima' : 'Pembayaran Dikonfirmasi'
  const mainIcon = isPenyaluran ? faHeart : faCircleCheck
  const heading2 = isPenyaluran ? `${nama}!` : `${nama}!`
  const subheading = isPenyaluran
    ? 'Donasi qurban penyaluran Anda telah kami terima. Semoga Allah SWT menerima amal ibadah Anda dan memberikan keberkahan berlipat ganda. 🤲'
    : 'Pembayaran Anda telah kami terima. Hewan kurban Anda akan dirawat dengan penuh amanah hingga hari penyembelihan. Semoga diterima Allah SWT. 🤲'
  const step2 = isPenyaluran
    ? `Hewan kurban akan disiapkan dan disalurkan langsung ke ${destLabels[dest] || 'destinasi pilihan Anda'}`
    : 'Hewan kurban Anda akan dirawat dan dipantau hingga hari pengiriman'
  const step3 = isPenyaluran
    ? 'Laporan foto, video, dan sertifikat penyaluran qurban dikirim via WhatsApp'
    : 'Update foto hewan kurban dikirim rutin via WhatsApp hingga hari H'
  const waShareText = isPenyaluran
    ? `Alhamdulillah, saya baru saja berqurban penyaluran melalui #BeyondQurban1447H ke ${destLabels[dest] || ''} 🐑 Yuk ikut berqurban!`
    : 'Alhamdulillah, saya baru saja memesan hewan kurban melalui Beyond Qurban 🐑 Yuk pesan juga!'

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Floating icon */}
      <div className="float scale-in mb-8">
        <div className="w-28 h-28 rounded-full bg-brand-surface border-4 border-brand-accent/40 flex items-center justify-center shadow-[0_0_40px_rgba(200,150,42,0.3)]">
          <FontAwesomeIcon icon={mainIcon} className="text-5xl text-brand-accent" />
        </div>
      </div>

      <div className="max-w-lg w-full text-center">
        {/* Badge */}
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 bg-brand-surface/40 border border-brand-surface-light/30 px-4 py-1.5 rounded-[20px] mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" style={{ animation: 'pulse-dot 2s infinite' }} />
            <span className="text-brand-accent-light text-xs font-medium uppercase tracking-wider">{badgeText}</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 fade-up-2">
          <span className="text-brand-light block">Jazakallah Khairan,</span>
          <span className="shimmer-text block mt-1">{heading2}</span>
        </h1>

        <p className="text-brand-accent-light/70 text-base md:text-lg font-light leading-relaxed mb-8 fade-up-3 max-w-md mx-auto">{subheading}</p>

        {/* Order info card */}
        <div className="bg-brand-surface/40 border border-brand-surface-light/30 rounded-[16px] p-6 mb-8 backdrop-blur-sm fade-up-3">
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="text-xs text-brand-accent-light/50 uppercase tracking-wider mb-1">No. Pesanan</div>
              <div className="font-bold text-brand-accent font-mono text-sm">{orderNumber}</div>
            </div>
            <div>
              <div className="text-xs text-brand-accent-light/50 uppercase tracking-wider mb-1">Tanggal</div>
              <div className="font-medium text-brand-light text-sm">{today}</div>
            </div>
            {isPenyaluran && dest && destLabels[dest] && (
              <div>
                <div className="text-xs text-brand-accent-light/50 uppercase tracking-wider mb-1">Destinasi</div>
                <div className="font-medium text-brand-light text-sm">{destLabels[dest]}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-brand-accent-light/50 uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="font-bold text-emerald-400 text-sm">Dikonfirmasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-brand-surface/30 border border-brand-surface-light/20 rounded-[14px] p-5 mb-8 text-left fade-up-3">
          <h3 className="font-serif text-base font-bold text-brand-light mb-4">Selanjutnya:</h3>
          <div className="flex flex-col gap-3">
            {[
              'Tim kami akan memverifikasi pembayaran Anda dalam 1×24 jam',
              step2,
              step3,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-brand-accent font-bold text-xs">{i + 1}</span>
                </div>
                <p className="text-brand-accent-light/75 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 fade-up-4">
          <Link href="/lacak-pesanan" className="flex-1 flex items-center justify-center gap-2 bg-cta-gradient text-brand-text-dark font-bold py-4 rounded-[14px] shadow-premium hover:scale-[1.02] transition-transform">
            <FontAwesomeIcon icon={faMagnifyingGlassLocation} /> Lacak Pesanan
          </Link>
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 bg-brand-surface/40 border border-brand-surface-light text-brand-light hover:border-brand-accent hover:text-brand-accent font-medium py-4 rounded-[14px] transition-all">
            <FontAwesomeIcon icon={faHouse} /> Kembali ke Beranda
          </Link>
        </div>

        {/* Share */}
        <div className="mt-8 fade-up-4">
          <p className="text-brand-accent-light/40 text-xs uppercase tracking-wider mb-3">Bagikan kebaikan ini</p>
          <div className="flex items-center justify-center gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faWhatsapp} className="text-base" />
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faFacebookF} className="text-sm" />
            </a>
            <a href="https://twitter.com/intent/tweet?text=%23BeyondQurban1447H" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faXTwitter} className="text-sm" />
            </a>
            <button onClick={() => navigator.clipboard.writeText(window.location.href).catch(() => {})} className="w-10 h-10 bg-brand-surface/50 border border-brand-surface-light rounded-full flex items-center justify-center text-brand-light hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faLink} className="text-sm" />
            </button>
          </div>
        </div>

        <p className="text-brand-accent-light/25 text-xs mt-10">© 2025 Beyond Qurban — Yayasan One Ummah</p>
      </div>
    </div>
  )
}

export default function TerimakasihPage() {
  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-brand-surface/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-brand-accent/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#C8962A 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-brand-accent text-xl font-serif">Loading...</div></div>}>
        <TerimakasihContent />
      </Suspense>
    </div>
  )
}
