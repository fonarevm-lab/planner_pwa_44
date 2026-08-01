<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Task, Category } from '../db'

const props = defineProps<{ task: Task; category: Category | null }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const router = useRouter()

function open() { router.push(`/tasks/${props.task.id}`) }
</script>

<template>
  <div class="card flex items-start gap-3 cursor-pointer hover:bg-bg-elev/60 transition-colors" @click="open">
    <button
      class="mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
      :class="task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-fg-muted/40 hover:border-accent'"
      @click.stop="emit('toggle', task.id)"
      :title="task.status === 'done' ? 'Снять отметку (вернуть в работу)' : 'Отметить выполненным'"
      :aria-label="task.status === 'done' ? 'Снять отметку выполнения' : 'Отметить выполненным'"
    >
      <span v-if="task.status === 'done'">✓</span>
    </button>
    <div class="flex-1 min-w-0">
      <h3 class="font-medium leading-snug" :class="task.status === 'done' ? 'line-through text-fg-muted' : ''">
        {{ task.title }}
      </h3>
      <p v-if="task.description" class="text-sm text-fg-muted line-clamp-2 mt-1">
        {{ task.description }}
      </p>
      <div class="flex items-center gap-2 flex-wrap mt-2">
        <span
          class="chip"
          :class="{
            'bg-red-500/20 text-red-300': task.priority === 'high',
            'bg-amber-500/20 text-amber-300': task.priority === 'medium',
            'bg-emerald-500/20 text-emerald-300': task.priority === 'low',
          }"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-red-400': task.priority === 'high',
            'bg-amber-400': task.priority === 'medium',
            'bg-emerald-400': task.priority === 'low',
          }"></span>
          {{ task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий' }}
        </span>
        <span v-if="category" class="chip" :style="{ backgroundColor: category.color + '22', color: category.color }">
          {{ category.icon }} {{ category.name }}
        </span>
        <span class="chip bg-white/5 text-fg-muted">📆 {{ new Date(task.planned_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
