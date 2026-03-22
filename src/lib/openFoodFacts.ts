import { apiUrl } from './api'

export type OFFProduct = {
  product_name?: string
  brands?: string
  quantity?: string
  code?: string
  image_front_url?: string
  image_url?: string
  nutriscore_grade?: string
  nutrition_grade_fr?: string
  nutriscore_data?: {
    grade?: string
    components?: {
      negative?: Array<{ id: string; points?: number; points_max?: number; value?: number | null }>
      positive?: Array<{ id: string; points?: number; points_max?: number; value?: number | null }>
    }
  }
  nutriments?: Record<string, number | string | undefined>
  ingredients_text?: string
  ingredients_n?: number
  labels_tags?: string[]
  nova_group?: number | string
  nova_groups?: string
  packaging_text?: string
  packagings?: Array<Record<string, unknown>>
  categories_tags?: string[]
  compared_to_category?: string
  nutrition_data_per?: string
  serving_size?: string
  serving_quantity?: string
  nutrient_levels_tags?: string[]
  additives_tags?: string[]
  additives_n?: number
}

export type OFFProductResponse = {
  code: string
  product?: OFFProduct
  status: number
  status_verbose: string
}

export type OFFSearchResponse = {
  count: number
  page: number
  page_size: number
  products: OFFProduct[]
}

export async function fetchProductByBarcode(
  barcode: string
): Promise<OFFProductResponse> {
  const clean = barcode.replace(/\D/g, '')
  if (!clean) {
    return { code: barcode, status: 0, status_verbose: 'no code or invalid code' }
  }
  const url = `${apiUrl('/api/product')}/${encodeURIComponent(clean)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`)
  return res.json() as Promise<OFFProductResponse>
}

export async function searchProducts(
  query: string,
  pageSize = 20
): Promise<OFFSearchResponse> {
  const q = query.trim()
  if (!q) {
    return { count: 0, page: 1, page_size: pageSize, products: [] }
  }
  const qs = new URLSearchParams({ q, page_size: String(pageSize) })
  const res = await fetch(`${apiUrl('/api/search')}?${qs}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Open Food Facts search error: ${res.status}`)
  return res.json() as Promise<OFFSearchResponse>
}

export async function fetchAlternatives(
  product: OFFProduct,
  excludeCode: string,
  limit = 6
): Promise<OFFProduct[]> {
  const brand = (product.brands || '').split(',')[0]?.trim()
  const name = (product.product_name || '').split(' ').slice(0, 3).join(' ')
  const terms = [brand, name].filter(Boolean).join(' ').trim() || 'food'
  const search = await searchProducts(terms, 24)
  const seen = new Set<string>([excludeCode])
  const out: OFFProduct[] = []
  for (const p of search.products) {
    const code = p.code || ''
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(p)
    if (out.length >= limit) break
  }
  return out
}
