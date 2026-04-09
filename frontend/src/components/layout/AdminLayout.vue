<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const sidebarLinks = [
  { icon: 'home',            label: 'Przeglądaj archiwum',    route: '/przegladaj',          exact: false },
  { icon: 'upload_file',     label: 'Dodaj zdjęcie',          route: '/dodaj-zdjecie',        exact: false },
  { icon: 'gavel',           label: 'Panel główny',            route: '/admin',                exact: true  },
  { icon: 'pending_actions', label: 'Moderacja zdjęć',        route: '/admin/moderacja',      exact: false },
  { icon: 'photo_library',   label: 'Wszystkie zdjęcia',      route: '/admin/zdjecia',        exact: false },
  { icon: 'folder',          label: 'Zarządzaj kategoriami',  route: '/admin/kategorie',      exact: false },
  { icon: 'people',          label: 'Zarządzaj użytkownikami',route: '/admin/uzytkownicy',    exact: false },
]
</script>

<template>
  <div class="admin-layout">
    <!-- ============================
         SIDEBAR (Desktop only)
         ============================ -->
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__profile">
        <div class="admin-layout__avatar">
          <span class="material-symbols-outlined">shield_person</span>
        </div>
        <div>
          <h2 class="admin-layout__name">Zarządzanie archiwum</h2>
          <p class="admin-layout__role">Starszy kurator</p>
        </div>
      </div>

      <button class="admin-layout__cta" @click="router.push({ name: 'upload-photo' })">
        <span class="material-symbols-outlined">add</span>
        Dodaj zdjęcie
      </button>

      <nav class="admin-layout__nav" aria-label="Menu administracyjne">
        <RouterLink
          v-for="link in sidebarLinks"
          :key="link.route"
          :to="link.route"
          class="admin-layout__link"
          :active-class="link.exact ? '' : 'admin-layout__link--active'"
          :exact-active-class="'admin-layout__link--active'"
        >
          <span class="material-symbols-outlined">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin-layout__sidebar-footer">
        <div class="admin-layout__user" v-if="authStore.user">
          <img
            v-if="authStore.user.avatarUrl"
            :src="authStore.user.avatarUrl"
            :alt="authStore.user.displayName"
            class="admin-layout__user-avatar"
          />
          <div v-else class="admin-layout__user-avatar admin-layout__user-avatar--placeholder">
            {{ authStore.user.displayName.charAt(0).toUpperCase() }}
          </div>
          <div class="admin-layout__user-info">
            <span class="admin-layout__user-name">{{ authStore.user.displayName }}</span>
            <span class="admin-layout__user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ============================
         MAIN CONTENT
         ============================ -->
    <main class="admin-layout__main">
      <slot />
    </main>

    <!-- ============================
         MOBILE BOTTOM NAV
         ============================ -->
    <nav class="admin-layout__mobile-nav" aria-label="Nawigacja mobilna admina">
      <RouterLink to="/admin" exact-active-class="admin-layout__mobile-item--active" class="admin-layout__mobile-item">
        <span class="material-symbols-outlined">gavel</span>
        <span>Panel</span>
      </RouterLink>
      <RouterLink to="/admin/moderacja" active-class="admin-layout__mobile-item--active" class="admin-layout__mobile-item">
        <span class="material-symbols-outlined">pending_actions</span>
        <span>Moderacja</span>
      </RouterLink>
      <RouterLink to="/admin/zdjecia" active-class="admin-layout__mobile-item--active" class="admin-layout__mobile-item">
        <span class="material-symbols-outlined">photo_library</span>
        <span>Zdjęcia</span>
      </RouterLink>
      <RouterLink to="/admin/uzytkownicy" active-class="admin-layout__mobile-item--active" class="admin-layout__mobile-item">
        <span class="material-symbols-outlined">people</span>
        <span>Użytkownicy</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* Root layout */
.admin-layout {
  display: flex;
  min-height: calc(100vh - 56px);
  background: var(--surface);
}

/* ===================== SIDEBAR ===================== */
.admin-layout__sidebar {
  display: none;
  flex-direction: column;
  width: 256px;
  height: calc(100vh - 56px);
  position: fixed;
  left: 0;
  top: 56px;
  padding: 16px;
  gap: 24px;
  background: var(--surface-variant);
  border-right: 1px solid var(--ghost-border);
  z-index: 50;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .admin-layout__sidebar {
    display: flex;
  }
}

.admin-layout__profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
}

.admin-layout__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: var(--on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-layout__name {
  font-family: var(--font-headline);
  font-size: var(--body-lg);
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.admin-layout__role {
  font-family: var(--font-label);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  margin: 0;
}

.admin-layout__cta {
  width: 100%;
  padding: 12px 16px;
  background: var(--secondary);
  color: var(--on-secondary);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--body-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity var(--transition-fast);
}

.admin-layout__cta:hover { opacity: 0.9; }

.admin-layout__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-layout__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: var(--body-sm);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--on-surface);
  opacity: 0.8;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.admin-layout__link:hover {
  background: var(--surface-container-low);
  opacity: 1;
}

.admin-layout__link--active {
  background: var(--surface);
  color: var(--primary);
  font-weight: 700;
  opacity: 1;
  box-shadow: var(--shadow-sm);
}

.admin-layout__link--active .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

.admin-layout__sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(190, 200, 201, 0.3);
}

.admin-layout__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
}

.admin-layout__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.admin-layout__user-avatar--placeholder {
  background: var(--primary);
  color: var(--on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--label-lg);
  font-weight: 700;
}

.admin-layout__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-layout__user-name {
  font-size: var(--body-sm);
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-layout__user-role {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--on-surface-variant);
}

/* ===================== MAIN ===================== */
.admin-layout__main {
  flex: 1;
  min-width: 0;
}

@media (min-width: 768px) {
  .admin-layout__main {
    margin-left: 256px;
  }
}

/* ===================== MOBILE BOTTOM NAV ===================== */
.admin-layout__mobile-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--surface-variant);
  border-top: 1px solid var(--ghost-border);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 768px) {
  .admin-layout__mobile-nav {
    display: none;
  }
}

.admin-layout__mobile-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  text-decoration: none;
  color: var(--on-surface-variant);
  font-family: var(--font-label);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color var(--transition-fast);
}

.admin-layout__mobile-item .material-symbols-outlined {
  font-size: 1.375rem;
}

.admin-layout__mobile-item--active {
  color: var(--primary);
}

.admin-layout__mobile-item--active .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}
</style>
