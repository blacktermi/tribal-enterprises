import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tribal/design-system': path.resolve(__dirname, 'src/lib/design-system.ts'),
    },
  },
  server: {
    port: 5181,
    proxy: {
      '/api': {
        target: 'https://tribalprint.ci',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
