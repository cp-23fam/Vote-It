<template>
  <div class="page">
    <div class="card">
      <h2>Congratulations!</h2>

      <p>Your vote has been recorded.</p>

      <button @click="backToWaiting">
        Back
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const backToWaiting = () => {
  router.push('/waiting')
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

button {
  margin-top: 20px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
}
</style>