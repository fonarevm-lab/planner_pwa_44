import { ref } from 'vue'
import { getAllTasks, getTask, putTask, deleteTask, type Task } from '../db'

const _state = {
  items: ref<Task[]>([]),
  loading: ref(false),
}

export function useTasksStore() {
  return {
    items: _state.items,
    loading: _state.loading,
    async loadAll() {
      _state.loading.value = true
      try {
        _state.items.value = (await getAllTasks()).sort(
          (a, b) => b.created_at.localeCompare(a.created_at)
        )
      } finally {
        _state.loading.value = false
      }
    },
    async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status'>) {
      const now = new Date().toISOString()
      const t: Task = {
        ...data,
        id: crypto.randomUUID(),
        status: 'pending',
        created_at: now,
        updated_at: now,
      }
      await putTask(t)
      _state.items.value.unshift(t)
      return t
    },
    async update(id: string, patch: Partial<Task>) {
      const t = await getTask(id)
      if (!t) return null
      const updated = { ...t, ...patch, updated_at: new Date().toISOString() }
      if (patch.status === 'done') {
        // ставим completed_at только при первом переходе в done
        if (!updated.completed_at) updated.completed_at = new Date().toISOString()
      } else if (patch.status === 'pending' || patch.status === 'in_progress') {
        // возврат в активные — чистим метку выполнения
        updated.completed_at = undefined
      }
      await putTask(updated)
      const idx = _state.items.value.findIndex((x) => x.id === id)
      if (idx >= 0) _state.items.value[idx] = updated
      return updated
    },
    async complete(id: string) {
      return this.update(id, { status: 'done' })
    },
    async uncomplete(id: string) {
      return this.update(id, { status: 'pending' })
    },
    async toggle(id: string) {
      const t = await getTask(id)
      if (!t) return null
      return this.update(id, { status: t.status === 'done' ? 'pending' : 'done' })
    },
    async remove(id: string) {
      await deleteTask(id)
      _state.items.value = _state.items.value.filter((x) => x.id !== id)
    },
    get byDate() {
      return (date: string) => _state.items.value.filter((t) => t.planned_date === date && t.status !== 'done')
    },
    get pending() {
      return _state.items.value.filter((t) => t.status === 'pending')
    },
    get done() {
      return _state.items.value.filter((t) => t.status === 'done')
    },
  }
}
