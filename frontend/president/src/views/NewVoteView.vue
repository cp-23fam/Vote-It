<template>
  <div class="new-vote">
    <header class="page-header">
      <div>
        <h1 class="page-title">New Vote</h1>
        <p class="page-sub">Configure and launch a council vote</p>
      </div>
    </header>

    <div v-if="vote.hasActiveVote" class="already-active">
      <p>A vote is already in progress.</p>
      <RouterLink :to="`/vote/${vote.activeVote.id}`" class="btn-secondary">
        Go to active vote →
      </RouterLink>
    </div>

    <form v-else class="form-card" @submit.prevent="handleSubmit">
      <!-- Title -->
      <div class="field">
        <label>Motion / Title <span class="required">*</span></label>
        <input
          v-model="form.title"
          type="text"
          placeholder="e.g. Approval of the 2025 budget"
          :disabled="loading"
          required
          maxlength="200"
        />
        <span class="char-count">{{ form.title.length }}/200</span>
      </div>

      <!-- Description -->
      <div class="field">
        <label>Description <span class="optional">(optional)</span></label>
        <textarea
          v-model="form.description"
          placeholder="Additional context or details for council members..."
          :disabled="loading"
          rows="3"
          maxlength="1000"
        />
      </div>

      <!-- Vote options -->
      <div class="field">
        <label>Vote Options <span class="required">*</span></label>
        <div class="options-list">
          <div
            v-for="(opt, i) in form.options"
            :key="i"
            class="option-row"
          >
            <input
              v-model="form.options[i]"
              type="text"
              :placeholder="`Option ${i + 1}`"
              :disabled="loading"
              required
            />
            <button
              v-if="form.options.length > 2"
              type="button"
              class="btn-remove"
              @click="removeOption(i)"
              :disabled="loading"
            >×</button>
          </div>
        </div>
        <button
          v-if="form.options.length < 8"
          type="button"
          class="btn-add-option"
          @click="addOption"
          :disabled="loading"
        >
          + Add option
        </button>
      </div>

      <!-- Duration -->
      <div class="field">
        <label>Voting Duration</label>
        <div class="duration-grid">
          <button
            v-for="preset in durationPresets"
            :key="preset.value"
            type="button"
            class="duration-chip"
            :class="{ active: form.duration === preset.value }"
            @click="form.duration = preset.value"
            :disabled="loading"
          >
            {{ preset.label }}
          </button>
          <button
            type="button"
            class="duration-chip"
            :class="{ active: form.duration === 0 }"
            @click="form.duration = 0"
            :disabled="loading"
          >
            No limit
          </button>
        </div>
        <div v-if="form.duration > 0 && !durationPresets.find(p => p.value === form.duration)" class="custom-duration">
          Custom: {{ form.duration }}s
        </div>
      </div>

      <!-- Anonymous -->
      <div class="field field-inline">
        <label class="toggle-label">
          <input v-model="form.anonymous" type="checkbox" class="toggle-input" :disabled="loading" />
          <span class="toggle-track"><span class="toggle-thumb" /></span>
          Anonymous vote
        </label>
        <span class="field-hint">Members' choices will not be linked to their identity in results</span>
      </div>

      <!-- Error -->
      <Transition name="fade">
        <p v-if="error" class="error">{{ error }}</p>
      </Transition>

      <!-- Actions -->
      <div class="form-actions">
        <RouterLink to="/" class="btn-ghost">Cancel</RouterLink>
        <button type="submit" class="btn-launch" :disabled="loading || !isValid">
          <span v-if="!loading">Launch Vote</span>
          <span v-else class="spinner" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useVoteStore } from '../stores/vote'

const vote = useVoteStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const form = ref({
  title: '',
  description: '',
  options: ['For', 'Against', 'Abstain'],
  duration: 120,
  anonymous: false
})

const durationPresets = [
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
]

const isValid = computed(() =>
  form.value.title.trim().length > 0 &&
  form.value.options.filter(o => o.trim()).length >= 2
)

function addOption() {
  form.value.options.push('')
}

function removeOption(i) {
  form.value.options.splice(i, 1)
}

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      options: form.value.options.map(o => o.trim()).filter(Boolean),
      duration: form.value.duration || null,
      anonymous: form.value.anonymous
    }
    const created = await vote.createVote(payload)
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
  max-width: 680px;
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
  background: var(--amber-dim);
  border: 1px solid rgba(217,160,76,0.2);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--amber);
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid currentColor;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--amber);
  font-size: 12px;
  transition: all var(--transition);
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
  position: relative;
}

label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.required { color: var(--red); margin-left: 2px; }
.optional { color: var(--text-muted); font-size: 10px; text-transform: none; letter-spacing: 0; }

input[type="text"],
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

input:focus, textarea:focus { border-color: var(--gold); }
input:disabled, textarea:disabled { opacity: 0.5; cursor: not-allowed; }
input::placeholder, textarea::placeholder { color: var(--text-muted); }

.char-count {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 10px;
  color: var(--text-muted);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-row input { flex: 1; }

.btn-remove {
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}

.btn-remove:hover { border-color: var(--red); color: var(--red); }

.btn-add-option {
  background: none;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 8px 14px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
  align-self: flex-start;
}

.btn-add-option:hover { border-color: var(--gold); color: var(--gold); }

.duration-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.duration-chip {
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

.duration-chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
.duration-chip.active { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }

.field-inline {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  font-size: 13px;
  color: var(--text-primary);
}

.toggle-input { display: none; }

.toggle-track {
  width: 36px;
  height: 20px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: all var(--transition);
}

.toggle-input:checked + .toggle-track {
  background: var(--gold-dim);
  border-color: var(--gold);
}

.toggle-thumb {
  width: 14px;
  height: 14px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition);
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  background: var(--gold);
  transform: translateX(16px);
}

.field-hint {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: 0;
}

.error {
  font-size: 12px;
  color: var(--red);
  background: var(--red-dim);
  border: 1px solid rgba(217,96,96,0.2);
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

.btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); }

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
  box-shadow: 0 4px 16px rgba(201,168,76,0.3);
}

.btn-launch:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(13,15,18,0.3);
  border-top-color: #0d0f12;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
