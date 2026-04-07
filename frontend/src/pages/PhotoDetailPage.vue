<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, RouterLink } from 'vue-router'
import { format, parse, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { PhotoDetail, Comment } from '@/types'
import { photosApi } from '@/api/photos.api'
import { commentsApi } from '@/api/comments.api'
import CategoryBreadcrumb from '@/components/categories/CategoryBreadcrumb.vue'
import LocationDisplay from '@/components/map/LocationDisplay.vue'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps<{
  id: string | number
}>()

const { t } = useI18n()
const router = useRouter()
const toastStore = useToastStore()
const authStore = useAuthStore()

const loading = ref(true)
const photo = ref<PhotoDetail | null>(null)
const lightboxOpen = ref(false)
const deleteDialogOpen = ref(false)
const deleting = ref(false)

const canModerate = computed(() => {
  if (!authStore.isAuthenticated || !photo.value) return false
  return authStore.isAdmin || photo.value.author.id === authStore.user?.id
})

async function handleDelete() {
  if (!photo.value) return
  deleting.value = true
  try {
    await photosApi.delete(photo.value.id)
    toastStore.show('Zdjęcie zostało usunięte', 'success')
    router.push('/przegladaj')
  } catch {
    toastStore.show('Nie udało się usunąć zdjęcia', 'error')
  } finally {
    deleting.value = false
    deleteDialogOpen.value = false
  }
}

const categoryPath = ref<{ id: number; name: string }[]>([])

const imageUrl = computed(() => {
  if (!photo.value) return ''
  return photo.value.imageUrl || photosApi.imageUrl(photo.value.id)
})

const formattedDate = computed(() => {
  if (!photo.value) return ''
  const { date, datePrecision } = photo.value
  try {
    if (datePrecision === 'year') return `ok. ${date.substring(0, 4)} r.`
    if (datePrecision === 'month') {
      const parsed = parse(date.substring(0, 7), 'yyyy-MM', new Date())
      return format(parsed, 'LLLL yyyy', { locale: pl })
    }
    const parsed = parse(date.substring(0, 10), 'yyyy-MM-dd', new Date())
    return format(parsed, 'd MMMM yyyy', { locale: pl })
  } catch { return date }
})

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && lightboxOpen.value) lightboxOpen.value = false
}

function navigateToRelated(photoId: number) {
  router.push({ name: 'photo-detail', params: { id: photoId } })
}

function handleDownload() {
  if (photo.value?.imageUrl) {
    window.open(photo.value.imageUrl, '_blank')
  }
}

function handleShare() {
  navigator.clipboard.writeText(window.location.href)
  toastStore.show('Link skopiowany do schowka', 'success')
}

// Comments
const comments = ref<Comment[]>([])
const newCommentText = ref('')
const submittingComment = ref(false)
const editingCommentId = ref<number | null>(null)
const editingCommentText = ref('')
const avatarFailed = ref<Record<number, boolean>>({})
const deleteCommentDialogOpen = ref(false)
const commentToDelete = ref<Comment | null>(null)

function canEditComment(comment: Comment) {
  if (!authStore.isAuthenticated) return false
  return authStore.isAdmin || comment.author.id === authStore.user?.id
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function relativeDate(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pl })
}

async function loadComments() {
  if (!photo.value) return
  try {
    comments.value = await commentsApi.getByPhotoId(photo.value.id)
  } catch {
    comments.value = []
  }
}

async function submitComment() {
  if (!photo.value || !newCommentText.value.trim()) return
  submittingComment.value = true
  try {
    const comment = await commentsApi.create(photo.value.id, newCommentText.value.trim())
    comments.value.push(comment)
    newCommentText.value = ''
  } catch {
    toastStore.show('Nie udało się dodać komentarza', 'error')
  } finally {
    submittingComment.value = false
  }
}

function startEditComment(comment: Comment) {
  editingCommentId.value = comment.id
  editingCommentText.value = comment.text
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentText.value = ''
}

async function saveEditComment(comment: Comment) {
  if (!editingCommentText.value.trim()) return
  try {
    const updated = await commentsApi.update(comment.id, editingCommentText.value.trim())
    const idx = comments.value.findIndex(c => c.id === comment.id)
    if (idx !== -1) comments.value[idx] = updated
    editingCommentId.value = null
    editingCommentText.value = ''
  } catch {
    toastStore.show('Nie udało się edytować komentarza', 'error')
  }
}

