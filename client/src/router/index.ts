import { createRouter, createWebHistory } from 'vue-router'
import stream from '../views/stream.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'stream',
      component: stream
    }
  ]
})

export default router
