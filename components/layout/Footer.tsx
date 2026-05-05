import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faFacebookF, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faLocationDot, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { prisma } from '@/lib/prisma'

export default async function Footer() {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['store_name','footer_description','footer_address','footer_phone','footer_email','footer_instagram','footer_facebook','footer_whatsapp','footer_copyright','nav_items'] } }
  })
  const s: Record<string, string> = {}
  rows.forEach(r => { s[r.key] = r.value })

  let navItems: { label: string; href: string }[] = [
    { label: 'Homepage', href: '/' },
    { label: 'Katalog Hewan', href: '/katalog' },
    { label: 'Lacak Pesanan', href: '/lacak-pesanan' },
    { label: 'Tentang Kami', href: '/tentang-kami' },
  ]
  try {
    const parsed = JSON.parse(s.nav_items ?? '[]')
    if (Array.isArray(parsed) && parsed.length > 0) navItems = parsed
  } catch {}

  const storeName = s.store_name || 'Beyond Qurban'
  const description = s.footer_description || 'Menyediakan hewan kurban berkualitas, sehat, dan dirawat sesuai syariat.'
  const address = s.footer_address || 'Jl. Peternakan Raya No. 12, Lembang, Bandung Barat'
  const phone = s.footer_phone || '+62 812-3456-7890'
  const email = s.footer_email || 'info@beyondqurban.com'
  const instagram = s.footer_instagram || '#'
  const facebook = s.footer_facebook || '#'
  const whatsapp = s.footer_whatsapp || 'https://wa.me/6281234567890'
  const copyright = s.footer_copyright || `© ${new Date().getFullYear()} ${storeName} — Yayasan One Ummah. All Rights Reserved.`

  return (
    <footer className="bg-brand-dark border-t border-brand-surface-light/20 pt-16 pb-8">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
          {/* Brand col */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center border border-brand-accent/30">
                <Image src="/logo-gold.png" alt="" width={28} height={28} className="object-contain" />
              </div>
              <span className="font-serif text-brand-accent text-xl font-bold">{storeName}</span>
            </div>
            <p className="text-brand-accent-light/65 text-sm leading-relaxed mb-5">{description}</p>
            <div className="flex gap-3">
              <a href={instagram} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-brand-accent hover:text-brand-dark transition-colors" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} className="text-sm w-3.5 h-3.5" />
              </a>
              <a href={facebook} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-brand-accent hover:text-brand-dark transition-colors" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebookF} className="text-sm w-3.5 h-3.5" />
              </a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-brand-light hover:bg-[#25D366] transition-colors" aria-label="WhatsApp">
                <FontAwesomeIcon icon={faWhatsapp} className="text-sm w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Menu col */}
          <div>
            <h4 className="font-serif text-brand-light text-base font-bold mb-5">Menu</h4>
            <ul className="space-y-3 text-sm">
              {navItems.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-brand-accent-light/65 hover:text-brand-accent transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak col */}
          <div>
            <h4 className="font-serif text-brand-light text-base font-bold mb-5">Kontak</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faLocationDot} className="text-brand-accent mt-0.5 w-3.5 h-3.5 flex-shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faPhone} className="text-brand-accent w-3.5 h-3.5 flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-accent-light/65">
                <FontAwesomeIcon icon={faEnvelope} className="text-brand-accent w-3.5 h-3.5 flex-shrink-0" />
                <span>{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-surface-light/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-brand-accent-light/40">
          <p>{copyright}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-brand-accent">Privacy Policy</a>
            <a href="#" className="hover:text-brand-accent">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
