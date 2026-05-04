export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import PengaturanClient from './PengaturanClient'

export default async function AdminPengaturanPage() {
  const settingsRows = await prisma.settings.findMany()
  const settings: Record<string, string> = {}
  settingsRows.forEach(s => { settings[s.key] = s.value })
  return <PengaturanClient initialSettings={settings} />
}
