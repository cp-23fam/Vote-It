<template>
  <div class="page">
    <div class="card">

      <div v-if="loading" class="state-msg">Loading...</div>
      <div v-else-if="!voteData" class="state-msg">
        Vote not found. <RouterLink to="/">← Back</RouterLink>
      </div>

      <template v-else>
        <div class="header">
          <div>
            <span class="closed-badge">Closed</span>
            <h1 class="title">{{ voteData.title }}</h1>
            <p class="subtitle">{{ formatDate(voteData.closed_at) }}</p>
          </div>
          <RouterLink to="/" class="btn-new">New vote</RouterLink>
        </div>

        <!-- Doughnut + winner -->
        <div class="chart-row">
          <div class="doughnut-wrap">
            <Doughnut :data="chartData" :options="chartOptions" />
          </div>
          <div class="winner-box">
            <p class="winner-label">Result</p>
            <p class="winner-value" :class="`color-${winner.toLowerCase()}`">{{ winner }}</p>
            <p class="winner-sub">{{ winnerPct }}% of votes</p>
          </div>
        </div>

        <!-- Breakdown table -->
        <div class="breakdown">
          <div v-for="opt in OPTIONS" :key="opt" class="breakdown-row">
            <div class="breakdown-left">
              <span class="dot" :class="`dot-${opt.toLowerCase()}`" />
              <span class="opt-name">{{ opt }}</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-track">
                <div
                  class="breakdown-fill"
                  :class="`fill-${opt.toLowerCase()}`"
                  :style="{ width: pct(opt) + '%' }"
                />
              </div>
            </div>
            <div class="breakdown-right">
              <span class="opt-count">{{ results[opt] ?? 0 }}</span>
              <span class="opt-pct">{{ pct(opt) }}%</span>
            </div>
          </div>
        </div>

        <p class="total">{{ total }} vote{{ total !== 1 ? 's' : '' }} total</p>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const OPTIONS = ['Yes', 'No', 'Abstain']
const COLORS  = { Yes: '#22a06b', No: '#d93636', Abstain: '#4a7fd4' }

const route   = useRoute()
const loading = ref(true)
const voteData = ref(null)

const results = computed(() => voteData.value?.results ?? {})
const total   = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))

function pct(opt) {
  if (!total.value) return 0
  return Math.round(((results.value[opt] ?? 0) / total.value) * 100)
}

const winner = computed(() => {
  if (!total.value) return '—'
  return OPTIONS.reduce((a, b) =>
    (results.value[a] ?? 0) >= (results.value[b] ?? 0) ? a : b
  )
})

const winnerPct = computed(() => pct(winner.value))

const chartData = computed(() => ({
  labels: OPTIONS,
  datasets: [{
    data: OPTIONS.map(o => results.value[o] ?? 0),
    backgroundColor: OPTIONS.map(o => COLORS[o]),
    borderWidth: 2,
    borderColor: '#fff'
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.raw} votes`
      }
    }
  },
  cutout: '65%'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    const res = await fetch(`/api/votes/${route.params.id}`)
    if (!res.ok) throw new Error()
    voteData.value = (await res.json()).vote
  } catch {
    voteData.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.state-msg { color: #888; padding: 20px 0; }
.state-msg a { color: var(--text); }

/* Header */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.closed-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  background: #f0f0f0;
  border-radius: 4px;
  padding: 2px 7px;
  margin-bottom: 6px;
}

.title { font-size: 18px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; }
.subtitle { font-size: 12px; color: var(--text-muted); }

.btn-new {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: border-color 150ms;
  flex-shrink: 0;
}
.btn-new:hover { border-color: #999; }

/* Chart row */
.chart-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
}

.doughnut-wrap {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.winner-box { flex: 1; }
.winner-label { font-size: 11px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.winner-value { font-size: 36px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.winner-sub { font-size: 13px; color: var(--text-muted); }

.color-yes     { color: var(--yes); }
.color-no      { color: var(--no); }
.color-abstain { color: var(--abstain); }

/* Breakdown */
.breakdown { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

.breakdown-row { display: flex; align-items: center; gap: 10px; }

.breakdown-left {
  display: flex; align-items: center; gap: 6px;
  width: 72px; flex-shrink: 0;
  font-size: 13px; font-weight: 500;
}

.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-yes     { background: var(--yes); }
.dot-no      { background: var(--no); }
.dot-abstain { background: var(--abstain); }

.breakdown-bar-wrap { flex: 1; }
.breakdown-track {
  height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;
}
.breakdown-fill { height: 100%; border-radius: 4px; }
.fill-yes     { background: var(--yes); }
.fill-no      { background: var(--no); }
.fill-abstain { background: var(--abstain); }

.breakdown-right {
  width: 80px; flex-shrink: 0;
  display: flex; align-items: baseline; gap: 4px;
  justify-content: flex-end;
}

.opt-count { font-size: 14px; font-weight: 600; }
.opt-pct { font-size: 12px; color: var(--text-muted); }

.total { font-size: 12px; color: var(--text-muted); text-align: right; }
</style>
