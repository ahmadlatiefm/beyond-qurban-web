import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faFacebookF, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faLocationDot, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons'

export default function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-brand-surface-light/20 pt-16 pb-8">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center border border-brand-accent/30">
                <Image
                  src="/logo-gold.png"
                  alt=""
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-serif text-brand-accent text-xl font-bold">Beyond Qurban</span>
            </div>
            <p className="text-brand-accent-light/65 text-sm leading-relaxed mb-5">
              Menyediakan hewan kurban berkualitas, sehat, dan dirawat sesuai syariat.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-brand-accent hover:text-brand-dark transition-colors"
                aria-label="Instagram"
              >
                <FontAwesomeIcon icon={faInstagram} className="text-sm w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-brand-accent hover:text-brand-dark transition-colors"
                aria-label="Facebook"
              >
                <FontAwesomeIcon icon={faFacebookF} className="text-sm w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/6281234567890"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="text-sm w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Menu col */}
          <div>
            <h4 className="font-serif text-brand-light text-base font-bold mb-5">Menu</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Homepage
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Katalog Hewan
                </Link>
              </li>
              <li>
                <Link href="/lacak-pesanan" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Lacak Pesanan
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin col */}
          <div>
            <h4 className="font-serif text-brand-light text-base font-bold mb-5">Admin</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/admin/login" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Login Admin
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak col */}
          <div>
            <h4 className="font-serif text-brand-light text-base font-bold mb-5">Kontak</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faLocationDot} className="text-brand-accent mt-0.5 w-3.5 h-3.5 flex-shrink-0" />
                <span>Jl. Peternakan Raya No. 12, Lembang, Bandung Barat</span>
              </div>
              <div className="flex items-center gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faPhone} className="text-brand-accent w-3.5 h-3.5 flex-shrink-0" />
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faEnvelope} className="text-brand-accent w-3.5 h-3.5 flex-shrink-0" />
                <span>info@beyondqurban.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-surface-light/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-brand-accent-light/40">
          <p>© 2025 Beyond Qurban — Yayasan One Ummah. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-brand-accent">Privacy Policy</a>
            <a href="#" className="hover:text-brand-accent">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
