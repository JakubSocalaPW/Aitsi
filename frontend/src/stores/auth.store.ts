import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCreator = computed(() => user.value?.role === 'creator' || isAdmin.value)
  const displayName = computed(() => user.value?.displayName ?? '')

  async function initialize() {
    const storedToken = localStorage.getItem('cas_token')
    if (storedToken) {
      token.value = storedToken
      try {
        await fetchMe()
      } catch {
        logout()
      }
    }
    isInitialized.value = true
  }

  async function fetchMe() {
    const data = await authApi.me()
    user.value = data
  }

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('cas_token', newToken)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('cas_token')
  }

  return {
    user, token, isLoading, isInitialized,
    isAuthenticated, isAdmin, isCreator, displayName,
    initialize, setAuth, logout, fetchMe
  }
})
