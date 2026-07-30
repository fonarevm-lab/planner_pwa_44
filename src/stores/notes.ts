import { ref, computed } from 'vue'
import { getAllNotes, getNote, putNote, deleteNote, type Note } from '../db'

const _items = ref<Note[]>([])
const _loading = ref(false)

export function useNotesStore() {
  return {
    items: _items,
    loading: _loading,

    async loadAll() {
      _loading.value = true
      try {
        const all = await getAllNotes()
        _items.value = all.sort((a, b) => {
          // Закреплённые сначала
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          // Потом по updated_at desc
          return b.updated_at.localeCompare(a.updated_at)
        })
      } finally {
        _loading.value = false
      }
    },

    async create(data: { title?: string; content: string; pinned?: boolean }) {
      const now = new Date().toISOString()
      const n: Note = {
        id: crypto.randomUUID(),
        title: data.title?.trim() || undefined,
        content: data.content.trim(),
        pinned: !!data.pinned,
        created_at: now,
        updated_at: now,
      }
      await putNote(n)
      _items.value.unshift(n)
      return n
    },

    async update(id: string, patch: Partial<Note>) {
      const n = await getNote(id)
      if (!n) return null
      const updated: Note = { ...n, ...patch, updated_at: new Date().toISOString() }
      await putNote(updated)
      const idx = _items.value.findIndex((x) => x.id === id)
      if (idx >= 0) _items.value[idx] = updated
      // Пересортируем
      await this.loadAll()
      return updated
    },

    async togglePin(id: string) {
      const n = await getNote(id)
      if (!n) return null
      return this.update(id, { pinned: !n.pinned })
    },

    async remove(id: string) {
      await deleteNote(id)
      _items.value = _items.value.filter((x) => x.id !== id)
    },

    get count() {
      return computed(() => _items.value.length)
    },
  }
}
