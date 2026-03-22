/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  /** Optional absolute API origin if not same-origin (defaults to same-origin `/api`). */
  readonly VITE_API_ROOT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
