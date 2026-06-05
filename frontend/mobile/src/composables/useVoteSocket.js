// src/composables/useVoteSocket.js
import { ref, onUnmounted } from "vue";

const WS_URL = "ws://localhost:3000/ws";

let socket = null;
let refCount = 0;

// État global partagé entre tous les composants
const currentVote = ref(null); // { id, title } | null
const isConnected = ref(false);

const listeners = new Set();

function connect() {
  if (socket && socket.readyState <= WebSocket.OPEN) return;

  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    isConnected.value = true;
    socket.send(JSON.stringify({ type: "IDENTIFY", role: "mobile" }));
  });

  socket.addEventListener("close", () => {
    isConnected.value = false;
    // Reconnexion automatique après 3s
    setTimeout(connect, 3000);
  });

  socket.addEventListener("error", () => {
    socket.close();
  });

  socket.addEventListener("message", (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    // Mettre à jour l'état global
    if (msg.type === "ROOM_STATE") {
      currentVote.value = msg.vote; // { id, title } | null
    } else if (msg.type === "VOTE_STARTED") {
      currentVote.value = { id: msg.vote_id, title: msg.title };
    } else if (msg.type === "VOTE_CLOSED") {
      currentVote.value = null;
    }

    // Notifier tous les abonnés
    listeners.forEach((fn) => fn(msg));
  });
}

/**
 * Composable à utiliser dans chaque page.
 * @returns {{ currentVote, isConnected, onMessage, disconnect }}
 */
export function useVoteSocket() {
  refCount++;
  connect();

  function onMessage(fn) {
    listeners.add(fn);
    onUnmounted(() => listeners.delete(fn));
  }

  onUnmounted(() => {
    refCount--;
    // Ne ferme pas le socket — il est partagé et se reconnecte tout seul
  });

  return { currentVote, isConnected, onMessage };
}
