import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps asset URLs relative so the built plugin works no matter
// what path it is hosted under. Sigma loads the plugin in an iframe and only
// ever knows the one URL you register, so relative assets are the safe default.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    // Sigma embeds the dev server in an iframe on a different origin.
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
