import { createRouter, createWebHistory } from 'vue-router'

// BASE_URL берётся из vite.config.ts (для GitHub Pages = '/planner_pwa_44/')
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
    { path: '/week', name: 'week', component: () => import('./views/WeekView.vue') },
    { path: '/notes', name: 'notes', component: () => import('./views/NotesView.vue') },
    { path: '/notes/new', name: 'note-new', component: () => import('./views/NoteCreateView.vue') },
    { path: '/notes/:id', name: 'note-detail', component: () => import('./views/NoteDetailView.vue'), props: true },
    { path: '/tasks/new', name: 'task-new', component: () => import('./views/TaskCreateView.vue') },
    { path: '/tasks/:id', name: 'task-detail', component: () => import('./views/TaskDetailView.vue'), props: true },
    { path: '/assistant', name: 'assistant', component: () => import('./views/AssistantView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
  ],
})

export default router
