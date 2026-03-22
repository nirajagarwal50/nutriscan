import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Seo
        title="Privacy Policy"
        description="Privacy Policy for NutriScan: how we handle data when you use the app."
        path="/privacy"
      />

      <header className="border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold text-primary">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <p>
          NutriScan (“we”, “our”) provides food information using public data from Open Food Facts. This policy describes
          how information may be handled when you use the NutriScan website or application.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Information we collect</h2>
        <p>
          NutriScan does not require an account. If you use the service locally, product lookups and search queries may
          be processed by our servers or proxies to retrieve data from Open Food Facts. We may cache requests to improve
          performance. Analytics or scan logs stored only in your browser (e.g. local storage) remain on your device
          unless you clear them.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Third-party services</h2>
        <p>
          Product data comes from Open Food Facts. Their terms and privacy practices apply to that data. Please review
          their policies at{' '}
          <a className="text-primary font-bold" href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer">
            openfoodfacts.org
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Contact</h2>
        <p>For privacy questions, contact us using the contact details published on your deployment of NutriScan.</p>
      </main>
    </div>
  )
}
