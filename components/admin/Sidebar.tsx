'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Package, ClipboardList, Users, Settings, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produk', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ClipboardList, exact: false },
  { href: '/admin/pembeli', label: 'Pembeli', icon: Users, exact: false },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, exact: false },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0D3320] text-white fixed left-0 top-0 z-40">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="font-serif text-lg font-bold">
          Beyond<span className="text-[#C8962A]">Qurban</span>
        </p>
        <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1B5E3B] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
