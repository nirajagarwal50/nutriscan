export type SearchType = 'scan' | 'search' | 'direct'

export type ScanLogEntry = {
  barcode: string
  product_name: string
  nutriscore: string | null
  search_type: SearchType
  timestamp: number
}

const STORAGE_KEY = 'nutriscan_scan_log_v1'
const MAX_ENTRIES = 200

function readAll(): ScanLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is ScanLogEntry =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as ScanLogEntry).barcode === 'string' &&
        typeof (x as ScanLogEntry).timestamp === 'number'
    )
  } catch {
    return []
  }
}

function writeAll(entries: ScanLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // quota / private mode
  }
}

export function logScanEvent(entry: Omit<ScanLogEntry, 'timestamp'> & { timestamp?: number }) {
  const row: ScanLogEntry = {
    ...entry,
    timestamp: entry.timestamp ?? Date.now(),
  }
  const prev = readAll()
  const next = [row, ...prev].slice(0, MAX_ENTRIES)
  writeAll(next)
}

/** Barcodes most often logged recently (client-only “trending”). */
export function getLocalTrendingBarcodes(limit = 8): { code: string; count: number; lastAt: number }[] {
  const entries = readAll()
  const map = new Map<string, { count: number; lastAt: number }>()
  for (const e of entries) {
    const cur = map.get(e.barcode) || { count: 0, lastAt: 0 }
    cur.count += 1
    cur.lastAt = Math.max(cur.lastAt, e.timestamp)
    map.set(e.barcode, cur)
  }
  return [...map.entries()]
    .map(([code, v]) => ({ code, count: v.count, lastAt: v.lastAt }))
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
    .slice(0, limit)
}
