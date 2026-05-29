import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVoteStore = defineStore('vote', () => {
  const vote = ref(null) // current vote object
  const results = ref({}) // live { Yes: n, No: n, Abstain: n }
  const timerLeft = ref(0)
  const wsConnected = ref(false)
  let ws = null
  let timerInterval = null

  const total = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))

  // ── WebSocket ──────────────────────────────────────────────
  function connect() {
    if (ws?.readyState === WebSocket.OPEN) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${proto}://${location.host}/ws`)
    ws.onopen = () => {
      wsConnected.value = true
    }
    ws.onclose = () => {
      wsConnected.value = false
      setTimeout(connect, 3000)
    }
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.type === 'VOTE_UPDATE' && vote.value?.id === msg.vote_id) {
        results.value = msg.results
      }
      if (msg.type === 'VOTE_CLOSED' && vote.value?.id === msg.vote_id) {
        results.value = msg.results
        vote.value.status = 'closed'
        stopTimer()
      }
    }
  }

  function disconnect() {
    ws?.close()
    ws = null
  }

  // ── Timer ──────────────────────────────────────────────────
  function startTimer(endsAt) {
    stopTimer()
    timerInterval = setInterval(() => {
      const left = Math.round((new Date(endsAt) - Date.now()) / 1000)
      if (left > 0) timerLeft.value = left
      else {
        timerLeft.value = 0
        stopTimer()
      }
    }, 500)
  }

  function stopTimer() {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // ── API ────────────────────────────────────────────────────
  async function createVote(title, duration) {
    const content = JSON.stringify({ title: title, duration: duration })

    const res = await fetch('http://localhost:3000/seances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    })

    // if (!res.ok) throw new Error((await res.json()).message)

    const data = await res.json()

    vote.value = data.vote
    results.value = { Yes: 0, No: 0, Abstain: 0 }
    if (duration) startTimer(duration)
    return data.vote
  }

  async function closeVote() {
    const res = await fetch(`http://localhost:3000/seances/close`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).message)
    const data = await res.json()
    vote.value = data.vote
    results.value = data.vote.results
    stopTimer()
    return data.vote
  }

  async function fetchActive() {
    const res = await fetch('http://localhost:3000/seances')
    if (res.status === 404) {
      vote.value = null
      return null
    }
    const data = await res.json()
    vote.value = data.vote
    results.value = data.vote.results ?? { Yes: 0, No: 0, Abstain: 0 }
    if (data.vote.status === 'open' && data.vote.duration) {
      const elapsed = Math.floor((Date.now() - new Date(data.vote.started_at)) / 1000)
      startTimer(Math.max(0, data.vote.duration - elapsed))
    }
    return data.vote
  }

  return {
    vote,
    results,
    timerLeft,
    wsConnected,
    total,
    connect,
    disconnect,
    createVote,
    closeVote,
    fetchActive,
  }
})
