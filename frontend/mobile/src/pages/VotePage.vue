<template>
  <div class="page">
    <div class="card">
      <h2>{{ currentVote?.title ?? "Vote en cours" }}</h2>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="yes" :disabled="loading || voted" @click="castVote('oui')">
        {{ voted === "oui" ? "✓ Yes" : "Yes" }}
      </button>

      <button class="no" :disabled="loading || voted" @click="castVote('non')">
        {{ voted === "non" ? "✓ No" : "No" }}
      </button>

      <button
        class="abstention"
        :disabled="loading || voted"
        @click="castVote('neutre')"
      >
        {{ voted === "neutre" ? "✓ Abstention" : "Abstention" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useVoteSocket } from "../composables/useVoteSocket";

const router = useRouter();
const { currentVote, onMessage } = useVoteSocket();

const loading = ref(false);
const voted = ref(null); // null | 'oui' | 'non' | 'neutre'
const error = ref("");

onMessage((msg) => {
  if (msg.type === "VOTE_CLOSED") {
    // La séance est terminée, retour en salle d'attente
    router.push("/waiting");
  }
});

async function castVote(choice) {
  if (loading.value || voted.value) return;

  loading.value = true;
  error.value = "";

  try {
    await axios.post(
      "http://localhost:3000/sieges/vote",
      { vote: choice },
      { withCredentials: true }, // Envoie le cookie Authorization
    );
    voted.value = choice;
    // Redirection vers la page de confirmation
    router.push("/success");
  } catch (err) {
    if (err.response?.status === 404) {
      // L'utilisateur n'a pas de siège dans cette séance
      error.value = "You don't have a seat in this session.";
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      // Token expiré → retour au login
      router.push("/");
    } else {
      error.value = "Failed to submit vote. Please try again.";
    }
  } finally {
    loading.value = false;
  }
}
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
  display: flex;
  flex-direction: column;
  gap: 15px;
}

button {
  padding: 15px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yes {
  background: green;
}

.no {
  background: red;
}

.abstention {
  background: blue;
}

.error {
  color: red;
  font-size: 14px;
  margin: 0;
}
</style>
