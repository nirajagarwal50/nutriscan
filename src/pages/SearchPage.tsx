import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { searchProducts } from '../lib/openFoodFacts'
import type { OFFProduct } from '../lib/openFoodFacts'
import { gradeToVerdict, normalizeNutriScoreGrade, verdictLabel } from '../lib/verdict'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const navigate = useNavigate()
  const [localQuery, setLocalQuery] = useState(q)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<OFFProduct[]>([])

  useEffect(() => {
    setLocalQuery(q)
  }, [q])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!q) {
        setResults([])
        return
      }
      const compactDigits = q.replace(/\s/g, '')
      if (/^\d{8,14}$/.test(compactDigits)) {
        navigate(`/p/${compactDigits}`, { replace: true, state: { searchType: 'search' } })
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await searchProducts(q, 24)
        if (cancelled) return
        setResults(res.products || [])
      } catch {
        if (!cancelled) setError('Search is taking too long or unavailable. Please try again in a moment.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [q, navigate])

  const submit = () => {
    const next = localQuery.trim()
    if (!next) return
    const compactDigits = next.replace(/\s/g, '')
    if (/^\d{8,14}$/.test(compactDigits)) {
      navigate(`/p/${compactDigits}`, { state: { searchType: 'search' } })
      return
    }
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  const title = useMemo(() => (q ? `Search: ${q}` : 'Search products'), [q])

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Seo
        title={title}
        description="Search Open Food Facts by product name or barcode number. Open a product to see NutriScan’s verdict and nutrition breakdown."
        path={`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`}
        noIndex={!q}
      />

      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-primary/10" aria-label="Home">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1 flex gap-2">
            <input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Search name or barcode…"
              className="flex-1 rounded-xl border border-primary/20 bg-white dark:bg-slate-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="button" onClick={submit} className="rounded-xl bg-primary text-white px-4 py-2 font-bold">
              Search
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!q ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Enter a product name or a barcode to search Open Food Facts.</p>
        ) : loading ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">Searching — this may take a few seconds…</p>
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-primary/10 bg-white dark:bg-slate-900">
                  <div className="size-16 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0"/>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"/>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{results.length} result(s)</p>
            {results.map((p) => {
              const code = p.code || ''
              const g = normalizeNutriScoreGrade(p)
              const v = gradeToVerdict(g)
              return (
                <Link
                  key={code}
                  to={`/p/${code}`}
                  state={{ searchType: 'search' }}
                  className="flex gap-3 p-3 rounded-xl border border-primary/10 bg-white dark:bg-slate-900 hover:border-primary/30 transition-colors"
                >
                  <div className="size-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image_front_url ? (
                      <img src={p.image_front_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400">fastfood</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{p.product_name || 'Unknown product'}</p>
                    <p className="text-xs text-slate-500 truncate">{p.brands || '—'}</p>
                    <p className="text-xs mt-1">
                      <span className="font-bold text-primary">{g ? `NutriScore ${g.toUpperCase()}` : 'NutriScore —'}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{verdictLabel(v)}</span>
                    </p>
                  </div>
                </Link>
              )
            })}
            {!results.length && !loading ? (
              <div className="rounded-xl border border-primary/10 p-4">
                <p className="font-bold mb-1">No matches</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Try a different spelling, a shorter query, or scan the barcode if you have the pack.
                </p>
                <Link className="text-primary font-bold" to="/product-not-found">
                  Go to “not found” help
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
