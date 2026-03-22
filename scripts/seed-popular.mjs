/**
 * Fetches ~200 popular-ish products from Open Food Facts (search + product API)
 * and stores full JSON responses in SQLite for fast local search.
 *
 * Usage: npm run seed
 * Requires network. Can take several minutes. Be gentle with OFF (built-in delays + retries).
 */

import { initDb, upsertProduct } from '../server/db.mjs'

const OFF_ORIGIN = 'https://world.openfoodfacts.org'
const TARGET = Math.min(250, Math.max(50, Number(process.env.SEED_TARGET_COUNT || 200)))

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

const SEARCH_TERMS = [
  'maggi',
  'coca cola',
  'nutella',
  'amul',
  'milk',
  'bread',
  'yogurt',
  'chips',
  'chocolate',
  'butter',
  'rice',
  'water',
  'juice',
  'pizza',
  'noodles',
  'coffee',
  'tea',
  'cereal',
  'cookie',
  'cheese',
  'organic',
  'vegan',
  'protein',
  'snack',
  'oat',
  'wheat',
  'biscuit',
  'honey',
  'peanut',
  'energy drink',
  'soy',
  'almond',
  'granola',
  'ketchup',
  'mayonnaise',
  'instant',
  'frozen',
  'baby food',
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function plausibleBarcode(code) {
  const d = String(code || '').replace(/\D/g, '')
  return d.length >= 8 && d.length <= 14
}

async function fetchWithRetry(url, opts = {}, attempts = 4) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        ...opts,
        headers: {
          'User-Agent': 'NutriScan-seed/1.0 (https://github.com/openfoodfacts)',
          Accept: 'application/json',
          ...(opts.headers || {}),
        },
      })
      if (r.ok) return r
      if ([429, 500, 502, 503, 504].includes(r.status)) {
        lastErr = new Error(`HTTP ${r.status}`)
        await sleep(800 * (i + 1) + Math.floor(Math.random() * 400))
        continue
      }
      return r
    } catch (e) {
      lastErr = e
      await sleep(800 * (i + 1) + Math.floor(Math.random() * 400))
    }
  }
  throw lastErr || new Error('fetch failed')
}

async function fetchSearch(term, pageSize) {
  const url = new URL(`${OFF_ORIGIN}/cgi/search.pl`)
  url.searchParams.set('search_terms', term)
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set(
    'fields',
    'code,product_name,brands,nutriscore_grade,nutrition_grade_fr,image_front_url,quantity'
  )
  const r = await fetchWithRetry(url.toString())
  if (!r.ok) throw new Error(`search failed: ${r.status}`)
  return r.json()
}

async function fetchProduct(code) {
  const url = `${OFF_ORIGIN}/api/v2/product/${encodeURIComponent(code)}.json?fields=${encodeURIComponent(PRODUCT_FIELDS)}`
  const r = await fetchWithRetry(url)
  if (!r.ok) throw new Error(`product ${code}: ${r.status}`)
  return r.json()
}

async function main() {
  await initDb()

  const codes = new Set()
  const pageSize = 25

  console.log(`Collecting product codes (target ~${TARGET})…`)

  for (const term of SEARCH_TERMS) {
    if (codes.size >= TARGET) break
    try {
      const data = await fetchSearch(term, pageSize)
      for (const p of data.products || []) {
        const c = p?.code && String(p.code).replace(/\D/g, '')
        if (c && plausibleBarcode(c)) codes.add(c)
      }
      console.log(`  "${term}": ${codes.size} unique codes`)
      await sleep(450)
    } catch (e) {
      console.warn(`  skip term "${term}":`, e.message)
    }
  }

  if (codes.size < TARGET) {
    console.log(`Note: only ${codes.size} unique codes collected; continuing.`)
  }

  const list = [...codes].slice(0, TARGET)
  console.log(`Fetching full product JSON for ${list.length} barcodes (this may take a few minutes)…`)

  let ok = 0
  for (let i = 0; i < list.length; i++) {
    const code = list[i]
    try {
      const data = await fetchProduct(code)
      if (data.status !== 1 || !data.product) {
        console.warn(`  skip ${code}: not found`)
        continue
      }
      const p = data.product
      const name = p.product_name || ''
      const brands = p.brands || ''
      await upsertProduct({
        code: String(p.code || code),
        name,
        brands,
        payload: JSON.stringify(data),
        updated_at: Date.now(),
      })
      ok += 1
      if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${list.length} (${ok} stored)`)
      await sleep(450 + Math.floor(Math.random() * 250))
    } catch (e) {
      console.warn(`  skip ${code}:`, e.message)
    }
  }

  console.log(`Done. Stored ${ok} products in ${DB_PATH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
