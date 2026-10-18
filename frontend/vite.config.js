import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/policy': 'http://127.0.0.1:8000',
      '/screen': 'http://127.0.0.1:8000',
      '/audit': 'http://127.0.0.1:8000',
      '/case': 'http://127.0.0.1:8000',
    }
  }
})
