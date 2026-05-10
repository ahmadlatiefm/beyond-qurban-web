import { createCanvas, loadImage, type CanvasRenderingContext2D } from 'canvas'
import { readFile } from 'fs/promises'
import { join } from 'path'
import PDFDocument from 'pdfkit'
import { NOTOSANS_REGULAR } from '@/lib/pdf/fonts'
import {
  migrateLegacyElements,
  type SertifikatElement,
  type SertifikatFieldElement,
  type SertifikatStaticTextElement,
} from './types'

interface GenerateOptions {
  blankoUrl: string
  fields: SertifikatElement[] | unknown
  data: Record<string, string>
}

async function resolveImageSrc(src: string): Promise<Buffer | string> {
  if (/^https?:\/\//i.test(src)) return src
  const cleanPath = src.startsWith('/') ? src : `/${src}`
  const filePath = join(process.cwd(), 'public', cleanPath.replace(/^\/+/, ''))
  return await readFile(filePath)
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (!maxWidth || maxWidth <= 0) return [text]
  const paragraphs = text.split(/\n/)
  const out: string[] = []
  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate
      } else {
        if (line) out.push(line)
        line = word
      }
    }
    if (line) out.push(line)
    if (!words.length) out.push('')
  }
  return out.length ? out : [text]
}

function renderTextElement(
  ctx: CanvasRenderingContext2D,
  el: SertifikatFieldElement | SertifikatStaticTextElement,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (!text) return
  const x = (el.x / 100) * canvasWidth
  const y = (el.y / 100) * canvasHeight
  const maxWidthPx = el.maxWidth ? (el.maxWidth / 100) * canvasWidth : 0

  const family = el.fontFamily || 'serif'
  ctx.font = `${el.fontWeight === 'bold' ? 'bold ' : ''}${el.fontSize}px "${family}"`
  ctx.fillStyle = el.color
  ctx.textAlign = el.align
  ctx.textBaseline = 'middle'

  const lines = wrapLines(ctx, text, maxWidthPx)
  const lineHeight = el.fontSize * 1.3
  const totalHeight = lineHeight * lines.length
  const startY = y - totalHeight / 2 + lineHeight / 2

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight)
  })
}

export async function generateSertifikatPng(opts: GenerateOptions): Promise<{ buffer: Buffer; width: number; height: number }> {
  const src = await resolveImageSrc(opts.blankoUrl)
  const img = await loadImage(src as Buffer | string)
  const width = img.width
  const height = img.height
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const elements = migrateLegacyElements(opts.fields)

  for (const el of elements) {
    if (el.type === 'field') {
      const raw = opts.data[el.key]
      const value = raw == null ? '' : String(raw).trim()
      if (!value) continue
      renderTextElement(ctx, el, value, width, height)
      continue
    }

    if (el.type === 'static_text') {
      const value = (el.content || '').trim()
      if (!value) continue
      renderTextElement(ctx, el, value, width, height)
      continue
    }

    if (el.type === 'image') {
      if (!el.url) continue
      let imgEl
      try {
        const imgSrc = await resolveImageSrc(el.url)
        imgEl = await loadImage(imgSrc as Buffer | string)
      } catch {
        continue
      }
      const x = (el.x / 100) * width
      const y = (el.y / 100) * height
      const w = (el.width / 100) * width
      const h = (el.height / 100) * height

      ctx.save()
      if (typeof el.opacity === 'number') {
        ctx.globalAlpha = Math.max(0, Math.min(100, el.opacity)) / 100
      }
      // Position rectangle is anchored at top-left (x, y).
      // Rotate around the center of the image.
      if (el.rotation && el.rotation !== 0) {
        const cx = x + w / 2
        const cy = y + h / 2
        ctx.translate(cx, cy)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.drawImage(imgEl, -w / 2, -h / 2, w, h)
      } else {
        ctx.drawImage(imgEl, x, y, w, h)
      }
      ctx.restore()
    }
  }

  return { buffer: canvas.toBuffer('image/png'), width, height }
}

export async function pngToPdfBuffer(pngBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  // Convert pixel dimensions to PDF points (72dpi assumed for canvas)
  const pageWidth = Math.max(72, width * 0.75)
  const pageHeight = Math.max(72, height * 0.75)

  return await new Promise<Buffer>((resolve, reject) => {
    // Pass NotoSans as default font to skip pdfkit's built-in Helvetica.afm load
    // (the AFM file is not bundled into the Next.js standalone server build).
    const doc = new PDFDocument({ size: [pageWidth, pageHeight], margin: 0, font: NOTOSANS_REGULAR })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.image(pngBuffer, 0, 0, { width: pageWidth, height: pageHeight })
    doc.end()
  })
}
