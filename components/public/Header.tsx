'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/katalog', label: 'Katalog' },
  { href: '/lacak', label: 'Lacak Pesanan' },
  { href: '/tentang', label: 'Tentang Kami' },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#1B5E3B] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-white tracking-tight">
              Beyond<span className="text-[#C8962A]">Qurban</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[#C8962A]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/katalog"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-[#C8962A] text-white text-sm font-semibold hover:bg-[#b07e20] transition-colors"
          >
            Pesan Sekarang
          </Link>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0D3320] border-t border-white/10">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium py-2 ${
                  pathname === link.href ? 'text-[#C8962A]' : 'text-white/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/katalog"
              onClick={() => setOpen(false)}
              className="mt-2 text-center px-4 py-2 rounded-lg bg-[#C8962A] text-white text-sm font-semibold"
            >
              Pesan Sekarang
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
