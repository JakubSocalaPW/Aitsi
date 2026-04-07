<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format, parse } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { PhotoSummary } from '@/types'

const props = withDefaults(defineProps<{
  photo: PhotoSummary
  showActions?: boolean
  lazy?: boolean
}>(), { showActions: false, lazy: true })

const emit = defineEmits<{
  edit: [photoId: number]
  delete: [photoId: number]
}>()

const { t } = useI18n()
const router = useRouter()

const formattedDate = computed(() => {
  const { date, datePrecision } = props.photo

  try {
    if (datePrecision === 'year') {
      return date.substring(0, 4)
    }

    if (datePrecision === 'month') {
      const parsed = parse(date.substring(0, 7), 'yyyy-MM', new Date())
      return format(parsed, 'LLLL yyyy', { locale: pl })
    }

    const parsed = parse(date.substring(0, 10), 'yyyy-MM-dd', new Date())
    return format(parsed, 'd MMMM yyyy', { locale: pl })
  } catch {
    return date
  }
})

const locationLabel = computed(() =>
  props.photo.location?.label || t('photo.unknownLocation')
)

function navigateToDetail() {
  router.push({ name: 'photo-detail', params: { id: props.photo.id } })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateToDetail()
  }
}

function onEdit(event: Event) {
  event.stopPropagation()
  emit('edit', props.photo.id)
}

function onDelete(event: Event) {
  event.stopPropagation()
  emit('delete', props.photo.id)
}
</script>

<template>
  <article
    class="photo-card card"
    tabindex="0"
    role="link"
    :aria-label="photo.title"
    @click="navigateToDetail"
    @keydown="handleKeydown"
  >
    <div class="photo-card__img">
      <img
        :src="photo.thumbnailUrl"
        :alt="photo.title"
        :loading="lazy ? 'lazy' : 'eager'"
      />
    </div>

    <div class="photo-card__body">
      <h3 class="photo-card__title">{{ photo.title }}</h3>
      <p class="photo-card__meta">{{ locationLabel }}</p>
      <p class="photo-card__meta">{{ formattedDate }}</p>

      <div v-if="showActions" class="photo-card__actions">
        <button
          class="btn btn-ghost"
          :aria-label="`${t('common.edit')}: ${photo.title}`"
          @click="onEdit"
        >
          {{ t('common.edit') }}
        </button>
        <button
          class="btn btn-danger"
          :aria-label="`${t('common.delete')}: ${photo.title}`"
          @click="onDelete"
        >
          {{ t('common.delete') }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.photo-card {
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-lg);
  border: none;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-sm);
}

.photo-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.photo-card__img {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.photo-card__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.photo-card:hover .photo-card__img img {
  transform: scale(1.03);
}

.photo-card__body {
  padding: 16px;
}

.photo-card__title {
  font-family: var(--font-headline);
  font-size: var(--headline-sm);
  color: var(--on-surface);
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.photo-card__meta {
  font-family: var(--font-label);
  font-size: var(--label-lg);
  color: var(--on-surface-variant);
  margin: 0;
  line-height: 1.5;
}

.photo-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ghost-border);
}
</style>
