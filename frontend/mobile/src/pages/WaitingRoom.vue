<template>
  <div class="page">
    <div class="card">
      <h2>Waiting Room</h2>

      <p v-if="currentVote">
        A vote is in progress:<br />
        <strong>{{ currentVote.title }}</strong>
      </p>
      <p v-else>Awaiting a new vote.</p>

      <div class="status">
        <span :class="['dot', isConnected ? 'connected' : 'disconnected']" />
        {{ isConnected ? "Connected" : "Reconnecting..." }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useVoteSocket } from "../composables/useVoteSocket";

const router = useRouter();
const { currentVote, isConnected, onMessage } = useVoteSocket();

// Si un vote est déjà actif à l'arrivée (ROOM_STATE), aller sur /vote
onMessage((msg) => {
  if (msg.type === "ROOM_STATE" && msg.vote) {
    router.push("/vote");
  }
  if (msg.type === "VOTE_STARTED") {
    router.push("/vote");
  }
});
</script>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #d9d9d9;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 300px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.connected {
  background: #22c55e;
}

.disconnected {
  background: #ef4444;
}
</style>
