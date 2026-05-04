'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartPie, faBoxOpen, faCartShopping, faCircleCheck,
  faHandHoldingHeart, faUsers, faGear, faArrowRightFromBracket, faBullhorn,
} from '@fortawesome/free-solid-svg-icons'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: faChartPie },
  { href: '/admin/produk', label: 'Produk', icon: faBoxOpen },
  { href: '/admin/pesanan', label: 'Pesanan', icon: faCartShopping },
  { href: '/admin/konfirmasi', label: 'Konfirmasi Bayar', icon: faCircleCheck },
  { href: '/admin/campaign', label: 'Campaign', icon: faBullhorn },
  { href: '/admin/penyaluran', label: 'Penyaluran', icon: faHandHoldingHeart },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: faGear },
]

export default function AdminSidebar({ adminName = 'Admin', adminEmail = 'admin@beyondqurban.com' }: { adminName?: string; adminEmail?: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-brand-dark min-h-screen sticky top-0 border-r border-brand-surface/30 z-40 shrink-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-brand-surface/30">
        <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center border border-brand-accent/30 shadow-glow">
          <Image src="/logo-gold.png" alt="logo" width={28} height={28} className="object-contain" />
        </div>
        <span className="font-serif font-bold text-brand-light text-lg tracking-wide">Admin Portal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm transition-all ${
                isActive
                  ? 'bg-brand-surface/40 text-brand-accent font-semibold border border-brand-accent/20'
                  : 'text-brand-light/70 hover:bg-brand-surface/20 hover:text-brand-light'
              }`}
            >
              <FontAwesomeIcon icon={icon} className="w-5 text-center" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-brand-surface/30 pt-3">
        <div className="flex items-center gap-3 px-4 py-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-brand-light text-sm font-medium">{adminName}</div>
            <div className="text-brand-accent-light/50 text-xs">{adminEmail}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-brand-accent-light/60 hover:bg-brand-surface/20 hover:text-brand-accent-light transition-all text-sm"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-5 text-center" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
