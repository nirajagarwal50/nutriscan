/**
 * API root for NutriScan backend (Open Food Facts proxy).
 * Empty = same origin (`/api/...`), with Vite proxying to the local server in dev.
 * Set `VITE_API_ROOT` if the API is on another origin.
 */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_ROOT as string | undefined)?.replace(/\/$/, '') ?? ''
  const p = path.startsWith('/') ? path : `/${path}`
  if (base) return `${base}${p}`
  return p
}
