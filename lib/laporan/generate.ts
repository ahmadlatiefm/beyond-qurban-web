import { createCanvas, loadImage, type CanvasRenderingContext2D, type Image } from 'canvas'
import { readFile } from 'fs/promises'
import { join } from 'path'
import PDFDocument from 'pdfkit'
import { NOTOSANS_REGULAR } from '@/lib/pdf/fonts'
import {
  migrateLegacyElements,
  getPhotoSlots,
  type LaporanElement,
  type LaporanFieldElement,
  type LaporanStaticTextElement,
  type FotoZoneKey,
} from './types'

interface GenerateOptions {
  blankoUrl: string
  elements: LaporanElement[] | unknown
  data: Record<string, string>
  photos: Record<FotoZoneKey, string[]>
  /** When true, render zone outlines + placeholder boxes for empty photos (preview-only). */
  placeholderEmpty?: boolean
}

async function resolveImageSrc(src: string): Promise<Buffer | string> {
  if (/^https?:\/\//i.test(src)) return src
  const cleanPath = src.startsWith('/') ? src : `/${src}`
  const filePath = join(process.cwd(), 'public', cleanPath.replace(/^\/+/, ''))
  return await readFile(filePath)
}

async function loadImageSafe(src: string): Promise<Image | null> {
  try {
    const r = await resolveImageSrc(src)
    return await loadImage(r as Buffer | string)
  } catch {
    return null
  }
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
  el: LaporanFieldElement | LaporanStaticTextElement,
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

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: Image,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (w <= 0 || h <= 0 || img.width <= 0 || img.height <= 0) return
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function drawPlaceholderBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
) {
  ctx.save()
  ctx.fillStyle = '#E5E7EB'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#9CA3AF'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const fontSize = Math.max(14, Math.min(w, h) / 4)
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.fillText(String(index + 1), x + w / 2, y + h / 2)
  ctx.restore()
}

export async function generateLaporanPng(opts: GenerateOptions): Promise<{ buffer: Buffer; width: number; height: number }> {
  const src = await resolveImageSrc(opts.blankoUrl)
  const img = await loadImage(src as Buffer | string)
  const width = img.width
  const height = img.height
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const elements = migrateLegacyElements(opts.elements)

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

    if (el.type === 'line') {
      const x = (el.x / 100) * width
      const y = (el.y / 100) * height
      const w = (el.width / 100) * width
      const h = Math.max(1, (el.height / 100) * height)
      ctx.save()
      ctx.fillStyle = el.color
      if (el.rotation && el.rotation !== 0) {
        const cx = x + w / 2
        const cy = y + h / 2
        ctx.translate(cx, cy)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.fillRect(-w / 2, -h / 2, w, h)
      } else {
        ctx.fillRect(x, y, w, h)
      }
      ctx.restore()
      continue
    }

    if (el.type === 'image') {
      if (!el.url) continue
      const imgEl = await loadImageSafe(el.url)
      if (!imgEl) continue
      const x = (el.x / 100) * width
      const y = (el.y / 100) * height
      const w = (el.width / 100) * width
      const h = (el.height / 100) * height

      ctx.save()
      if (typeof el.opacity === 'number') {
        ctx.globalAlpha = Math.max(0, Math.min(100, el.opacity)) / 100
      }
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
      continue
    }

    if (el.type === 'foto_zone') {
      const zoneX = (el.x / 100) * width
      const zoneY = (el.y / 100) * height
      const zoneW = (el.width / 100) * width
      const zoneH = (el.height / 100) * height

      const sourcePhotos = opts.photos[el.key] || []
      const count = opts.placeholderEmpty
        ? Math.max(1, Math.min(el.maxFoto, sourcePhotos.length || el.maxFoto))
        : Math.min(el.maxFoto, sourcePhotos.length)

      if (count <= 0) {
        if (el.border) {
          ctx.save()
          ctx.strokeStyle = el.borderColor || '#1B3A2F'
          ctx.lineWidth = 1
          ctx.setLineDash([6, 4])
          ctx.strokeRect(zoneX, zoneY, zoneW, zoneH)
          ctx.setLineDash([])
          ctx.restore()
        }
        continue
      }

      const gapPx = (el.gap / 100) * width
      const slots = getPhotoSlots(zoneX, zoneY, zoneW, zoneH, count, el.layout, gapPx)

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        const photoUrl = sourcePhotos[i]
        let drawn = false
        if (photoUrl) {
          const pImg = await loadImageSafe(photoUrl)
          if (pImg) {
            ctx.save()
            ctx.beginPath()
            ctx.rect(slot.x, slot.y, slot.w, slot.h)
            ctx.clip()
            drawImageCover(ctx, pImg, slot.x, slot.y, slot.w, slot.h)
            ctx.restore()
            drawn = true
          }
        }
        if (!drawn) {
          drawPlaceholderBox(ctx, slot.x, slot.y, slot.w, slot.h, i)
        }
        if (el.border) {
          ctx.save()
          ctx.strokeStyle = el.borderColor || '#1B3A2F'
          ctx.lineWidth = 1
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h)
          ctx.restore()
        }
      }
    }
  }

  return { buffer: canvas.toBuffer('image/png'), width, height }
}

export async function pngToPdfBuffer(pngBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  // A4 portrait dimensions in PDF points (72dpi)
  const A4_W = 595.28
  const A4_H = 841.89

  const imgAspect = width / height
  const pageAspect = A4_W / A4_H

  let drawW: number
  let drawH: number
  if (imgAspect > pageAspect) {
    drawW = A4_W
    drawH = A4_W / imgAspect
  } else {
    drawH = A4_H
    drawW = A4_H * imgAspect
  }
  const drawX = (A4_W - drawW) / 2
  const drawY = (A4_H - drawH) / 2

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, font: NOTOSANS_REGULAR })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.image(pngBuffer, drawX, drawY, { width: drawW, height: drawH })
    doc.end()
  })
}

export async function generateLaporanPdf(opts: GenerateOptions): Promise<Buffer> {
  const { buffer, width, height } = await generateLaporanPng(opts)
  return await pngToPdfBuffer(buffer, width, height)
}
