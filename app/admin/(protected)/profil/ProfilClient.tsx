'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import { changePassword } from '@/lib/actions/settings'
import { useAppToast } from '@/components/ui/AppToast'
import AdminNotifBell from '@/components/admin/AdminNotifBell'
import AdminProfileMenu from '@/components/admin/AdminProfileMenu'

export default function ProfilClient({
  adminName, adminEmail, memberSince,
}: { adminName: string; adminEmail: string; memberSince: string }) {
  const appToast = useAppToast()
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (newPw !== confirmPw) {
      setError('Konfirmasi tidak cocok dengan password baru.')
      return
    }
    if (newPw.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }
    setSubmitting(true)
    try {
      const res = await changePassword(oldPw, newPw)
      if (res.success) {
        appToast.success('Password berhasil diganti. Gunakan password baru di login berikutnya.')
        setOldPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setError(res.error ?? 'Gagal mengganti password.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-brand-light/90 backdrop-blur-md border-b border-brand-muted/15 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-xl font-bold text-brand-dark">Profil &amp; Keamanan</h1>
          <p className="text-brand-muted text-xs mt-0.5">Kelola akun admin dan password kamu</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifBell />
          <AdminProfileMenu />
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-[900px] mx-auto w-full flex flex-col gap-6">
        {/* Info akun */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6 md:p-8">
          <h2 className="font-bold text-brand-dark text-base mb-1 flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-brand-surface text-sm" /> Info Akun
          </h2>
          <p className="text-brand-muted text-sm mb-5">Detail akun admin yang sedang login.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-light rounded-[10px] p-4">
              <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Nama</div>
              <div className="font-bold text-brand-dark">{adminName}</div>
            </div>
            <div className="bg-brand-light rounded-[10px] p-4">
              <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Email</div>
              <div className="font-bold text-brand-dark break-all">{adminEmail}</div>
            </div>
            <div className="bg-brand-light rounded-[10px] p-4 md:col-span-2">
              <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Member Sejak</div>
              <div className="font-bold text-brand-dark">
                {new Date(memberSince).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Ganti password */}
        <div className="bg-white rounded-[14px] shadow-premium border border-brand-muted/10 p-6 md:p-8">
          <h2 className="font-bold text-brand-dark text-base mb-1 flex items-center gap-2">
            <FontAwesomeIcon icon={faLock} className="text-brand-surface text-sm" /> Ganti Password
          </h2>
          <p className="text-brand-muted text-sm mb-5">Untuk keamanan, ganti password admin secara berkala. Minimal 8 karakter.</p>
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 max-w-md">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Password Lama</label>
              <input
                type="password"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                autoComplete="current-password"
                required
                className="inp"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Password Baru</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="inp"
                placeholder="Min. 8 karakter"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={`inp ${confirmPw.length > 0 && confirmPw !== newPw ? 'border-red-400' : ''}`}
                placeholder="Ulangi password baru"
              />
              {confirmPw.length > 0 && confirmPw !== newPw && (
                <p className="text-xs text-red-600 font-medium">Konfirmasi tidak cocok dengan password baru.</p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-[6px] font-medium">❌ {error}</div>
            )}
            <div>
              <button
                type="submit"
                disabled={submitting || !oldPw || !newPw || !confirmPw}
                className="flex items-center gap-2 bg-cta-gradient text-brand-text-dark font-bold text-sm px-5 py-2.5 rounded-[8px] shadow-premium disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> {submitting ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
