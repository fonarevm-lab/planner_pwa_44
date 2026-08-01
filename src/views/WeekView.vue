<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { useCategoriesStore } from '../stores/categories'

const tasks = useTasksStore()
const categories = useCategoriesStore()

const today = new Date()
const startOfWeek = new Date(today)
startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))

const weekDays = computed(() => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    }
  })
})

const tasksByDate = computed(() => {
  const map: Record<string, typeof tasks.items.value> = {}
  for (const t of tasks.items.value) {
    if (t.status === 'pending' || t.status === 'in_progress') {
      ;(map[t.planned_date] ||= []).push(t)
    }
  }
  return map
})

function categoryById(id: number) {
  return categories.items.value.find((c) => c.id === id) || null
}

onMounted(async () => {
  await categories.load()
  await tasks.loadAll()
})
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">Неделя</h1>
      <p class="text-sm text-fg-muted">
        {{ startOfWeek.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) }} —
        {{ new Date(startOfWeek.getTime() + 6 * 86400000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) }}
      </p>
    </header>

    <div class="space-y-3">
      <section v-for="d in weekDays" :key="d.date" class="card">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-semibold capitalize" :class="d.isToday ? 'text-accent' : ''">
            {{ d.dayName }} <span class="text-fg-muted ml-1">{{ d.dayNum }}</span>
          </h2>
          <span class="text-xs text-fg-muted">{{ tasksByDate[d.date]?.length || 0 }}</span>
        </div>
        <div v-if="!tasksByDate[d.date]?.length" class="text-xs text-fg-muted/60 py-2">—</div>
        <ul v-else class="space-y-1.5">
          <li v-for="t in tasksByDate[d.date]" :key="t.id" class="flex items-center gap-2 text-sm">
            <span class="w-1.5 h-1.5 rounded-full" :class="{
              'bg-red-400': t.priority === 'high',
              'bg-amber-400': t.priority === 'medium',
              'bg-emerald-400': t.priority === 'low',
            }"></span>
            <span class="flex-1 truncate">{{ t.title }}</span>
            <span class="text-xs text-fg-muted">{{ categoryById(t.category_id)?.icon }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
