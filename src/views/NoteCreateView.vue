<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { getNote, type Note } from '../db'

const router = useRouter()
const route = useRoute()
const notes = useNotesStore()

const editing = ref<Note | null>(null)
const title = ref('')
const content = ref('')
const pinned = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  const id = route.params.id as string | undefined
  if (id) {
    editing.value = await getNote(id)
    if (editing.value) {
      title.value = editing.value.title || ''
      content.value = editing.value.content
      pinned.value = editing.value.pinned
    }
  }
})

async function save() {
  if (!content.value.trim()) {
    error.value = 'Заметка не может быть пустой'
    return
  }
  saving.value = true
  error.value = null
  try {
    if (editing.value) {
      await notes.update(editing.value.id, {
        title: title.value.trim() || undefined,
        content: content.value.trim(),
        pinned: pinned.value,
      })
    } else {
      await notes.create({
        title: title.value.trim() || undefined,
        content: content.value.trim(),
        pinned: pinned.value,
      })
    }
    router.replace('/notes')
  } catch (e: any) {
    error.value = e?.message || 'Ошибка'
  } finally {
    saving.value = false
  }
}

async function deleteNote() {
  if (!editing.value) return
  if (!confirm('Удалить заметку?')) return
  await notes.remove(editing.value.id)
  router.replace('/notes')
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between">
      <button class="btn-ghost !px-3" @click="router.back()">←</button>
      <h1 class="text-xl font-semibold">{{ editing ? 'Заметка' : 'Новая мысль' }}</h1>
      <div class="flex gap-2">
        <button
          v-if="editing"
          class="btn-ghost !py-1.5 !px-3 text-sm"
          @click="pinned = !pinned"
        >{{ pinned ? '📌' : '📍' }}</button>
        <button class="btn-primary !px-4" :disabled="saving" @click="save">
          {{ saving ? '...' : 'Готово' }}
        </button>
      </div>
    </header>

    <div>
      <input
        v-model="title"
        class="input text-lg !py-3"
        placeholder="Заголовок (опционально)"
      />
    </div>

    <div>
      <textarea
        v-model="content"
        class="input min-h-[280px] resize-y text-base leading-relaxed"
        placeholder="Что пришло в голову?"
        autofocus
      ></textarea>
    </div>

    <div class="flex items-center gap-2 text-sm text-fg-muted">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="pinned" class="accent-amber-400" />
        📌 Закрепить наверху
      </label>
    </div>

    <div v-if="error" class="card border border-red-500/30 text-red-300 text-sm">{{ error }}</div>

    <div v-if="editing" class="pt-4">
      <button class="btn-danger w-full" @click="deleteNote">🗑 Удалить заметку</button>
    </div>
  </div>
</template>
