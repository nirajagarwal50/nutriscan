import pg from 'pg'

const { Pool } = pg

let _pool = null

export function getPool() {
  if (!process.env.DATABASE_URL) return null
  if (_pool) return _pool
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  return _pool
}

export async function initDb() {
  const pool = getPool()
  if (!pool) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      code TEXT PRIMARY KEY,
      name TEXT,
      brands TEXT,
      payload TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_brands ON products(brands);
  `)
}

export async function getProductPayloadByCode(code) {
  const pool = getPool()
  if (!pool) return null
  try {
    const { rows } = await pool.query('SELECT payload FROM products WHERE code = $1', [code])
    return rows[0]?.payload || null
  } catch {
    return null
  }
}

export async function upsertProduct({ code, name, brands, payload, updated_at }) {
  const pool = getPool()
  if (!pool) return
  await pool.query(
    `INSERT INTO products (code, name, brands, payload, updated_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       brands = EXCLUDED.brands,
       payload = EXCLUDED.payload,
       updated_at = EXCLUDED.updated_at`,
    [code, name, brands, payload, updated_at]
  )
}

export async function searchCachedProducts(qRaw, limit) {
  const pool = getPool()
  if (!pool) return []
  const q = String(qRaw || '').trim()
  if (!q) return []

  const lim = Math.min(50, Math.max(1, Number(limit) || 20))
  const digits = q.replace(/\D/g, '')

  if (/^\d{8,14}$/.test(digits) && digits === q.replace(/\s/g, '')) {
    const payload = await getProductPayloadByCode(digits)
    if (!payload) return []
    try {
      const parsed = JSON.parse(payload)
      const p = parsed.product || parsed
      return p ? [p] : []
    } catch {
      return []
    }
  }

  try {
    const pattern = `%${q}%`
    const { rows } = await pool.query(
      `SELECT payload FROM products
       WHERE name ILIKE $1 OR brands ILIKE $1 OR code ILIKE $1
       LIMIT $2`,
      [pattern, lim]
    )
    const out = []
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.payload)
        const p = parsed.product || parsed
        if (p) out.push(p)
      } catch {
        // skip malformed rows
      }
    }
    return out
  } catch {
    return []
  }
}

export async function productCount() {
  const pool = getPool()
  if (!pool) return 0
  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM products')
    return Number(rows[0]?.c || 0)
  } catch {
    return 0
  }
}
