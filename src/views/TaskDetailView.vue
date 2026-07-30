<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask, type Task, type Category } from '../db'
import { useCategoriesStore } from '../stores/categories'
import { useTasksStore } from '../stores/tasks'
import { openInCalendar } from '../calendar'

const route = useRoute()
const router = useRouter()
const tasks = useTasksStore()
const categories = useCategoriesStore()
const id = computed(() => String(route.params.id))

const task = ref<Task | null>(null)
const category = ref<Category | null>(null)
const loading = ref(true)
const tab = ref<'main' | 'calendar'>('main')

onMounted(async () => {
  await categories.load()
  task.value = await getTask(id.value)
  if (task.value) category.value = categories.items.value.find((c) => c.id === task.value!.category_id) || null
  loading.value = false
})

async function complete() {
  if (!task.value) return
  task.value = await tasks.complete(task.value.id)
}

async function remove() {
  if (!task.value) return
  if (!confirm('Удалить задачу?')) return
  await tasks.remove(task.value.id)
  router.replace('/')
}

function openCalendar() {
  if (!task.value) return
  const start = new Date(task.value.planned_date)
  start.setHours(15, 0, 0, 0)
  openInCalendar({
    title: task.value.title,
    description: task.value.description,
    start,
    duration_minutes: 60,
  })
}
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-fg-muted">Загрузка…</div>
  <div v-else-if="!task" class="text-center py-8 text-fg-muted">Задача не найдена</div>
  <div v-else class="space-y-4">
    <header class="flex items-center justify-between">
      <button class="btn-ghost !px-3" @click="router.back()">←</button>
      <div class="flex gap-2">
        <button v-if="task.status !== 'done'" class="btn-primary !py-1.5 !px-3 text-sm" @click="complete">✓ Сделано</button>
        <button class="btn-ghost !py-1.5 !px-3 text-sm" @click="openCalendar">📅 В календарь</button>
        <button class="btn-danger !py-1.5 !px-3 text-sm" @click="remove">🗑</button>
      </div>
    </header>

    <div class="space-y-3">
      <h1 class="text-2xl font-bold" :class="task.status === 'done' ? 'line-through text-fg-muted' : ''">
        {{ task.title }}
      </h1>
      <p v-if="task.description" class="text-fg-muted whitespace-pre-wrap">{{ task.description }}</p>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="chip" :class="{
          'bg-red-500/20 text-red-300': task.priority === 'high',
          'bg-amber-500/20 text-amber-300': task.priority === 'medium',
          'bg-emerald-500/20 text-emerald-300': task.priority === 'low',
        }">
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-red-400': task.priority === 'high',
            'bg-amber-400': task.priority === 'medium',
            'bg-emerald-400': task.priority === 'low',
          }"></span>
          {{ task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий' }}
        </span>
        <span v-if="category" class="chip" :style="{ backgroundColor: category.color + '22', color: category.color }">
          {{ category.icon }} {{ category.name }}
        </span>
        <span class="chip bg-white/5 text-fg-muted">📆 {{ new Date(task.planned_date).toLocaleDateString('ru-RU') }}</span>
      </div>
    </div>

    <div class="card">
      <p class="text-sm text-fg-muted">
        Создано: {{ new Date(task.created_at).toLocaleString('ru-RU') }}<br>
        Обновлено: {{ new Date(task.updated_at).toLocaleString('ru-RU') }}<br>
        <span v-if="task.completed_at">Выполнено: {{ new Date(task.completed_at).toLocaleString('ru-RU') }}</span>
      </p>
    </div>
  </div>
</template>