function deleteComment(comment: Comment) {
  commentToDelete.value = comment
  deleteCommentDialogOpen.value = true
}

async function confirmDeleteComment() {
  if (!commentToDelete.value) return
  try {
    await commentsApi.delete(commentToDelete.value.id)
    comments.value = comments.value.filter(c => c.id !== commentToDelete.value!.id)
  } catch {
    toastStore.show('Nie udało się usunąć komentarza', 'error')
  } finally {
    deleteCommentDialogOpen.value = false
    commentToDelete.value = null
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleEscape)
  try {
    photo.value = await photosApi.getById(Number(props.id))
    if (photo.value.category) {
      categoryPath.value = [{ id: photo.value.category.id, name: photo.value.category.name }]
    }
    await loadComments()
  } catch {
    photo.value = null
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="detail">
    <!-- Loading -->
    <div v-if="loading" class="detail__loading" aria-busy="true">
      {{ t('common.loading') }}
    </div>

    <template v-else-if="photo">
      <!-- ============================
           HERO SECTION
           ============================ -->
      <section class="detail__hero">
        <!-- Image -->
        <div class="detail__image-col" @click="lightboxOpen = true">
          <img
            :src="imageUrl"
            :alt="photo.title"
            class="detail__image"
          />
          <div class="detail__image-overlay">
            <button
              class="detail__image-btn"
              aria-label="Powieksz"
              @click.stop="lightboxOpen = true"
            >
              <span class="material-symbols-outlined">zoom_in</span>
            </button>
            <button
              class="detail__image-btn"
              aria-label="Pelny ekran"
              @click.stop="lightboxOpen = true"
            >
              <span class="material-symbols-outlined">fullscreen</span>
            </button>
          </div>
        </div>

        <!-- Metadata -->
        <div class="detail__meta-col">
          <nav class="detail__breadcrumb">
            <CategoryBreadcrumb :path="categoryPath" />
            <span class="detail__object-number">{{ t('photoDetail.objectNumber') }} #{{ photo.id }}</span>
          </nav>

          <h1 class="detail__title">{{ photo.title }}</h1>

          <div class="detail__key-facts">
            <div class="detail__fact">
              <span class="detail__fact-label">{{ t('photoDetail.dating') }}</span>
              <span class="detail__fact-value">{{ formattedDate }}</span>
            </div>
            <div class="detail__fact-divider" aria-hidden="true"></div>
            <div v-if="photo.technique" class="detail__fact">
              <span class="detail__fact-label">{{ t('photoDetail.technique') }}</span>
              <span class="detail__fact-value">{{ photo.technique }}</span>
            </div>
          </div>

          <blockquote v-if="photo.quote" class="detail__quote">
            "{{ photo.quote }}"
          </blockquote>

          <div class="detail__actions">
            <button class="btn btn-primary detail__download-btn" @click="handleDownload()">
              <span class="material-symbols-outlined">download</span>
              <span>{{ t('photoDetail.downloadReproduction') }}</span>
            </button>
            <button class="detail__share-btn ghost-border" aria-label="Udostepnij" @click="handleShare()">
              <span class="material-symbols-outlined">share</span>
            </button>
            <template v-if="canModerate">
              <RouterLink :to="`/edytuj-zdjecie/${photo.id}`" class="detail__mod-btn detail__mod-btn--edit ghost-border">
                <span class="material-symbols-outlined">edit</span>
                <span>Edytuj</span>
              </RouterLink>
              <button class="detail__mod-btn detail__mod-btn--delete ghost-border" @click="deleteDialogOpen = true">
                <span class="material-symbols-outlined">delete</span>
                <span>Usuń</span>
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- ============================
           CONTENT GRID
           ============================ -->
      <section class="detail__content">
        <div class="detail__main">
          <!-- History -->
          <div class="detail__history">
            <h2>{{ t('photoDetail.historyTitle') }}</h2>
            <p>{{ photo.description }}</p>
          </div>

          <div class="detail__cards-grid">
            <!-- Contributor -->
            <div v-if="photo.contributor" class="detail__contributor">
              <div class="detail__contributor-header">
                <span class="material-symbols-outlined detail__contributor-icon">history_edu</span>
                <h3>{{ t('photoDetail.toldBy') }}</h3>
              </div>
              <div class="detail__contributor-profile">
                <img
                  v-if="photo.contributor.avatarUrl"
                  :src="photo.contributor.avatarUrl"
                  :alt="photo.contributor.name"
                  class="detail__contributor-avatar"
                />
                <div>
                  <h4 class="detail__contributor-name">{{ photo.contributor.name }}</h4>
                  <p class="detail__contributor-role">{{ photo.contributor.role }}</p>
                </div>
              </div>
              <p v-if="photo.contributor.quote" class="detail__contributor-quote">
                "{{ photo.contributor.quote }}"
              </p>
            </div>

            <!-- Technical Specs -->
            <div class="detail__specs">
              <h3>{{ t('photoDetail.technicalMetadata') }}</h3>
              <dl>
                <div v-if="photo.originalFormat" class="detail__spec-row">
                  <dt>{{ t('photoDetail.originalFormat') }}</dt>
                  <dd>{{ photo.originalFormat }}</dd>
                </div>
                <div v-if="photo.inventoryNumber" class="detail__spec-row">
                  <dt>{{ t('photoDetail.inventoryNumber') }}</dt>
                  <dd>{{ photo.inventoryNumber }}</dd>
                </div>
                <div v-if="photo.license" class="detail__spec-row">
                  <dt>{{ t('photoDetail.license') }}</dt>
                  <dd>{{ photo.license }}</dd>
                </div>
                <div v-if="photo.digitization" class="detail__spec-row">
                  <dt>{{ t('photoDetail.digitization') }}</dt>
                  <dd>{{ photo.digitization }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="detail__sidebar">
          <!-- Location -->
          <div v-if="photo.location" class="detail__location">
            <div class="detail__location-header">
              <span class="material-symbols-outlined detail__location-icon">location_on</span>
              <h3>{{ t('photoDetail.location') }}</h3>
            </div>
            <p class="detail__location-label">{{ photo.location.label || photo.locationLabel }}</p>
            <LocationDisplay
              :lat="photo.location.lat"
              :lng="photo.location.lng"
              :label="photo.location.label"
              height="240px"
            />
          </div>

          <!-- Tags -->
          <div v-if="photo.tags?.length" class="detail__tags">
            <h3>{{ t('photoDetail.archiveTags') }}</h3>
            <div class="detail__tags-list">
              <span v-for="tag in photo.tags" :key="tag" class="detail__tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </aside>
      </section>

      <!-- ============================
           COMMENTS SECTION
           ============================ -->
      <section class="comments">
        <h2 class="comments__title">
          <span class="material-symbols-outlined comments__title-icon">forum</span>
          {{ t('comments.title') }}
          <span class="comments__count">({{ comments.length }})</span>
        </h2>

        <!-- Comment list -->
        <div v-if="comments.length" class="comments__list">
          <article v-for="comment in comments" :key="comment.id" class="comments__item">
            <div class="comments__avatar">
              <img v-if="comment.author.avatarUrl && !avatarFailed[comment.id]" :src="comment.author.avatarUrl" :alt="comment.author.displayName" class="comments__avatar-img" @error="avatarFailed[comment.id] = true" />
              <span v-else class="comments__avatar-initials">{{ getInitials(comment.author.displayName) }}</span>
            </div>
            <div class="comments__body">
              <div class="comments__meta">
                <span class="comments__author">{{ comment.author.displayName }}</span>
                <span class="comments__date">{{ relativeDate(comment.createdAt) }}</span>
                <span v-if="comment.updatedAt" class="comments__edited">({{ t('comments.edited') }})</span>
              </div>

              <!-- Edit mode -->
              <template v-if="editingCommentId === comment.id">
                <textarea v-model="editingCommentText" class="comments__edit-textarea" rows="3" />
                <div class="comments__edit-actions">
                  <button class="comments__edit-btn comments__edit-btn--save" @click="saveEditComment(comment)">{{ t('common.save') }}</button>
                  <button class="comments__edit-btn comments__edit-btn--cancel" @click="cancelEditComment()">{{ t('common.cancel') }}</button>
                </div>
              </template>

              <!-- Display mode -->
              <template v-else>
                <p class="comments__text">{{ comment.text }}</p>
                <div v-if="canEditComment(comment)" class="comments__actions">
                  <button class="comments__action-btn" @click="startEditComment(comment)">
                    <span class="material-symbols-outlined">edit</span>
                    {{ t('common.edit') }}
                  </button>
                  <button class="comments__action-btn comments__action-btn--delete" @click="deleteComment(comment)">
                    <span class="material-symbols-outlined">delete</span>
                    {{ t('common.delete') }}
                  </button>
                </div>
              </template>
            </div>
          </article>
        </div>

        <!-- No comments -->
        <p v-else class="comments__empty">{{ t('comments.noComments') }}</p>

        <!-- Comment form (authenticated only) -->
        <form v-if="authStore.isAuthenticated" class="comments__form" @submit.prevent="submitComment">
          <textarea
            v-model="newCommentText"
            class="comments__textarea"
            :placeholder="t('comments.placeholder')"
            rows="3"
          />
          <button
            type="submit"
            class="btn btn-primary comments__submit"
            :disabled="!newCommentText.trim() || submittingComment"
          >
            {{ submittingComment ? t('common.loading') : t('comments.submit') }}
          </button>
        </form>

        <!-- Login prompt for guests -->
        <p v-else class="comments__login-prompt">
          <RouterLink to="/logowanie">{{ t('comments.loginToComment') }}</RouterLink>
        </p>
      </section>

      <!-- ============================
           RELATED MATERIALS
           ============================ -->
      <section v-if="photo.relatedPhotos?.length" class="detail__related">
        <div class="detail__related-header">
          <div>
            <span class="detail__related-label">{{ t('photoDetail.collection') }}</span>
            <h2>{{ t('photoDetail.relatedMaterials') }}</h2>
          </div>
          <RouterLink :to="{ path: '/przegladaj', query: { categoryId: String(photo.category?.id) } }" class="detail__related-link">
            <span>{{ t('photoDetail.viewFullCollection') }}</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </RouterLink>
        </div>

        <div class="detail__related-grid">
          <article
            v-for="related in photo.relatedPhotos"
            :key="related.id"
            class="detail__related-card"
            tabindex="0"
            role="link"
            :aria-label="related.title"
            @click="navigateToRelated(related.id)"
            @keydown.enter="navigateToRelated(related.id)"
          >
            <div class="detail__related-card-img">
              <img :src="related.thumbnailUrl" :alt="related.title" loading="lazy" />
            </div>
            <div class="detail__related-card-body">
              <p class="detail__related-card-date">{{ related.date.substring(0, 4) }} r.</p>
              <h3>{{ related.title }}</h3>
              <p v-if="related.description" class="detail__related-card-desc">{{ related.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- ============================
           LIGHTBOX
           ============================ -->
      <Teleport to="body">
        <div
          v-if="lightboxOpen"
          class="lightbox"
          role="dialog"
          aria-modal="true"
          @click.self="lightboxOpen = false"
        >
          <button class="lightbox__close" aria-label="Zamknij" @click="lightboxOpen = false">
            &#x2715;
          </button>
          <img :src="imageUrl" :alt="photo.title" class="lightbox__img" />
        </div>
      </Teleport>

      <!-- ============================
           DELETE CONFIRM DIALOG (photo)
           ============================ -->
      <Teleport to="body">
        <div
          v-if="deleteDialogOpen"
          class="dialog-overlay"
          @click.self="deleteDialogOpen = false"
        >
          <div class="dialog" role="alertdialog" aria-modal="true">
            <h3 class="dialog__title">Potwierdź usunięcie</h3>
            <p class="dialog__text">Czy na pewno chcesz usunąć zdjęcie „{{ photo.title }}"? Tej operacji nie można cofnąć.</p>
            <div class="dialog__actions">
              <button class="dialog__btn dialog__btn--cancel" @click="deleteDialogOpen = false" :disabled="deleting">Anuluj</button>
              <button class="dialog__btn dialog__btn--danger" @click="handleDelete()" :disabled="deleting">
                {{ deleting ? 'Usuwanie...' : 'Usuń' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ============================
           DELETE CONFIRM DIALOG (comment)
           ============================ -->
      <Teleport to="body">
        <div
          v-if="deleteCommentDialogOpen"
          class="dialog-overlay"
          @click.self="deleteCommentDialogOpen = false"
        >
          <div class="dialog" role="alertdialog" aria-modal="true">
            <h3 class="dialog__title">{{ t('comments.deleteConfirm') }}</h3>
            <p class="dialog__text">{{ t('comments.deleteConfirmText') }}</p>
            <div class="dialog__actions">
              <button class="dialog__btn dialog__btn--cancel" @click="deleteCommentDialogOpen = false">Anuluj</button>
              <button class="dialog__btn dialog__btn--danger" @click="confirmDeleteComment()">Usuń</button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <!-- Not found -->
    <div v-else class="detail__empty">
      <p>{{ t('photoDetail.notFound') }}</p>
      <router-link to="/przegladaj">{{ t('photoDetail.backToBrowse') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   PHOTO DETAIL — Editorial Heritage Layout
   ========================================================================== */

.detail {
  max-width: var(--container-max);
  margin-inline: auto;
  padding: 48px 32px 96px;
}

@media (max-width: 768px) {
  .detail {
    padding: 24px 16px 64px;
  }
}

.detail__loading {
  text-align: center;
  padding: 96px 0;
  color: var(--on-surface-variant);
  font-family: var(--font-body);
  font-size: var(--body-lg);
}

/* ==========================================================================
   HERO
   ========================================================================== */

.detail__hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: start;
  margin-bottom: 80px;
}

@media (min-width: 1024px) {
  .detail__hero {
    grid-template-columns: 7fr 5fr;
    gap: 64px;
  }
}

/* Image Column */
.detail__image-col {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--surface-container-highest);
  box-shadow: 0 40px 60px -20px rgba(28, 28, 23, 0.04);
  cursor: zoom-in;
}

.detail__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  transition: transform 700ms ease;
}

.detail__image-col:hover .detail__image {
  transform: scale(1.05);
}

.detail__image-overlay {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
}

.detail__image-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: none;
  color: var(--primary);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(28, 28, 23, 0.08);
  transition: transform var(--transition-fast);
}

.detail__image-btn:hover {
  transform: scale(1.1);
}

.detail__image-btn:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* Metadata Column */
.detail__meta-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 16px;
}

.detail__breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
}

.detail__object-number {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  color: var(--secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.detail__title {
  font-family: var(--font-headline);
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  color: var(--on-surface);
  line-height: 1.1;
  margin: 0 0 32px;
}

.detail__key-facts {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.detail__fact {
  display: flex;
  flex-direction: column;
}

.detail__fact-label {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  color: var(--on-surface-variant);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.detail__fact-value {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  color: var(--primary);
}

.detail__fact-divider {
  width: 1px;
  height: 40px;
  background: var(--outline-variant);
  opacity: 0.3;
}

.detail__quote {
  font-family: var(--font-headline);
  font-style: italic;
  font-size: var(--title-lg);
  color: var(--on-surface-variant);
  line-height: 1.5;
  margin: 0 0 32px;
  padding: 0;
  border: none;
}

.detail__actions {
  display: flex;
  gap: 16px;
  padding-top: 16px;
}

.detail__download-btn {
  padding: 12px 32px;
}

.detail__share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: var(--radius-lg);
  background: var(--surface-container-low);
  color: var(--primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.detail__share-btn:hover {
  background: var(--surface-container-high);
}

.detail__share-btn:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* ==========================================================================
   CONTENT GRID
   ========================================================================== */

.detail__content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  margin-bottom: 96px;
}

@media (min-width: 1024px) {
  .detail__content {
    grid-template-columns: 2fr 1fr;
  }
}

/* History Section */
.detail__history {
  background: var(--surface-container-low);
  padding: 40px;
  border-radius: var(--radius-xl);
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .detail__history {
    padding: 24px;
  }
}

.detail__history h2 {
  font-family: var(--font-headline);
  font-size: var(--headline-lg);
  margin: 0 0 24px;
  color: var(--on-surface);
}

.detail__history p {
  font-family: var(--font-body);
  font-size: var(--body-lg);
  line-height: 1.7;
  color: var(--on-surface-variant);
  margin: 0 0 16px;
}

.detail__history p:last-child {
  margin-bottom: 0;
}

/* Cards Grid (Contributor + Specs) */
.detail__cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 768px) {
  .detail__cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Contributor */
.detail__contributor {
  background: var(--surface-container-lowest);
  padding: 32px;
  border-radius: var(--radius-xl);
  box-shadow: 0 40px 60px -20px rgba(28, 28, 23, 0.04);
  border-top: 4px solid rgba(160, 65, 0, 0.2);
}

.detail__contributor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.detail__contributor-icon {
  color: var(--secondary);
  font-size: 1.875rem;
}

.detail__contributor-header h3 {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--on-surface);
}

.detail__contributor-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail__contributor-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.detail__contributor-name {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--body-lg);
  color: var(--on-surface);
  margin: 0;
}

.detail__contributor-role {
  font-family: var(--font-label);
  font-size: var(--body-sm);
  color: var(--on-surface-variant);
  margin: 0;
}

.detail__contributor-quote {
  font-family: var(--font-body);
  font-style: italic;
  font-size: var(--body-sm);
  color: var(--on-surface-variant);
  line-height: 1.5;
  margin: 0;
}

/* Technical Specs */
.detail__specs {
  background: var(--surface-container-highest);
  padding: 32px;
  border-radius: var(--radius-xl);
}

.detail__specs h3 {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  margin: 0 0 24px;
  color: var(--on-surface);
}

.detail__specs dl {
  margin: 0;
}

.detail__spec-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(190, 200, 201, 0.1);
  font-family: var(--font-label);
  font-size: var(--body-sm);
}

.detail__spec-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.detail__spec-row dt {
  color: var(--on-surface-variant);
}

.detail__spec-row dd {
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */

.detail__sidebar {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Location */
.detail__location {
  background: var(--surface-container-highest);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 40px 60px -20px rgba(28, 28, 23, 0.04);
}

.detail__location-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
}

.detail__location-icon {
  color: var(--primary);
}

.detail__location-header h3 {
  font-family: var(--font-headline);
  font-size: var(--headline-md);
  margin: 0;
  color: var(--on-surface);
}

.detail__location-label {
  font-family: var(--font-label);
  font-size: var(--body-sm);
  color: var(--on-surface-variant);
  margin: 0;
  padding: 0 24px 24px;
}

.detail__location :deep(.location-display__map) {
  border-radius: 0;
  border: none;
}

.detail__location :deep(.location-display__coords) {
  display: none;
}

.detail__map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: var(--surface-container-lowest);
  color: var(--primary);
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--body-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.detail__map-btn:hover {
  background: rgba(0, 70, 74, 0.05);
}

.detail__map-btn:focus-visible {
  outline: var(--focus-ring);
  outline-offset: -2px;
}

/* Tags */
.detail__tags {
  background: var(--surface-container-low);
  padding: 32px;
  border-radius: var(--radius-xl);
}

.detail__tags h3 {
  font-family: var(--font-headline);
  font-size: var(--title-lg);
  margin: 0 0 16px;
  color: var(--on-surface);
}

.detail__tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail__tag {
  padding: 4px 12px;
  background: var(--surface-container-highest);
  color: var(--on-surface-variant);
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 500;
  border-radius: var(--radius-full);
}

/* ==========================================================================
   COMMENTS SECTION
   ========================================================================== */

.comments {
  margin-bottom: 96px;
  border-top: 1px solid var(--outline-variant);
}

.comments__title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-headline);
  font-size: var(--headline-lg);
  color: var(--on-surface);
  margin: 0 0 32px;
}

.comments__title-icon {
  color: var(--primary);
  font-size: 1.5rem;
}

.comments__count {
  font-family: var(--font-label);
  font-size: var(--body-md);
  font-weight: 400;
  color: var(--on-surface-variant);
}

.comments__list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.comments__item {
  display: flex;
  gap: 16px;
}

.comments__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--surface-container-highest);
  display: flex;
  align-items: center;
  justify-content: center;
}

.comments__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comments__avatar-initials {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  color: var(--primary);
}

.comments__body {
  flex: 1;
  min-width: 0;
}

.comments__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.comments__author {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--body-sm);
  color: var(--on-surface);
}

