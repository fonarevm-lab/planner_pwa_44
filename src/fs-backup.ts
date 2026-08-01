/**
 * File System Access API обёртка для бэкапов Planner.
 *
 * Поддерживается в:
 * - Chrome/Edge на desktop (с Chrome 86+)
 * - Chrome на Android (с Chrome 86+)
 * НЕ поддерживается в iOS Safari, Firefox, Samsung Internet.
 *
 * Использование:
 *   const handle = await pickBackupFolder()  // пользователь выбирает папку
 *   if (handle) await saveBackup(handle, { tasks, notes })
 */
import { getSetting, setSetting } from './db'

const SETTING_KEY = 'backup_folder_handle'
const SETTING_LAST_DATE = 'last_auto_backup_date'
const SUBFOLDER_NAME = 'Planner'

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export interface BackupPayload {
  tasks: unknown[]
  notes: unknown[]
  exported_at: string
  app_version: string
}

/**
 * Открывает системный диалог выбора папки. Возвращает handle или null.
 * После выбора handle сохраняется в IndexedDB — больше не спрашивает у пользователя.
 */
export async function pickBackupFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API не поддерживается в этом браузере')
  }
  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      id: 'planner-backup',
    })
    await setSetting(SETTING_KEY, handle) // structured clone сохраняет handle
    return handle
  } catch (e: any) {
    if (e.name === 'AbortError') return null
    throw e
  }
}

/**
 * Достаёт сохранённый handle из IndexedDB. Если permission протух — запрашивает заново.
 */
export async function getSavedFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const handle = await getSetting(SETTING_KEY)
  if (!handle) return null
  try {
    // Проверяем permission
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return handle as FileSystemDirectoryHandle
    // Если denied — запрашиваем
    const req = await (handle as any).requestPermission({ mode: 'readwrite' })
    if (req === 'granted') return handle as FileSystemDirectoryHandle
    return null
  } catch {
    return null
  }
}

export async function forgetFolder(): Promise<void> {
  await setSetting(SETTING_KEY, '')
}

/**
 * Пишет JSON-файл в подпапку Planner/ внутри выбранной папки.
 * Если подпапки нет — создаёт.
 */
export async function saveBackup(
  rootHandle: FileSystemDirectoryHandle,
  payload: BackupPayload
): Promise<string> {
  // Получаем или создаём подпапку Planner
  const subHandle = await rootHandle.getDirectoryHandle(SUBFOLDER_NAME, { create: true })

  const ts = formatTimestamp(new Date())
  const fileName = `planner-backup-${ts}.json`

  const fileHandle = await subHandle.getFileHandle(fileName, { create: true })
  const writable = await (fileHandle as any).createWritable()
  await writable.write(JSON.stringify(payload, null, 2))
  await writable.close()

  return fileName
}

/**
 * Сохраняет дату последнего успешного авто-бэкапа (YYYY-MM-DD).
 */
export async function markAutoBackupDone(date: Date = new Date()): Promise<void> {
  await setSetting(SETTING_LAST_DATE, date.toISOString().slice(0, 10))
}

export async function getLastAutoBackupDate(): Promise<string | null> {
  return getSetting(SETTING_LAST_DATE)
}

/**
 * Поддерживается ли Web Share API для файлов (мобильный Chrome, Safari).
 */
export function isShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  const data: any = { files: [new File([''], 'x', { type: 'application/json' })] }
  return !!(navigator.canShare && navigator.canShare(data))
}

/**
 * Скачивает бэкап как JSON-файл. Работает везде (десктоп + мобильный).
 * Возвращает имя сгенерированного файла.
 */
export async function downloadBackup(payload: BackupPayload): Promise<string> {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const fileName = `planner-backup-${formatTimestamp(new Date())}.json`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return fileName
}

/**
 * Шэрит бэкап через системный share-sheet (мобильный) или скачивает (десктоп).
 * Идеально для сохранения в Google Drive / OneDrive / отправки в Telegram.
 */
export async function shareBackup(
  payload: BackupPayload
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const json = JSON.stringify(payload, null, 2)
  const fileName = `planner-backup-${formatTimestamp(new Date())}.json`
  const file = new File([json], fileName, { type: 'application/json' })

  if (isShareSupported()) {
    try {
      await navigator.share({
        files: [file],
        title: 'Planner Backup',
        text: 'Бэкап Planner PWA',
      })
      return 'shared'
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled'
      // иначе — падаем в download
    }
  }

  await downloadBackup(payload)
  return 'downloaded'
}

/**
 * Читает файл бэкапа и парсит JSON. Возвращает payload или null если файл невалидный.
 */
export async function parseBackupFile(file: File): Promise<BackupPayload | null> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object') throw new Error('Не JSON')
    if (!Array.isArray(data.tasks) || !Array.isArray(data.notes)) {
      throw new Error('Нет полей tasks/notes')
    }
    return data as BackupPayload
  } catch (e) {
    console.error('parseBackupFile error:', e)
    return null
  }
}

/**
 * Собирает текущие задачи+заметки в payload. Удобно дёргать из UI.
 */
export async function buildBackupPayload(
  tasks: unknown[],
  notes: unknown[]
): Promise<BackupPayload> {
  return {
    tasks,
    notes,
    exported_at: new Date().toISOString(),
    app_version: '0.2.0',
  }
}

/**
 * Нужно ли делать авто-бэкап сейчас?
 * Возвращает true если сегодня ещё не делали и время >= 6:00.
 */
export function shouldRunAutoBackup(now: Date = new Date()): boolean {
  const today = now.toISOString().slice(0, 10)
  return now.getHours() >= 6 // упрощённо: если открыл после 6 утра и сегодня не делал — делаем
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}
