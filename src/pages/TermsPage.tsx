import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Seo
        title="Terms of Service"
        description="Terms of Service for using NutriScan and its food information features."
        path="/terms"
      />

      <header className="border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold text-primary">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="text-xs text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <p>
          By using NutriScan, you agree to these terms. If you do not agree, do not use the service.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Informational use only</h2>
        <p>
          NutriScan displays summaries and scores based on public product data. This is for general information only and
          is not medical advice, a diagnosis, or a replacement for reading labels or consulting a qualified professional.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Data accuracy</h2>
        <p>
          Data is sourced from Open Food Facts and may be incomplete or outdated. Always verify critical information on
          the product packaging.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Limitation of liability</h2>
        <p>
          NutriScan is provided “as is” without warranties of any kind. To the fullest extent permitted by law, we are not
          liable for any loss or damage arising from your use of the service.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Changes</h2>
        <p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p>
      </main>
    </div>
  )
}
