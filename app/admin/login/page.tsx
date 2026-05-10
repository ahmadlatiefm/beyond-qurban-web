'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect jika sudah login ditangani oleh middleware (middleware.ts)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      redirect: false,
      email: fd.get('email'),
      password: fd.get('password'),
    })
    setLoading(false)
    if (result?.ok) {
      router.push('/admin/dashboard')
    } else {
      setError(true)
    }
  }

  return (
    <div className="font-sans antialiased min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-brand-dark">
      {/* Glow orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-brand-surface/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-brand-accent/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[45%] left-[65%] w-[30%] h-[30%] bg-brand-surface/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-surface rounded-full flex items-center justify-center border border-brand-accent/30 shadow-glow">
              <Image src="/logo-gold.png" alt="logo" width={36} height={36} className="object-contain" />
            </div>
          </div>
          <div className="bg-brand-accent-light px-4 py-1.5 rounded-[20px] inline-block mb-4">
            <span className="text-brand-dark font-semibold text-sm tracking-wide">Admin Portal</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-brand-light mb-2">Welcome Back!</h1>
          <p className="text-brand-accent-light/65 text-sm">Secure access to Beyond Qurban dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface rounded-[14px] p-8 md:p-10 shadow-premium border border-brand-accent/20">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-brand-light font-medium text-sm">Email / Username</label>
              <input
                name="email"
                type="text"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full h-12 bg-brand-light text-brand-dark rounded-[8px] px-4 border-2 border-transparent focus:border-brand-accent focus:outline-none transition-colors text-sm"
                placeholder="admin@beyondqurban.com"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-brand-light font-medium text-sm">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="w-full h-12 bg-brand-light text-brand-dark rounded-[8px] px-4 pr-12 border-2 border-transparent focus:border-brand-accent focus:outline-none transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                >
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-5 h-5 bg-brand-accent rounded-[4px] flex items-center justify-center">
                  <span className="text-brand-dark text-xs font-bold">✓</span>
                </div>
                <span className="text-brand-light/75 text-sm">Remember me</span>
              </label>
              <a href="#" className="text-brand-accent hover:text-brand-accent-light text-sm font-medium transition-colors">Lupa password?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-[8px] px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                <span>⚠</span> Email atau password salah.
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-cta-gradient text-brand-text-dark font-serif font-bold text-lg rounded-[8px] shadow-premium hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Memproses...' : 'Masuk'} <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-brand-accent/70 text-sm">
            <FontAwesomeIcon icon={faShieldHalved} />
            <span>256-bit Encrypted Connection</span>
          </div>
          <Link href="/" className="text-brand-accent-light/50 text-xs hover:text-brand-accent transition-colors">← Kembali ke website</Link>
        </div>
      </div>
    </div>
  )
}
