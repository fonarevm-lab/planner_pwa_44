import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, host: '0.0.0.0' },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  // Vite PWA: можно добавить vite-plugin-pwa позже для генерации SW
})
