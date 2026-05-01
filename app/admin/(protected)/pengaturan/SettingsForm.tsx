'use client'

import { useState, useTransition } from 'react'
import { updateSettings } from '@/lib/actions/settings'

type Props = { settings: Record<string, string> }

const TABS = ['Tripay', 'OneSender', 'Pixel & Tracking', 'Info Toko'] as const
type Tab = typeof TABS[number]

const NOTIF_EVENTS = [
  { key: 'notif_order_customer',    label: 'Order masuk — Customer' },
  { key: 'notif_order_admin',       label: 'Order masuk — Admin' },
  { key: 'notif_payment_customer',  label: 'Pembayaran diterima — Customer' },
  { key: 'notif_payment_admin',     label: 'Pembayaran diterima — Admin' },
  { key: 'notif_status_customer',   label: 'Update status — Customer' },
  { key: 'notif_shipping_customer', label: 'Pengiriman — Customer' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#1B5E3B]' : 'bg-gray-200'}`}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  )
}

export default function SettingsForm({ settings: initial }: Props) {
  const [tab, setTab] = useState<Tab>('Tripay')
  const [settings, setSettings] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function toggle(key: string) {
    set(key, settings[key] === 'true' ? 'false' : 'true')
  }

  function handleSave() {
    startTransition(async () => {
      await updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'

  return (
    <div>
      {/* Tab header */}
      <div className="flex overflow-x-auto gap-1 border-b border-gray-200 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#1B5E3B] text-[#1B5E3B]'
                : 'border-transparent text-[#6B7280] hover:text-[#0D1F17]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tripay */}
      {tab === 'Tripay' && (
        <div className="space-y-5 max-w-lg">
          {[
            { key: 'tripay_api_key', label: 'API Key', type: 'password', placeholder: 'T-...' },
            { key: 'tripay_private_key', label: 'Private Key', type: 'password', placeholder: '' },
            { key: 'tripay_merchant_code', label: 'Merchant Code', type: 'text', placeholder: '' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">Mode</label>
            <select
              value={settings.tripay_mode ?? 'sandbox'}
              onChange={(e) => set('tripay_mode', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">
              Callback URL <span className="text-[#6B7280] font-normal">(read-only)</span>
            </label>
            <input
              readOnly
              value={`${appUrl}/api/tripay/callback`}
              className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-[#6B7280] cursor-text"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
        </div>
      )}

      {/* OneSender */}
      {tab === 'OneSender' && (
        <div className="space-y-6 max-w-lg">
          <div className="space-y-5">
            {[
              { key: 'onesender_api_key', label: 'API Key', type: 'password' },
              { key: 'onesender_sender_number', label: 'Nomor Pengirim (format 628xxx)', type: 'text' },
              { key: 'admin_whatsapp', label: 'WhatsApp Admin (format 628xxx)', type: 'text' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={settings[field.key] ?? ''}
                  onChange={(e) => set(field.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                />
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0D1F17] mb-3">Toggle Notifikasi</p>
            <div className="space-y-3">
              {NOTIF_EVENTS.map((ev) => (
                <div key={ev.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-[#6B7280]">{ev.label}</span>
                  <Toggle checked={settings[ev.key] === 'true'} onChange={() => toggle(ev.key)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pixel & Tracking */}
      {tab === 'Pixel & Tracking' && (
        <div className="space-y-6 max-w-lg">
          {/* Facebook */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Facebook Pixel</p>
              <Toggle checked={settings.fb_pixel_enabled === 'true'} onChange={() => toggle('fb_pixel_enabled')} />
            </div>
            <input value={settings.fb_pixel_id ?? ''} onChange={(e) => set('fb_pixel_id', e.target.value)} placeholder="Pixel ID" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Meta CAPI (Server-side)</p>
              <Toggle checked={settings.fb_capi_enabled === 'true'} onChange={() => toggle('fb_capi_enabled')} />
            </div>
            <input type="password" value={settings.fb_capi_token ?? ''} onChange={(e) => set('fb_capi_token', e.target.value)} placeholder="Access Token" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Test Event Code (kosongkan untuk production)</label>
              <input value={settings.fb_capi_test_event_code ?? ''} onChange={(e) => set('fb_capi_test_event_code', e.target.value)} placeholder="TEST12345" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0D1F17] mb-2">CAPI Purchase Trigger</label>
              {[
                { value: 'payment_page', label: 'Halaman Pembayaran' },
                { value: 'tripay_callback', label: 'Konfirmasi Tripay' },
                { value: 'both', label: 'Keduanya' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="capi_trigger"
                    value={opt.value}
                    checked={settings.fb_capi_purchase_trigger === opt.value}
                    onChange={() => set('fb_capi_purchase_trigger', opt.value)}
                    className="accent-[#1B5E3B]"
                  />
                  <span className="text-sm text-[#6B7280]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">TikTok Pixel</p>
              <Toggle checked={settings.tiktok_pixel_enabled === 'true'} onChange={() => toggle('tiktok_pixel_enabled')} />
            </div>
            <input value={settings.tiktok_pixel_id ?? ''} onChange={(e) => set('tiktok_pixel_id', e.target.value)} placeholder="TikTok Pixel ID" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#0D1F17]">Google Tag Manager</p>
              <Toggle checked={settings.gtm_enabled === 'true'} onChange={() => toggle('gtm_enabled')} />
            </div>
            <input value={settings.gtm_container_id ?? ''} onChange={(e) => set('gtm_container_id', e.target.value)} placeholder="GTM-XXXXXXX" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
        </div>
      )}

      {/* Info Toko */}
      {tab === 'Info Toko' && (
        <div className="space-y-5 max-w-lg">
          {[
            { key: 'store_name', label: 'Nama Toko' },
            { key: 'store_whatsapp', label: 'WhatsApp CS (format 628xxx)' },
            { key: 'store_email', label: 'Email' },
            { key: 'store_address', label: 'Alamat' },
            { key: 'store_hours', label: 'Jam Operasional' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-[#0D1F17] mb-1.5">{field.label}</label>
              <input
                type="text"
                value={settings[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Save */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-3 rounded-xl bg-[#1B5E3B] text-white font-semibold text-sm hover:bg-[#0D3320] disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✅ Tersimpan!</span>}
      </div>
    </div>
  )
}
