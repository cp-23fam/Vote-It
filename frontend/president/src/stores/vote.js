import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useVoteStore = defineStore('vote', () => {
  const auth = useAuthStore()

  // State
  const activeVote = ref(null)
  const history = ref([])
  const ws = ref(null)
  const wsConnected = ref(false)
  const timerRemaining = ref(0)
  let timerInterval = null

  // Computed
  const hasActiveVote = computed(() => !!activeVote.value)
  const voteStatus = computed(() => activeVote.value?.status ?? null)

  const totalVotes = computed(() => {
    if (!activeVote.value?.results) return 0
    return Object.values(activeVote.value.results).reduce((a, b) => a + b, 0)
  })

  const participationRate = computed(() => {
    if (!activeVote.value) return 0
    const total = activeVote.value.eligible_voters || 1
    return Math.round((totalVotes.value / total) * 100)
  })

  // WebSocket
  function connectWebSocket() {
    if (ws.value?.readyState === WebSocket.OPEN) return

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    ws.value = new WebSocket(`${protocol}://${location.host}/ws?token=${auth.token}`)

    ws.value.onopen = () => {
      wsConnected.value = true
      ws.value.send(JSON.stringify({ type: 'IDENTIFY', role: 'president' }))
    }

    ws.value.onclose = () => {
      wsConnected.value = false
      // Reconnect after 3s
      setTimeout(connectWebSocket, 3000)
    }

    ws.value.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      handleWsMessage(msg)
    }

    ws.value.onerror = () => {
      wsConnected.value = false
    }
  }

  function handleWsMessage(msg) {
    switch (msg.type) {
      case 'VOTE_UPDATE':
        if (activeVote.value && activeVote.value.id === msg.vote_id) {
          activeVote.value.results = msg.results
          activeVote.value.voter_count = msg.voter_count
        }
        break
      case 'VOTE_CLOSED':
        if (activeVote.value && activeVote.value.id === msg.vote_id) {
          activeVote.value.status = 'closed'
          activeVote.value.results = msg.results
          clearTimer()
        }
        break
      case 'VOTER_JOINED':
        if (activeVote.value) {
          activeVote.value.connected_voters = msg.count
        }
        break
    }
  }

  function disconnectWebSocket() {
    ws.value?.close()
    ws.value = null
  }

  // Timer
  function startTimer(seconds) {
    timerRemaining.value = seconds
    clearTimer()
    timerInterval = setInterval(() => {
      if (timerRemaining.value > 0) {
        timerRemaining.value--
      } else {
        clearTimer()
      }
    }, 1000)
  }

  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // API Actions
  async function createVote(payload) {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    activeVote.value = data.vote
    if (data.vote.duration) startTimer(data.vote.duration)
    return data.vote
  }

  async function closeVote(voteId) {
    const res = await fetch(`/api/votes/${voteId}/close`, {
      method: 'POST',
      headers: auth.authHeaders()
    })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    activeVote.value = data.vote
    clearTimer()
    return data.vote
  }

  async function fetchActiveVote() {
    const res = await fetch('/api/votes/active', {
      headers: auth.authHeaders()
    })
    if (res.status === 404) {
      activeVote.value = null
      return null
    }
    if (!res.ok) throw new Error('Failed to fetch active vote')
    const data = await res.json()
    activeVote.value = data.vote
    if (data.vote.status === 'open' && data.vote.duration) {
      const elapsed = Math.floor((Date.now() - new Date(data.vote.started_at)) / 1000)
      const remaining = Math.max(0, data.vote.duration - elapsed)
      startTimer(remaining)
    }
    return data.vote
  }

  async function fetchHistory() {
    const res = await fetch('/api/votes/history', {
      headers: auth.authHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch history')
    const data = await res.json()
    history.value = data.votes
    return data.votes
  }

  async function fetchVoteById(id) {
    const res = await fetch(`/api/votes/${id}`, {
      headers: auth.authHeaders()
    })
    if (!res.ok) throw new Error('Vote not found')
    return (await res.json()).vote
  }

  return {
    activeVote, history, wsConnected, timerRemaining,
    hasActiveVote, voteStatus, totalVotes, participationRate,
    connectWebSocket, disconnectWebSocket,
    createVote, closeVote, fetchActiveVote, fetchHistory, fetchVoteById
  }
})
