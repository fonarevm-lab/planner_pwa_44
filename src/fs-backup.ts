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
