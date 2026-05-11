import sharp from 'sharp'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

const TARGET_SIZE = 150 * 1024

export interface CompressResult {
  size: number
  quality: number
  width: number
  height: number
}

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  targetSizeBytes?: number
  minQuality?: number
  preserveTransparency?: boolean
}

export async function compressToTarget(
  inputBuffer: Buffer,
  outputPath: string,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    targetSizeBytes = TARGET_SIZE,
    minQuality = 40,
    preserveTransparency = false,
  } = options

  await mkdir(path.dirname(outputPath), { recursive: true })

  const resized = sharp(inputBuffer, { failOn: 'none' })
    .rotate()
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })

  let quality = 85
  let outputBuffer: Buffer = Buffer.alloc(0)
  let attempts = 0

  while (attempts < 10) {
    const pipeline = resized.clone()
    outputBuffer = preserveTransparency
      ? await pipeline.png({ compressionLevel: 9, quality }).toBuffer()
      : await pipeline.webp({ quality }).toBuffer()

    if (outputBuffer.length <= targetSizeBytes || quality <= minQuality) {
      break
    }

    const ratio = outputBuffer.length / targetSizeBytes
    const next = Math.floor(quality / Math.sqrt(ratio))
    quality = Math.max(minQuality, Math.min(quality - 1, next))
    attempts++
  }

  await writeFile(outputPath, outputBuffer)

  const meta = await sharp(outputBuffer).metadata()
  return {
    size: outputBuffer.length,
    quality,
    width: meta.width || 0,
    height: meta.height || 0,
  }
}

export async function compressBlanko(
  inputBuffer: Buffer,
  outputPath: string,
): Promise<CompressResult> {
  return compressToTarget(inputBuffer, outputPath, {
    maxWidth: 2480,
    maxHeight: 3508,
    targetSizeBytes: 500 * 1024,
    minQuality: 70,
  })
}

export async function compressAsset(
  inputBuffer: Buffer,
  outputPath: string,
): Promise<CompressResult> {
  const meta = await sharp(inputBuffer).metadata()
  const hasAlpha = meta.hasAlpha || false

  return compressToTarget(inputBuffer, outputPath, {
    maxWidth: 800,
    maxHeight: 800,
    targetSizeBytes: 100 * 1024,
    minQuality: 60,
    preserveTransparency: hasAlpha,
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function reductionPercent(originalSize: number, compressedSize: number): string {
  if (originalSize <= 0) return '0%'
  const pct = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
  return `${pct}%`
}
