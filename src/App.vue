<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { useTasksStore } from './stores/tasks'
import { useNotesStore } from './stores/notes'
import { getAllTasks, getAllNotes } from './db'
import {
  getSavedFolder,
  saveBackup,
  getLastAutoBackupDate,
  markAutoBackupDone,
  shouldRunAutoBackup,
  type BackupPayload,
} from './fs-backup'

const tasks = useTasksStore()
const notes = useNotesStore()
const autoBackupMessage = ref<string | null>(null)

let backupCheckInterval: number | null = null

onMounted(async () => {
  await tasks.loadAll()
  await notes.loadAll()

  // Планировщик авто-бэкапа: проверяем каждые 5 минут
  backupCheckInterval = window.setInterval(checkAutoBackup, 5 * 60 * 1000)
  // Сразу проверим при старте
  await checkAutoBackup()
})

onUnmounted(() => {
  if (backupCheckInterval !== null) {
    clearInterval(backupCheckInterval)
  }
})

async function checkAutoBackup() {
  try {
    const now = new Date()
    if (!shouldRunAutoBackup(now)) return

    const lastDate = await getLastAutoBackupDate()
    const today = now.toISOString().slice(0, 10)
    if (lastDate === today) return // уже делали сегодня

    const handle = await getSavedFolder()
    if (!handle) return // папка не выбрана

    const tasksList = await getAllTasks()
    const notesList = await getAllNotes()
    const payload: BackupPayload = {
      tasks: tasksList,
      notes: notesList,
      exported_at: now.toISOString(),
      app_version: '0.2.0',
    }
    const fileName = await saveBackup(handle, payload)
    await markAutoBackupDone(now)
    autoBackupMessage.value = `✅ Авто-бэкап: Planner/${fileName}`
    setTimeout(() => (autoBackupMessage.value = null), 5000)
  } catch (e) {
    console.warn('Auto-backup failed:', e)
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 mx-auto w-full max-w-app px-4 pt-4 pb-24 safe-top">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <BottomNav />

    <!-- Тост авто-бэкапа -->
    <Transition name="toast">
      <div
        v-if="autoBackupMessage"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-elev border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-sm shadow-lg z-50"
      >
        {{ autoBackupMessage }}
      </div>
    </Transition>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from { opacity: 0; transform: translate(-50%, 20px); }
.toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }
</style>
