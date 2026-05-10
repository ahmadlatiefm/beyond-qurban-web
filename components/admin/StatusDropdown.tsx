'use client'
import { useEffect, useRef, useState, useLayoutEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

export interface StatusDropdownOption<T extends string = string> {
  value: T
  label: string
  dotClass?: string
}

interface StatusDropdownProps<T extends string = string> {
  value: T
  options: StatusDropdownOption<T>[]
  onChange: (value: T) => void
  align?: 'left' | 'right'
  disabled?: boolean
  className?: string
  buttonContent?: ReactNode
  minWidth?: number
}

export function StatusDropdown<T extends string = string>({
  value,
  options,
  onChange,
  align = 'left',
  disabled = false,
  className = '',
  buttonContent,
  minWidth = 160,
}: StatusDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Position the menu below the trigger using viewport (fixed) coords
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = Math.max(rect.width, minWidth)
    let left = align === 'right' ? rect.right - menuWidth : rect.left
    // Keep menu inside viewport
    const margin = 8
    if (left < margin) left = margin
    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin
    }
    setPos({ top: rect.bottom + 4, left, width: menuWidth })
  }, [open, align, minWidth])

  // Close on outside click, scroll, resize, escape
  useEffect(() => {
    if (!open) return

    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    const onResize = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }

    document.addEventListener('mousedown', onOutside)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={className || 'px-3 py-1.5 bg-brand-light border border-brand-muted/20 text-brand-dark text-xs font-medium rounded-[8px] flex items-center gap-1.5 hover:bg-brand-surface/5 disabled:opacity-50'}
      >
        {buttonContent ?? (
          <>
            {current?.dotClass && <span className={`w-2 h-2 rounded-full inline-block ${current.dotClass}`} />}
            <span>{current?.label ?? 'Status'}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
          </>
        )}
      </button>

      {mounted && open && pos && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            minWidth: pos.width,
            zIndex: 1000,
          }}
          className="bg-white border border-brand-muted/20 rounded-[8px] shadow-premium overflow-hidden py-1"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-brand-light flex items-center gap-2 ${
                opt.value === value ? 'text-brand-surface bg-brand-light' : 'text-brand-dark'
              }`}
            >
              {opt.dotClass && <span className={`w-2 h-2 rounded-full inline-block ${opt.dotClass}`} />}
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
