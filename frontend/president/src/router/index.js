import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'vote/new', name: 'NewVote', component: () => import('../views/NewVoteView.vue') },
      {
        path: 'vote/:id',
        name: 'ActiveVote',
        component: () => import('../views/ActiveVoteView.vue'),
      },
      {
        path: 'vote/:id/results',
        name: 'VoteResults',
        component: () => import('../views/VoteResultsView.vue'),
      },
      { path: 'history', name: 'History', component: () => import('../views/HistoryView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export default createRouter({ history: createWebHistory(), routes })
