<template>
  <div class="page">
    <div class="card">

      <h2>Register</h2>

      <input v-model="name" type="text" placeholder="Name" />
      <input v-model="surname" type="text" placeholder="Surname" />
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />

      <button @click="register">
        Create account
      </button>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const surname = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')

const getUsers = () => {
  return JSON.parse(localStorage.getItem('users') || '[]')
}

const saveUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users))
}

const register = () => {
  error.value = ''
  success.value = ''

  if (!name.value || !surname.value || !email.value || !password.value) {
    error.value = 'All fields are required'
    return
  }

  const users = getUsers()

  const exists = users.find(u => u.email === email.value)

  if (exists) {
    error.value = 'Email already exists'
    return
  }

  const newUser = {
    id: Date.now(),
    name: name.value,
    surname: surname.value,
    email: email.value,
    password: password.value
  }

  users.push(newUser)
  saveUsers(users)

  success.value = 'Account created successfully!'

  setTimeout(() => {
    router.push('/')
  }, 800)
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

.success {
  color: green;
}
</style>