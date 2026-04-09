<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast.store'
import { adminApi } from '@/api/admin.api'
import { photosApi } from '@/api/photos.api'
import type { PhotoSummary } from '@/types'
import AppPagination from '@/components/common/AppPagination.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const toastStore = useToastStore()

const photos = ref<PhotoSummary[]>([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const pageSize = 20

async function loadPending() {
  loading.value = true
  try {
    const res = await adminApi.getPendingPhotos({ page: page.value, pageSize })
    photos.value = res.items
    totalPages.value = res.totalPages
    totalCount.value = res.totalCount
  } catch {
    toastStore.show('Nie udało się pobrać oczekujących zdjęć', 'error')
  } finally {
    loading.value = false
  }
}

async function approve(photo: PhotoSummary) {
  try {
    await adminApi.approvePhoto(photo.id)
    photos.value = photos.value.filter(p => p.id !== photo.id)
    totalCount.value--
    toastStore.show('Zdjęcie zostało zaakceptowane', 'success')
  } catch {
    toastStore.show('Nie udało się zaakceptować zdjęcia', 'error')
  }
}

async function deletePhoto(photo: PhotoSummary) {
  if (!confirm(`Odrzucić i usunąć „${photo.title}"? Operacji nie można cofnąć.`)) return
  try {
    await photosApi.delete(photo.id)
    photos.value = photos.value.filter(p => p.id !== photo.id)
    totalCount.value--
    toastStore.show('Zdjęcie zostało usunięte', 'success')
  } catch {
    toastStore.show('Nie udało się usunąć zdjęcia', 'error')
  }
}

function preview(id: number) {
  router.push({ name: 'photo-detail', params: { id } })
}

function onPageChange(p: number) {
  page.value = p
  loadPending()
}

onMounted(loadPending)
</script>

<template>
  <AdminLayout>
  <div class="container">
    <div class="page-header">
      <h1>Moderacja zdjęć</h1>
      <span class="badge" :class="{ 'badge--zero': totalCount === 0 }">
        {{ totalCount }} oczekujących
      </span>
    </div>

    <div v-if="loading" class="empty-state" role="status">
      <p>Ładowanie…</p>
    </div>

    <div v-else-if="photos.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon">check_circle</span>
      <p>Brak zdjęć oczekujących na moderację.</p>
    </div>

    <div v-else class="mod-table-wrapper">
      <table class="mod-table" role="table">
        <thead>
          <tr>
            <th>Miniatura</th>
            <th>Tytuł</th>
            <th>Autor</th>
            <th>Dodano</th>
            <th>Kategoria</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="photo in photos" :key="photo.id">
            <td data-label="Miniatura">
              <img
                :src="photo.thumbnailUrl"
                :alt="photo.title"
                class="thumb"
                width="64"
                height="64"
                loading="lazy"
              />
            </td>
            <td data-label="Tytuł">
              <button class="title-link" @click="preview(photo.id)">{{ photo.title }}</button>
            </td>
            <td data-label="Autor">{{ photo.author.displayName }}</td>
            <td data-label="Dodano">{{ new Date(photo.createdAt).toLocaleDateString('pl-PL') }}</td>
            <td data-label="Kategoria">{{ photo.category.name }}</td>
            <td data-label="Akcje">
              <div class="action-group">
                <button class="action-btn action-approve" @click="approve(photo)">
                  <span class="material-symbols-outlined" aria-hidden="true">check</span>
                  Akceptuj
                </button>
                <button class="action-btn action-preview" @click="preview(photo.id)">
                  Podgląd
                </button>
                <button class="action-btn action-delete" @click="deletePhoto(photo)">
                  Usuń
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination
      v-if="totalPages > 1"
      :page="page"
      :total-pages="totalPages"
      :total-count="totalCount"
      @update:page="onPageChange"
    />
  </div>
  </AdminLayout>
</template>

<style scoped>
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 32px 16px;
}

@media (min-width: 768px) {
  .container { padding: 32px 24px; }
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.page-header h1 {
  font-family: var(--font-headline);
  font-size: var(--headline-lg);
  font-weight: 400;
  color: var(--on-surface);
  margin: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: var(--label-md);
  font-weight: 600;
  background-color: var(--error);
  color: var(--on-error);
}

.badge--zero {
  background-color: var(--surface-container-low);
  color: var(--on-surface-variant);
}

.empty-state {
  text-align: center;
  padding: 64px 16px;
  color: var(--on-surface-variant);
  font-size: var(--label-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  color: var(--success, #4caf50);
}

.mod-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.mod-table {
  width: 100%;
  border-collapse: collapse;
}

.mod-table thead th {
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid var(--ghost-border);
  font-size: var(--label-lg);
  color: var(--on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.mod-table tbody td {
  padding: 12px;
  border-bottom: 1px solid var(--ghost-border);
  font-size: var(--label-lg);
  color: var(--on-surface);
  vertical-align: middle;
}

.thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--radius-md);
  display: block;
}

.title-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--primary);
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
}

.title-link:hover { opacity: 0.8; }

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: var(--label-lg);
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 44px;
  white-space: nowrap;
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
}

.action-btn:hover { opacity: 0.85; }

.action-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.action-approve {
  background-color: var(--success, #4caf50);
  color: #fff;
}

.action-preview {
  background-color: transparent;
  border-color: var(--ghost-border);
  color: var(--on-surface);
}

.action-preview:hover { background-color: var(--surface-container-low); }

.action-delete {
  background-color: var(--error);
  color: var(--on-error);
}

/* Mobile card layout */
@media (max-width: 768px) {
  .mod-table thead { display: none; }

  .mod-table,
  .mod-table tbody,
  .mod-table tr,
  .mod-table td {
    display: block;
    width: 100%;
  }

  .mod-table tr {
    margin-bottom: 16px;
    border: 1px solid var(--ghost-border);
    border-radius: var(--radius-lg);
    padding: 12px;
    background-color: var(--surface-container-lowest);
  }

  .mod-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: none;
  }

  .mod-table td:not(:last-child) { border-bottom: 1px solid var(--ghost-border); }

  .mod-table td::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: var(--label-lg);
    color: var(--on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 12px;
    flex-shrink: 0;
  }
}
</style>
