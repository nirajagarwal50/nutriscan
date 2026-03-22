import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import type { OFFProduct } from '../lib/openFoodFacts'
import { fetchAlternatives, fetchProductByBarcode } from '../lib/openFoodFacts'
import { buildNutritionDisplay } from '../lib/nutrition'
import { chipsFromLabelsTags } from '../lib/labels'
import { buildVerdictExplanation, gradeToVerdict, normalizeNutriScoreGrade, verdictEmoji, verdictLabel } from '../lib/verdict'
import { describeNova } from '../lib/nova'
import { absoluteUrl } from '../lib/site'
import { logScanEvent, type SearchType } from '../lib/scanLog'

function iconForVerdict(kind: ReturnType<typeof gradeToVerdict>): { icon: string; ring: string; text: string } {
  if (kind === 'healthy') return { icon: 'check_circle', ring: 'border-primary', text: 'text-primary' }
  if (kind === 'moderate') return { icon: 'warning', ring: 'border-amber-500', text: 'text-amber-600' }
  if (kind === 'junk') return { icon: 'dangerous', ring: 'border-red-500', text: 'text-red-600' }
  return { icon: 'help', ring: 'border-slate-400', text: 'text-slate-600' }
}

function nutriScoreColor(grade?: string): string {
  const g = (grade || '').toLowerCase()
  if (g === 'a') return '#038141'
  if (g === 'b') return '#85BB2F'
  if (g === 'c') return '#FECB02'
  if (g === 'd') return '#EE8100'
  if (g === 'e') return '#E63E11'
  return '#64748b'
}

