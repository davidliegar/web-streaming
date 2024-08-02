import { createRouter, createWebHistory } from 'vue-router'
import stream from '../views/stream.vue'
import local from '../views/local.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'stream',
      component: stream
    },
    {
      path: '/local',
      name: 'local',
      component: local
    }
  ]
})

export default router
