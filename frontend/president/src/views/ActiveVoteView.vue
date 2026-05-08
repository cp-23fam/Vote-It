<template>
  <div class="active-vote">
    <div v-if="loading" class="loading">Loading vote...</div>
    <div v-else-if="!localVote" class="not-found">
      Vote not found.
      <RouterLink to="/">← Back</RouterLink>
    </div>
    <template v-else>
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <RouterLink to="/" class="back-link">← Dashboard</RouterLink>
          <div class="status-row">
            <span class="status-badge" :class="localVote.status">
              {{ statusLabel }}
            </span>
            <h1 class="page-title">{{ localVote.title }}</h1>
          </div>
          <p v-if="localVote.description" class="description">{{ localVote.description }}</p>
        </div>

        <div class="header-right">
          <TimerDisplay
            v-if="localVote.status === 'open' && vote.timerRemaining > 0"
            :seconds="vote.timerRemaining"
            large
          />
          <button
            v-if="localVote.status === 'open'"
            class="btn-close-vote"
            @click="showConfirm = true"
          >
            Close Vote
          </button>
          <RouterLink
            v-if="localVote.status === 'closed'"
            :to="`/vote/${localVote.id}/results`"
            class="btn-results"
          >
            Full Results →
          </RouterLink>
        </div>
      </header>

      <!-- Live Stats -->
      <div class="stats-row">
        <div class="stat-pill">
          <span class="stat-num">{{ liveVoterCount }}</span>
          <span class="stat-lbl">Connected</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ totalVotes }}</span>
          <span class="stat-lbl">Votes cast</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ participation }}%</span>
          <span class="stat-lbl">Participation</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ localVote.eligible_voters ?? '—' }}</span>
          <span class="stat-lbl">Eligible</span>
        </div>
      </div>

      <!-- Live Results -->
      <section class="results-section">
        <h2 class="section-title">Live Results</h2>
        <div class="results-list">
          <div
            v-for="option in localVote.options"
            :key="option"
            class="result-row"
          >
            <div class="result-meta">
              <span class="result-option">{{ option }}</span>
              <span class="result-count">
                {{ results[option] ?? 0 }}
                <span class="result-pct">
                  ({{ totalVotes > 0 ? Math.round(((results[option] ?? 0) / totalVotes) * 100) : 0 }}%)
                </span>
              </span>
            </div>
            <div class="result-bar-track">
              <div
                class="result-bar-fill"
                :style="{ width: barWidth(option) + '%' }"
                :class="barColor(option)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Anonymous / options info -->
      <div class="meta-row">
        <span class="meta-chip" :class="{ on: localVote.anonymous }">
          {{ localVote.anonymous ? 'Anonymous vote' : 'Named vote' }}
        </span>
        <span class="meta-chip">{{ localVote.options?.length }} options</span>
        <span class="meta-chip">ID: {{ localVote.id }}</span>
      </div>
    </template>

    <!-- Confirm close dialog -->
    <Transition name="fade">
      <div v-if="showConfirm" class="overlay" @click.self="showConfirm = false">
        <div class="dialog">
          <h3 class="dialog-title">Close this vote?</h3>
          <p class="dialog-body">
            {{ totalVotes }} vote{{ totalVotes !== 1 ? 's' : '' }} have been cast.
            This action cannot be undone.
          </p>
          <div class="dialog-actions">
            <button class="btn-ghost" @click="showConfirm = false">Cancel</button>
            <button class="btn-confirm-close" @click="handleClose" :disabled="closing">
              <span v-if="!closing">Close Vote</span>
              <span v-else class="spinner" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useVoteStore } from '../stores/vote'
import TimerDisplay from '../components/TimerDisplay.vue'

const route = useRoute()
const router = useRouter()
const vote = useVoteStore()

const loading = ref(false)
const closing = ref(false)
const showConfirm = ref(false)
const localVote = ref(null)

// Sync from store if this is the active vote
const syncFromStore = () => {
  if (vote.activeVote && vote.activeVote.id === route.params.id) {
    localVote.value = vote.activeVote
  }
}

