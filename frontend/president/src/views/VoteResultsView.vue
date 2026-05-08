<template>
  <div class="results-page">
    <div v-if="loading" class="loading">Loading results...</div>
    <div v-else-if="!voteData" class="not-found">Vote not found. <RouterLink to="/">← Back</RouterLink></div>

    <template v-else>
      <header class="page-header">
        <div>
          <RouterLink to="/history" class="back-link">← History</RouterLink>
          <div class="title-row">
            <span class="closed-badge">Closed</span>
            <h1 class="page-title">{{ voteData.title }}</h1>
          </div>
          <p v-if="voteData.description" class="description">{{ voteData.description }}</p>
          <p class="closed-at">Closed {{ formatDate(voteData.closed_at) }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-export" @click="exportCSV">Export CSV</button>
        </div>
      </header>

      <!-- Summary cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="s-label">Total Votes</span>
          <span class="s-value">{{ totalVotes }}</span>
        </div>
        <div class="summary-card">
          <span class="s-label">Eligible</span>
          <span class="s-value">{{ voteData.eligible_voters ?? '—' }}</span>
        </div>
        <div class="summary-card">
          <span class="s-label">Participation</span>
          <span class="s-value">{{ participation }}%</span>
        </div>
        <div class="summary-card highlight">
          <span class="s-label">Winner</span>
          <span class="s-value winner-text">{{ winner }}</span>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="charts-grid">
        <!-- Bar chart -->
        <div class="chart-card chart-wide">
          <h3 class="chart-title">Vote Breakdown</h3>
          <div class="chart-wrap">
            <Bar v-if="barData" :data="barData" :options="barOptions" />
          </div>
        </div>

        <!-- Doughnut -->
        <div class="chart-card">
          <h3 class="chart-title">Distribution</h3>
          <div class="chart-wrap chart-wrap-sm">
            <Doughnut v-if="doughnutData" :data="doughnutData" :options="doughnutOptions" />
          </div>
        </div>
      </div>

      <!-- Detailed table -->
      <section class="detail-section">
        <h2 class="section-title">Detailed Results</h2>
        <table class="results-table">
          <thead>
            <tr>
              <th>Option</th>
              <th>Votes</th>
              <th>%</th>
              <th>Bar</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(option, i) in voteData.options"
              :key="option"
              :class="{ 'tr-winner': isWinner(option) }"
            >
              <td class="td-option">
                <span class="opt-dot" :style="{ background: PALETTE[i % PALETTE.length] }"></span>
                {{ option }}
              </td>
              <td class="td-votes">{{ results[option] ?? 0 }}</td>
              <td class="td-pct">{{ totalVotes > 0 ? Math.round(((results[option] ?? 0) / totalVotes) * 100) : 0 }}%</td>
              <td class="td-bar">
                <div class="mini-track">
                  <div
                    class="mini-fill"
                    :style="{
                      width: totalVotes > 0 ? Math.round(((results[option] ?? 0) / totalVotes) * 100) + '%' : '0%',
                      background: PALETTE[i % PALETTE.length]
                    }"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Vote metadata -->
      <div class="meta-row">
        <span class="meta-chip" :class="{ on: voteData.anonymous }">
          {{ voteData.anonymous ? 'Anonymous' : 'Named' }}
        </span>
        <span class="meta-chip">{{ voteData.options?.length }} options</span>
        <span class="meta-chip">ID: {{ voteData.id }}</span>
        <span class="meta-chip" v-if="voteData.duration">Duration: {{ voteData.duration }}s</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
  ArcElement
} from 'chart.js'
import { useVoteStore } from '../stores/vote'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const PALETTE = ['#c9a84c', '#5b8fd9', '#4caf82', '#d96060', '#d9a04c', '#9b59b6']

const route = useRoute()
const vote = useVoteStore()

const loading = ref(false)
const voteData = ref(null)

const results = computed(() => voteData.value?.results ?? {})
const totalVotes = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))
const participation = computed(() => {
  const el = voteData.value?.eligible_voters
  if (!el) return '—'
  return Math.round((totalVotes.value / el) * 100)
})