.comments__date {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  color: var(--on-surface-variant);
}

.comments__edited {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-style: italic;
  color: var(--on-surface-variant);
}

.comments__text {
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.comments__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.comments__action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 600;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.comments__action-btn .material-symbols-outlined {
  font-size: 1rem;
}

.comments__action-btn:hover {
  background: var(--surface-container-high);
  color: var(--on-surface);
}

.comments__action-btn--delete:hover {
  color: var(--error);
}

.comments__edit-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-lg);
  background: var(--surface-container-lowest);
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface);
  resize: vertical;
  margin-top: 8px;
  box-sizing: border-box;
}

.comments__edit-textarea:focus {
  outline: none;
  border-color: var(--outline);
  box-shadow: none;
}

.comments__edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.comments__edit-btn {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 600;
  cursor: pointer;
}

.comments__edit-btn--save {
  background: var(--primary);
  color: var(--on-primary);
}

.comments__edit-btn--cancel {
  background: var(--surface-container-high);
  color: var(--on-surface-variant);
}

.comments__empty {
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  text-align: center;
  padding: 32px 0;
  margin: 0 0 32px;
}

.comments__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments__textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-xl);
  background: var(--surface-container-lowest);
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface);
  resize: vertical;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.comments__textarea:focus {
  outline: none;
  border-color: var(--outline);
  box-shadow: none;
}

