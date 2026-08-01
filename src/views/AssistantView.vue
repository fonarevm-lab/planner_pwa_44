<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { useNotesStore } from '../stores/notes'
import { useCategoriesStore } from '../stores/categories'
import { buildExport, buildAssistantPrompt, copyToClipboard } from '../exporter'

const tasks = useTasksStore()
const notes = useNotesStore()
const categories = useCategoriesStore()
const message = ref<string | null>(null)

onMounted(async () => {
  await categories.load()
  await tasks.loadAll()
  await notes.loadAll()
})

async function exportToAssistant() {
  const catMap = new Map(categories.items.value.map((c) => [c.id, c.name]))
  const json = buildExport(tasks.items.value, notes.items.value, catMap)
  const prompt = buildAssistantPrompt(json)
  const ok = await copyToClipboard(prompt)
  message.value = ok
    ? `✅ Скопировано! ${tasks.items.value.length} задач + ${notes.items.value.length} заметок. Открой чат с Planner Assistant и вставь (Ctrl+V).`
    : '❌ Не удалось скопировать.'
  setTimeout(() => (message.value = null), 6000)
}

async function downloadJson() {
  const catMap = new Map(categories.items.value.map((c) => [c.id, c.name]))
  const json = buildExport(tasks.items.value, notes.items.value, catMap)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `planner-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-bold">🤖 Ассистент</h1>
      <p class="text-sm text-fg-muted">Отправь свои планы и заметки Planner Assistant — он проанализирует, задаст вопросы, поможет</p>
    </header>

    <div class="card space-y-3">
      <h2 class="font-semibold">📤 Экспорт в ассистента</h2>
      <div class="text-sm text-fg-muted space-y-1">
        <p>📋 Будет скопировано:</p>
        <ul class="list-disc list-inside text-xs space-y-0.5">
          <li><b>{{ tasks.items.value.length }}</b> задач (ближайшая неделя)</li>
          <li><b>{{ notes.items.value.length }}</b> заметок (последние 30)</li>
        </ul>
      </div>
      <button class="btn-primary w-full" @click="exportToAssistant">
        📋 Скопировать для ассистента
      </button>
      <button class="btn-ghost w-full text-sm" @click="downloadJson">
        💾 Скачать JSON-файл
      </button>
      <p v-if="message" class="text-sm text-emerald-400">{{ message }}</p>
    </div>

    <div class="card space-y-2">
      <h2 class="font-semibold">💡 Что умеет ассистент</h2>
      <ul class="text-sm text-fg-muted space-y-1.5 list-disc list-inside">
        <li>Проверит реалистичность твоих планов</li>
        <li>Подсветит перегруз (если есть)</li>
        <li>Свяжет задачи с заметками (идея → задача?)</li>
        <li>Задаст 1-3 уточняющих вопроса</li>
        <li>Поможет найти рецепт / инструкцию / идею</li>
        <li>Запомнит твои предпочтения между сессиями</li>
      </ul>
    </div>

    <div class="card space-y-2 text-xs text-fg-muted">
      <p><b>Когда спрашивать:</b></p>
      <p>🌅 Утром в 9:00 — бот напомнит сам</p>
      <p>🌙 Вечером в 21:00 — подвести итоги и заглянуть в завтра</p>
      <p>📌 В любое время — открой Mavis и тегни Planner Assistant</p>
    </div>
  </div>
</template>
