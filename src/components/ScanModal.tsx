import { useEffect, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

type ScanModalProps = {
  open: boolean
  onClose: () => void
  onDetected: (barcode: string) => void
}

export function ScanModal({ open, onClose, onDetected }: ScanModalProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const scanner = new Html5Qrcode('nutriscan-scanner', { verbose: false })
    let cancelled = false

    const start = async () => {
      setError(null)
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 180 } },
          (text) => {
            const digits = text.replace(/\D/g, '')
            if (digits.length >= 8 && digits.length <= 14) {
              onDetected(digits)
            }
          },
          () => {}
        )
      } catch {
        if (!cancelled) {
          setError('Camera access was blocked or unavailable. Try manual search instead.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
    }
  }, [open, onDetected])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background-light dark:bg-background-dark border border-primary/20 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
          <p className="font-bold">Scan barcode</p>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-primary/10"
            onClick={onClose}
            aria-label="Close scanner"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div
            id="nutriscan-scanner"
            className="w-full rounded-xl overflow-hidden bg-black min-h-[220px]"
          />
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Point your camera at a product barcode (EAN-13 / UPC). Grant camera permission when prompted.
          </p>
        </div>
      </div>
    </div>
  )
}
