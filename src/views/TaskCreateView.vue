<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import { useCategoriesStore } from '../stores/categories'
import { getTask, type Task } from '../db'
import { openInCalendar } from '../calendar'

const router = useRouter()
const route = useRoute()
const tasks = useTasksStore()
const categories = useCategoriesStore()

const editing = ref<Task | null>(null)
const loadingTask = ref(false)

const form = reactive({
  title: '',
  description: '',
  category_id: 1,
  priority: 'medium' as 'high' | 'medium' | 'low',
  planned_date: new Date().toISOString().slice(0, 10),
  remind_at_time: '15:00',
})

const priorities: { value: 'high' | 'medium' | 'low'; label: string }[] = [
  { value: 'high', label: '🔴 Высокий' },
  { value: 'medium', label: '🟡 Средний' },
  { value: 'low', label: '🟢 Низкий' },
]

const saving = ref(false)
const error = ref<string | null>(null)
const showCalendar = ref(false)
const calendarTime = ref('15:00')

const isEdit = computed(() => !!editing.value)
const editId = computed(() => route.params.id as string | undefined)

onMounted(async () => {
  await categories.load()
  if (editId.value) {
    loadingTask.value = true
    const t = await getTask(editId.value)
    if (t) {
      editing.value = t
      form.title = t.title
      form.description = t.description || ''
      form.category_id = t.category_id
      form.priority = t.priority
      form.planned_date = t.planned_date
    } else {
      error.value = 'Задача не найдена'
    }
    loadingTask.value = false
  }
})

async function save() {
  if (!form.title.trim()) {
    error.value = 'Введите название'
    return
  }
  saving.value = true
  error.value = null
  try {
    if (editing.value) {
      await tasks.update(editing.value.id, {
        title: form.title.trim(),
        description: form.description || undefined,
        category_id: form.category_id,
        priority: form.priority,
        planned_date: form.planned_date,
      })
      router.replace(`/tasks/${editing.value.id}`)
    } else {
      const t = await tasks.create({
        title: form.title.trim(),
        description: form.description || undefined,
        category_id: form.category_id,
        priority: form.priority,
        planned_date: form.planned_date,
      })
      router.replace(`/tasks/${t.id}`)
    }
  } catch (e: any) {
    error.value = e?.message || 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!editing.value) return
  if (!confirm('Удалить задачу?')) return
  await tasks.remove(editing.value.id)
  router.replace('/')
}

function openCalendarNow() {
  if (!form.title.trim()) {
    error.value = 'Сначала введите название'
    return
  }
  const [hh, mm] = calendarTime.value.split(':').map(Number)
  const start = new Date(form.planned_date)
  start.setHours(hh, mm, 0, 0)
  openInCalendar({
    title: form.title.trim(),
    description: form.description || undefined,
    start,
    duration_minutes: 60,
  })
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between">
      <button class="btn-ghost !px-3" @click="router.back()">←</button>
      <h1 class="text-xl font-semibold">{{ isEdit ? 'Редактирование' : 'Новая задача' }}</h1>
      <button class="btn-primary !px-4" :disabled="saving" @click="save">
        {{ saving ? '...' : 'Сохранить' }}
      </button>
    </header>

    <form @submit.prevent="save" class="space-y-4">
      <div>
        <input v-model="form.title" class="input text-lg !py-3" placeholder="Что нужно сделать?" autofocus />
      </div>

      <div>
        <label class="label">Описание</label>
        <textarea v-model="form.description" class="input min-h-[100px] resize-y" placeholder="Детали, подзадачи, ссылки..."></textarea>
      </div>

      <div>
        <label class="label">Категория</label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in categories.items.value"
            :key="c.id"
            type="button"
            class="chip transition-opacity"
            :style="{
              backgroundColor: c.color + '22',
              color: c.color,
              opacity: form.category_id === c.id ? 1 : 0.4,
              borderWidth: '1px',
              borderColor: form.category_id === c.id ? c.color : 'transparent',
            }"
            @click="form.category_id = c.id"
          >
            {{ c.icon }} {{ c.name }}
          </button>
        </div>
      </div>

      <div>
        <label class="label">Приоритет</label>
        <div class="flex gap-1.5">
          <button
            v-for="p in priorities"
            :key="p.value"
            type="button"
            class="chip"
            :class="form.priority === p.value ? 'bg-bg-elev' : 'opacity-40 bg-white/5'"
            @click="form.priority = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="label">Дата</label>
        <input type="date" v-model="form.planned_date" class="input" />
      </div>

      <div class="card !p-3 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">📅 Напоминание в календаре</div>
            <div class="text-xs text-fg-muted">Откроется Samsung Calendar с предзаполненным событием</div>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <input type="time" v-model="calendarTime" class="input flex-1" />
          <button type="button" class="btn-primary" @click="openCalendarNow">
            📅 Открыть
          </button>
        </div>
      </div>

      <div v-if="error" class="card border border-red-500/30 text-red-300 text-sm">{{ error }}</div>
    </form>

    <div v-if="isEdit" class="pt-4">
      <button type="button" class="btn-danger w-full" @click="remove">🗑 Удалить задачу</button>
    </div>
  </div>
</template>
