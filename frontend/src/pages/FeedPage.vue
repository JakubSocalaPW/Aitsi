<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { photosApi } from '@/api/photos.api'
import { useCategoriesStore } from '@/stores/categories.store'
import { useToastStore } from '@/stores/toast.store'
import type { PhotoSummary } from '@/types'

const { t } = useI18n()
const categoriesStore = useCategoriesStore()
const toastStore = useToastStore()

/* ---- Feed state ---- */
const photos = ref<PhotoSummary[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const PAGE_SIZE = 6

/* ---- Local social state (persisted in localStorage) ---- */
const APPRECIATED_KEY = 'cas_appreciated'
const appreciatedIds = ref<number[]>(JSON.parse(localStorage.getItem(APPRECIATED_KEY) || '[]'))

/* ---- Computed ---- */
const hasMore = computed(() => currentPage.value < totalPages.value)

const recentAuthors = computed(() => {
  const seen = new Set<number>()
  return photos.value
    .filter(p => {
      if (seen.has(p.author.id)) return false
      seen.add(p.author.id)
      return true
    })
    .map(p => p.author)
    .slice(0, 8)
})

/* ---- API ---- */
async function fetchFeed(append = false) {
  isLoading.value = true
  try {
    const res = await photosApi.search({
      sortBy: 'createdAt',
      sortDir: 'desc',
      page: currentPage.value,
      pageSize: PAGE_SIZE,
    })
    photos.value = append ? [...photos.value, ...res.items] : res.items
    totalPages.value = res.totalPages
  } finally {
    isLoading.value = false
  }
}

/* ---- Handlers ---- */
function isAppreciated(id: number) {
  return appreciatedIds.value.includes(id)
}

function toggleAppreciate(id: number) {
  if (isAppreciated(id)) {
    appreciatedIds.value = appreciatedIds.value.filter(x => x !== id)
  } else {
    appreciatedIds.value = [...appreciatedIds.value, id]
    toastStore.show('Doceniono!', 'success')
  }
  localStorage.setItem(APPRECIATED_KEY, JSON.stringify(appreciatedIds.value))
}

function handleShare(photo: PhotoSummary) {
  const url = `${window.location.origin}/zdjecie/${photo.id}`
  navigator.clipboard?.writeText(url)
  toastStore.show(`Link do "${photo.title}" skopiowany`, 'info')
}

function handleLoadMore() {
  if (!hasMore.value) return
  currentPage.value++
  fetchFeed(true)
}

/* ---- Init ---- */
onMounted(() => {
  categoriesStore.fetchTree()
  fetchFeed()
})
</script>

<template>
  <div class="feed">
    <!-- Main content -->
    <main class="feed__main">
      <!-- Feed column -->
      <div class="feed__column">
        <header class="feed__header">
          <h1 class="feed__title">{{ t('feed.title') }}</h1>
          <p class="feed__subtitle">{{ t('feed.subtitle') }}</p>
        </header>

        <!-- Loading -->
        <div v-if="isLoading && !photos.length" class="feed__loading">
          {{ t('common.loading') }}
        </div>

        <!-- Empty -->
        <div v-else-if="!photos.length" class="feed__empty">
          <p>Brak materialow do wyswietlenia.</p>
          <RouterLink to="/dodaj-zdjecie" class="feed__empty-link">
            Dodaj pierwsze zdjecie
          </RouterLink>
        </div>

        <!-- Feed items -->
        <article
          v-for="photo in photos"
          :key="photo.id"
          class="feed__item"
        >
          <!-- Contributor -->
          <div class="feed__item-contributor">
            <div class="feed__contributor-info">
              <div class="feed__contributor-avatar feed__contributor-avatar--placeholder">
                {{ photo.author.displayName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="feed__contributor-name">{{ photo.author.displayName }}</p>
                <p class="feed__contributor-role">{{ t('feed.archivalContributor') }}</p>
              </div>
            </div>
          </div>

          <!-- Photo -->
          <RouterLink :to="`/zdjecie/${photo.id}`" class="feed__item-photo">
            <img
              :src="photo.thumbnailUrl"
              :alt="photo.title"
              class="feed__photo"
            />
            <div class="feed__photo-overlay">
              <div class="feed__photo-meta">
                <span v-if="photo.location?.label" class="feed__photo-meta-item">
                  <span class="material-symbols-outlined feed__meta-icon">location_on</span>
                  {{ photo.location.label }}
                </span>
                <span class="feed__photo-meta-item">
                  <span class="material-symbols-outlined feed__meta-icon">calendar_today</span>
                  {{ photo.date }}
                </span>
              </div>
            </div>
          </RouterLink>

          <!-- Text -->
          <div class="feed__item-text">
            <RouterLink :to="`/zdjecie/${photo.id}`" class="feed__item-title-link">
              <h2 class="feed__item-title">{{ photo.title }}</h2>
            </RouterLink>
            <p v-if="photo.description" class="feed__item-quote">{{ photo.description }}</p>
          </div>

          <!-- Actions -->
          <div class="feed__item-actions">
            <button
              class="feed__action-btn"
              :class="{ 'feed__action-btn--active': isAppreciated(photo.id) }"
              @click="toggleAppreciate(photo.id)"
            >
              <span
                class="material-symbols-outlined"
                :style="{ fontVariationSettings: isAppreciated(photo.id) ? `'FILL' 1` : `'FILL' 0` }"
              >favorite</span>
              <span class="feed__action-label">
                {{ t(isAppreciated(photo.id) ? 'feed.appreciated' : 'feed.appreciate') }}
              </span>
            </button>
            <button class="feed__action-btn" @click="handleShare(photo)">
              <span class="material-symbols-outlined">share</span>
              <span class="feed__action-label feed__action-label--hide-mobile">{{ t('feed.share') }}</span>
            </button>
          </div>
        </article>

        <!-- Load more -->
        <div v-if="hasMore" class="feed__load-more-wrap">
          <button class="feed__load-more" :disabled="isLoading" @click="handleLoadMore">
            {{ isLoading ? t('common.loading') : t('feed.loadMore') }}
            <span class="material-symbols-outlined feed__load-more-icon">expand_more</span>
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="feed__sidebar">
        <!-- CTA -->
        <div class="feed__cta">
          <h3 class="feed__cta-title">{{ t('feed.contributeTitle') }}</h3>
          <p class="feed__cta-text">{{ t('feed.contributeDescription') }}</p>
          <RouterLink to="/dodaj-zdjecie" class="feed__cta-btn">
            {{ t('feed.uploadArchive') }}
          </RouterLink>
        </div>

        <!-- Suggested Collections (from real categories) -->
        <section v-if="categoriesStore.topCategories.length" class="feed__collections">
          <h3 class="feed__section-heading">
            <span class="feed__heading-line"></span>
            {{ t('feed.suggestedCollections') }}
          </h3>
          <div class="feed__collections-list">
            <RouterLink
              v-for="cat in categoriesStore.topCategories"
              :key="cat.id"
              :to="{ path: '/przegladaj', query: { categoryId: String(cat.id) } }"
              class="feed__collection"
            >
              <div class="feed__collection-thumb feed__collection-thumb--placeholder">
                <span class="material-symbols-outlined">photo_library</span>
              </div>
              <div>
                <h4 class="feed__collection-title">{{ cat.name }}</h4>
              </div>
            </RouterLink>
          </div>
        </section>

        <!-- Recent Contributors -->
        <section v-if="recentAuthors.length" class="feed__contributors">
          <h3 class="feed__section-heading">
            <span class="feed__heading-line"></span>
            {{ t('feed.recentContributors') }}
          </h3>
          <div class="feed__contributors-grid">
            <div
              v-for="author in recentAuthors"
              :key="author.id"
              class="feed__contributors-avatar feed__contributors-avatar--placeholder"
            >
              {{ author.displayName.charAt(0).toUpperCase() }}
            </div>
          </div>
        </section>
      </aside>
    </main>

    <!-- Mobile bottom nav -->
    <nav class="feed__mobile-nav" aria-label="Mobile navigation">
      <RouterLink to="/przegladaj" class="feed__mobile-link">
        <span class="material-symbols-outlined">search</span>
        <span class="feed__mobile-label">Przeglądaj</span>
      </RouterLink>
      <RouterLink to="/mapa" class="feed__mobile-link">
        <span class="material-symbols-outlined">map</span>
        <span class="feed__mobile-label">Mapa</span>
      </RouterLink>
      <RouterLink to="/dodaj-zdjecie" class="feed__mobile-link">
        <span class="material-symbols-outlined">add_a_photo</span>
        <span class="feed__mobile-label">Dodaj</span>
      </RouterLink>
      <RouterLink to="/moje-zdjecia" class="feed__mobile-link">
        <span class="material-symbols-outlined">person</span>
        <span class="feed__mobile-label">Profil</span>
      </RouterLink>
    </nav>

    <!-- FAB -->
    <RouterLink to="/dodaj-zdjecie" class="feed__fab" :aria-label="t('feed.uploadArchive')">
      <span class="material-symbols-outlined feed__fab-icon">edit</span>
    </RouterLink>
  </div>
</template>

<style scoped>
/* ==========================================================================
   Feed Page — Community Chronicles
   ========================================================================== */

.feed {
  min-height: 100vh;
  background: var(--surface);
  color: var(--on-surface);
  font-family: var(--font-body);
}

/* --------------------------------------------------------------------------
   Main layout
   -------------------------------------------------------------------------- */
.feed__main {
  display: flex;
  flex-direction: column;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
  gap: 4rem;
}

@media (min-width: 1024px) {
  .feed__main {
    flex-direction: row;
    padding: 3rem 1.5rem;
  }
}

/* --------------------------------------------------------------------------
   Feed column
   -------------------------------------------------------------------------- */
.feed__column {
  flex: 1;
  max-width: 42rem;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .feed__column {
    margin: 0;
  }
}

.feed__header {
  margin-bottom: 3rem;
}

.feed__title {
  font-family: var(--font-headline);
  font-size: var(--display-sm);
  font-weight: 300;
  font-style: italic;
  color: var(--on-surface);
  margin: 0 0 0.5rem;
}

.feed__subtitle {
  font-family: var(--font-body);
  font-size: var(--label-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  margin: 0;
}

/* Loading / Empty */
.feed__loading,
.feed__empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--on-surface-variant);
  font-size: var(--body-lg);
}

.feed__empty-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--primary);
  font-weight: 600;
}

