/**
 * IndexedDB-обёртка для PWA. Хранит задачи, заметки, категории, настройки.
 * Заменяет бэкенд — все данные локально на устройстве.
 */
const DB_NAME = 'planner-pwa'
const DB_VERSION = 2

export interface Task {
  id: string
  title: string
  description?: string
  category_id: number
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  planned_date: string // YYYY-MM-DD
  calendar_event_id?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Note {
  id: string
  title?: string
  content: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Семья', color: '#ec4899', icon: '👨‍👩‍👧' },
  { id: 2, name: 'Работа', color: '#3b82f6', icon: '💼' },
  { id: 3, name: 'Саморазвитие', color: '#8b5cf6', icon: '📚' },
  { id: 4, name: 'Досуг', color: '#10b981', icon: '🎮' },
  { id: 5, name: 'Финансы', color: '#f59e0b', icon: '💰' },
]

let _db: IDBDatabase | null = null

export async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' })
        store.createIndex('planned_date', 'planned_date', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' })
        store.createIndex('pinned', 'pinned', { unique: false })
        store.createIndex('updated_at', 'updated_at', { unique: false })
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => {
      _db = req.result
      initCategories(_db).then(() => resolve(_db!))
    }
    req.onerror = () => reject(req.error)
  })
}

async function initCategories(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite')
    const store = tx.objectStore('categories')
    const countReq = store.count()
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        DEFAULT_CATEGORIES.forEach((c) => store.put(c))
      }
      resolve()
    }
    countReq.onerror = () => reject(countReq.error)
  })
}

// --- Tasks ---

export async function getAllTasks(): Promise<Task[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('tasks', 'readonly').objectStore('tasks').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function putTask(t: Task): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('tasks', 'readwrite').objectStore('tasks').put(t)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deleteTask(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('tasks', 'readwrite').objectStore('tasks').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('tasks', 'readonly').objectStore('tasks').get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

// --- Notes ---

export async function getAllNotes(): Promise<Note[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readonly').objectStore('notes').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function putNote(n: Note): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readwrite').objectStore('notes').put(n)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deleteNote(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readwrite').objectStore('notes').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readonly').objectStore('notes').get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

// --- Categories ---

export async function getAllCategories(): Promise<Category[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('categories', 'readonly').objectStore('categories').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

// --- Settings ---

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('settings', 'readonly').objectStore('settings').get(key)
    req.onsuccess = () => resolve((req.result?.value ?? null) as T | null)
    req.onerror = () => reject(req.error)
  })
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('settings', 'readwrite').objectStore('settings').put({ key, value })
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
