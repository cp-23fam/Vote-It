<template>
  <div class="dashboard">
    <header class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Welcome back, {{ auth.user?.username ?? 'President' }}</p>
      </div>
      <RouterLink to="/vote/new" class="btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Start Vote
      </RouterLink>
    </header>

    <!-- Active Vote Banner -->
    <Transition name="slide-up">
      <div v-if="vote.hasActiveVote" class="active-banner">
        <div class="banner-left">
          <span class="live-badge">LIVE</span>
          <div>
            <p class="banner-title">{{ vote.activeVote.title }}</p>
            <p class="banner-meta">
              {{ vote.totalVotes }} votes · {{ vote.participationRate }}% participation
            </p>
          </div>
        </div>
        <div class="banner-right">
          <TimerDisplay v-if="vote.timerRemaining > 0" :seconds="vote.timerRemaining" />
          <RouterLink :to="`/vote/${vote.activeVote.id}`" class="btn-go">
            Manage →
          </RouterLink>
        </div>
      </div>
    </Transition>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Sessions</span>
        <span class="stat-value">{{ vote.history.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Status</span>
        <span class="stat-value" :class="vote.hasActiveVote ? 'green' : 'muted'">
          {{ vote.hasActiveVote ? 'Active' : 'Idle' }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Connection</span>
        <span class="stat-value" :class="vote.wsConnected ? 'green' : 'red'">
          {{ vote.wsConnected ? 'Live' : 'Offline' }}
        </span>
      </div>
    </div>

    <!-- Recent History -->
    <section class="section">
      <h2 class="section-title">Recent Votes</h2>
      <div v-if="loading" class="empty">Loading...</div>
      <div v-else-if="recentHistory.length === 0" class="empty">No votes yet.</div>
      <div v-else class="history-list">
        <RouterLink
          v-for="v in recentHistory"
          :key="v.id"
          :to="`/vote/${v.id}/results`"
          class="history-item"
        >
          <div class="history-left">
            <span class="history-title">{{ v.title }}</span>
            <span class="history-date">{{ formatDate(v.closed_at || v.created_at) }}</span>
          </div>
          <div class="history-right">
            <span class="history-count">{{ v.total_votes }} votes</span>
            <span class="history-arrow">→</span>
          </div>
        </RouterLink>
      </div>
      <RouterLink v-if="vote.history.length > 5" to="/history" class="view-all">
        View all history →
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useVoteStore } from '../stores/vote'
import TimerDisplay from '../components/TimerDisplay.vue'

const auth = useAuthStore()
const vote = useVoteStore()
const loading = ref(false)

const recentHistory = computed(() => vote.history.slice(0, 5))

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  loading.value = true
  try { await vote.fetchHistory() } catch {}
  loading.value = false
})
</script>

<style scoped>
.dashboard {
  padding: 40px;
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

.page-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--gold);
  color: #0d0f12;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  transition: all var(--transition);
}

.btn-primary:hover {
  background: #d4b05a;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201,168,76,0.3);
}

/* Active banner */
.active-banner {
  background: var(--green-dim);
  border: 1px solid rgba(76, 175, 130, 0.25);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-badge {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--green);
  background: rgba(76, 175, 130, 0.15);
  border: 1px solid rgba(76, 175, 130, 0.3);
  padding: 3px 8px;
  border-radius: 3px;
  animation: pulse-text 2s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.banner-title {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.banner-meta {
  font-size: 11px;
  color: var(--text-secondary);
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-go {
  padding: 8px 16px;
  background: var(--green);
  color: #0d0f12;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition);
}

.btn-go:hover { background: #5ec494; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
}

.stat-value.green { color: var(--green); }
.stat-value.red { color: var(--red); }
.stat-value.muted { color: var(--text-muted); }

/* Section */
.section { }
.section-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all var(--transition);
}

.history-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.history-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-title {
  font-size: 13px;
  color: var(--text-primary);
}

.history-date {
  font-size: 11px;
  color: var(--text-muted);
}

.history-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-arrow {
  color: var(--text-muted);
  font-size: 14px;
}

.view-all {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  color: var(--gold);
  text-decoration: none;
}

.view-all:hover { text-decoration: underline; }
</style>
