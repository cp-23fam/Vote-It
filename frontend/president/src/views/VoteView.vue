<template>
  <div class="page">
    <!-- ── FORMULAIRE : pas de vote actif ─────────────────────── -->
    <div v-if="!store.hasActiveVote" class="card form-card">
      <h1 class="title">Démarrer un vote</h1>

      <div class="field">
        <label>Motion</label>
        <input
          v-model="title"
          type="text"
          placeholder="ex. Approbation du budget 2025"
          maxlength="200"
          :disabled="loading"
        />
      </div>

      <div class="field">
        <label>Durée</label>
        <div class="chips">
          <button
            v-for="p in presets"
            :key="p.value"
            type="button"
            class="chip"
            :class="{ active: duration === p.value }"
            @click="duration = p.value"
            :disabled="loading"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="btn-launch" :disabled="loading || !title.trim()" @click="launch">
        <span v-if="!loading">Lancer</span>
        <span v-else class="spinner" />
      </button>
    </div>

    <!-- ── VOTE EN COURS ──────────────────────────────────────── -->
    <div v-else class="card live-card">
      <div class="live-header">
        <div>
          <span class="live-badge">EN COURS</span>
          <h2 class="live-title">{{ store.vote.question }}</h2>
        </div>
        <div class="timer" :class="{ urgent: store.timerLeft <= 30 && store.timerLeft > 0 }">
          {{ formattedTime }}
        </div>
      </div>

      <!-- Indicateur WebSocket -->
      <div class="ws-row">
        <span class="ws-dot" :class="store.wsConnected ? 'on' : 'off'" />
        <span class="ws-label">{{
          store.wsConnected ? 'Connecté en temps réel' : 'Reconnexion…'
        }}</span>
      </div>

      <!-- Barres de progression -->
      <div class="bars">
        <div v-for="opt in OPTIONS" :key="opt.key" class="bar-row">
          <div class="bar-label">
            <span :class="`dot dot-${opt.key}`" />
            {{ opt.label }}
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="`fill-${opt.key}`"
              :style="{ width: pct(opt.key) + '%' }"
            />
          </div>
          <div class="bar-count">
            {{ store.results[opt.key] ?? 0 }}
            <span class="bar-pct">({{ pct(opt.key) }}%)</span>
          </div>
        </div>
      </div>

      <div class="live-footer">
        <span class="total-label">
          {{ store.total }} vote{{ store.total !== 1 ? 's' : '' }} exprimé{{
            store.total !== 1 ? 's' : ''
          }}
        </span>
        <button
          v-if="!store.vote?.closed"
          class="btn-close"
          :disabled="closing"
          @click="handleClose"
        >
          <span v-if="!closing">Clore le vote</span>
          <span v-else class="spinner spinner-light" />
        </button>
        <RouterLink v-else :to="`/results/${store.vote.id}`" class="btn-results">
          Voir les résultats →
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useVoteStore } from '../stores/vote'

const store = useVoteStore()

// Oui / Non / Neutre (clés en minuscules = valeurs BDD)
const OPTIONS = [
  { key: 'oui', label: 'Oui' },
  { key: 'non', label: 'Non' },
  { key: 'neutre', label: 'Neutre' },
]

const presets = [
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '7 min', value: 7 * 60 },
  { label: '10 min', value: 600 },
]

const title = ref('')
const duration = ref(120)
const loading = ref(false)
const closing = ref(false)
const error = ref('')

// ── Timer affiché ────────────────────────────────────────────
const formattedTime = computed(() => {
  const s = store.timerLeft
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

// ── Pourcentage d'une option ──────────────────────────────────
function pct(key) {
  if (!store.total) return 0
  return Math.round(((store.results[key] ?? 0) / store.total) * 100)
}

// ── Actions ──────────────────────────────────────────────────
async function launch() {
  loading.value = true
  error.value = ''
  try {
    await store.createVote(title.value.trim(), duration.value)
    // L'état est mis à jour via VOTE_STARTED reçu par le WebSocket
    title.value = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleClose() {
  closing.value = true
  try {
    await store.closeVote()
    // L'état est mis à jour via VOTE_CLOSED reçu par le WebSocket
  } catch (e) {
    error.value = e.message
  } finally {
    closing.value = false
  }
}

// ── Cycle de vie ──────────────────────────────────────────────
onMounted(() => {
  store.connect()
  // Fallback REST si le WS est lent à envoyer ROOM_STATE
  store.fetchActive().catch(() => {})
})

onUnmounted(() => store.disconnect())
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ── Formulaire ── */
.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

input {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  color: var(--text);
  background: #fff;
  outline: none;
  transition: border-color 150ms;
}
input:focus {
  border-color: #999;
}
input::placeholder {
  color: #bbb;
}
input:disabled {
  opacity: 0.5;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms;
}
.chip:hover {
  border-color: #999;
  color: var(--text);
}
.chip.active {
  border-color: var(--text);
  background: var(--text);
  color: #fff;
}
.chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error {
  font-size: 13px;
  color: var(--no);
  background: var(--no-bg);
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 16px;
}

.btn-launch {
  width: 100%;
  padding: 12px;
  background: var(--text);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
}
.btn-launch:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-launch:hover:not(:disabled) {
  opacity: 0.85;
}

/* ── Vote en cours ── */
.live-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.live-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--yes);
  background: var(--yes-bg);
  border-radius: 4px;
  padding: 2px 7px;
  margin-bottom: 6px;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.live-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.timer {
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  flex-shrink: 0;
  letter-spacing: -0.02em;
}
.timer.urgent {
  color: var(--no);
  animation: blink 1s ease-in-out infinite;
}

/* Indicateur WS */
.ws-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
}
.ws-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.ws-dot.on {
  background: var(--yes);
  animation: blink 2s ease-in-out infinite;
}
.ws-dot.off {
  background: #888;
}
.ws-label {
  font-size: 11px;
  color: var(--text-muted);
}

/* Barres */
.bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 72px;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-oui {
  background: var(--yes);
}
.dot-non {
  background: var(--no);
}
.dot-neutre {
  background: var(--abstain);
}

.bar-track {
  flex: 1;
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
.fill-oui {
  background: var(--yes);
}
.fill-non {
  background: var(--no);
}
.fill-neutre {
  background: var(--abstain);
}

.bar-count {
  width: 80px;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  flex-shrink: 0;
}
.bar-pct {
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
}

/* Footer */
.live-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.total-label {
  font-size: 13px;
  color: var(--text-muted);
}

.btn-close {
  padding: 9px 20px;
  background: var(--no);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 110px;
  height: 38px;
}
.btn-close:hover:not(:disabled) {
  opacity: 0.85;
}
.btn-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-results {
  padding: 9px 20px;
  background: var(--text);
  color: #fff;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 150ms;
}
.btn-results:hover {
  opacity: 0.8;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.spinner-light {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
