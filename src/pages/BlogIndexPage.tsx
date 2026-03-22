import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { blogPosts } from '../data/blogPosts'
import { absoluteUrl } from '../lib/site'

export function BlogIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'NutriScan Nutrition Blog',
    url: absoluteUrl('/blog'),
    blogPost: blogPosts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      datePublished: p.publishedAt,
      url: absoluteUrl(`/blog/${p.slug}`),
    })),
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Seo
        title="Nutrition blog"
        description="Guides on NutriScore, hidden sugars, NOVA processing, and how NutriScan uses Open Food Facts responsibly."
        path="/blog"
        jsonLd={jsonLd}
      />

      <header className="border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold">
            <span className="material-symbols-outlined text-primary">nutrition</span>
            NutriScan
          </Link>
          <Link className="text-sm font-bold text-primary" to="/search">
            Search
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black mb-2">Expert Nutrition Blog</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Practical articles to help you interpret NutriScore, spot marketing traps, and understand processing levels.
          </p>
        </div>

        <div className="space-y-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-5 hover:border-primary/30 transition-colors"
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">{post.category}</p>
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{post.description}</p>
              <p className="text-xs text-slate-500">
                {post.publishedAt} · {post.readTimeMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
