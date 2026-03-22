import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { getPostBySlug } from '../data/blogPosts'
import { absoluteUrl } from '../lib/site'

function renderMarkdownish(content: string): string {
  const lines = content.trim().split('\n')
  let html = ''
  let inList = false
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/)
    const h3 = line.match(/^###\s+(.*)$/)
    const li = line.match(/^-\s+(.*)$/)
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    if (h2) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<h2 class="text-2xl font-black mt-8 mb-3">${h2[1]}</h2>`
      continue
    }
    if (h3) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<h3 class="text-xl font-bold mt-6 mb-2">${h3[1]}</h3>`
      continue
    }
    if (li) {
      if (!inList) {
        html += '<ul class="list-disc pl-5 space-y-2 my-4">'
        inList = true
      }
      const item = li[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      html += `<li>${item}</li>`
      continue
    }
    if (!line.trim()) continue
    if (inList) {
      html += '</ul>'
      inList = false
    }
    html += `<p class="my-4 text-slate-700 dark:text-slate-300 leading-relaxed">${boldLine}</p>`
  }
  if (inList) html += '</ul>'
  return html
}

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-6">
        <p className="font-bold mb-3">Article not found</p>
        <Link className="text-primary font-bold" to="/blog">
          Back to blog
        </Link>
      </div>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    image: post.image,
    author: { '@type': 'Organization', name: 'NutriScan' },
    publisher: { '@type': 'Organization', name: 'NutriScan' },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        image={post.image}
        type="article"
        jsonLd={jsonLd}
      />

      <header className="border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/blog" className="text-sm font-bold text-primary">
            ← Blog
          </Link>
          <Link to="/" className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-3">{post.category}</p>
        <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4">{post.title}</h1>
        <p className="text-sm text-slate-500 mb-8">
          {post.publishedAt} · {post.readTimeMinutes} min read
        </p>

        <div
          className="rounded-2xl overflow-hidden aspect-[16/9] mb-10 bg-slate-200 dark:bg-slate-800 bg-cover bg-center"
          style={{ backgroundImage: `url('${post.image}')` }}
        />

        <div
          className="max-w-none text-base [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h3]:text-slate-900 [&_h3]:dark:text-white"
          dangerouslySetInnerHTML={{ __html: renderMarkdownish(post.content) }}
        />

        <div className="mt-12 pt-8 border-t border-primary/10">
          <p className="text-xs text-slate-500">
            Educational content only—not medical advice. Product scores come from Open Food Facts when available.
          </p>
        </div>
      </article>
    </div>
  )
}