const winner = computed(() => {
  if (!voteData.value || totalVotes.value === 0) return '—'
  return voteData.value.options.reduce((a, b) =>
    (results.value[a] ?? 0) >= (results.value[b] ?? 0) ? a : b
  )
})

function isWinner(option) {
  return totalVotes.value > 0 && option === winner.value
}

// Chart data
const barData = computed(() => {
  if (!voteData.value) return null
  return {
    labels: voteData.value.options,
    datasets: [{
      label: 'Votes',
      data: voteData.value.options.map(o => results.value[o] ?? 0),
      backgroundColor: voteData.value.options.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
      borderColor: voteData.value.options.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 1,
      borderRadius: 4
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1e25',
      borderColor: '#ffffff20',
      borderWidth: 1,
      titleColor: '#ffffff99',
      bodyColor: '#ffffffee',
      padding: 12
    }
  },
  scales: {
    x: {
      grid: { color: '#ffffff08' },
      ticks: { color: '#ffffff60', font: { family: 'DM Mono', size: 12 } }
    },
    y: {
      grid: { color: '#ffffff08' },
      ticks: { color: '#ffffff60', font: { family: 'DM Mono', size: 12 }, stepSize: 1 },
      beginAtZero: true
    }
  }
}

const doughnutData = computed(() => {
  if (!voteData.value) return null
  return {
    labels: voteData.value.options,
    datasets: [{
      data: voteData.value.options.map(o => results.value[o] ?? 0),
      backgroundColor: voteData.value.options.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
      borderColor: '#13161b',
      borderWidth: 3
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#ffffff80', font: { family: 'DM Mono', size: 11 }, padding: 12 }
    },
    tooltip: {
      backgroundColor: '#1a1e25',
      borderColor: '#ffffff20',
      borderWidth: 1,
      titleColor: '#ffffff99',
      bodyColor: '#ffffffee',
      padding: 12
    }
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function exportCSV() {
  const rows = [['Option', 'Votes', 'Percentage']]
  voteData.value.options.forEach(o => {
    const v = results.value[o] ?? 0
    const pct = totalVotes.value > 0 ? Math.round((v / totalVotes.value) * 100) : 0
    rows.push([o, v, pct + '%'])
  })
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `vote-${voteData.value.id}-results.csv`
  a.click()
}

onMounted(async () => {
  loading.value = true
  try {
    voteData.value = await vote.fetchVoteById(route.params.id)
  } catch {
    voteData.value = null
  }
  loading.value = false
})
</script>

<style scoped>
.results-page {
  padding: 40px;
  max-width: 1000px;
}

.loading, .not-found { color: var(--text-muted); padding: 40px 0; }
.not-found a { color: var(--gold); text-decoration: none; margin-left: 8px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.closed-badge {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--bg-raised);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.page-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 0.04em;
}

.description {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
  max-width: 500px;
}

.closed-at {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-export {
  padding: 9px 16px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.btn-export:hover { border-color: var(--gold); color: var(--gold); }

/* Summary */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.summary-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card.highlight {
  border-color: rgba(201,168,76,0.3);
  background: var(--gold-dim);
}

.s-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.s-value {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 300;
  color: var(--text-primary);
}

.winner-text {
  font-size: 18px;
  color: var(--gold);
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.chart-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.chart-title {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.chart-wrap { height: 260px; }
.chart-wrap-sm { height: 240px; }

/* Table */
.detail-section { margin-bottom: 28px; }
.section-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.results-table thead th {
  padding: 10px 16px;
  text-align: left;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  font-weight: 400;
}

.results-table tbody td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.results-table tbody tr:last-child td { border-bottom: none; }

.results-table tbody tr.tr-winner { background: var(--gold-glow); }

.td-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.td-votes { font-family: var(--font-display); font-size: 18px; font-weight: 300; }
.td-pct { color: var(--text-secondary); }

.td-bar { width: 200px; }
.mini-track { height: 4px; background: var(--bg-raised); border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; border-radius: 2px; transition: width 600ms; }

/* Meta */
.meta-row { display: flex; gap: 8px; flex-wrap: wrap; }
.meta-chip {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
}
.meta-chip.on { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
</style>
