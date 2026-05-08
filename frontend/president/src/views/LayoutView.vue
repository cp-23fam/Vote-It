<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <polygon points="20,4 36,32 4,32" stroke="var(--gold)" stroke-width="1.5" fill="none" />
            <circle cx="20" cy="20" r="4" fill="var(--gold)" opacity="0.8" />
          </svg>
          <span class="brand-name">Vote It</span>
        </div>

        <nav class="nav">
          <RouterLink to="/" exact class="nav-item"> <IconGrid /> Dashboard </RouterLink>
          <RouterLink to="/vote/new" class="nav-item"> <IconPlus /> New Vote </RouterLink>
          <RouterLink
            v-if="vote.hasActiveVote"
            :to="`/vote/${vote.activeVote.id}`"
            class="nav-item active-vote-link"
          >
            <span class="pulse-dot" />
            Active Vote
          </RouterLink>
          <RouterLink to="/history" class="nav-item"> <IconClock /> History </RouterLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="ws-status" :class="vote.wsConnected ? 'connected' : 'disconnected'">
          <span class="ws-dot" />
          {{ vote.wsConnected ? 'Live' : 'Reconnecting...' }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ auth.user?.username ?? 'President' }}</span>
          <button class="btn-logout" @click="handleLogout">Logout</button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useVoteStore } from '../stores/vote'

const auth = useAuthStore()
const vote = useVoteStore()
const router = useRouter()

onMounted(() => {
  vote.connectWebSocket()
  vote.fetchActiveVote().catch(() => {})
})

onUnmounted(() => {
  vote.disconnectWebSocket()
})

function handleLogout() {
  vote.disconnectWebSocket()
  auth.logout()
  router.push('/login')
}

// Icon components inline
const IconGrid = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
}
const IconPlus = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
}
const IconClock = {
  template: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  border-bottom: 1px solid var(--border);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.nav {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.router-link-active {
  background: var(--gold-dim);
  color: var(--gold);
}

.active-vote-link {
  color: var(--green) !important;
  position: relative;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.85);
  }
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.ws-status.connected {
  color: var(--green);
}
.ws-status.disconnected {
  color: var(--text-muted);
}

.ws-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ws-status.connected .ws-dot {
  animation: pulse 1.5s ease-in-out infinite;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-name {
  font-size: 11px;
  color: var(--text-secondary);
}

.btn-logout {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 3px 8px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.06em;
}

.btn-logout:hover {
  border-color: var(--red);
  color: var(--red);
}

.main {
  flex: 1;
  overflow-y: auto;
  min-height: 100vh;
}
</style>
