import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('president_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('president_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'president' })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Login failed')
    }
    const data = await res.json()
    token.value = data.token
    user.value = data.user
    localStorage.setItem('president_token', data.token)
    localStorage.setItem('president_user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('president_token')
    localStorage.removeItem('president_user')
  }

  function authHeaders() {
    return { Authorization: `Bearer ${token.value}` }
  }

  return { token, user, isAuthenticated, login, logout, authHeaders }
})
