<template>
  <div class="new-vote">
    <header class="page-header">
      <h1 class="page-title">New Vote</h1>
      <p class="page-sub">Options are always: Yes · No · Abstain</p>
    </header>

    <div v-if="vote.hasActiveVote" class="already-active">
      <p>A vote is already in progress.</p>
      <RouterLink :to="`/vote/${vote.activeVote.id}`" class="btn-link"
        >Go to active vote →</RouterLink
      >
    </div>

    <form v-else class="form-card" @submit.prevent="handleSubmit">
      <!-- Title -->
      <div class="field">
        <label>Motion <span class="req">*</span></label>
        <input
          v-model="form.title"
          type="text"
          placeholder="e.g. Approval of the 2025 annual budget"
          :disabled="loading"
          required
          maxlength="200"
        />
      </div>

      <!-- Description -->
      <div class="field">
        <label>Description <span class="opt">(optional)</span></label>
        <textarea
          v-model="form.description"
          placeholder="Additional context for council members..."
          :disabled="loading"
          rows="3"
          maxlength="1000"
        />
      </div>

      <!-- Duration -->
      <div class="field">
        <label>Voting Duration</label>
        <div class="duration-grid">
          <button
            v-for="p in durationPresets"
            :key="p.value"
            type="button"
            class="chip"
            :class="{ active: form.duration === p.value }"
            @click="form.duration = p.value"
            :disabled="loading"
          >
            {{ p.label }}
          </button>
          <button
            type="button"
            class="chip"
            :class="{ active: form.duration === 0 }"
            @click="form.duration = 0"
            :disabled="loading"
          >
            No limit
          </button>
        </div>
      </div>

      <!-- Preview -->
      <div class="preview">
        <span class="preview-label">Voters will choose from</span>
        <div class="options-preview">
          <span class="opt-tag yes">Yes</span>
          <span class="opt-tag no">No</span>
          <span class="opt-tag abstain">Abstain</span>
        </div>
      </div>

      <Transition name="fade">
        <p v-if="error" class="error">{{ error }}</p>
      </Transition>

      <div class="form-actions">
        <RouterLink to="/" class="btn-ghost">Cancel</RouterLink>
        <button type="submit" class="btn-launch" :disabled="loading || !form.title.trim()">
          <span v-if="!loading">Launch Vote</span>
          <span v-else class="spinner" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useVoteStore } from '../stores/vote'

const vote = useVoteStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = ref({ title: '', description: '', duration: 120 })

const durationPresets = [
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
]

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    const created = await vote.createVote({
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      duration: form.value.duration || null,
    })
    router.push(`/vote/${created.id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.new-vote {
  padding: 40px;
  max-width: 600px;
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

.already-active {
  background: var(--abstain-dim);
  border: 1px solid rgba(91, 143, 217, 0.2);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--abstain);
}
.btn-link {
  color: currentColor;
  text-decoration: none;
  font-size: 12px;
}
.btn-link:hover {
  text-decoration: underline;
}

.form-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.req {
  color: var(--no);
}
.opt {
  color: var(--text-muted);
  font-size: 10px;
  text-transform: none;
  letter-spacing: 0;
}

input,
textarea {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition);
  resize: vertical;
}
input:focus,
textarea:focus {
  border-color: var(--gold);
}
input:disabled,
textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
}

.duration-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}
.chip:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}
.chip.active {
  border-color: var(--gold);
  color: var(--gold);
  background: var(--gold-dim);
}

.preview {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.preview-label {
  font-size: 11px;
  color: var(--text-muted);
}
.options-preview {
  display: flex;
  gap: 8px;
}

.opt-tag {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 20px;
}
.opt-tag.yes {
  background: var(--yes-dim);
  color: var(--yes);
  border: 1px solid rgba(76, 175, 130, 0.3);
}
.opt-tag.no {
  background: var(--no-dim);
  color: var(--no);
  border: 1px solid rgba(217, 96, 96, 0.3);
}
.opt-tag.abstain {
  background: var(--abstain-dim);
  color: var(--abstain);
  border: 1px solid rgba(91, 143, 217, 0.3);
}

.error {
  font-size: 12px;
  color: var(--no);
  background: var(--no-dim);
  border: 1px solid rgba(217, 96, 96, 0.2);
  border-radius: var(--radius);
  padding: 10px 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.btn-ghost {
  padding: 10px 18px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all var(--transition);
}
.btn-ghost:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.btn-launch {
  padding: 10px 24px;
  background: var(--gold);
  color: #0d0f12;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 40px;
}
.btn-launch:hover:not(:disabled) {
  background: #d4b05a;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
}
.btn-launch:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(13, 15, 18, 0.3);
  border-top-color: #0d0f12;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
