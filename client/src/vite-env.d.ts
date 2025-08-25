/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_STRIPE_PUBLIC_KEY: string
    readonly VITE_GOOGLE_PLACES_API_KEY: string
    readonly VITE_BANNER_VIDEO_URL: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
    readonly BASE_URL: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly hot?: import('vite/types/hot').ViteHotContext
    readonly glob: import('vite/types/importGlob').ImportGlobFunction
  }
}

export {}
