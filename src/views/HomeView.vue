<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import { useCategoriesStore } from '../stores/categories'
import TaskCard from '../components/TaskCard.vue'

const tasks = useTasksStore()
const categories = useCategoriesStore()
const router = useRouter()

const today = new Date().toISOString().slice(0, 10)
const filter = ref<'today' | 'all' | 'done'>('today')

onMounted(async () => {
  await categories.load()
  await tasks.loadAll()
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
})

const filterOptions: { key: 'today' | 'all' | 'done'; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'all', label: 'Активные' },
  { key: 'done', label: 'Готово' },
]

const filteredTasks = computed(() => {
  if (filter.value === 'today') return tasks.byDate(today)
  if (filter.value === 'done') return tasks.done
  return tasks.pending
})

function categoryById(id: number) {
  return categories.items.value.find((c) => c.id === id) || null
}

async function onComplete(id: string) {
  await tasks.complete(id)
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ greeting }} 👋</h1>
        <p class="text-sm text-fg-muted">
          {{ new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}
        </p>
      </div>
      <button class="btn-primary !rounded-full w-12 h-12 !p-0 text-2xl" @click="router.push('/tasks/new')" aria-label="Новая задача">
        +
      </button>
    </header>

    <div class="flex bg-bg-elev rounded-xl p-1">
      <button
        v-for="f in filterOptions"
        :key="f.key"
        class="flex-1 py-2 rounded-lg text-sm transition-colors"
        :class="filter === f.key ? 'bg-accent text-white' : 'text-fg-muted'"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="tasks.loading.value" class="text-center py-8 text-fg-muted">Загрузка…</div>
    <div v-else-if="!filteredTasks.length" class="card text-center text-fg-muted py-12">
      <div class="text-4xl mb-2">🎉</div>
      <p v-if="filter === 'today'">На сегодня задач нет</p>
      <p v-else-if="filter === 'done'">Нет выполненных задач</p>
      <p v-else>Все чисто!</p>
    </div>
    <div v-else class="space-y-2">
      <TaskCard
        v-for="t in filteredTasks"
        :key="t.id"
        :task="t"
        :category="categoryById(t.category_id)"
        @complete="onComplete"
      />
    </div>
  </div>
</template>
