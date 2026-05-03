'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'

const navLinks = [
  { label: 'Homepage', href: '/' },
  { label: 'Katalog', href: '/katalog' },
  { label: 'Penyaluran', href: '/penyaluran' },
  { label: 'Lacak Pesanan', href: '/lacak-pesanan' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const headerStyle = scrolled
    ? { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(13,51,32,0.96)' }
    : {}

  return (
    <>
      <header
        id="header"
        className="fixed top-0 left-0 w-full z-50 bg-brand-dark border-b border-brand-surface-light/30 transition-all duration-300"
        style={headerStyle}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center border border-brand-accent/30 group-hover:border-brand-accent transition-colors">
              <Image
                src="/logo-gold.png"
                alt="logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="font-serif text-brand-accent text-xl font-bold tracking-wide">
              Beyond Qurban
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(pathname, link.href)
                    ? 'text-brand-accent border-b-2 border-brand-accent pb-1'
                    : 'text-brand-light hover:text-brand-accent font-medium text-sm tracking-wide transition-colors'
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/katalog"
              className="bg-cta-gradient text-brand-text-dark font-bold text-sm py-2.5 px-6 rounded-[20px] shadow-premium hover:scale-105 transition-transform"
            >
              Beli Sekarang
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            className="md:hidden text-brand-light hover:text-brand-accent transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="text-2xl w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className="fixed inset-0 z-[60] bg-brand-dark flex flex-col md:hidden"
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="px-6 h-20 flex items-center justify-between border-b border-brand-surface-light/30">
          <span className="font-serif text-brand-accent text-xl font-bold tracking-wide">
            Beyond Qurban
          </span>
          <button
            id="close-menu-btn"
            className="text-brand-light"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} className="text-3xl w-7 h-7" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col pt-8 px-6 gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium text-xl border-b border-brand-surface-light/20 pb-4 transition-colors ${
                isActive(pathname, link.href)
                  ? 'text-brand-accent'
                  : 'text-brand-light'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-6">
          <Link
            href="/katalog"
            className="w-full bg-cta-gradient text-brand-text-dark font-bold text-lg py-4 rounded-[20px] shadow-premium flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
          >
            Beli Sekarang
          </Link>
        </div>
      </div>
    </>
  )
}
