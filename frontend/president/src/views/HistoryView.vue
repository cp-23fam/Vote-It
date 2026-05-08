<template>
  <div class="history-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Vote History</h1>
        <p class="page-sub">All past vote-it votes</p>
      </div>
    </header>

    <div v-if="loading" class="empty">Loading...</div>
    <div v-else-if="vote.history.length === 0" class="empty">No votes have been conducted yet.</div>

    <div v-else class="list">
      <RouterLink
        v-for="v in vote.history"
        :key="v.id"
        :to="`/vote/${v.id}/results`"
        class="history-card"
      >
        <div class="card-left">
          <p class="card-title">{{ v.title }}</p>
          <p class="card-date">{{ formatDate(v.closed_at || v.created_at) }}</p>
        </div>
        <div class="card-right">
          <div class="card-stats">
            <span class="card-stat">
              <span class="s-val">{{ v.total_votes }}</span>
              <span class="s-lbl">votes</span>
            </span>
            <span class="card-stat" v-if="v.eligible_voters">
              <span class="s-val"
                >{{ Math.round((v.total_votes / v.eligible_voters) * 100) }}%</span
              >
              <span class="s-lbl">participation</span>
            </span>
          </div>
          <span class="card-arrow">→</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useVoteStore } from '../stores/vote'

const vote = useVoteStore()
const loading = ref(false)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  loading.value = true
  try {
    await vote.fetchHistory()
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.history-page {
  padding: 40px;
  max-width: 800px;
}

.page-header {
  margin-bottom: 32px;
}
.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 0.06em;
}
.page-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.empty {
  color: var(--text-muted);
  padding: 20px 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition);
  gap: 16px;
}

.history-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.card-title {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-date {
  font-size: 11px;
  color: var(--text-muted);
}

.card-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.card-stats {
  display: flex;
  gap: 20px;
}

.card-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.s-val {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 300;
  color: var(--text-primary);
}

.s-lbl {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-arrow {
  color: var(--text-muted);
  font-size: 16px;
}
</style>
