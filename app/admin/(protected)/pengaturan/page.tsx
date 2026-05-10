export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PengaturanClient from './PengaturanClient'

export default async function AdminPengaturanPage() {
  const [settingsRows, session] = await Promise.all([
    prisma.settings.findMany(),
    getServerSession(authOptions),
  ])
  const settings: Record<string, string> = {}
  settingsRows.forEach(s => { settings[s.key] = s.value })
  const adminEmail = session?.user?.email ?? ''
  return <PengaturanClient initialSettings={settings} adminEmail={adminEmail} />
}
