<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <polygon points="20,4 36,32 4,32" stroke="var(--gold)" stroke-width="1.5" fill="none" />
            <circle cx="20" cy="20" r="4" fill="var(--gold)" opacity="0.8" />
          </svg>
          <span class="brand-name">Council</span>
        </div>

        <nav class="nav">
          <RouterLink to="/" exact class="nav-item"> <IconGrid /> Dashboard </RouterLink>
          <RouterLink to="/vote/new" class="nav-item"> <IconPlus /> New Vote </RouterLink>
          <RouterLink
            v-if="vote.hasActiveVote"
            :to="`/vote/${vote.activeVote.id}`"
            class="nav-item live-link"
          >
            <span class="pulse-dot" /> Active Vote
          </RouterLink>
          <RouterLink to="/history" class="nav-item"> <IconClock /> History </RouterLink>
        </nav>
      </div>

      <div class="ws-status" :class="vote.wsConnected ? 'connected' : 'disconnected'">
        <span class="ws-dot" />
        {{ vote.wsConnected ? 'Live' : 'Reconnecting...' }}
      </div>
    </aside>

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
import { RouterView, RouterLink } from 'vue-router'
import { useVoteStore } from '../stores/vote'

const vote = useVoteStore()

onMounted(() => {
  vote.connectWebSocket()
  vote.fetchActiveVote().catch(() => {})
})

onUnmounted(() => vote.disconnectWebSocket())

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
  width: 210px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.live-link {
  color: var(--yes) !important;
}
.live-link.router-link-active {
  background: var(--yes-dim);
  color: var(--yes) !important;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--yes);
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

.ws-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  font-size: 11px;
  letter-spacing: 0.06em;
  border-top: 1px solid var(--border);
}

.ws-status.connected {
  color: var(--yes);
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

.main {
  flex: 1;
  overflow-y: auto;
  min-height: 100vh;
}
</style>
