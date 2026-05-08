import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const OPTIONS = ['Yes', 'No', 'Abstain']

export const useVoteStore = defineStore('vote', () => {
  const activeVote = ref(null)
  const history = ref([])
  const ws = ref(null)
  const wsConnected = ref(false)
  const timerRemaining = ref(0)
  let timerInterval = null

  const hasActiveVote = computed(() => !!activeVote.value)

  const totalVotes = computed(() => {
    if (!activeVote.value?.results) return 0
    return Object.values(activeVote.value.results).reduce((a, b) => a + b, 0)
  })

  // WebSocket
  function connectWebSocket() {
    if (ws.value?.readyState === WebSocket.OPEN) return
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    ws.value = new WebSocket(`${protocol}://${location.host}/ws`)

    ws.value.onopen = () => {
      wsConnected.value = true
    }
    ws.value.onclose = () => {
      wsConnected.value = false
      setTimeout(connectWebSocket, 3000)
    }
    ws.value.onerror = () => {
      wsConnected.value = false
    }
    ws.value.onmessage = (e) => handleWsMessage(JSON.parse(e.data))
  }

  function handleWsMessage(msg) {
    if (msg.type === 'VOTE_UPDATE' && activeVote.value?.id === msg.vote_id) {
      activeVote.value.results = msg.results
    }
    if (msg.type === 'VOTE_CLOSED' && activeVote.value?.id === msg.vote_id) {
      activeVote.value.status = 'closed'
      activeVote.value.results = msg.results
      clearTimer()
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
      if (timerRemaining.value > 0) timerRemaining.value--
      else clearTimer()
    }, 1000)
  }

  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // API
  async function createVote(payload) {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, options: OPTIONS }),
    })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    activeVote.value = data.vote
    if (data.vote.duration) startTimer(data.vote.duration)
    return data.vote
  }

  async function closeVote(voteId) {
    const res = await fetch(`/api/votes/${voteId}/close`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    activeVote.value = data.vote
    clearTimer()
    return data.vote
  }

  async function fetchActiveVote() {
    const res = await fetch('/api/votes/active')
    if (res.status === 404) {
      activeVote.value = null
      return null
    }
    if (!res.ok) throw new Error('Failed to fetch active vote')
    const data = await res.json()
    activeVote.value = data.vote
    if (data.vote.status === 'open' && data.vote.duration) {
      const elapsed = Math.floor((Date.now() - new Date(data.vote.started_at)) / 1000)
      startTimer(Math.max(0, data.vote.duration - elapsed))
    }
    return data.vote
  }

  async function fetchHistory() {
    const res = await fetch('/api/votes/history')
    if (!res.ok) throw new Error('Failed to fetch history')
    const data = await res.json()
    history.value = data.votes
    return data.votes
  }

  async function fetchVoteById(id) {
    const res = await fetch(`/api/votes/${id}`)
    if (!res.ok) throw new Error('Vote not found')
    return (await res.json()).vote
  }

  return {
    activeVote,
    history,
    wsConnected,
    timerRemaining,
    hasActiveVote,
    totalVotes,
    OPTIONS,
    connectWebSocket,
    disconnectWebSocket,
    createVote,
    closeVote,
    fetchActiveVote,
    fetchHistory,
    fetchVoteById,
  }
})
