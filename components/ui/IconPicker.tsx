'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CONTENT_ICONS } from '@/lib/contentIcons'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = CONTENT_ICONS[value] ?? CONTENT_ICONS.shield
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] border border-brand-muted/20 bg-white text-sm text-brand-dark hover:border-brand-accent"
      >
        <FontAwesomeIcon icon={current.icon} className="text-brand-surface" />
        <span className="flex-1 text-left">{current.label}</span>
        <span className="text-[10px] text-brand-muted">Ganti</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 bg-white border border-brand-muted/20 rounded-[8px] shadow-lg p-2 grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
          {Object.entries(CONTENT_ICONS).map(([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setOpen(false) }}
              title={label}
              className={`aspect-square flex items-center justify-center rounded-[6px] border ${
                value === key ? 'border-brand-accent bg-brand-accent/10' : 'border-transparent hover:bg-brand-light'
              }`}
            >
              <FontAwesomeIcon icon={icon} className="text-brand-surface" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