/* --------------------------------------------------------------------------
   Feed item (article)
   -------------------------------------------------------------------------- */
.feed__item {
  margin-bottom: 5rem;
}

.feed__item:last-child {
  margin-bottom: 0;
}

/* Contributor header */
.feed__item-contributor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.feed__contributor-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.feed__contributor-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  object-fit: cover;
  filter: grayscale(1);
  opacity: 0.8;
}

.feed__contributor-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-container-highest);
  color: var(--on-surface);
  font-family: var(--font-headline);
  font-size: var(--title-lg);
  font-weight: 700;
  filter: none;
  opacity: 1;
}

.feed__contributor-name {
  font-family: var(--font-label);
  font-size: var(--body-sm);
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.feed__contributor-role {
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--on-surface-variant);
  margin: 0;
}

/* Photo */
.feed__item-photo {
  display: block;
  position: relative;
  margin-bottom: 1.5rem;
  text-decoration: none;
  color: inherit;
}

.feed__photo {
  width: 100%;
  aspect-ratio: 3/2;
  object-fit: cover;
  border-radius: var(--radius-sm);
  box-shadow: 0 40px 60px -20px rgba(28, 28, 23, 0.04);
}

.feed__photo-overlay {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: var(--surface);
  opacity: 0.9;
  backdrop-filter: blur(12px);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--ghost-border);
}