.comments__submit {
  align-self: flex-end;
  padding: 10px 24px;
}

.comments__login-prompt {
  font-family: var(--font-body);
  font-size: var(--body-md);
  color: var(--on-surface-variant);
  text-align: center;
  padding: 24px 0;
  margin: 0;
}

.comments__login-prompt a {
  color: var(--primary);
  font-weight: 600;
}

/* ==========================================================================
   RELATED MATERIALS
   ========================================================================== */

.detail__related {
  padding-top: 96px;
  border-top: 1px solid rgba(190, 200, 201, 0.1);
}

.detail__related-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 16px;
}

.detail__related-label {
  display: block;
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  color: var(--secondary);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 8px;
}

.detail__related-header h2 {
  font-family: var(--font-headline);
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin: 0;
  color: var(--on-surface);
}

.detail__related-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(0, 70, 74, 0.2);
  padding-bottom: 4px;
  color: var(--primary);
  font-family: var(--font-label);
  font-weight: 700;
  font-size: var(--label-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.detail__related-link:hover {
  border-color: var(--primary);
}

.detail__related-link:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.detail__related-link .material-symbols-outlined {
  font-size: 1rem;
}

.detail__related-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 640px) {
  .detail__related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .detail__related-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.detail__related-card {
  background: var(--surface-container-lowest);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 40px 60px -20px rgba(28, 28, 23, 0.04);
  cursor: pointer;
  transition: transform var(--transition-normal);
}

.detail__related-card:hover {
  transform: translateY(-8px);
}

.detail__related-card:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.detail__related-card-img {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}

.detail__related-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.detail__related-card:hover .detail__related-card-img img {
  transform: scale(1.1);
}

.detail__related-card-body {
  padding: 24px;
}

.detail__related-card-date {
  font-family: var(--font-label);
  font-size: 10px;
  font-weight: 700;
  color: var(--on-surface-variant);
  opacity: 0.6;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.detail__related-card-body h3 {
  font-family: var(--font-headline);
  font-size: var(--title-lg);
  margin: 0 0 8px;
  color: var(--on-surface);
}

.detail__related-card-desc {
  font-family: var(--font-body);
  font-size: var(--body-sm);
  color: var(--on-surface-variant);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ==========================================================================
   MODERATION BUTTONS
   ========================================================================== */

.detail__mod-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  font-family: var(--font-label);
  font-size: var(--body-sm);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.detail__mod-btn--edit {
  background: var(--surface-container-low);
  color: var(--primary);
}

.detail__mod-btn--edit:hover {
  background: var(--surface-container-high);
}

.detail__mod-btn--delete {
  background: var(--error-container);
  color: var(--on-error-container);
  border: none;
}

.detail__mod-btn--delete:hover {
  opacity: 0.85;
}

.detail__mod-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ==========================================================================
   DELETE CONFIRM DIALOG
   ========================================================================== */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
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
   LIGHTBOX
   ========================================================================== */

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox__img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

.lightbox__close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #fff;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.lightbox__close:hover {
  opacity: 0.7;
}

.lightbox__close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

/* ==========================================================================
   EMPTY / NOT FOUND
   ========================================================================== */

.detail__empty {
  text-align: center;
  padding: 96px 0;
}

.detail__empty p {
  color: var(--on-surface-variant);
  margin-bottom: 16px;
  font-size: var(--body-lg);
}

.detail__empty a {
  color: var(--primary);
  font-weight: 600;
}
</style>