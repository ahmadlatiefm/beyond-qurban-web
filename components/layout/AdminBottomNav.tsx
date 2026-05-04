'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartPie, faBoxOpen, faCartShopping, faCircleCheck, faGear } from '@fortawesome/free-solid-svg-icons'

const BOTTOM_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: faChartPie },
  { href: '/admin/produk', label: 'Produk', icon: faBoxOpen },
  { href: '/admin/pesanan', label: 'Pesanan', icon: faCartShopping },
  { href: '/admin/konfirmasi', label: 'Konfirmasi', icon: faCircleCheck },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: faGear },
]

export default function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-dark border-t border-brand-surface/30 flex">
      {BOTTOM_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-accent' : 'text-brand-light/50 hover:text-brand-light'
            }`}
          >
            <FontAwesomeIcon icon={icon} className="text-base" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
