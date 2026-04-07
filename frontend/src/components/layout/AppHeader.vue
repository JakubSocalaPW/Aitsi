<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppNav from '@/components/layout/AppNav.vue'
import MobileMenu from '@/components/layout/MobileMenu.vue'
import SettingsDropdown from '@/components/common/SettingsDropdown.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const menuOpen = ref(false)
const searchQuery = ref('')

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'browse', query: { q: searchQuery.value.trim() } })
    searchQuery.value = ''
  }
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'landing' })
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <router-link to="/" class="header__brand">
        Cyfrowe Archiwum
      </router-link>

      <AppNav class="header__nav" />

      <form class="header__search" role="search" @submit.prevent="handleSearch">
        <span class="material-symbols-outlined header__search-icon">search</span>
        <input
          v-model="searchQuery"
          type="search"
          class="header__search-input"
          :placeholder="t('search.placeholder')"
        />
      </form>

      <div class="header__actions">
        <SettingsDropdown />

        <template v-if="authStore.isAuthenticated">
          <button class="header__link" @click="handleLogout">
            {{ t('nav.logout') }}
          </button>
        </template>
        <template v-else>
          <router-link to="/logowanie" class="header__link">
            {{ t('nav.login') }}
          </router-link>
        </template>
      </div>

      <button
        class="header__hamburger"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">Menu</span>
        <span class="header__hamburger-icon" aria-hidden="true" />
      </button>
    </div>

    <MobileMenu v-if="menuOpen" @close="menuOpen = false" />
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--ghost-border);
}

.header__inner {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: 16px;
  display: flex;
  align-items: center;
  height: 56px;
}

@media (min-width: 768px) {
  .header__inner {
    padding-inline: 24px;
  }
}

.header__brand {
  font-family: var(--font-headline);
  font-size: var(--headline-sm);
  color: var(--on-surface);
  text-decoration: none;
  flex-shrink: 0;
  line-height: 1;
}

.header__brand:hover {
  color: var(--on-surface);
  opacity: 0.85;
}

.header__nav {
  display: none;
  margin-left: 32px;
}

.header__actions {
  display: none;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.header__user {
  font-family: var(--font-label);
  font-size: var(--label-lg);
  color: var(--on-surface-variant);
}

.header__link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--primary);
  color: var(--on-primary);
  font-family: var(--font-label);
  font-size: var(--label-lg);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.header__link:hover {
  opacity: 0.9;
}

.header__link:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* Hamburger */
.header__hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.header__hamburger:hover {
  background: var(--surface-container);
}

.header__hamburger:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.header__hamburger-icon,
.header__hamburger-icon::before,
.header__hamburger-icon::after {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--on-surface);
  border-radius: 1px;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.header__hamburger-icon {
  position: relative;
}

.header__hamburger-icon::before,
.header__hamburger-icon::after {
  content: '';
  position: absolute;
  left: 0;
}

.header__hamburger-icon::before {
  top: -6px;
}

.header__hamburger-icon::after {
  top: 6px;
}

/* Search */
.header__search {
  display: none;
  align-items: center;
  position: relative;
  margin-left: auto;
  margin-right: 16px;
}

.header__search-icon {
  position: absolute;
  left: 10px;
  font-size: 18px;
  color: var(--on-surface-variant);
  pointer-events: none;
}

.header__search-input {
  width: 200px;
  padding: 6px 12px 6px 34px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--surface-container);
  font-family: var(--font-body);
  font-size: var(--body-sm);
  color: var(--on-surface);
  outline: none;
  transition: width var(--transition-fast), box-shadow var(--transition-fast);
}

.header__search-input::placeholder {
  color: var(--on-surface-variant);
  opacity: 0.6;
}

.header__search-input:focus {
  width: 280px;
  box-shadow: var(--focus-ring);
}

/* Hide webkit search cancel button for consistent styling */
.header__search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

@media (min-width: 768px) {
  .header__nav {
    display: block;
  }

  .header__search {
    display: flex;
  }

  .header__actions {
    display: flex;
  }

  .header__hamburger {
    display: none;
  }
}
</style>