.feed__photo-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feed__photo-meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: var(--on-surface);
}

.feed__meta-icon {
  font-size: 0.875rem !important;
}

/* Text content */
.feed__item-text {
  margin-bottom: 1rem;
}

.feed__item-title-link {
  text-decoration: none;
  color: inherit;
}

.feed__item-title {
  font-family: var(--font-headline);
  font-size: var(--headline-lg);
  font-style: italic;
  font-weight: 400;
  color: var(--on-surface);
  margin: 0 0 0.75rem;
}

.feed__item-quote {
  font-family: var(--font-headline);
  font-size: var(--body-lg);
  line-height: 1.7;
  color: var(--on-surface-variant);
  margin: 0;
}

/* Action buttons */
.feed__item-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ghost-border);
}

.feed__action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: color var(--transition-fast);
  padding: 0;
}

.feed__action-btn:hover {
  color: var(--primary);
}

.feed__action-btn--active {
  color: var(--secondary);
}

.feed__action-btn--active:hover {
  color: var(--secondary);
  opacity: 0.8;
}

.feed__action-label {
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

@media (max-width: 639px) {
  .feed__action-label--hide-mobile {
    display: none;
  }
}

/* Load more */
.feed__load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.feed__load-more {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-container-low);
  border: 1px solid var(--ghost-border);
  color: var(--on-surface-variant);
  padding: 0.75rem 2rem;
  border-radius: var(--radius-full);
  font-family: var(--font-label);
  font-size: var(--body-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.feed__load-more:hover:not(:disabled) {
  background: var(--surface-container);
}

.feed__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feed__load-more-icon {
  font-size: 1rem !important;
}

/* --------------------------------------------------------------------------
   Sidebar
   -------------------------------------------------------------------------- */
.feed__sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

@media (min-width: 1024px) {
  .feed__sidebar {
    width: 20rem;
    flex-shrink: 0;
  }
}

/* CTA card */
.feed__cta {
  background: var(--surface-container-highest);
  padding: 2rem;
  border-radius: var(--radius-lg);
}

.feed__cta-title {
  font-family: var(--font-headline);
  font-size: var(--headline-sm);
  font-style: italic;
  color: var(--primary);
  margin: 0 0 1rem;
}

.feed__cta-text {
  font-size: var(--body-sm);
  color: var(--on-surface-variant);
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.feed__cta-btn {
  display: block;
  width: 100%;
  background: var(--secondary);
  color: var(--on-secondary);
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-align: center;
  text-decoration: none;
  padding: 0.875rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.feed__cta-btn:hover {
  opacity: 0.9;
}

.feed__cta-btn:active {
  transform: scale(0.97);
}

/* Section headings */
.feed__section-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-label);
  font-size: var(--label-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--on-surface-variant);
  margin: 0 0 1.5rem;
}

.feed__heading-line {
  display: block;
  width: 2rem;
  height: 1px;
  background: var(--outline-variant);
  opacity: 0.3;
}

/* Collections */
.feed__collections-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feed__collection {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.feed__collection:hover .feed__collection-title {
  color: var(--primary);
}

.feed__collection-thumb {
  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-container-highest);
  flex-shrink: 0;
}

.feed__collection-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transition: transform var(--transition-slow);
}

.feed__collection:hover .feed__collection-thumb img {
  transform: scale(1.1);
}

.feed__collection-thumb--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--on-primary);
}

