import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
