<template>
  <div class="page">
    <div class="card">

      <h2>Register</h2>

      <input
        v-model="name"
        type="text"
        placeholder="Name"
      />

      <input
        v-model="surname"
        type="text"
        placeholder="Surname"
      />

      <input
        v-model="email"
        type="email"
        placeholder="Email"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
      />

      <button @click="register">
        Create account
      </button>

      <p v-if="error" class="error">
        {{ error }}
      </p>

    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const surname = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

const register = async () => {

  try {

    error.value = ''

    await axios.post(
      'http://localhost:3000/signup',
      {
        name: name.value,
        surname: surname.value,
        email: email.value,
        password: password.value,
      }
    )

    router.push('/')

  } catch (err) {

    console.error(err)

    error.value = 'Registration failed'
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

input {
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #eeeeee;
}

button {
  padding: 10px;
  border-radius: 8px;
  border: none;
}

.error {
  color: red;
}
</style>