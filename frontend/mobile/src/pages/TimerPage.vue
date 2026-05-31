<template>
  <div class="page">
    <div class="card">
      <h2>Vote starting...</h2>

      <div class="timer">
        10
      </div>

      <button @click="goToVote">
        Go vote
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToVote = () => {
  router.push('/vote')
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
  text-align: center;
}

.timer {
  font-size: 60px;
  margin: 20px 0;
}
</style>