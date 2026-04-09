<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { adminApi } from '@/api/admin.api'
import { photosApi } from '@/api/photos.api'
import type { PhotoSummary } from '@/types'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const stats = reactive({
  moderationQueue: 0,
  totalPhotos: 0,
  activeUsers: 0,
})

const pendingPhotos = ref<PhotoSummary[]>([])
const loadingPhotos = ref(true)
const deleteTarget = ref<PhotoSummary | null>(null)
const deleting = ref(false)
const approving = ref<number | null>(null)

async function approve(photo: PhotoSummary) {
  approving.value = photo.id
  try {
    await adminApi.approvePhoto(photo.id)
    pendingPhotos.value = pendingPhotos.value.filter(p => p.id !== photo.id)
    stats.moderationQueue = Math.max(0, stats.moderationQueue - 1)
    toastStore.show('Zdjęcie zostało zaakceptowane', 'success')
  } catch {
    toastStore.show('Nie udało się zaakceptować zdjęcia', 'error')
  } finally {
    approving.value = null
  }
}

async function confirmDelete(photo: PhotoSummary) {
  deleteTarget.value = photo
}

async function executeDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await photosApi.delete(deleteTarget.value.id)
    pendingPhotos.value = pendingPhotos.value.filter(p => p.id !== deleteTarget.value!.id)
    stats.moderationQueue = Math.max(0, stats.moderationQueue - 1)
    toastStore.show('Zdjęcie zostało usunięte', 'success')
  } catch {
    toastStore.show('Nie udało się usunąć zdjęcia', 'error')
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

const moderator = reactive({
  get name() { return authStore.user?.displayName ?? 'Admin' },
  get avatarUrl() { return authStore.user?.avatarUrl ?? '' },
  get initials() { return (authStore.user?.displayName ?? 'A').charAt(0).toUpperCase() },
})

onMounted(async () => {
  try {
    const data = await adminApi.getStats()
    stats.totalPhotos = data.totalPhotos
    stats.activeUsers = data.totalUsers
    stats.moderationQueue = data.pendingPhotos
  } catch {
    // silent
  }

  try {
    const res = await adminApi.getPendingPhotos({ pageSize: 5 })
    pendingPhotos.value = res.items
  } catch {
    // silent
  } finally {
    loadingPhotos.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <!-- ============================
         MAIN CANVAS
         ============================ -->
    <div class="admin__canvas">
      <!-- STATS BENTO -->
      <section class="admin__stats">
        <div class="admin__stat admin__stat--wide">
          <div>
            <span class="admin__stat-label">{{ t('adminDashboard.moderationQueue') }}</span>
            <h3 class="admin__stat-value admin__stat-value--primary">{{ stats.moderationQueue }}</h3>
            <p class="admin__stat-desc">{{ t('adminDashboard.pendingReview') }}</p>
          </div>
          <RouterLink to="/admin/moderacja" class="admin__stat-link">
            Przejdź do moderacji →
          </RouterLink>
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
            <span>Łącznie zarejestrowanych</span>
          </div>
        </div>
      </section>

      <!-- GRID: Pending moderation + Moderator card -->
      <div class="admin__grid">
        <!-- Moderation queue -->
        <div class="admin__moderation">
          <div class="admin__moderation-header">
            <h2>{{ t('adminDashboard.reportsForModeration') }}</h2>
            <div class="admin__moderation-actions">
              <RouterLink :to="{ name: 'admin-moderation' }" class="admin__action-btn">
                Moderacja zdjęć
              </RouterLink>
              <RouterLink :to="{ name: 'admin-users' }" class="admin__action-btn">
                {{ t('adminDashboard.manageUsers') }}
              </RouterLink>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loadingPhotos" class="admin__moderation-empty">
            <p>Ładowanie...</p>
          </div>

          <!-- Empty queue -->
          <div v-else-if="pendingPhotos.length === 0" class="admin__moderation-empty">
            <span class="material-symbols-outlined admin__moderation-empty-icon">check_circle</span>
            <p>Brak zdjęć oczekujących na moderację</p>
          </div>

          <!-- Pending list -->
          <div v-else class="admin__moderation-list">
            <div v-for="p in pendingPhotos" :key="p.id" class="admin__mod-item">
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
                <div class="admin__mod-actions">
                  <button
                    class="admin__mod-action admin__mod-action--approve"
                    :disabled="approving === p.id"
                    @click="approve(p)"
                  >
                    <span class="material-symbols-outlined">check</span>
                    {{ approving === p.id ? 'Akceptowanie…' : 'Akceptuj' }}
                  </button>
                  <RouterLink
                    :to="{ name: 'photo-detail', params: { id: p.id } }"
                    class="admin__mod-action admin__mod-action--primary"
                  >
                    <span class="material-symbols-outlined">visibility</span>
                    Podgląd
                  </RouterLink>
                  <button
                    class="admin__mod-action admin__mod-action--error"
                    @click="confirmDelete(p)"
                  >
                    <span class="material-symbols-outlined">delete</span>
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Moderator card -->
        <div class="admin__aside">
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


    <!-- DELETE CONFIRM DIALOG -->
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
  </AdminLayout>
</template>

<style scoped>
/* ===================== CANVAS ===================== */
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

/* ===================== STATS ===================== */
.admin__stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .admin__stats { grid-template-columns: repeat(4, 1fr); }
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
  .admin__stat--wide { grid-column: span 2; }
}

.admin__stat--primary {
  background: var(--primary);
  color: var(--on-primary);
}

.admin__stat--secondary {
  background: var(--secondary);
  color: var(--on-secondary);
}

.admin__stat-label {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.admin__stat--wide .admin__stat-label { color: var(--on-surface-variant); }
.admin__stat--primary .admin__stat-label,
.admin__stat--secondary .admin__stat-label { opacity: 0.8; }

.admin__stat-value {
  font-family: var(--font-headline);
  font-size: clamp(1.875rem, 3vw, 2.25rem);
  font-weight: 700;
  margin-top: 8px;
}

.admin__stat-value--primary { color: var(--primary); }

.admin__stat-desc {
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  margin: 4px 0 0;
}

.admin__stat-link {
  margin-top: 16px;
  font-size: var(--label-lg);
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

.admin__stat-link:hover { text-decoration: underline; }

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
  font-size: var(--label-sm);
  opacity: 0.7;
}

/* ===================== MAIN GRID ===================== */
.admin__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}

@media (min-width: 1280px) {
  .admin__grid { grid-template-columns: 2fr 1fr; }
}

/* ===================== MODERATION LIST ===================== */
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

.admin__action-btn:hover { background: var(--surface-dim); }

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

.admin__mod-item:hover { background: var(--surface-container-low); }

@media (max-width: 640px) {
  .admin__mod-item { flex-direction: column; }
}

.admin__mod-thumb {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-container);
}

.admin__mod-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .admin__mod-thumb { width: 100%; height: 160px; }
}

.admin__mod-content { flex: 1; min-width: 0; }

.admin__mod-title {
  font-weight: 700;
  font-size: var(--body-lg);
  color: var(--on-surface);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin__mod-meta {
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 4px 0 0;
}

.admin__mod-user { font-weight: 600; color: var(--primary); }

.admin__mod-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.admin__mod-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-family: var(--font-label);
  font-size: var(--body-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: opacity var(--transition-fast);
  min-height: 36px;
}

.admin__mod-action:disabled { opacity: 0.6; cursor: not-allowed; }
.admin__mod-action:not(:disabled):hover { opacity: 0.85; }

.admin__mod-action .material-symbols-outlined { font-size: 1rem; }

.admin__mod-action--approve {
  background: var(--success, #2e7d32);
  color: #fff;
}

.admin__mod-action--primary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--ghost-border);
}

.admin__mod-action--error {
  background: transparent;
  color: var(--error);
  border: 1px solid var(--ghost-border);
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

/* ===================== ASIDE ===================== */
.admin__aside { display: flex; flex-direction: column; gap: 24px; }

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

.admin__moderator-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--on-primary);
  font-size: var(--title-lg);
  font-weight: 700;
}

.admin__moderator-name {
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.admin__moderator-session {
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 0;
}

/* ===================== FOOTER ===================== */
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
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  margin: 0;
}

.admin__footer-links {
  display: flex;
  gap: 16px;
}

.admin__footer-links a {
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
  text-decoration: none;
}

.admin__footer-links a:hover { color: var(--primary); }

/* ===================== DIALOG ===================== */
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
  font-size: var(--body-md);
  color: var(--on-surface-variant);
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
  font-weight: 600;
  font-size: var(--body-sm);
  cursor: pointer;
  border: none;
  transition: opacity var(--transition-fast);
}

.dialog__btn:disabled { opacity: 0.6; cursor: not-allowed; }
.dialog__btn--cancel { background: var(--surface-container-high); color: var(--on-surface-variant); }
.dialog__btn--danger { background: var(--error); color: var(--on-error); }
.dialog__btn--danger:hover:not(:disabled) { opacity: 0.9; }
</style>