export function ProductPage() {
  const { barcode = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const searchType: SearchType =
    (location.state as { searchType?: SearchType } | null)?.searchType ?? 'direct'
  const loggedKey = useRef<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<OFFProduct | null>(null)
  const [alternatives, setAlternatives] = useState<OFFProduct[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchProductByBarcode(barcode)
        if (cancelled) return
        if (res.status !== 1 || !res.product) {
          navigate(`/product-not-found?barcode=${encodeURIComponent(barcode)}`, { replace: true })
          return
        }
        setProduct(res.product)
        const alt = await fetchAlternatives(res.product, res.product.code || barcode, 6)
        if (!cancelled) setAlternatives(alt)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [barcode, navigate])

  useEffect(() => {
    if (!product) return
    const key = product.code || barcode
    if (!key || loggedKey.current === key) return
    loggedKey.current = key
    logScanEvent({
      barcode: key,
      product_name: product.product_name || '',
      nutriscore: normalizeNutriScoreGrade(product) || null,
      search_type: searchType,
    })
  }, [product, barcode, searchType])

  const grade = normalizeNutriScoreGrade(product || {})
  const verdict = gradeToVerdict(grade)
  const showVerdict = verdict !== 'unknown'
  const vIcon = iconForVerdict(verdict)
  const nutrition = product ? buildNutritionDisplay(product) : null
  const explanation = useMemo(() => {
    if (!product || !showVerdict) return null
    return buildVerdictExplanation({
      grade,
      verdict,
      nutriscoreData: product.nutriscore_data,
      novaGroup: product.nova_group,
      additivesTags: product.additives_tags,
    })
  }, [product, grade, verdict, showVerdict])

  const labels = chipsFromLabelsTags(product?.labels_tags)
  const nova = describeNova(product?.nova_group ?? product?.nova_groups)

  const ingredientsText = (product?.ingredients_text || '').trim()
  const ingredientCount =
    product?.ingredients_n ??
    (ingredientsText ? ingredientsText.split(',').filter(Boolean).length : 0)

  const packagingText = (product?.packaging_text || '').trim()
  const packagingSummary =
    Array.isArray(product?.packagings) && product.packagings.length
      ? product.packagings
          .slice(0, 4)
          .map((p) => {
            const shape = typeof p.shape === 'string' ? p.shape.replace(/^..:/, '') : ''
            const material = typeof p.material === 'string' ? p.material.replace(/^..:/, '') : ''
            return [shape, material].filter(Boolean).join(' · ')
          })
          .filter(Boolean)
          .join(' · ')
      : ''

  const titleBase = product?.product_name || 'Product'
  const desc = useMemo(() => {
    if (!grade) {
      return `${titleBase} on NutriScan — Open Food Facts nutrition facts, ingredients, labels, and processing (NutriScore not available).`
    }
    return `${titleBase} on NutriScan — NutriScore ${grade.toUpperCase()}. Ingredients, nutrition, NOVA, and a healthy vs junk verdict (Open Food Facts).`
  }, [grade, titleBase])

  const jsonLd = useMemo(() => {
    if (!product?.code) return undefined
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.product_name,
      image: product.image_front_url,
      brand: product.brands ? { '@type': 'Brand', name: product.brands } : undefined,
      sku: product.code,
      url: absoluteUrl(`/p/${product.code}`),
    }
  }, [product])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading product…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link className="text-primary font-bold" to="/">
          Back home
        </Link>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col">
      <Seo
        title={`${titleBase} nutrition analysis`}
        description={desc}
        path={`/p/${product.code || barcode}`}
        image={product.image_front_url}
        type="article"
        jsonLd={jsonLd}
      />

      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto w-full">
          <button
            type="button"
            className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 text-slate-900 dark:text-slate-100"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Product Analysis</h1>
          <button
            type="button"
            className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 text-slate-900 dark:text-slate-100"
            onClick={async () => {
              const url = absoluteUrl(`/p/${product.code || barcode}`)
              try {
                if (navigator.share) {
                  await navigator.share({ title: titleBase, text: desc, url })
                } else {
                  await navigator.clipboard.writeText(url)
                }
              } catch {
                // ignore
              }
            }}
            aria-label="Share"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        <section className="p-6 flex flex-col items-center text-center gap-4">
          {showVerdict ? (
            <div className="relative">
              <div className={`size-40 rounded-full border-8 ${vIcon.ring} flex items-center justify-center bg-primary/5`}>
                <div className="flex flex-col items-center">
                  <span className={`material-symbols-outlined ${vIcon.text} text-5xl font-bold`}>{vIcon.icon}</span>
                  <span className={`text-2xl font-extrabold ${vIcon.text}`}>
                    {verdictEmoji(verdict)} {verdictLabel(verdict)}
                  </span>
                </div>
              </div>
              {grade ? (
                <div
                  className="absolute -bottom-2 -right-2 size-16 rounded-xl flex items-center justify-center shadow-lg border-4 border-background-light dark:border-background-dark text-white text-3xl font-black italic"
                  style={{ backgroundColor: nutriScoreColor(grade) }}
                >
                  {grade.toUpperCase()}
                </div>
              ) : null}
            </div>
          ) : product.image_front_url ? (
            <div className="w-40 h-40 rounded-2xl overflow-hidden border border-primary/15 shadow-sm bg-white dark:bg-slate-900">
              <img src={product.image_front_url} alt="" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-40 h-40 rounded-2xl border border-primary/15 bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl">nutrition</span>
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{product.product_name || 'Unknown product'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {[product.quantity, product.brands].filter(Boolean).join(' • ')}
            </p>
          </div>
          {!showVerdict ? (
            <div className="w-full text-left rounded-xl border border-primary/15 bg-white dark:bg-slate-900/40 p-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  NutriScore isn&apos;t available for this product in Open Food Facts yet. Below are the raw nutrition
                  facts, ingredients, and other data we could load.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {explanation ? (
          <section className="px-4 mb-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <h3 className="font-bold">{explanation.title}</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {explanation.items.map((it, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      className={`material-symbols-outlined text-xs mt-1 ${
                        it.tone === 'bad' ? 'text-red-600' : it.tone === 'warn' ? 'text-amber-600' : 'text-primary'
                      }`}
                    >
                      {it.tone === 'bad' ? 'close' : it.tone === 'warn' ? 'warning' : 'check'}
                    </span>
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {nutrition ? (
          <section className="px-4 mb-8">
            <h3 className="font-bold mb-2 px-1">Nutrition Overview</h3>
            <p className="text-xs text-slate-500 mb-4 px-1">{nutrition.basis}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">local_fire_department</span>
                <span className="text-xs text-slate-500">Calories</span>
                <span className="font-bold text-lg">{nutrition.calories}</span>
              </div>
              <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">fitness_center</span>
                <span className="text-xs text-slate-500">Protein</span>
                <span className="font-bold text-lg">{nutrition.protein}</span>
              </div>
              <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">opacity</span>
                <span className="text-xs text-slate-500">Fat</span>
                <span className="font-bold text-lg">{nutrition.fat}</span>
              </div>
              <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2">laundry</span>
                <span className="text-xs text-slate-500">Sugar</span>
                <span className="font-bold text-lg">{nutrition.sugar}</span>
              </div>
              <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center shadow-sm col-span-2">
                <span className="material-symbols-outlined text-primary mb-2">salinity</span>
                <span className="text-xs text-slate-500">Salt</span>
                <span className="font-bold text-lg">{nutrition.salt}</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {labels.length ? (
              labels.map((l) => (
                <span
                  key={l.key}
                  className={`${
                    l.active ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  } px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}
                >
                  <span className="material-symbols-outlined text-sm">{l.icon}</span>
                  {l.label}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No diet labels listed in Open Food Facts for this product.</span>
            )}
          </div>
        </section>

        {nova ? (
          <section className="px-4 mb-8">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-center gap-4">
              <div className="size-14 bg-amber-500 text-white rounded-lg flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold">NOVA</span>
                <span className="text-2xl font-black">{nova.level}</span>
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-400 leading-tight">{nova.title}</h4>
                <p className="text-xs text-amber-800 dark:text-amber-500 mt-1">{nova.description}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="px-4 mb-8">
            <div className="rounded-xl border border-primary/10 p-4 text-sm text-slate-600 dark:text-slate-400">
              NOVA processing level is not available for this product in Open Food Facts.
            </div>
          </section>
        )}

        <section className="px-4 mb-8">
          <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <h3 className="font-bold">Ingredients</h3>
              </div>
              <span className="text-xs text-slate-400">{ingredientCount ? `${ingredientCount} items` : '—'}</span>
            </div>
            <div className="p-4 max-h-40 overflow-y-auto hide-scrollbar text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {ingredientsText || 'Ingredients are not available in Open Food Facts for this product.'}
            </div>
          </div>
        </section>

        {(packagingText || packagingSummary) && (
          <section className="px-4 mb-8">
            <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-primary/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <h3 className="font-bold">Packaging</h3>
              </div>
              <div className="p-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {packagingText || packagingSummary}
              </div>
            </div>
          </section>
        )}

        <section className="mb-10">
          <h3 className="font-bold mb-4 px-4">Trending Alternatives</h3>
          <div className="flex gap-4 overflow-x-auto px-4 hide-scrollbar">
            {alternatives.length ? (
              alternatives.map((alt) => (
                <Link
                  key={alt.code}
                  to={`/p/${alt.code}`}
                  state={{ searchType: 'search' }}
                  className="min-w-[140px] flex flex-col gap-2"
                >
                  <div className="aspect-square bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/5 flex items-center justify-center p-4">
                    {alt.image_front_url ? (
                      <img alt="" className="w-full h-auto object-contain" src={alt.image_front_url} />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400">fastfood</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate">{alt.product_name || 'Product'}</p>
                    <p className="text-xs font-bold text-primary">
                      {alt.nutriscore_grade || alt.nutrition_grade_fr
                        ? `NutriScore ${String(alt.nutriscore_grade || alt.nutrition_grade_fr).toUpperCase()}`
                        : 'NutriScore —'}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500 px-2">No close alternatives found via search yet.</p>
            )}
          </div>
        </section>

        <footer className="px-6 py-12 bg-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-9xl absolute -top-10 -right-10">lunch_dining</span>
            <span className="material-symbols-outlined text-9xl absolute top-20 -left-10">eco</span>
            <span className="material-symbols-outlined text-9xl absolute bottom-0 right-20">restaurant</span>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex gap-6 text-sm font-bold text-slate-600 dark:text-slate-400">
              <Link className="hover:text-primary" to="/">
                Home
              </Link>
              <Link className="hover:text-primary" to="/blog">
                Blog
              </Link>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} NutriScan. Data from Open Food Facts.</p>
          </div>
        </footer>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-primary/10 px-4 pb-6 pt-2 z-50">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link className="flex flex-col items-center gap-1 text-primary" to="/">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span className="text-[10px] font-bold">Scan</span>
          </Link>
          <span className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-[10px] font-bold">Analysis</span>
          </span>
        </div>
      </nav>
    </div>
  )
}
