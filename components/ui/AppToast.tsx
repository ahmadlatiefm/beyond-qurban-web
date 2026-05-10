'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastItem = {
  id: number
  msg: string
  type: ToastType
}

type ToastContextValue = {
  show: (msg: string, type?: ToastType) => void
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLE: Record<ToastType, { bg: string; border: string; text: string; icon: any; iconCls: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: faCircleCheck,
    iconCls: 'text-emerald-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: faCircleXmark,
    iconCls: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: faTriangleExclamation,
    iconCls: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: faCircleInfo,
    iconCls: 'text-blue-500',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((msg: string, type: ToastType = 'success') => {
    const id = ++seq.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  const value: ToastContextValue = {
    show,
    success: msg => show(msg, 'success'),
    error: msg => show(msg, 'error'),
    warning: msg => show(msg, 'warning'),
    info: msg => show(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const s = STYLE[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto min-w-[260px] max-w-sm flex items-start gap-3 ${s.bg} border ${s.border} rounded-[10px] shadow-lg px-4 py-3 text-sm font-medium ${s.text} app-toast-in`}
              role="status"
            >
              <FontAwesomeIcon icon={s.icon} className={`${s.iconCls} mt-0.5 shrink-0`} />
              <span className="flex-1 leading-snug">{t.msg}</span>
              <button
                onClick={() => dismiss(t.id)}
                className={`${s.iconCls} hover:opacity-70 transition-opacity shrink-0`}
                aria-label="Tutup"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes app-toast-in {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .app-toast-in { animation: app-toast-in .18s ease-out; }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useAppToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback: no-op + console, so components don't crash if provider is missing.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[useAppToast] called outside <ToastProvider>')
    }
    const noop = () => {}
    return { show: noop, success: noop, error: noop, warning: noop, info: noop } as ToastContextValue
  }
  return ctx
}

// Imperative helper for non-hook contexts (rare).
let _toastBridge: ToastContextValue | null = null
export function _bindToastBridge(ctx: ToastContextValue | null) { _toastBridge = ctx }
export function toast(msg: string, type: ToastType = 'success') {
  _toastBridge?.show(msg, type)
}

export function ToastBridge() {
  const ctx = useContext(ToastContext)
  useEffect(() => {
    _bindToastBridge(ctx)
    return () => _bindToastBridge(null)
  }, [ctx])
  return null
}
