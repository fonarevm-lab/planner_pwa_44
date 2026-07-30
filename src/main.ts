import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('SW registration failed:', err)
    })
  })
}

createApp(App).use(router).mount('#app')
