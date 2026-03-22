import type { OFFProduct } from './openFoodFacts'

export type NutritionDisplay = {
  label: string
  calories: string
  protein: string
  fat: string
  sugar: string
  salt: string
  basis: string
}

function pickNutriment(
  nutriments: Record<string, number | string | undefined> | undefined,
  key: string,
  preferServing: boolean
): number | undefined {
  if (!nutriments) return undefined
  const servingKey = `${key}_serving`
  const baseKey = `${key}_100g`
  const raw = preferServing
    ? (nutriments[servingKey] ?? nutriments[key] ?? nutriments[baseKey])
    : (nutriments[baseKey] ?? nutriments[key] ?? nutriments[servingKey])
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function buildNutritionDisplay(product: OFFProduct): NutritionDisplay {
  const nutriments = product.nutriments as Record<string, number | string | undefined> | undefined
  const hasServing =
    !!product.serving_size &&
    product.nutrition_data_per !== '100g' &&
    nutriments &&
    nutriments['energy-kcal_serving'] != null

  const preferServing = !!hasServing

  const kcal = pickNutriment(nutriments, 'energy-kcal', preferServing)
  const protein = pickNutriment(nutriments, 'proteins', preferServing)
  const fat = pickNutriment(nutriments, 'fat', preferServing)
  const sugar = pickNutriment(nutriments, 'sugars', preferServing)
  const salt = pickNutriment(nutriments, 'salt', preferServing)

  const basis = preferServing
    ? `Per serving ${product.serving_size || ''}`.trim()
    : 'Per 100 g'

  const fmt = (n: number | undefined, unit: string): string =>
    n === undefined ? '—' : `${roundSmart(n)}${unit}`

  return {
    label: product.product_name || 'Product',
    calories: fmt(kcal, ' kcal'),
    protein: fmt(protein, 'g'),
    fat: fmt(fat, 'g'),
    sugar: fmt(sugar, 'g'),
    salt: fmt(salt, 'g'),
    basis,
  }
}

function roundSmart(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}
