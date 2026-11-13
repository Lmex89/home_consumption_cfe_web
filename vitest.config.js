import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Kept separate from vite.config.js so the PWA plugin never runs during tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 30000,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      // main.jsx imports virtual:pwa-register, which only resolves with the PWA plugin.
      // src/test/** is infrastructure (setup + fetch mock), not product code.
      exclude: ['src/main.jsx', 'src/test/**'],
    },
  },
})
