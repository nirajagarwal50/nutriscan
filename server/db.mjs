import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ROOT = path.join(__dirname, '..')
export const DB_PATH = process.env.NUTRISCAN_DB_PATH || path.join(ROOT, 'data', 'nutriscan.db')

let _db

export function getDb() {
  if (_db) return _db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      code TEXT PRIMARY KEY,
      name TEXT,
      brands TEXT,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_brands ON products(brands);
  `)
  return _db
}

/** Escape LIKE wildcards in user input (SQLite default escape is \\). */
export function escapeLikeFragment(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * @returns {import('better-sqlite3').Statement}
 */
export function upsertProductStmt() {
  const db = getDb()
  return db.prepare(`
    INSERT INTO products (code, name, brands, payload, updated_at)
    VALUES (@code, @name, @brands, @payload, @updated_at)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      brands = excluded.brands,
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `)
}

export function getProductPayloadByCode(code) {
  const db = getDb()
  const row = db.prepare('SELECT payload FROM products WHERE code = ?').get(code)
  return row?.payload ? String(row.payload) : null
}

/**
 * Search cached products by barcode exact match or name/brands substring.
 * @returns {unknown[]} array of OFF-style product objects (minimal fields ok)
 */
export function searchCachedProducts(qRaw, limit) {
  const db = getDb()
  const q = String(qRaw || '').trim()
  if (!q) return []

  const lim = Math.min(50, Math.max(1, Number(limit) || 20))
  const digits = q.replace(/\D/g, '')

  if (/^\d{8,14}$/.test(digits) && digits === q.replace(/\s/g, '')) {
    const payload = getProductPayloadByCode(digits)
    if (!payload) return []
    try {
      const parsed = JSON.parse(payload)
      const p = parsed.product || parsed
      return p ? [p] : []
    } catch {
      return []
    }
  }

  const esc = escapeLikeFragment(q)
  const pattern = `%${esc}%`
  const rows = db
    .prepare(
      `
    SELECT payload FROM products
    WHERE
      name LIKE ? ESCAPE '\\'
      OR brands LIKE ? ESCAPE '\\'
      OR code LIKE ? ESCAPE '\\'
    LIMIT ?
  `
    )
    .all(pattern, pattern, pattern, lim)

  const out = []
  for (const r of rows) {
    try {
      const parsed = JSON.parse(String(r.payload))
      const p = parsed.product || parsed
      if (p) out.push(p)
    } catch {
      // skip
    }
  }
  return out
}

export function productCount() {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) AS c FROM products').get()
  return Number(row?.c || 0)
}
