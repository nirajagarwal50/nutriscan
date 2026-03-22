import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'

export function NotFoundProductPage() {
  const [params] = useSearchParams()
  const barcode = params.get('barcode') || ''

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <Seo
        title="Product not found"
        description="We could not find this barcode in Open Food Facts yet. Try searching by product name instead."
        path="/product-not-found"
        noIndex
      />

      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">nutrition</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-primary">NutriScan</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" to="/">
              Scan
            </Link>
            <Link className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" to="/search">
              Search
            </Link>
            <Link className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" to="/blog">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto w-full">
        <div className="relative mb-8 w-full aspect-square max-w-[280px]">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 flex flex-col items-center justify-center border border-primary/20 h-full w-full">
            <div className="bg-primary/10 text-primary p-6 rounded-full mb-4">
              <span className="material-symbols-outlined text-6xl">search_off</span>
            </div>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-2" />
            <div className="w-16 h-2 bg-slate-100 dark:bg-slate-600 rounded-full" />
          </div>
        </div>

        <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Product Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Sorry, we couldn&apos;t find this product in Open Food Facts yet. Try searching by name, or scan another item.
            {barcode ? (
              <>
                {' '}
                <span className="block mt-2 text-xs font-mono text-slate-500">Barcode: {barcode}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full mb-12">
          <Link
            to="/"
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Scan Again
          </Link>
          <Link
            to="/search"
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
            Search Another
          </Link>
        </div>

        <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-primary/20 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-primary">info</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Help improve Open Food Facts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                NutriScan reads public data from Open Food Facts. If a product is missing, you can contribute it via the
                official Open Food Facts project.
              </p>
              <a
                className="inline-flex w-full sm:w-auto h-10 items-center justify-center bg-slate-900 dark:bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity px-4"
                href="https://world.openfoodfacts.org/contribute"
                target="_blank"
                rel="noreferrer"
              >
                Contribute on Open Food Facts
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-primary/10 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <p className="font-bold text-primary">Features</p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link className="hover:text-primary" to="/">
                    Barcode lookup
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary" to="/search">
                    Search
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="font-bold text-primary">Learn</p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link className="hover:text-primary" to="/blog">
                    Blog
                  </Link>
                </li>
                <li>
                  <a className="hover:text-primary" href="https://world.openfoodfacts.org/discover" target="_blank" rel="noreferrer">
                    Open Food Facts
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 flex flex-col items-center md:items-end justify-center">
              <p className="text-xs text-slate-500 text-center md:text-right">
                © {new Date().getFullYear()} NutriScan. Product data © Open Food Facts contributors.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <div className="md:hidden sticky bottom-0 w-full bg-white dark:bg-slate-900 border-t border-primary/10 px-4 py-2 flex justify-around items-center">
        <Link className="flex flex-col items-center gap-1 text-primary" to="/">
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="text-[10px] font-bold">Scan</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" to="/search">
          <span className="material-symbols-outlined">search</span>
          <span className="text-[10px] font-bold">Search</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" to="/blog">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px] font-bold">Blog</span>
        </Link>
      </div>
    </div>
  )
}
