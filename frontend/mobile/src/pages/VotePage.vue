<template>
  <div class="page">
    <div class="card">
      <h2>Current vote</h2>

      <button class="yes" @click="success">
        Yes
      </button>

      <button class="no" @click="success">
        No
      </button>

      <button class="abstention" @click="success">
        Abstention
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const success = () => {
  router.push('/success')
}

const tooLate = () => {
  router.push('/toolate')
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

.late {
  background: gray;
}
</style>