watch(() => vote.activeVote, syncFromStore, { deep: true })

const results = computed(() => localVote.value?.results ?? {})
const totalVotes = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))
const liveVoterCount = computed(() => localVote.value?.connected_voters ?? 0)
const participation = computed(() => {
  const eligible = localVote.value?.eligible_voters || 0
  if (!eligible) return '—'
  return Math.round((totalVotes.value / eligible) * 100)
})

const statusLabel = computed(() => {
  const s = localVote.value?.status
  if (s === 'open') return 'Live'
  if (s === 'closed') return 'Closed'
  return s ?? ''
})

function barWidth(option) {
  if (totalVotes.value === 0) return 0
  return Math.round(((results.value[option] ?? 0) / totalVotes.value) * 100)
}

const BAR_COLORS = ['gold', 'blue', 'green', 'red', 'amber']
function barColor(option) {
  const idx = localVote.value?.options?.indexOf(option) ?? 0
  return BAR_COLORS[idx % BAR_COLORS.length]
}

async function handleClose() {
  closing.value = true
  try {
    await vote.closeVote(localVote.value.id)
    showConfirm.value = false
    router.push(`/vote/${localVote.value.id}/results`)
  } catch (e) {
    alert('Failed to close vote: ' + e.message)
  } finally {
    closing.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id
    if (vote.activeVote?.id === id) {
      localVote.value = vote.activeVote
    } else {
      localVote.value = await vote.fetchVoteById(id)
    }
  } catch {
    localVote.value = null
  }
  loading.value = false
})
</script>

<style scoped>
.active-vote {
  padding: 40px;
  max-width: 900px;
}

.loading, .not-found {
  color: var(--text-muted);
  padding: 40px 0;
}

.not-found a { color: var(--gold); text-decoration: none; margin-left: 8px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 24px;
}

.back-link {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 12px;
}

.back-link:hover { color: var(--text-secondary); }

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.status-badge {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 3px;
  font-weight: 500;
}

.status-badge.open {
  background: var(--green-dim);
  color: var(--green);
  border: 1px solid rgba(76,175,130,0.25);
  animation: pulse-text 2s ease-in-out infinite;
}

.status-badge.closed {
  background: var(--bg-raised);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

@keyframes pulse-text { 0%,100%{opacity:1}50%{opacity:0.6} }

.page-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 0.04em;
}

.description {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 500px;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.btn-close-vote {
  padding: 10px 20px;
  background: var(--red-dim);
  border: 1px solid rgba(217,96,96,0.3);
  border-radius: var(--radius);
  color: var(--red);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-close-vote:hover {
  background: rgba(217,96,96,0.25);
  transform: translateY(-1px);
}

.btn-results {
  padding: 10px 20px;
  background: var(--gold);
  color: #0d0f12;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition);
}

.btn-results:hover { background: #d4b05a; }

/* Stats */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 36px;
}

.stat-pill {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
}

.stat-lbl {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Results */
.results-section { margin-bottom: 28px; }
.section-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-row {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.result-option {
  font-size: 14px;
  color: var(--text-primary);
}

.result-count {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.result-pct {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 4px;
}

.result-bar-track {
  height: 6px;
  background: var(--bg-raised);
  border-radius: 3px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 600ms cubic-bezier(0.4,0,0.2,1);
}

.result-bar-fill.gold { background: var(--gold); }
.result-bar-fill.blue { background: var(--blue); }
.result-bar-fill.green { background: var(--green); }
.result-bar-fill.red { background: var(--red); }
.result-bar-fill.amber { background: var(--amber); }

/* Meta */
.meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
}

.meta-chip.on {
  border-color: var(--gold);
  color: var(--gold);
  background: var(--gold-dim);
}

/* Dialog */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 32px;
  width: 400px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}

.dialog-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 300;
  margin-bottom: 12px;
}

.dialog-body {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-ghost {
  padding: 9px 16px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); }

.btn-confirm-close {
  padding: 9px 20px;
  background: var(--red);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 38px;
}
.btn-confirm-close:hover:not(:disabled) { background: #e06868; }
.btn-confirm-close:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
