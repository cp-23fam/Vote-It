import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVoteStore = defineStore('vote', () => {
  // ── État ────────────────────────────────────────────────────
  const vote = ref(null) // séance en cours { id, question, fin_seance }
  const results = ref({ oui: 0, non: 0, neutre: 0 })
  const seats = ref({}) // { "A1": { name, vote } }
  const timerLeft = ref(0)
  const wsConnected = ref(false)

  let ws = null
  let timerInterval = null
  let reconnectTimeout = null

  // ── Computed ─────────────────────────────────────────────────
  const total = computed(() => Object.values(results.value).reduce((a, b) => a + b, 0))

  const hasActiveVote = computed(() => vote.value !== null)

  // ── Timer ────────────────────────────────────────────────────
  function startTimer(finSeance) {
    stopTimer()
    timerInterval = setInterval(() => {
      const left = Math.round((new Date(finSeance) - Date.now()) / 1000)
      if (left > 0) {
        timerLeft.value = left
      } else {
        timerLeft.value = 0
        stopTimer()
      }
    }, 500)
  }

  function stopTimer() {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // ── WebSocket ─────────────────────────────────────────────────
  function connect() {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    // En dev Vite proxifie /ws → localhost:3000/ws
    ws = new WebSocket(`${proto}://localhost:3000/ws`)

    ws.onopen = () => {
      wsConnected.value = true
      ws.send(JSON.stringify({ type: 'IDENTIFY', role: 'president' }))
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    }

    ws.onclose = () => {
      wsConnected.value = false
      reconnectTimeout = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws?.close()
    }

    ws.onmessage = ({ data }) => {
      try {
        handleMessage(JSON.parse(data))
      } catch (_) { }
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    ws?.close()
    ws = null
    wsConnected.value = false
  }

  // ── Gestionnaire de messages WS ───────────────────────────────
  function handleMessage(msg) {
    switch (msg.type) {
      // Le backend envoie l'état complet à la connexion
      case 'ROOM_STATE':
        if (msg.vote) {
          vote.value = { id: msg.vote.id, question: msg.vote.title }
          if (msg.vote.fin_seance) startTimer(msg.vote.fin_seance)
        } else {
          vote.value = null
          stopTimer()
        }
        seats.value = msg.seats ?? {}
        results.value = { oui: 0, non: 0, neutre: 0, ...msg.results }
        break

      // Un nouveau vote vient de démarrer
      case 'VOTE_STARTED':
        vote.value = { id: msg.vote_id, question: msg.title }
        results.value = { oui: 0, non: 0, neutre: 0 }
        seats.value = {}
        timerLeft.value = 0
        if (msg.fin_seance) startTimer(msg.fin_seance)
        break

      // Un participant vient de s'asseoir
      case 'SEAT_JOINED':
        seats.value = {
          ...seats.value,
          [msg.seat_id]: { name: msg.name, vote: null },
        }
        break

      // Un vote a été posé
      case 'SEAT_VOTED':
        if (seats.value[msg.seat_id]) {
          seats.value[msg.seat_id] = {
            ...seats.value[msg.seat_id],
            vote: msg.vote,
          }
        }
        results.value = { oui: 0, non: 0, neutre: 0, ...msg.results }
        break

      // Vote fermé
      case 'VOTE_CLOSED':
        results.value = { oui: 0, non: 0, neutre: 0, ...msg.results }
        if (vote.value) vote.value = { ...vote.value, closed: true }
        stopTimer()
        break
    }
  }

  // ── API REST ──────────────────────────────────────────────────

  /** Créer une nouvelle séance. Les mises à jour arrivent via WS. */
  async function createVote(title, duration) {
    const res = await fetch('http://localhost:3000/seances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, duration }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Erreur lors de la création')
    }

    // Le WS va recevoir VOTE_STARTED et mettre à jour l'état.
    // On retourne quand même les données pour la navigation.
    const data = await res.json()
    return data
  }

  /** Fermer la séance en cours. */
  async function closeVote() {
    const res = await fetch('http://localhost:3000/seances/close')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Erreur lors de la fermeture')
    }
    // Le WS va recevoir VOTE_CLOSED
    return res.json()
  }

  /** Récupérer l'état initial (utile si la connexion WS est lente). */
  async function fetchActive() {
    const res = await fetch('http://localhost:3000/seances')
    if (res.status === 404) {
      vote.value = null
      return null
    }
    if (!res.ok) throw new Error('Erreur réseau')
    const data = await res.json()
    // Pré-remplir uniquement si le WS n'a pas encore envoyé ROOM_STATE
    if (!vote.value) {
      vote.value = { id: data.id, question: data.question }
      if (data.fin_seance) startTimer(data.fin_seance)
    }
    return data
  }

  return {
    vote,
    results,
    seats,
    timerLeft,
    wsConnected,
    total,
    hasActiveVote,
    connect,
    disconnect,
    createVote,
    closeVote,
    fetchActive,
  }
})
