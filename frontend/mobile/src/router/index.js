import { createRouter, createWebHistory } from 'vue-router'

import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import VotePage from '../pages/VotePage.vue'
import WaitingRoom from '../pages/WaitingRoom.vue'
import SuccessPage from '../pages/SuccessPage.vue'
import TooLatePage from '../pages/TooLatePage.vue'

const routes = [
  {
    path: '/',
    component: Login,
  },
  {
    path: '/register',
    component: Register,
  },
  {
    path: '/waiting',
    component: WaitingRoom,
  },
  {
    path: '/vote',
    component: VotePage,
  },
  {
    path: '/success',
    component: SuccessPage,
  },
  {
    path: '/toolate',
    component: TooLatePage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router