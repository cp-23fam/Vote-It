import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVoteStore = defineStore('vote', () => {
  const vote = ref(null)
  const results = ref({})
  const timerLeft = ref(0)
  const wsConnected = ref(true)
  let timerInterval = null
  let voteInterval = null

  const total = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))

  function connect() {}
  function disconnect() {}

  function startTimer(seconds) {
    timerLeft.value = seconds
    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timerLeft.value > 0) timerLeft.value--
      else clearInterval(timerInterval)
    }, 1000)
  }

  async function createVote(title, duration) {
    vote.value = {
      id: 'mock-001',
      title,
      duration,
      status: 'open',
      started_at: new Date().toISOString(),
    }
    results.value = { Yes: 0, No: 0, Abstain: 0 }
    if (duration) startTimer(duration)

    // Simulate votes trickling in
    voteInterval = setInterval(() => {
      if (vote.value?.status !== 'open') {
        clearInterval(voteInterval)
        return
      }
      const pick = ['Yes', 'No', 'Abstain'][Math.floor(Math.random() * 3)]
      results.value[pick]++
    }, 800)

    return vote.value
  }

  async function closeVote() {
    clearInterval(voteInterval)
    clearInterval(timerInterval)
    vote.value.status = 'closed'
    vote.value.closed_at = new Date().toISOString()
    return vote.value
  }

  async function fetchActive() {
    return null
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
