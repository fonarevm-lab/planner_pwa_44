/**
 * Экспорт задач и заметок в JSON для передачи ассистенту (Mavis Planner Assistant).
 * Кнопка "🤖 Спросить ассистента" копирует этот JSON + инструкцию в буфер.
 */
import type { Task, Note } from './db'

export interface ExportPayload {
  generated_at: string
  period: { from: string; to: string }
  tasks: Array<{
    title: string
    description?: string
    category: string
    priority: string
    status: string
    planned_date: string
  }>
  notes: Array<{
    title?: string
    content: string
    pinned: boolean
  }>
}

export function buildExport(
  tasks: Task[],
  notes: Note[],
  categories: Map<number, string>
): string {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)

  const filteredTasks = tasks.filter(
    (t) => t.planned_date >= weekAgo && t.planned_date <= addDays(today, 7)
  )

  // Берём последние 30 заметок (или все, если меньше)
  const recentNotes = [...notes]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 30)

  const payload: ExportPayload = {
    generated_at: new Date().toISOString(),
    period: { from: weekAgo, to: addDays(today, 7) },
    tasks: filteredTasks.map((t) => ({
      title: t.title,
      description: t.description,
      category: categories.get(t.category_id) ?? '—',
      priority: t.priority,
      status: t.status,
      planned_date: t.planned_date,
    })),
    notes: recentNotes.map((n) => ({
      title: n.title,
      content: n.content,
      pinned: n.pinned,
    })),
  }
  return JSON.stringify(payload, null, 2)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildAssistantPrompt(json: string): string {
  return `Привет! Вот мои планы и заметки из PWA-планировщика (ближайшая неделя + последние мысли):

\`\`\`json
${json}
\`\`\`

Проанализируй:
1. Реалистичность задач (хватит ли времени?)
2. Баланс категорий (работа/отдых/семья)
3. Что упустил
4. Есть ли перегруз
5. Связь заметок с задачами (может какие-то мысли стоит превратить в задачи?)

Если нужна помощь (поиск рецепта, инструкции, идеи) — задай уточняющие вопросы.`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch (e) {
    console.error('Clipboard copy failed:', e)
    return false
  }
}
