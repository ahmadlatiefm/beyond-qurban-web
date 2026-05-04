import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminBottomNav from '@/components/layout/AdminBottomNav'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  return (
    <div className="antialiased font-sans flex min-h-screen bg-brand-light">
      <AdminSidebar
        adminName={session.user?.name ?? 'Admin'}
        adminEmail={session.user?.email ?? 'admin@beyondqurban.com'}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto pb-16 md:pb-0">
        {children}
      </div>
      <AdminBottomNav />
    </div>
  )
}
