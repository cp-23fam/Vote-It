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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

const getUsers = () => {
  return JSON.parse(localStorage.getItem('users') || '[]')
}

const login = () => {
  error.value = ''

  const users = getUsers()

  const user = users.find(
    u => u.email === email.value && u.password === password.value
  )

  if (!user) {
    error.value = 'Invalid email or password'
    return
  }

  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', 'fake-token-' + user.id)

  router.push('/waiting')
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
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.error {
  color: red;
}

a {
  color: blue;
}
</style>