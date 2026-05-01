'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produk', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardList, exact: false },
  { href: '/admin/pembeli', label: 'Pembeli', icon: Users, exact: false },
  { href: '/admin/pengaturan', label: 'Settings', icon: Settings, exact: false },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D3320] border-t border-white/10 flex">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-[#C8962A]' : 'text-white/50'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
