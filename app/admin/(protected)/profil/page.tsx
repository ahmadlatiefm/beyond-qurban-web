export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfilClient from './ProfilClient'

export default async function AdminProfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/admin/login')
  const user = await prisma.adminUser.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, createdAt: true },
  })
  if (!user) redirect('/admin/login')

  return (
    <ProfilClient
      adminName={user.name}
      adminEmail={user.email}
      memberSince={user.createdAt.toISOString()}
    />
  )
}
