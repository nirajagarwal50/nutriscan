/**
 * Canonical / OG base URL.
 * - If `VITE_SITE_URL` is set (e.g. after you buy a domain), it wins.
 * - Otherwise in the browser we use the current origin (`http://localhost:5173` in dev, file host in prod).
 * - This works for local hosting with no domain; add `VITE_SITE_URL` later when you deploy.
 */
export function siteUrl(): string {
  const v = import.meta.env.VITE_SITE_URL as string | undefined
  if (v && /^https?:\/\//i.test(v)) return v.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:5173'
}

export function absoluteUrl(path: string): string {
  const base = siteUrl()
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}
