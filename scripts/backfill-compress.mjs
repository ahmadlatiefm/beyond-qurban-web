// One-off: compress all >150KB files in public/uploads to .webp, then update
// every DB column that references the old path so URLs stay valid.
//
// Usage:
//   DRY_RUN=1 node scripts/backfill-compress.mjs   # plan only
//   node scripts/backfill-compress.mjs             # execute
//
// Skips files already <= TARGET. Skips SVG and ICO (favicon).

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

const DRY_RUN = process.env.DRY_RUN === '1'
const ROOT = path.resolve('public/uploads')
const PUBLIC_PREFIX = '/uploads/'
const TARGET = 150 * 1024
const COMPRESSABLE = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const DB_TARGETS = [
  { type: 'text', table: 'Product', column: 'imageUrl' },
  { type: 'text', table: 'Order', column: 'paymentProofUrl' },
  { type: 'text', table: 'Campaign', column: 'imageUrl' },
  { type: 'text', table: 'Campaign', column: 'gallery' },
  { type: 'text', table: 'Pengiriman', column: 'buktiTransfer' },
  { type: 'text', table: 'Pengiriman', column: 'fotoSerahTerima' },
  { type: 'text', table: 'CampaignUpdate', column: 'imageUrl' },
  { type: 'text', table: 'Donation', column: 'paymentProofUrl' },
  { type: 'text', table: 'LaporanPenyaluran', column: 'tandaTerima' },
  { type: 'text', table: 'TemplateSertifikat', column: 'blankoUrl' },
  { type: 'text', table: 'TemplateLaporan', column: 'blankoUrl' },
  { type: 'text', table: 'Settings', column: 'value' },
  { type: 'text_array', table: 'Product', column: 'images' },
  { type: 'jsonb', table: 'LaporanPenyaluran', column: 'fotoUrls' },
  { type: 'jsonb', table: 'LaporanDonatur', column: 'fotoPenyembelihan' },
  { type: 'jsonb', table: 'TemplateSertifikat', column: 'fields' },
  { type: 'jsonb', table: 'TemplateLaporan', column: 'elements' },
]

function fmtKB(n) {
  return Math.round(n / 1024) + 'KB'
}

async function compressBuffer(buf) {
  let quality = 85
  let out
  for (let i = 0; i < 10; i++) {
    out = await sharp(buf)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
    if (out.length <= TARGET || quality <= 40) break
    const ratio = out.length / TARGET
    quality = Math.max(40, Math.floor(quality / Math.sqrt(ratio)))
  }
  return { buffer: out, quality }
}

async function walkAndCompress() {
  const mapping = []
  const stack = [ROOT]
  while (stack.length) {
    const dir = stack.pop()
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      const ext = path.extname(full).toLowerCase()
      if (!COMPRESSABLE.has(ext)) continue
      const stat = fs.statSync(full)
      if (stat.size <= TARGET) continue

      const buf = fs.readFileSync(full)
      let result
      try {
        result = await compressBuffer(buf)
      } catch (err) {
        console.error('FAIL compress', full, err.message)
        continue
      }
      const newFull = full.replace(/\.(jpe?g|png|webp)$/i, '.webp')
      const oldUrl = PUBLIC_PREFIX + path.relative(ROOT, full).split(path.sep).join('/')
      const newUrl = PUBLIC_PREFIX + path.relative(ROOT, newFull).split(path.sep).join('/')

      if (DRY_RUN) {
        console.log(`PLAN: ${path.basename(full)} ${fmtKB(stat.size)} -> ${fmtKB(result.buffer.length)} (q${result.quality})`)
      } else {
        fs.writeFileSync(newFull, result.buffer)
        if (newFull !== full) fs.unlinkSync(full)
        console.log(`OK: ${path.basename(newFull)} ${fmtKB(stat.size)} -> ${fmtKB(result.buffer.length)} (q${result.quality})`)
      }

      if (oldUrl !== newUrl) {
        mapping.push({ oldUrl, newUrl })
      }
    }
  }
  return mapping
}

async function updateDb(mapping) {
  if (mapping.length === 0) {
    console.log('No URL changes — DB untouched.')
    return
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL missing')
    process.exit(1)
  }
  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    if (!DRY_RUN) await client.query('BEGIN')

    for (const target of DB_TARGETS) {
      for (const m of mapping) {
        let sql
        const ident = `"${target.table}"."${target.column}"`
        if (target.type === 'text') {
          sql = `UPDATE "${target.table}" SET "${target.column}" = REPLACE("${target.column}", $1, $2) WHERE "${target.column}" LIKE '%' || $1 || '%'`
        } else if (target.type === 'jsonb') {
          sql = `UPDATE "${target.table}" SET "${target.column}" = REPLACE("${target.column}"::text, $1, $2)::jsonb WHERE "${target.column}"::text LIKE '%' || $1 || '%'`
        } else if (target.type === 'text_array') {
          sql = `UPDATE "${target.table}" SET "${target.column}" = string_to_array(REPLACE(array_to_string("${target.column}", E'\\x1f'), $1, $2), E'\\x1f') WHERE array_to_string("${target.column}", ',') LIKE '%' || $1 || '%'`
        }
        if (DRY_RUN) {
          const probe = await client.query(
            target.type === 'jsonb'
              ? `SELECT COUNT(*) FROM "${target.table}" WHERE "${target.column}"::text LIKE '%' || $1 || '%'`
              : target.type === 'text_array'
              ? `SELECT COUNT(*) FROM "${target.table}" WHERE array_to_string("${target.column}", ',') LIKE '%' || $1 || '%'`
              : `SELECT COUNT(*) FROM "${target.table}" WHERE "${target.column}" LIKE '%' || $1 || '%'`,
            [m.oldUrl],
          )
          const c = Number(probe.rows[0].count)
          if (c > 0) console.log(`DRY ${ident}: ${c} rows would change for ${m.oldUrl}`)
        } else {
          const res = await client.query(sql, [m.oldUrl, m.newUrl])
          if (res.rowCount > 0) console.log(`UPDATE ${ident}: ${res.rowCount} rows ${m.oldUrl} -> ${m.newUrl}`)
        }
      }
    }

    if (!DRY_RUN) await client.query('COMMIT')
  } catch (err) {
    if (!DRY_RUN) await client.query('ROLLBACK')
    throw err
  } finally {
    await client.end()
  }
}

;(async () => {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== EXECUTING ===')
  const mapping = await walkAndCompress()
  console.log(`\nFiles to rename: ${mapping.length}`)
  await updateDb(mapping)
  console.log('Done.')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
