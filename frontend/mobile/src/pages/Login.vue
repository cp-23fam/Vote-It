<template>
  <div class="page">
    <div class="card">

      <h2>Login</h2>

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

      <button @click="login">
        Login
      </button>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <p>
        Don't have an account?

        <a href="#" @click.prevent="goToRegister">
          Sign up
        </a>
      </p>

    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  try {
    error.value = ''
    const response = await axios.post(
      'http://localhost:3000/user/login',
      {
        email: email.value,
        password: password.value,
      }
    )
    console.log(response.data)

    // Stockage du token dans un cookie Authorization
    const token = response.data.token
    const expires = new Date()
    expires.setDate(expires.getDate() + 1) // Expiration dans 7 jours
    document.cookie = `Authorization=Bearer ${token}; expires=${expires.toUTCString()}; path=/; domain=localhost;`

    localStorage.setItem(
      'user',
      JSON.stringify(response.data.utilisateur)
    )
    router.push('/waiting')
  } catch (err) {
    console.error(err)
    error.value = 'Invalid email or password'
  }
}

const goToRegister = () => {
  router.push('/register')
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
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

a {
  color: blue;
}

.error {
  color: red;
}
</style>