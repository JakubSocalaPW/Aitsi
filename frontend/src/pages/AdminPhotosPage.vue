<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast.store'
import { photosApi } from '@/api/photos.api'
import type { PhotoSummary } from '@/types'
import AdminPhotoTable from '@/components/admin/AdminPhotoTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'

const router = useRouter()
const toastStore = useToastStore()

const photos = ref<PhotoSummary[]>([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const pageSize = 20

async function loadPhotos() {
  loading.value = true
  try {
    const res = await photosApi.search({
      page: page.value,
      pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc',
    })
    photos.value = res.items
    totalPages.value = res.totalPages
    totalCount.value = res.totalCount
  } catch {
    toastStore.show('Nie udało się pobrać zdjęć', 'error')
  } finally {
    loading.value = false
  }
}

function editPhoto(id: number) {
  router.push({ name: 'edit-photo', params: { id } })
}

async function deletePhoto(id: number) {
  if (!confirm('Czy na pewno usunąć to zdjęcie? Operacji nie można cofnąć.')) return
  try {
    await photosApi.delete(id)
    toastStore.show('Zdjęcie zostało usunięte', 'success')
    await loadPhotos()
  } catch {
    toastStore.show('Nie udało się usunąć zdjęcia', 'error')
  }
}

function onPageChange(p: number) {
  page.value = p
  loadPhotos()
}

onMounted(loadPhotos)
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1>Wszystkie zdjęcia</h1>
      <span class="photo-count">{{ totalCount }} zdjęć w archiwum</span>
    </div>

    <AdminPhotoTable
      :photos="photos"
      :loading="loading"
      @edit="editPhoto"
      @delete="deletePhoto"
    />

    <AppPagination
      :page="page"
      :total-pages="totalPages"
      :total-count="totalCount"
      @update:page="onPageChange"
    />
  </div>
</template>

<style scoped>
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 32px 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 32px 24px;
  }
}

.page-header {
  display: flex;
  align-items: baseline;
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

.photo-count {
  font-size: var(--label-lg);
  color: var(--on-surface-variant);
}
</style>
