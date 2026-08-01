<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSetting, setSetting, getAllTasks, getAllNotes, deleteTask, deleteNote } from '../db'
import {
  isFileSystemAccessSupported,
  pickBackupFolder,
  getSavedFolder,
  forgetFolder,
  saveBackup,
  getLastAutoBackupDate,
  markAutoBackupDone,
  shouldRunAutoBackup,
  type BackupPayload,
} from '../fs-backup'

const llmApiKey = ref('')
const mavisAgentId = ref('Planner Assistant')
const reminderOffset = ref(15)
const saved = ref(false)

const folderSupported = ref(false)
const folderSet = ref(false)
const lastAutoDate = ref<string | null>(null)
const backupMessage = ref<string | null>(null)
const backupBusy = ref(false)

onMounted(async () => {
  folderSupported.value = isFileSystemAccessSupported()
  if (folderSupported.value) {
    const h = await getSavedFolder()
    folderSet.value = !!h
  }
  lastAutoDate.value = await getLastAutoBackupDate()
  llmApiKey.value = (await getSetting('llm_api_key')) || ''
  const offset = await getSetting('reminder_offset')
  if (offset) reminderOffset.value = Number(offset)
})

async function save() {
  await setSetting('llm_api_key', llmApiKey.value.trim())
  await setSetting('reminder_offset', String(reminderOffset.value))
  saved.value = true
  setTimeout(() => (saved.value = false), 3000)
}

async function chooseFolder() {
  try {
    backupMessage.value = null
    const h = await pickBackupFolder()
    folderSet.value = !!h
    if (h) {
      backupMessage.value = '✅ Папка выбрана. Бэкапы будут в подпапке "Planner/"'
    }
  } catch (e: any) {
    backupMessage.value = '❌ ' + (e?.message || 'Не удалось выбрать папку')
  }
}

async function forgetFolderClick() {
  if (!confirm('Забыть выбранную папку? Авто-бэкап перестанет работать, пока не выберешь новую.')) return
  await forgetFolder()
  folderSet.value = false
  backupMessage.value = 'Папка сброшена'
}

async function backupNow() {
  if (backupBusy.value) return
  backupBusy.value = true
  backupMessage.value = null
  try {
    const handle = await getSavedFolder()
    if (!handle) {
      backupMessage.value = '❌ Сначала выбери папку'
      return
    }
    const tasks = await getAllTasks()
    const notes = await getAllNotes()
    const payload: BackupPayload = {
      tasks,
      notes,
      exported_at: new Date().toISOString(),
      app_version: '0.2.0',
    }
    const fileName = await saveBackup(handle, payload)
    await markAutoBackupDone()
    lastAutoDate.value = new Date().toISOString().slice(0, 10)
    backupMessage.value = `✅ Сохранено: Planner/${fileName}`
  } catch (e: any) {
    backupMessage.value = '❌ ' + (e?.message || 'Ошибка бэкапа')
  } finally {
    backupBusy.value = false
  }
}

async function exportAll() {
  const tasks = await getAllTasks()
  const notes = await getAllNotes()
  const data = { tasks, notes, exported_at: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `planner-full-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function clearAll() {
  if (!confirm('Удалить ВСЕ задачи и заметки? Это необратимо.')) return
  const tasks = await getAllTasks()
  for (const t of tasks) await deleteTask(t.id)
  const notes = await getAllNotes()
  for (const n of notes) await deleteNote(n.id)
  location.reload()
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Настройки</h1>

    <!-- BACKUP -->
    <section class="card space-y-3">
      <h2 class="font-semibold">📁 Бэкап в папку Android</h2>

      <div v-if="!folderSupported" class="text-sm text-amber-300 bg-amber-500/10 rounded-lg p-3">
        ⚠️ Твой браузер не поддерживает File System Access API. Открой PWA в <b>Chrome</b>.
      </div>

      <div v-else>
        <div class="flex items-center gap-2 text-sm">
          <span class="w-2 h-2 rounded-full" :class="folderSet ? 'bg-emerald-400' : 'bg-fg-muted/40'"></span>
          <span v-if="folderSet" class="text-fg-muted">Папка настроена. Бэкапы: <b>Planner/</b></span>
          <span v-else class="text-fg-muted">Не настроено</span>
        </div>

        <div class="text-xs text-fg-muted space-y-0.5">
          <p>⏰ Авто-бэкап: ежедневно после 6:00</p>
          <p v-if="lastAutoDate">📅 Последний: <b>{{ lastAutoDate }}</b></p>
          <p v-else>📅 Последний: ещё не было</p>
        </div>

        <div class="flex gap-2">
          <button class="btn-primary flex-1" :disabled="backupBusy" @click="chooseFolder">
            {{ folderSet ? '📁 Сменить папку' : '📁 Выбрать папку' }}
          </button>
          <button class="btn-ghost" :disabled="backupBusy || !folderSet" @click="backupNow">
            {{ backupBusy ? '⏳' : '💾' }}
          </button>
        </div>

        <button
          v-if="folderSet"
          class="text-xs text-fg-muted hover:text-red-400 underline"
          @click="forgetFolderClick"
        >Забыть папку</button>
      </div>

      <p v-if="backupMessage" class="text-sm" :class="backupMessage.startsWith('❌') ? 'text-red-300' : 'text-emerald-400'">
        {{ backupMessage }}
      </p>
    </section>

    <!-- AI -->
    <section class="card space-y-3">
      <h2 class="font-semibold">🔑 LLM API ключ</h2>
      <p class="text-sm text-fg-muted">
        Хранится локально. Не нужен пока — ассистент работает через Mavis.
      </p>
      <input v-model="llmApiKey" type="password" class="input" placeholder="Вставьте ключ..." />
    </section>

    <!-- REMINDERS -->
    <section class="card space-y-3">
      <h2 class="font-semibold">⏰ Напоминания по умолчанию</h2>
      <p class="text-sm text-fg-muted">За сколько минут напоминать (в Samsung Calendar)</p>
      <div class="flex gap-2">
        <input type="number" v-model.number="reminderOffset" min="0" max="1440" class="input" />
        <span class="self-center text-sm text-fg-muted">мин</span>
      </div>
    </section>

    <!-- ASSISTANT -->
    <section class="card space-y-3">
      <h2 class="font-semibold">🤖 Ассистент</h2>
      <p class="text-sm text-fg-muted">Имя агента в Mavis:</p>
      <input v-model="mavisAgentId" class="input" />
      <p class="text-xs text-fg-muted">Уже создан агент <b>Planner Assistant</b> с cron-расписанием (утро 9:00, вечер 21:00).</p>
    </section>

    <button class="btn-primary w-full" @click="save">💾 Сохранить настройки</button>
    <p v-if="saved" class="text-center text-sm text-emerald-400">Сохранено ✓</p>

    <!-- DANGER -->
    <section class="card space-y-3 mt-6">
      <h2 class="font-semibold">💾 Экспорт и очистка</h2>
      <button class="btn-ghost w-full" @click="exportAll">📤 Скачать все данные (JSON)</button>
      <button class="btn-danger w-full !bg-red-900/30 !text-red-300" @click="clearAll">🗑 Удалить все данные</button>
    </section>

    <section class="card text-xs text-fg-muted space-y-1">
      <p><b>Planner PWA v0.2.0</b></p>
      <p>Personal · {{ new Date().getFullYear() }}</p>
      <p>Данные хранятся локально на устройстве</p>
    </section>
  </div>
</template>