.feed__collection-thumb--placeholder .material-symbols-outlined {
  font-size: 1.5rem;
}

.feed__collection-title {
  font-family: var(--font-headline);
  font-size: var(--body-lg);
  font-style: italic;
  color: var(--on-surface);
  margin: 0 0 0.25rem;
  transition: color var(--transition-fast);
}

.feed__collection-count {
  font-family: var(--font-label);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--on-surface-variant);
  margin: 0;
}

/* Contributors */
.feed__contributors-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.feed__contributors-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-full);
  object-fit: cover;
  filter: grayscale(1);
  border: 1px solid var(--ghost-border);
  cursor: pointer;
  transition: filter var(--transition-normal);
}

.feed__contributors-avatar:hover {
  filter: grayscale(0);
}

.feed__contributors-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-container-highest);
  color: var(--on-surface);
  font-family: var(--font-headline);
  font-size: var(--title-lg);
  font-weight: 700;
  filter: none;
}

/* --------------------------------------------------------------------------
   Mobile bottom nav
   -------------------------------------------------------------------------- */
.feed__mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: var(--z-sticky);
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 4rem;
  padding: 0 1rem;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--surface);
  opacity: 0.8;
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--ghost-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
}

@media (min-width: 1024px) {
  .feed__mobile-nav {
    display: none;
  }
}

.feed__mobile-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--on-surface);
  opacity: 0.5;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

.feed__mobile-link--active {
  color: var(--primary-container);
  opacity: 1;
  transform: scale(1.1);
}

.feed__mobile-label {
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
}

/* --------------------------------------------------------------------------
   FAB
   -------------------------------------------------------------------------- */
.feed__fab {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 4rem;
  height: 4rem;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--transition-fast);
  z-index: var(--z-dropdown);
}

.feed__fab:hover {
  transform: scale(1.05);
}

.feed__fab:active {
  transform: scale(0.95);
}

.feed__fab-icon {
  font-size: 1.75rem;
}

@media (min-width: 1024px) {
  .feed__fab {
    bottom: 3rem;
    right: 3rem;
  }
}
</style>
