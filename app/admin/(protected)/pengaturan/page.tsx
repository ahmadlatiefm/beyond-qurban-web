import { getSettings } from '@/lib/actions/settings'
import SettingsForm from './SettingsForm'

export default async function AdminPengaturanPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-[#0D1F17]">Pengaturan</h1>
        <p className="text-sm text-[#6B7280] mt-1">Kelola integrasi, notifikasi, dan info toko</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
