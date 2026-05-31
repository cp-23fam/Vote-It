import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Vote', component: () => import('../views/VoteView.vue') },
    { path: '/results/:id', name: 'Results', component: () => import('../views/ResultsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
