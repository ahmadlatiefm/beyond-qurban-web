import { Font } from '@react-pdf/renderer'
import path from 'path'

const fontDir = path.join(process.cwd(), 'public', 'fonts')

export const NOTOSANS_REGULAR = path.join(fontDir, 'NotoSans-Regular.ttf')
export const NOTOSANS_BOLD = path.join(fontDir, 'NotoSans-Bold.ttf')

let registered = false

/**
 * Register NotoSans as the default font family for all react-pdf documents.
 * Replaces the implicit Helvetica fallback (which fails in Next.js production
 * builds because Helvetica.afm is not traced into the standalone bundle).
 *
 * Safe to call repeatedly — only registers once.
 */
export function ensurePdfFonts() {
  if (registered) return
  Font.register({
    family: 'NotoSans',
    fonts: [
      { src: NOTOSANS_REGULAR, fontWeight: 'normal' },
      { src: NOTOSANS_BOLD, fontWeight: 'bold' },
    ],
  })
  // Disable hyphenation (default behavior wraps long strings awkwardly).
  Font.registerHyphenationCallback(word => [word])
  registered = true
}

// Auto-register on import so consumers can simply `import './fonts'` once.
ensurePdfFonts()
