import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
