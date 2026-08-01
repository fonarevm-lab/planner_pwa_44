<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import type { Note } from '../db'

const notes = useNotesStore()
const router = useRouter()

const search = ref('')

onMounted(() => notes.loadAll())

const filtered = computed(() => {
  if (!search.value.trim()) return notes.items.value
  const q = search.value.toLowerCase()
  return notes.items.value.filter(
    (n) =>
      n.title?.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
  )
})

async function togglePin(n: Note) {
  await notes.togglePin(n.id)
}

async function remove(n: Note) {
  if (!confirm('Удалить заметку?')) return
  await notes.remove(n.id)
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const min = Math.floor(diffMs / 60_000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  if (hr < 24) return `${hr} ч назад`
  if (day < 7) return `${day} д назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">💡 Идеи</h1>
        <p class="text-sm text-fg-muted">Быстрые мысли, которые не хочется потерять</p>
      </div>
      <button class="btn-primary !rounded-full w-12 h-12 !p-0 text-2xl" @click="router.push('/notes/new')" aria-label="Новая заметка">
        +
      </button>
    </header>

    <input v-model="search" class="input" placeholder="🔍 Поиск по заметкам..." />

    <div v-if="notes.loading.value" class="text-center py-8 text-fg-muted">Загрузка…</div>
    <div v-else-if="!filtered.length" class="card text-center text-fg-muted py-12">
      <div class="text-4xl mb-2">💡</div>
      <p v-if="search">Ничего не найдено</p>
      <p v-else>Пока заметок нет. Жми «+» чтобы записать мысль</p>
    </div>
    <div v-else class="space-y-2">
      <article
        v-for="n in filtered"
        :key="n.id"
        class="card cursor-pointer hover:bg-bg-elev/60 transition-colors"
        :class="{ 'ring-1 ring-amber-500/40': n.pinned }"
        @click="router.push(`/notes/${n.id}`)"
      >
        <div class="flex items-start gap-2">
          <button
            v-if="n.pinned"
            class="text-amber-400 text-sm flex-shrink-0 mt-0.5"
            @click.stop="togglePin(n)"
            title="Открепить"
          >📌</button>
          <div class="flex-1 min-w-0">
            <h3 v-if="n.title" class="font-medium leading-snug">{{ n.title }}</h3>
            <p class="text-sm text-fg whitespace-pre-wrap line-clamp-4 mt-1">{{ n.content }}</p>
            <div class="text-xs text-fg-muted mt-2">{{ relativeTime(n.updated_at) }}</div>
          </div>
          <div class="flex flex-col gap-1 flex-shrink-0">
            <button
              class="text-fg-muted hover:text-amber-400 text-sm p-1"
              @click.stop="togglePin(n)"
              :title="n.pinned ? 'Открепить' : 'Закрепить'"
            >{{ n.pinned ? '📌' : '📍' }}</button>
            <button
              class="text-fg-muted hover:text-red-400 text-sm p-1"
              @click.stop="remove(n)"
              title="Удалить"
            >🗑</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
