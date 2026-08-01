import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages репозиторий: fonarevm-lab/planner_pwa_44
// base должен совпадать с именем репо
const GITHUB_PAGES_BASE = '/planner_pwa_44/'

export default defineConfig({
  plugins: [vue()],
  // Базовый путь для GitHub Pages. Vite встроит его в index.html
  // и использует для Router.
  base: GITHUB_PAGES_BASE,
  server: { port: 5173, host: '0.0.0.0' },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
})
