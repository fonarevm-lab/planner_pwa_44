<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const items = [
  { to: '/', label: 'Сегодня', icon: '🏠' },
  { to: '/week', label: 'Неделя', icon: '📅' },
  { to: '/notes', label: 'Идеи', icon: '💡' },
  { to: '/assistant', label: 'AI', icon: '🤖' },
  { to: '/settings', label: 'Ещё', icon: '⚙️' },
]
function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur border-t border-white/5 safe-bottom">
    <div class="mx-auto max-w-app flex items-stretch justify-around">
      <RouterLink
        v-for="i in items"
        :key="i.to"
        :to="i.to"
        class="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors"
        :class="isActive(i.to) ? 'text-accent' : 'text-fg-muted hover:text-fg'"
      >
        <span class="text-xl leading-none">{{ i.icon }}</span>
        <span>{{ i.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
