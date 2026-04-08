<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { adminApi } from '@/api/admin.api'
import { photosApi } from '@/api/photos.api'
import type { PhotoSummary } from '@/types'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const stats = reactive({
  moderationQueue: 0,
  totalPhotos: 0,
  activeUsers: 0,
  newToday: 0,
})

const recentPhotos = ref<PhotoSummary[]>([])
const loadingPhotos = ref(true)
const deleteTarget = ref<PhotoSummary | null>(null)
const deleting = ref(false)

async function confirmDelete(photo: PhotoSummary) {
  deleteTarget.value = photo
}

async function executeDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await photosApi.delete(deleteTarget.value.id)
    recentPhotos.value = recentPhotos.value.filter(p => p.id !== deleteTarget.value!.id)
    stats.totalPhotos--
    toastStore.show('Zdjęcie zostało usunięte', 'success')
  } catch {
    toastStore.show('Nie udało się usunąć zdjęcia', 'error')
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

onMounted(async () => {
  try {
    const data = await adminApi.getStats()
    stats.totalPhotos = data.totalPhotos
    stats.activeUsers = data.totalUsers
  } catch {
    // Stats fail silently
  }

  try {
    const res = await photosApi.search({ pageSize: 5, sortBy: 'createdAt', sortDir: 'desc' })
    recentPhotos.value = res.items
    stats.moderationQueue = res.totalCount
  } catch {
    // Photos fail silently
  } finally {
    loadingPhotos.value = false
  }
})


const moderator = reactive({
  get name() { return authStore.user?.displayName ?? 'Admin' },
  get avatarUrl() { return authStore.user?.avatarUrl ?? '' },
  get initials() { return (authStore.user?.displayName ?? 'A').charAt(0).toUpperCase() },
})

const sidebarLinks = [
  { icon: 'home', label: t('adminDashboard.sideHome'), active: false, route: '/przegladaj' },
  { icon: 'account_balance', label: t('adminDashboard.sideArchive'), active: false, route: '/przegladaj' },
  { icon: 'upload_file', label: t('adminDashboard.sideUploads'), active: false, route: '/moje-zdjecia' },
  { icon: 'gavel', label: t('adminDashboard.sideModeration'), active: true, route: '/admin' },
  { icon: 'gavel', label: 'Zarządzaj kategoriami', active: false, route: '/admin/kategorie' },
  { icon: 'gavel', label: 'Zarządzaj użytkownikami', active: false, route: '/admin/uzytkownicy' },

]

</script>

<template>
  <div class="admin">
    <!-- ============================
         SIDEBAR (Desktop only)
         ============================ -->
    <aside class="admin__sidebar">
      <div class="admin__sidebar-profile">
        <div class="admin__sidebar-avatar">
          <span class="material-symbols-outlined">shield_person</span>
        </div>
        <div>
          <h2 class="admin__sidebar-name">{{ t('adminDashboard.archiveManager') }}</h2>
          <p class="admin__sidebar-role">{{ t('adminDashboard.seniorCurator') }}</p>
        </div>
      </div>

      <button class="admin__sidebar-cta" @click="router.push({ name: 'upload-photo' })">
        <span class="material-symbols-outlined">add</span>
        {{ t('adminDashboard.newCollection') }}
      </button>

      <nav class="admin__sidebar-nav">
        <RouterLink
          v-for="link in sidebarLinks"
          :key="link.label"
          :to="link.route"
          class="admin__sidebar-link"
          :class="{ 'admin__sidebar-link--active': link.active }"
        >
          <span
            class="material-symbols-outlined"
            :style="link.active ? `font-variation-settings: 'FILL' 1` : ''"
          >{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin__sidebar-footer">
        <a href="#" class="admin__sidebar-link" @click.prevent>
          <span class="material-symbols-outlined">help</span>
          <span>{{ t('adminDashboard.helpCenter') }}</span>
        </a>
      </div>
    </aside>

    <!-- ============================
         MAIN CONTENT
         ============================ -->
    <main class="admin__main">
      <!-- Dashboard Canvas -->
      <div class="admin__canvas">
        <!-- ============================
             STATS BENTO GRID
             ============================ -->
        <section class="admin__stats">
          <div class="admin__stat admin__stat--wide">
            <div>
              <span class="admin__stat-label">{{ t('adminDashboard.moderationQueue') }}</span>
              <h3 class="admin__stat-value admin__stat-value--primary">{{ stats.moderationQueue }}</h3>
              <p class="admin__stat-desc">{{ t('adminDashboard.pendingReview') }}</p>
            </div>
            <div class="admin__stat-badge admin__stat-badge--error">
              +{{ stats.newToday }} {{ t('adminDashboard.today') }}
            </div>
          </div>

          <div class="admin__stat admin__stat--primary">
            <span class="admin__stat-label">{{ t('adminDashboard.totalPhotos') }}</span>
            <h3 class="admin__stat-value">{{ stats.totalPhotos.toLocaleString('pl-PL') }}</h3>
            <div class="admin__stat-footer">
              <span class="material-symbols-outlined admin__stat-icon">photo_library</span>
              <span>{{ t('adminDashboard.liveArchive') }}</span>
            </div>
          </div>

          <div class="admin__stat admin__stat--secondary">
            <span class="admin__stat-label">{{ t('adminDashboard.activeUsers') }}</span>
            <h3 class="admin__stat-value">{{ stats.activeUsers.toLocaleString('pl-PL') }}</h3>
            <div class="admin__stat-footer">
              <span class="material-symbols-outlined admin__stat-icon">group</span>
              <span>{{ t('adminDashboard.past24h') }}</span>
            </div>
          </div>
        </section>

        <!-- ============================
             MAIN GRID: Moderation + Audit
             ============================ -->
        <div class="admin__grid">
          <!-- Moderation List -->
          <div class="admin__moderation">
            <div class="admin__moderation-header">
              <h2>{{ t('adminDashboard.reportsForModeration') }}</h2>
              <div class="admin__moderation-actions">
                <RouterLink :to="{ name: 'admin-users' }" class="admin__action-btn">{{ t('adminDashboard.manageUsers') }}</RouterLink>
                <RouterLink :to="{ name: 'admin-categories' }" class="admin__action-btn">Zarządzaj kategoriami</RouterLink>
              </div>
            </div>

            <!-- Loading state -->
            <div v-if="loadingPhotos" class="admin__moderation-empty">
              <p>Ładowanie...</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="recentPhotos.length === 0" class="admin__moderation-empty">
              <span class="material-symbols-outlined admin__moderation-empty-icon">check_circle</span>
              <p>Brak zdjęć do moderacji</p>
            </div>

            <!-- Photo list -->
            <div v-else class="admin__moderation-list">
              <div v-for="p in recentPhotos" :key="p.id" class="admin__mod-item">
                <div class="admin__mod-thumb">
                  <img :src="p.thumbnailUrl" :alt="p.title" />
                </div>
                <div class="admin__mod-content">
                  <div class="admin__mod-top">
                    <div>
                      <h3 class="admin__mod-title">{{ p.title }}</h3>
                      <p class="admin__mod-meta">
                        <span class="admin__mod-user">{{ p.author.displayName }}</span>
                        · {{ new Date(p.createdAt).toLocaleDateString('pl-PL') }}
                      </p>
                    </div>
                  </div>
                  <div class="admin__mod-actions" style="opacity: 1;">
                    <RouterLink :to="{ name: 'photo-detail', params: { id: p.id } }" class="admin__mod-action admin__mod-action--primary">
                      <span class="material-symbols-outlined">visibility</span>
                      Podgląd
                    </RouterLink>
                    <RouterLink :to="`/edytuj-zdjecie/${p.id}`" class="admin__mod-action admin__mod-action--secondary">
                      <span class="material-symbols-outlined">edit</span>
                      Edytuj
                    </RouterLink>
                    <button class="admin__mod-action admin__mod-action--error" @click="confirmDelete(p)">
                      <span class="material-symbols-outlined">delete</span>
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Log + Moderator Card -->
          <div class="admin__aside">
            <!-- <h2 class="admin__aside-title">{{ t('adminDashboard.recentActions') }}</h2>

            <div class="admin__audit">
              <div class="admin__audit-empty">
                <span class="material-symbols-outlined">history</span>
                <p>Brak ostatnich akcji</p>
              </div>
            </div> -->

            <!-- Moderator Card -->
            <div class="admin__moderator">
              <div class="admin__moderator-profile">
                <img v-if="moderator.avatarUrl" :src="moderator.avatarUrl" :alt="moderator.name" class="admin__moderator-avatar" />
                <div v-else class="admin__moderator-avatar admin__moderator-avatar--placeholder">{{ moderator.initials }}</div>
                <div>
                  <h4 class="admin__moderator-name">{{ moderator.name }}</h4>
                  <p class="admin__moderator-session">{{ t('adminDashboard.activeSession') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="admin__footer">
        <p>{{ t('adminDashboard.copyrightAdmin') }}</p>
        <div class="admin__footer-links">
          <a href="#">{{ t('adminDashboard.systemStatus') }}</a>
          <a href="#">{{ t('adminDashboard.securityPolicy') }}</a>
        </div>
      </footer>
    </main>

    <!-- ============================
         DELETE CONFIRM DIALOG
         ============================ -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="dialog-overlay"
        @click.self="deleteTarget = null"
      >
        <div class="dialog" role="alertdialog" aria-modal="true">
          <h3 class="dialog__title">Potwierdź usunięcie</h3>
          <p class="dialog__text">Czy na pewno chcesz usunąć zdjęcie „{{ deleteTarget.title }}"? Tej operacji nie można cofnąć.</p>
          <div class="dialog__actions">
            <button class="dialog__btn dialog__btn--cancel" @click="deleteTarget = null" :disabled="deleting">Anuluj</button>
            <button class="dialog__btn dialog__btn--danger" @click="executeDelete()" :disabled="deleting">
              {{ deleting ? 'Usuwanie...' : 'Usuń' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================
         MOBILE BOTTOM NAV
         ============================ -->
    <nav class="admin__mobile-nav" aria-label="Nawigacja mobilna admina">
      <RouterLink to="/przegladaj" class="admin__mobile-nav-item">
        <span class="material-symbols-outlined">search</span>
        <span class="admin__mobile-nav-label">Przeglądaj</span>
      </RouterLink>
      <RouterLink to="/mapa" class="admin__mobile-nav-item">
        <span class="material-symbols-outlined">map</span>
        <span class="admin__mobile-nav-label">Mapa</span>
      </RouterLink>
      <RouterLink to="/dodaj-zdjecie" class="admin__mobile-nav-item">
        <span class="material-symbols-outlined">add_a_photo</span>
        <span class="admin__mobile-nav-label">Dodaj</span>
      </RouterLink>
      <RouterLink to="/moje-zdjecia" class="admin__mobile-nav-item">
        <span class="material-symbols-outlined">person</span>
        <span class="admin__mobile-nav-label">Profil</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* ==========================================================================
   ADMIN DASHBOARD — Moderation Panel
   ========================================================================== */

.admin {
  display: flex;
  min-height: calc(100vh - 56px);
  background: var(--surface);
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */

.admin__sidebar {
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
  .admin__sidebar {
    display: flex;
  }
}

.admin__sidebar-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
}

.admin__sidebar-avatar {
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

.admin__sidebar-name {
  font-family: var(--font-headline);
  font-size: var(--body-lg);
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.admin__sidebar-role {
  font-family: var(--font-label);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  margin: 0;
}

.admin__sidebar-cta {
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

.admin__sidebar-cta:hover {
  opacity: 0.9;
}

.admin__sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin__sidebar-link {
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

.admin__sidebar-link:hover {
  background: var(--surface-container-low);
  opacity: 1;
}

.admin__sidebar-link--active {
  background: var(--surface);
  color: var(--primary);
  font-weight: 700;
  opacity: 1;
  box-shadow: var(--shadow-sm);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.admin__sidebar-footer {
  padding-top: 24px;
  border-top: 1px solid rgba(190, 200, 201, 0.3);
}

/* ==========================================================================
   MAIN
   ========================================================================== */

.admin__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

@media (min-width: 768px) {
  .admin__main {
    margin-left: 256px;
  }
}

/* ==========================================================================
   CANVAS
   ========================================================================== */

.admin__canvas {
  padding: 32px;
  max-width: var(--container-max);
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

@media (max-width: 768px) {
  .admin__canvas {
    padding: 16px;
    gap: 24px;
  }
}

/* ==========================================================================
   STATS BENTO GRID
   ========================================================================== */

.admin__stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .admin__stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

.admin__stat {
  padding: 24px;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.admin__stat--wide {
  background: var(--surface-container-lowest);
  border: 1px solid rgba(190, 200, 201, 0.1);
}

@media (min-width: 768px) {
  .admin__stat--wide {
    grid-column: span 2;
  }
}

.admin__stat--primary {
  background: var(--primary);
  color: var(--on-primary);
  border: 1px solid var(--primary-container);
}

.admin__stat--secondary {
  background: var(--secondary);
  color: var(--on-secondary);
  border: 1px solid var(--secondary-container);
}

.admin__stat-label {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.admin__stat--wide .admin__stat-label {
  color: var(--on-surface-variant);
}

.admin__stat--primary .admin__stat-label,
.admin__stat--secondary .admin__stat-label {
  opacity: 0.8;
}

.admin__stat-value {
  font-family: var(--font-headline);
  font-size: clamp(1.875rem, 3vw, 2.25rem);
  font-weight: 700;
  margin-top: 8px;
}

.admin__stat-value--primary {
  color: var(--primary);
}

.admin__stat-desc {
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  margin: 4px 0 0;
}

.admin__stat-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  margin-top: 16px;
}

.admin__stat-badge--error {
  background: var(--error-container);
  color: var(--on-error-container);
}

.admin__stat-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 32px;
}

.admin__stat-icon {
  font-size: 2.5rem;
  opacity: 0.2;
}

.admin__stat-footer span:last-child {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  opacity: 0.7;
}

/* ==========================================================================
   MAIN GRID
   ========================================================================== */

.admin__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}

@media (min-width: 1280px) {
  .admin__grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* ==========================================================================
   MODERATION LIST
   ========================================================================== */

.admin__moderation {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin__moderation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.admin__moderation-header h2 {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  font-weight: 700;
  margin: 0;
  color: var(--on-surface);
}

.admin__moderation-actions {
  display: flex;
  gap: 8px;
}

.admin__action-btn {
  padding: 8px 16px;
  background: var(--surface-container-high);
  color: var(--on-surface-variant);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-size: var(--body-sm);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
}

.admin__action-btn:hover {
  background: var(--surface-dim);
}

.admin__moderation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin__mod-item {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  background: var(--surface-container-lowest);
  padding: 16px;
  border-radius: var(--radius-xl);
  transition: background var(--transition-fast);
}

.admin__mod-item:hover {
  background: #fff;
}

@media (max-width: 640px) {
  .admin__mod-item {
    flex-direction: column;
  }
}

.admin__mod-thumb {
  width: 128px;
  height: 128px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-container);
}

@media (max-width: 640px) {
  .admin__mod-thumb {
    width: 100%;
    height: 200px;
  }
}

.admin__mod-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin__mod-thumb-grayscale {
  filter: grayscale(100%);
}

.admin__mod-content {
  flex: 1;
  min-width: 0;
}

.admin__mod-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.admin__mod-title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--body-lg);
  color: var(--on-surface);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin__mod-meta {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 4px 0 0;
}

.admin__mod-user {
  font-weight: 600;
  color: var(--primary);
}

.admin__mod-flag {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-family: var(--font-label);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.admin__mod-flag--warn {
  background: var(--tertiary-fixed);
  color: var(--on-tertiary-fixed-variant);
}

.admin__mod-flag--error {
  background: var(--error-container);
  color: var(--on-error-container);
}

.admin__mod-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.admin__mod-tag {
  padding: 4px 8px;
  background: var(--surface-container);
  color: var(--on-surface-variant);
  font-family: var(--font-label);
  font-size: var(--label-sm);
  border-radius: var(--radius-sm);
}

.admin__mod-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.admin__mod-item:hover .admin__mod-actions {
  opacity: 1;
}

@media (max-width: 768px) {
  .admin__mod-actions {
    opacity: 1;
  }
}

.admin__mod-action {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-family: var(--font-label);
  font-size: var(--body-sm);
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.admin__mod-action:hover {
  text-decoration: underline;
}

.admin__mod-action--primary {
  color: var(--primary);
}

.admin__mod-action--secondary {
  color: var(--secondary);
}

.admin__mod-action--error {
  color: var(--error);
}

.admin__mod-action .material-symbols-outlined {
  font-size: 1rem;
}

.admin__mod-spacer {
  flex: 1;
}

.admin__mod-approve {
  padding: 8px 24px;
  font-size: var(--body-sm);
}

.admin__moderation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--on-surface-variant);
  font-size: var(--body-md);
}

.admin__moderation-empty-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.admin__moderation-empty p {
  margin: 0;
}

.admin__audit-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--on-surface-variant);
  font-size: var(--body-sm);
}

.admin__audit-empty .material-symbols-outlined {
  font-size: 2rem;
  opacity: 0.4;
}

.admin__audit-empty p {
  margin: 0;
}

.admin__load-more {
  width: 100%;
  padding: 16px;
  border: 2px dashed rgba(190, 200, 201, 0.3);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--on-surface-variant);
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--body-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.admin__load-more:hover {
  background: var(--surface-container-low);
}

/* ==========================================================================
   AUDIT LOG + MODERATOR
   ========================================================================== */

.admin__aside {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin__aside-title {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  font-weight: 700;
  margin: 0;
  color: var(--on-surface);
}

.admin__audit {
  background: var(--surface-container-low);
  border-radius: var(--radius-xl);
  padding: 24px;
  border: 1px solid rgba(190, 200, 201, 0.2);
  position: relative;
  overflow: hidden;
}

.admin__audit-decor {
  position: absolute;
  top: 0;
  right: 0;
  width: 128px;
  height: 128px;
  background: rgba(0, 70, 74, 0.05);
  border-radius: var(--radius-full);
  transform: translate(50%, -50%);
}

.admin__audit-timeline {
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
}

.admin__audit-entry {
  position: relative;
  padding-left: 32px;
}

.admin__audit-dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: 4px solid var(--surface);
}

.admin__audit-dot--primary {
  background: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 70, 74, 0.2);
}

.admin__audit-dot--secondary {
  background: var(--secondary);
  box-shadow: 0 0 0 2px rgba(160, 65, 0, 0.2);
}

.admin__audit-dot--muted {
  background: var(--on-surface-variant);
  box-shadow: 0 0 0 2px rgba(190, 200, 201, 0.2);
}

.admin__audit-line {
  position: absolute;
  left: 5px;
  top: 18px;
  width: 2px;
  height: 48px;
  background: rgba(190, 200, 201, 0.2);
}

.admin__audit-time {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin: 0;
}

.admin__audit-time--primary {
  color: var(--primary);
}

.admin__audit-time--secondary {
  color: var(--secondary);
}

.admin__audit-time--muted {
  color: var(--on-surface-variant);
}

.admin__audit-text {
  font-family: var(--font-body);
  font-size: var(--body-sm);
  font-weight: 500;
  color: var(--on-surface);
  margin: 4px 0 0;
}

.admin__audit-detail {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 4px 0 0;
}

.admin__audit-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 40px;
  padding: 8px;
  background: none;
  border: none;
  color: var(--primary);
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--body-sm);
  cursor: pointer;
}

.admin__audit-link:hover {
  text-decoration: underline;
}

.admin__audit-link .material-symbols-outlined {
  font-size: 0.875rem;
}

/* Moderator Card */
.admin__moderator {
  background: var(--surface-container-high);
  padding: 24px;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(190, 200, 201, 0.2);
}

.admin__moderator-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin__moderator-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.admin__moderator-name {
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.admin__moderator-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--on-primary);
  font-family: var(--font-headline);
  font-size: var(--title-lg);
  font-weight: 700;
}

.admin__moderator-session {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 0;
}

.admin__moderator-progress {
  margin-top: 24px;
}

.admin__moderator-progress-header {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin-bottom: 12px;
}

.admin__moderator-progress-value {
  font-weight: 700;
  color: var(--on-surface);
}

.admin__moderator-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--surface);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.admin__moderator-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

/* ==========================================================================
   DELETE CONFIRM DIALOG
   ========================================================================== */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dialog {
  background: var(--surface-container-lowest);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

.dialog__title {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  margin: 0 0 12px;
  color: var(--on-surface);
}

.dialog__text {
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  line-height: 1.5;
  margin: 0 0 24px;
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog__btn {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--body-sm);
  cursor: pointer;
  border: none;
  transition: opacity var(--transition-fast);
}

.dialog__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog__btn--cancel {
  background: var(--surface-container-high);
  color: var(--on-surface-variant);
}

.dialog__btn--danger {
  background: var(--error);
  color: var(--on-error);
}

.dialog__btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}

/* ==========================================================================
   FOOTER
   ========================================================================== */

.admin__footer {
  margin-top: auto;
  padding: 32px;
  border-top: 1px solid rgba(190, 200, 201, 0.1);
  background: var(--surface-container-low);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 768px) {
  .admin__footer {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }
}

.admin__footer p {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 0;
}

.admin__footer-links {
  display: flex;
  gap: 16px;
}

.admin__footer-links a {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.admin__footer-links a:hover {
  color: var(--primary);
}

/* ==========================================================================
   MOBILE BOTTOM NAV
   ========================================================================== */

.admin__mobile-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px 24px;
  background: rgba(252, 249, 241, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--ghost-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
}

@media (min-width: 768px) {
  .admin__mobile-nav {
    display: none;
  }
}

.admin__mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  border-radius: var(--radius-xl);
  text-decoration: none;
  color: var(--on-surface);
  opacity: 0.6;
  transition: all var(--transition-fast);
}

.admin__mobile-nav-item--active {
  color: var(--primary);
  background: rgba(0, 70, 74, 0.05);
  opacity: 1;
}

.admin__mobile-nav-label {
  font-family: var(--font-label);
  font-size: 12px;
  font-weight: 600;
}
</style>