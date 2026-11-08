import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Google Fonts are the only third-party requests the app makes at runtime:
// cache them so the installed app keeps its typography while offline.
const pwaRuntimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: { cacheName: 'google-fonts-stylesheets' },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: new deployments take over on the next load, no prompt.
      registerType: 'autoUpdate',
      // Registration is manual in src/main.jsx via `virtual:pwa-register`.
      injectRegister: null,
      // The manifest icons are already precached through globPatterns below,
      // so the automatic manifest-icon injection would duplicate entries.
      includeManifestIcons: false,
      // Written to dist/manifest.webmanifest and linked from index.html.
      // Icons are generated with `@vite-pwa/assets-generator` (see AGENTS.md).
      // theme/background mirror the theme-color meta tag in index.html.
      manifest: {
        name: 'CFE Consumos',
        short_name: 'CFE Consumos',
        description:
          'Seguimiento del consumo eléctrico doméstico, tarifas y periodos de facturación de CFE.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f6fa',
        theme_color: '#f4f6fa',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the built app shell plus the icons/favicons in public/.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        // Files that should keep going to the origin instead of resolving to
        // the SPA shell when opened directly in the browser.
        navigateFallbackDenylist: [/^\/health$/, /^\/sw\.js$/, /^\/manifest\.webmanifest$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: pwaRuntimeCaching,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules/')) return undefined

          const packagePath = id.split('node_modules/')[1]
          if (!packagePath) return undefined

          const segments = packagePath.split('/')
          const packageName = segments[0].startsWith('@')
            ? `${segments[0]}/${segments[1]}`
            : segments[0]

          if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
            return 'vendor-react'
          }

          if (packageName === 'antd' || packageName === '@ant-design/icons') {
            if (packageName === '@ant-design/icons') {
              return 'vendor-ant-icons'
            }

            const antdScope = segments[2]
            if (antdScope && antdScope !== 'style') {
              return `vendor-antd-${antdScope}`
            }

            return 'vendor-antd-core'
          }

          if (packageName === '@ant-design/charts' || packageName.startsWith('@antv/')) {
            if (packageName.startsWith('@antv/')) {
              const antvScope = segments[2]
              if (antvScope && antvScope !== 'dist' && antvScope !== 'esm' && antvScope !== 'lib') {
                return `vendor-${packageName.replace('@', '').replace('/', '-')}-${antvScope}`
              }
            }

            return `vendor-${packageName.replace('@', '').replace('/', '-')}`
          }

          return undefined
        },
      },
    },
  },
})
