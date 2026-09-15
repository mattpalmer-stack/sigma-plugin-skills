/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Maps JavaScript API key, injected at build time.
   *
   * A Maps JS key is necessarily visible in the shipped bundle — it is sent to
   * Google from the browser. Restricting it by HTTP referrer in the Google Cloud
   * console is what actually protects it, not keeping it out of the bundle.
   */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
