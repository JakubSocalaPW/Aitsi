<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PhotoSummary } from '@/types'
import PhotoCard from '@/components/photos/PhotoCard.vue'

const props = withDefaults(defineProps<{
  photos: PhotoSummary[]
  loading?: boolean
  showActions?: boolean
  emptyMessage?: string
}>(), { loading: false, showActions: false })

const emit = defineEmits<{
  edit: [photoId: number]
  delete: [photoId: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="loading" class="grid-status" aria-busy="true">
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else-if="photos.length === 0" class="grid-status" role="status">
    <p>{{ emptyMessage || t('search.noResults') }}</p>
  </div>

  <div v-else class="photo-grid" role="feed" aria-label="Galeria zdjec">
    <PhotoCard
      v-for="photo in photos"
      :key="photo.id"
      :photo="photo"
      :show-actions="showActions"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.grid-status {
  text-align: center;
  padding: 64px 16px;
  color: var(--on-surface-variant);
  font-family: var(--font-body);
  font-size: var(--body-lg);
}
</style>
