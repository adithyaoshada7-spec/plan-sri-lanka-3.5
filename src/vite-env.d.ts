/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Build timestamp (ISO 8601) injected by Vite config. */
  readonly VITE_BUILD_TIME_ISO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
