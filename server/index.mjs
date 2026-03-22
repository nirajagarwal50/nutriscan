import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import { initDb, getProductPayloadByCode, productCount, searchCachedProducts } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OFF_ORIGIN = 'https://world.openfoodfacts.org'

const PRODUCT_FIELDS = [
  'product_name',
  'brands',
  'quantity',
  'code',
  'image_front_url',
  'image_url',
  'nutriscore_grade',
  'nutrition_grade_fr',
  'nutriscore_data',
  'nutriments',
  'ingredients_text',
  'ingredients_n',
  'labels_tags',
  'nova_group',
  'nova_groups',
  'packaging_text',
  'packagings',
  'categories_tags',
  'compared_to_category',
  'nutrition_data_per',
  'serving_size',
  'serving_quantity',
  'nutrient_levels_tags',
  'additives_tags',
  'additives_n',
  'environment_impact_level_tags',
].join(',')

const TTL_PRODUCT_MS = 10 * 60 * 1000
const TTL_SEARCH_MS = 5 * 60 * 1000

/** @type {Map<string, { value: unknown; expires: number }>} */
const cache = new Map()

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expires) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value, ttlMs) {
  cache.set(key, { value, expires: Date.now() + ttlMs })
}

const app = express()
const PORT = Number(process.env.PORT || 8787)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.set('trust proxy', 1)
app.use('/api', apiLimiter)

app.get('/api/health', async (_req, res) => {
  try {
    const n = await productCount()
    res.json({ ok: true, cached_products: n })
  } catch {
    res.json({ ok: true, cached_products: null })
  }
})

app.get('/api/product/:barcode', async (req, res) => {
  const raw = String(req.params.barcode || '')
  const clean = raw.replace(/\D/g, '')
  if (!clean || clean.length < 8 || clean.length > 14) {
    res.status(400).json({ code: raw, status: 0, status_verbose: 'invalid barcode' })
    return
  }

  try {
    const cachedPayload = await getProductPayloadByCode(clean)
    if (cachedPayload) {
      res.type('application/json').send(cachedPayload)
      return
    }
  } catch {
    // fall through to upstream
  }

  const cacheKey = `product:${clean}`
  const hit = cacheGet(cacheKey)
  if (hit) {
    res.json(hit)
    return
  }

  try {
    const url = `${OFF_ORIGIN}/api/v2/product/${encodeURIComponent(clean)}.json?fields=${encodeURIComponent(PRODUCT_FIELDS)}`
    const r = await fetch(url, { headers: { 'User-Agent': 'NutriScan/1.0 (https://github.com/openfoodfacts)' } })
    if (!r.ok) {
      res.status(502).json({ error: 'upstream_error', status: r.status })
      return
    }
    /** @type {unknown} */
    const data = await r.json()
    cacheSet(cacheKey, data, TTL_PRODUCT_MS)
    res.json(data)
  } catch {
    res.status(502).json({ error: 'fetch_failed' })
  }
})

async function fetchOffSearch(q, pageSize) {
  const url = new URL(`${OFF_ORIGIN}/cgi/search.pl`)
  url.searchParams.set('search_terms', q)
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set(
    'fields',
    'code,product_name,brands,nutriscore_grade,nutrition_grade_fr,image_front_url,quantity'
  )
  const r = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NutriScan/1.0 (https://github.com/nirajagarwal50/nutriscan)' },
    signal: AbortSignal.timeout(30000),
  })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

function dedupeByCode(products) {
  const seen = new Set()
  const out = []
  for (const p of products) {
    const c = p?.code && String(p.code)
    if (!c || seen.has(c)) continue
    seen.add(c)
    out.push(p)
  }
  return out
}

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || req.query.search_terms || '').trim()
  const pageSize = Math.min(50, Math.max(1, Number(req.query.page_size || 20)))

  if (!q) {
    res.json({ count: 0, page: 1, page_size: pageSize, products: [] })
    return
  }

  const hasDb = (await productCount()) > 0
  const local = hasDb ? await searchCachedProducts(q, pageSize) : []

  if (local.length > 0) {
    const merged = dedupeByCode(local).slice(0, pageSize)
    res.json({
      count: merged.length,
      page: 1,
      page_size: pageSize,
      products: merged,
    })
    return
  }

  const cacheKey = `search:${q}:${pageSize}`
  const hit = cacheGet(cacheKey)
  if (hit) {
    res.json(hit)
    return
  }

  try {
    /** @type {unknown} */
    const data = await fetchOffSearch(q, pageSize)
    cacheSet(cacheKey, data, TTL_SEARCH_MS)
    res.json(data)
  } catch (err) {
    console.error('Search fetch error:', err?.message || err)
    res.status(502).json({ error: 'fetch_failed', detail: err?.message })
  }
})

const distDir = path.join(__dirname, '..', 'dist')

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir, { fallthrough: true }))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(distDir, 'index.html'), (err) => (err ? next(err) : undefined))
  })
}

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`NutriScan API listening on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
