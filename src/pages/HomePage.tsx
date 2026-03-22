import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanModal } from '../components/ScanModal'
import { Seo } from '../components/Seo'
import { TRENDING_BARCODES } from '../data/trending'
import { blogPosts } from '../data/blogPosts'
import { fetchProductByBarcode } from '../lib/openFoodFacts'
import { gradeToVerdict, verdictLabel } from '../lib/verdict'
import { absoluteUrl } from '../lib/site'
import { getLocalTrendingBarcodes } from '../lib/scanLog'

type TrendingCard = {
  code: string
  name: string
  brand: string
  image?: string
  grade?: string
}

function nutriBadgeClass(grade?: string): string {
  const g = (grade || '').toLowerCase()
  if (g === 'a') return 'bg-green-600'
  if (g === 'b') return 'bg-lime-600'
  if (g === 'c') return 'bg-yellow-500'
  if (g === 'd') return 'bg-orange-500'
  if (g === 'e') return 'bg-red-600'
  return 'bg-slate-500'
}

function verdictPillClass(kind: ReturnType<typeof gradeToVerdict>): string {
  if (kind === 'healthy') return 'bg-green-100 text-green-800 border-green-200'
  if (kind === 'moderate') return 'bg-orange-100 text-orange-800 border-orange-200'
  if (kind === 'junk') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export function HomePage() {
  const navigate = useNavigate()
  const [scanOpen, setScanOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [trending, setTrending] = useState<TrendingCard[]>(
    TRENDING_BARCODES.map((t) => ({
      code: t.code,
      name: t.name,
      brand: t.brand,
    }))
  )

  const mergedTrendingCodes = useMemo(() => {
    const staticMap = Object.fromEntries(TRENDING_BARCODES.map((t) => [t.code, t]))
    const local = getLocalTrendingBarcodes(8)
    const seen = new Set<string>()
    const out: { code: string; name?: string; brand?: string }[] = []
    for (const l of local) {
      if (seen.has(l.code)) continue
      seen.add(l.code)
      const s = staticMap[l.code]
      out.push({ code: l.code, name: s?.name, brand: s?.brand })
    }
    for (const t of TRENDING_BARCODES) {
      if (seen.has(t.code)) continue
      seen.add(t.code)
      out.push({ code: t.code, name: t.name, brand: t.brand })
    }
    return out.slice(0, 6)
  }, [])

  const onDetected = useCallback(
    (barcode: string) => {
      setScanOpen(false)
      navigate(`/p/${barcode}`, { state: { searchType: 'scan' } })
    },
    [navigate]
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next: TrendingCard[] = []
      for (const item of mergedTrendingCodes) {
        try {
          const res = await fetchProductByBarcode(item.code)
          const p = res.product
          if (cancelled) return
          next.push({
            code: item.code,
            name: p?.product_name || item.name || 'Product',
            brand: p?.brands?.split(',')[0]?.trim() || item.brand || '—',
            image: p?.image_front_url,
            grade: p?.nutriscore_grade || p?.nutrition_grade_fr,
          })
        } catch {
          next.push({
            code: item.code,
            name: item.name || 'Product',
            brand: item.brand || '—',
          })
        }
      }
      if (!cancelled) setTrending(next)
    })()
    return () => {
      cancelled = true
    }
  }, [mergedTrendingCodes])

  const submitSearch = useCallback(() => {
    const q = query.trim()
    if (!q) return
    const compactDigits = q.replace(/\s/g, '')
    if (/^\d{8,14}$/.test(compactDigits)) {
      navigate(`/p/${compactDigits}`, { state: { searchType: 'search' } })
      return
    }
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }, [navigate, query])

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'NutriScan',
      url: absoluteUrl('/'),
      description:
        'Scan barcodes or search Open Food Facts to see a simple healthy vs junk verdict based on NutriScore.',
    }),
    []
  )

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display pb-24 md:pb-10">
      <Seo
        title="NutriScan — Healthy or junk in one scan"
        description="Scan packaged food barcodes or search Open Food Facts. NutriScan turns NutriScore into a clear healthy, moderate, or junk verdict in seconds."
        path="/"
        jsonLd={jsonLd}
      />

      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">nutrition</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              NutriScan
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              className="text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => setScanOpen(true)}
            >
              Scan
            </button>
            <button
              type="button"
              className="text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => searchRef.current?.focus()}
            >
              Search
            </button>
            <Link className="text-sm font-semibold hover:text-primary transition-colors" to="/blog">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
              onClick={() => setScanOpen(true)}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left z-10">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4">
              Scan Your Food. <br />
              <span className="text-primary">Know If It&apos;s Healthy.</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Instantly discover if packaged food is healthy or junk using NutriScore analysis powered by Open Food
              Facts. Better choices start with one simple scan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                onClick={() => setScanOpen(true)}
              >
                <span className="material-symbols-outlined">barcode_scanner</span>
                Scan Product
              </button>
              <button
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/10 text-primary px-8 py-4 rounded-xl text-base font-bold border border-primary/20"
                onClick={() => searchRef.current?.focus()}
              >
                <span className="material-symbols-outlined">search</span>
                Search Product
              </button>
            </div>

            <div className="mt-8 max-w-xl mx-auto lg:mx-0">
              <label className="block text-left text-xs font-bold text-slate-500 mb-2">Search by name or barcode</label>
              <div className="flex gap-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                  placeholder="e.g. Greek yogurt or 3017620422003"
                  className="flex-1 rounded-xl border border-primary/20 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={submitSearch}
                  className="rounded-xl bg-primary text-white px-4 py-3 font-bold"
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-md lg:max-w-none">
            <div className="relative z-10 bg-slate-200 dark:bg-slate-800 rounded-[3rem] p-4 border-8 border-slate-900 dark:border-slate-700 shadow-2xl aspect-[9/19] max-w-[280px] lg:max-w-[320px] mx-auto overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center rounded-[2.5rem] relative"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaqriVQQQtPQFJNCTbUeejkqpiagvK4rmLdQGZ8gWQiAuJ132oYSS1LP4up94-MGpfDz9P0-ghEAdue9ZVUWLYXzztRaraV-rFeh6tuL9lt11fyjhMJEmpEYOTa_QxrZMTx9vIhMqlsGZBhBp0HQgZtlYZVPLUdG9B_iEuJu4DrAHhTjnWiBVkJAqo8VavQclZ2zcsDd2mFnOq99ApGf3ydfJx4PwySSWcBjTW5r3LFkAiUrlRg7p19Xvr0EYrTuv5mX7L-S1CRC7U')",
                }}
              >
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                  <div className="w-64 h-48 border-2 border-primary rounded-lg flex items-center justify-center">
                    <div className="w-full h-0.5 bg-primary animate-pulse shadow-[0_0_10px_#4cae4f]" />
                  </div>
                  <div className="mt-8 bg-white/90 dark:bg-slate-900/90 p-4 rounded-2xl w-56 shadow-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        A
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-primary">Nutri-Score</p>
                        <p className="text-sm font-bold">Excellent Choice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 rounded-full blur-[100px] -z-0" />
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400">Three simple steps to better health</p>
          </div>
          <div className="carousel-container flex gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-pl-4">
            <div className="carousel-item w-[85%] md:w-[calc(33.333%-1rem)] bg-background-light dark:bg-background-dark p-6 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-sm">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">barcode_scanner</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Scan barcode</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Point your camera at a packaged food barcode. NutriScan reads it in the browser and looks it up in Open
                Food Facts.
              </p>
            </div>
            <div className="carousel-item w-[85%] md:w-[calc(33.333%-1rem)] bg-background-light dark:bg-background-dark p-6 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-sm">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">analytics</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Analyze nutrition</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We pull NutriScore, macros, ingredients, labels, and NOVA processing when available—then summarize what
                matters.
              </p>
            </div>
            <div className="carousel-item w-[85%] md:w-[calc(33.333%-1rem)] bg-background-light dark:bg-background-dark p-6 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-sm">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">task_alt</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Get a clear verdict</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                See healthy, moderate, or junk at a glance—plus quick reasons tied to the underlying NutriScore drivers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">Trending Products</h2>
              <p className="text-xs text-slate-500 mt-1">Includes your recent scans on this device, plus popular picks.</p>
            </div>
            <Link className="text-primary font-bold flex items-center gap-1 hover:underline text-xs" to="/search?q=maggi">
              View All <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          <div className="carousel-container flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-pl-4">
            {trending.map((p) => {
              const g = (p.grade || '').toLowerCase()
              const v = gradeToVerdict(g)
              return (
                <Link
                  key={p.code}
                  to={`/p/${p.code}`}
                  className="carousel-item w-[240px] bg-background-light dark:bg-background-dark rounded-xl border border-primary/10 overflow-hidden group"
                >
                  <div
                    className="aspect-square bg-cover bg-center bg-slate-200 dark:bg-slate-800"
                    style={p.image ? { backgroundImage: `url('${p.image}')` } : undefined}
                  />
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.brand}</p>
                    <h3 className="font-bold text-base mb-2 line-clamp-2">{p.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${nutriBadgeClass(p.grade)} text-white text-[9px] font-black px-2 py-0.5 rounded`}>
                        {p.grade ? `NUTRI-SCORE ${p.grade.toUpperCase()}` : 'NUTRI-SCORE —'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${verdictPillClass(v)}`}
                      >
                        {verdictLabel(v)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-black mb-8">Expert Nutrition Blog</h2>
          <div className="carousel-container flex gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-pl-4">
            {blogPosts.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="carousel-item w-[280px] md:w-[380px] flex flex-col gap-3 group cursor-pointer"
              >
                <div className="rounded-xl overflow-hidden aspect-[16/9]">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${post.image}')` }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase">{post.category}</span>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">{post.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/blog" className="text-primary font-bold hover:underline">
              Browse all articles
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-background-light dark:bg-background-dark pt-12 pb-28 md:pb-10 border-t border-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">nutrition</span>
                </div>
                <span className="text-xl font-extrabold tracking-tight">NutriScan</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-4">
                Empowering shoppers to make healthier choices through transparent, Open Food Facts–backed analysis.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">restaurant</span> Company
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <span className="cursor-default">About (coming soon)</span>
                </li>
                <li>
                  <Link className="hover:text-primary" to="/blog">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">article</span> Resources
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link className="hover:text-primary" to="/blog/understanding-nutriscore">
                    NutriScore FAQ
                  </Link>
                </li>
                <li>
                  <a className="hover:text-primary" href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer">
                    Open Food Facts
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">shield_person</span> Legal
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link className="hover:text-primary" to="/privacy">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary" to="/terms">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-primary/5 text-[10px] text-slate-500">
            <p>© {new Date().getFullYear()} NutriScan. All rights reserved.</p>
            <div className="flex gap-4 mt-2 md:mt-0">
              <p className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">eco</span> Data: Open Food Facts
              </p>
              <p className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">health_and_safety</span> NutriScore-based
              </p>
            </div>
          </div>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-primary/10 px-4 py-2 flex justify-around items-center z-50">
        <button type="button" className="flex flex-col items-center gap-1 text-primary" onClick={() => setScanOpen(true)}>
          <span className="material-symbols-outlined">barcode_scanner</span>
          <span className="text-[10px] font-bold">Scan</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1 text-slate-500" onClick={() => searchRef.current?.focus()}>
          <span className="material-symbols-outlined">search</span>
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <Link className="flex flex-col items-center gap-1 text-slate-500" to="/blog">
          <span className="material-symbols-outlined">article</span>
          <span className="text-[10px] font-bold">Blog</span>
        </Link>
      </div>

      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onDetected} />
    </div>
  )
}
