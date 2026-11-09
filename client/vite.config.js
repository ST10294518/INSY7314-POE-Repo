// Documentation references added during final review (9 November 2026).
// VITE: https://vite.dev/config/server-options
// HTTPS: https://nodejs.org/api/https.html
// VITEST: https://vitest.dev/guide/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
import { readFileSync } from 'node:fs'
import { Agent } from 'node:https'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const previewCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://localhost:5443",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export default defineConfig(({ command, mode }) => {
  const localServerOptions = {}

  if (command === 'serve' && mode !== 'test') {
    const key = readFileSync(new URL('../certs/key.pem', import.meta.url))
    const cert = readFileSync(new URL('../certs/cert.pem', import.meta.url))

    localServerOptions.https = { key, cert }
    localServerOptions.proxy = {
      '/api': {
        target: 'https://localhost:5443',
        changeOrigin: true,
        secure: true,
        agent: new Agent({ ca: cert }),
      },
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      ...localServerOptions,
    },
    preview: {
      host: 'localhost',
      port: 4173,
      strictPort: true,
      ...localServerOptions,
      headers: {
        'Content-Security-Policy': previewCsp,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
      },
    },
  }
})