import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-hash',
      transformIndexHtml(html) {
        const v = Date.now().toString(36)
        return html.replace(/(src|href)=(["'])(\/[^"']+?)(\?[^"']*?)?(["'])/g,
          (m, attr, q, path, qs, end) => {
            if (path.startsWith('/src/')) return m
            const existing = qs ? qs.replace(/[?&]v=[^"']*/, '') : ''
            const sep = existing ? '&' : '?'
            return `${attr}=${q}${path}${existing}${sep}v=${v}${end}`
          }
        )
      }
    }
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:1337',
      '/ws': {
        target: 'ws://localhost:1337',
        ws: true,
      },
    }
  },
  build: {
    outDir: '../web_static',
    emptyOutDir: true,
  },
})
