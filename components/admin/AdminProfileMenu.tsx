'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

export default function AdminProfileMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const name = session?.user?.name ?? 'Admin'
  const email = session?.user?.email ?? ''
  const initial = name.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${name}${email ? ` — ${email}` : ''}`}
        className="w-9 h-9 rounded-full bg-brand-surface border border-brand-accent/30 flex items-center justify-center text-xs text-brand-accent font-bold hover:bg-brand-dark transition-colors"
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 bg-white border border-brand-muted/20 rounded-[10px] shadow-premium z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-muted/10 bg-brand-light">
            <div className="font-bold text-sm text-brand-dark truncate">{name}</div>
            {email && <div className="text-xs text-brand-muted truncate mt-0.5">{email}</div>}
          </div>
          <Link
            href="/admin/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-light transition-colors"
            role="menuitem"
          >
            <FontAwesomeIcon icon={faUser} className="text-brand-muted w-4" />
            Profil &amp; Keamanan
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/admin/login' }) }}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-brand-muted/10"
            role="menuitem"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
