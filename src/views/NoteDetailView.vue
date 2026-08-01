<script setup lang="ts">
// Алиас для NoteCreateView в режиме редактирования.
// Маршрут /notes/:id просто рендерит NoteCreateView с подгруженной заметкой.
import NoteCreateView from './NoteCreateView.vue'
</script>

<template>
  <NoteCreateView />
</template>
