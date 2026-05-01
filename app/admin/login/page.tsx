'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signIn('credentials', {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah.')
        return
      }

      router.push('/admin')
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#0D3320] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-serif text-2xl font-bold text-white">
            Beyond<span className="text-[#C8962A]">Qurban</span>
          </p>
          <p className="text-white/50 text-sm mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-xl font-bold text-[#0D1F17] mb-6">Masuk ke Dashboard</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                placeholder="admin@beyondqurban.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold hover:bg-[#0D3320] disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
