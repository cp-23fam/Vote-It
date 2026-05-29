<template>
  <div class="login-page">
    <div class="noise" />

    <div class="login-card">
      <div class="crest">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <polygon points="20,4 36,32 4,32" stroke="var(--gold)" stroke-width="1.5" fill="none"/>
          <circle cx="20" cy="20" r="5" fill="var(--gold)" opacity="0.7"/>
        </svg>
      </div>

      <h1 class="title">Council</h1>
      <p class="subtitle">President Panel</p>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label>Username</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="president"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="loading"
          />
        </div>

        <Transition name="fade">
          <p v-if="error" class="error">{{ error }}</p>
        </Transition>

        <button type="submit" class="btn-login" :disabled="loading || !username || !password">
          <span v-if="!loading">Sign in</span>
          <span v-else class="spinner" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

.noise {
  position: fixed;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
}

.login-card {
  width: 360px;
  padding: 48px 40px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  box-shadow: 0 0 80px rgba(201, 168, 76, 0.04), 0 24px 48px rgba(0,0,0,0.4);
  animation: cardIn 500ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.crest {
  margin-bottom: 20px;
  opacity: 0.9;
}

.title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 40px;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

input {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition);
}

input:focus {
  border-color: var(--gold);
}

input::placeholder {
  color: var(--text-muted);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  font-size: 12px;
  color: var(--red);
  text-align: center;
  padding: 8px 12px;
  background: var(--red-dim);
  border-radius: var(--radius);
  border: 1px solid rgba(217, 96, 96, 0.2);
}

.btn-login {
  margin-top: 8px;
  width: 100%;
  padding: 12px;
  background: var(--gold);
  color: #0d0f12;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
}

.btn-login:hover:not(:disabled) {
  background: #d4b05a;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.3);
}

.btn-login:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(13,15,18,0.3);
  border-top-color: #0d0f12;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
