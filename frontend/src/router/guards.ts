import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export function setupGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    // Wait for initial auth check
    if (!authStore.isInitialized) {
      await authStore.initialize()
    }

    // Update page title
    const title = to.meta.title
      ? `${to.meta.title} | Cyfrowe Archiwum`
      : 'Cyfrowe Archiwum'
    document.title = title

    // Guest-only (login page) — redirect if already authenticated
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: 'landing' }
    }

    // Auth required
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // Admin required
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return { name: 'landing' }
    }
  })
}
