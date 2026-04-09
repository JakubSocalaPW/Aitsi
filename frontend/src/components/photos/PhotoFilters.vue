<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CategoryNode } from '@/types'

const props = defineProps<{
  categoryId?: number
  dateFrom?: string
  dateTo?: string
  tag?: string
  sortBy?: string
  sortDir?: string
  categories: CategoryNode[]
}>()

const emit = defineEmits<{
  'update:categoryId': [value: number | undefined]
  'update:dateFrom': [value: string]
  'update:dateTo': [value: string]
  'update:tag': [value: string]
  'update:sortBy': [value: string]
  'update:sortDir': [value: string]
  reset: []
}>()

const { t } = useI18n()

const nodeMap = computed(() => {
  const map = new Map<number, CategoryNode>()
  function walk(nodes: CategoryNode[]) {
    for (const n of nodes) {
      map.set(n.id, n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(props.categories)
  return map
})

const selectedNode = computed(() =>
  props.categoryId != null ? nodeMap.value.get(props.categoryId) : undefined
)

const breadcrumb = computed(() => {
  if (props.categoryId == null) return []
  const path: CategoryNode[] = []
  let node = nodeMap.value.get(props.categoryId)
  while (node) {
    path.unshift(node)
    node = node.parentId != null ? nodeMap.value.get(node.parentId) : undefined
  }
  return path
})

const displayedCategories = computed(() => {
  if (props.categoryId == null) return props.categories
  const node = selectedNode.value
  if (!node) return props.categories
  if (node.children?.length) return node.children
  // Liść: pokaż rodzeństwo (dzieci rodzica)
  return node.parentId != null
    ? (nodeMap.value.get(node.parentId)?.children ?? props.categories)
    : props.categories
})

function selectCategory(id: number) {
  if (props.categoryId === id) {
    // Odznacz: wróć do rodzica
    emit('update:categoryId', selectedNode.value?.parentId ?? undefined)
  } else {
    emit('update:categoryId', id)
  }
}

function onDateFromInput(event: Event) {
  emit('update:dateFrom', (event.target as HTMLInputElement).value)
}

function onDateToInput(event: Event) {
  emit('update:dateTo', (event.target as HTMLInputElement).value)
}

function onTagInput(event: Event) {
  emit('update:tag', (event.target as HTMLInputElement).value)
}

function onSortByChange(event: Event) {
  emit('update:sortBy', (event.target as HTMLSelectElement).value)
}

function onSortDirChange(event: Event) {
  emit('update:sortDir', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <aside class="filters" aria-label="Filtry wyszukiwania">
    <div class="filters__header">
      <h2 class="filters__heading">{{ t('search.filters') }}</h2>
      <button class="filters__reset" type="button" @click="emit('reset')">
        {{ t('search.clearFilters') }}
      </button>
    </div>

    <details class="filters__section" open>
      <summary class="filters__summary">Kategoria</summary>
      <div class="filters__content">
        <nav v-if="breadcrumb.length > 0" class="filters__cat-nav" aria-label="Ścieżka kategorii">
          <button type="button" class="filters__cat-up" @click="emit('update:categoryId', undefined)">
            Wszystkie
          </button>
          <template v-for="(node, i) in breadcrumb" :key="node.id">
            <span class="filters__cat-sep" aria-hidden="true">›</span>
            <button
              v-if="i < breadcrumb.length - 1"
              type="button"
              class="filters__cat-up"
              @click="emit('update:categoryId', node.id)"
            >{{ node.name }}</button>
            <span v-else class="filters__cat-current">{{ node.name }}</span>
          </template>
        </nav>

        <div class="filters__chips">
          <button
            v-for="cat in displayedCategories"
            :key="cat.id"
            type="button"
            class="filters__chip"
            :class="{ 'filters__chip--active': categoryId === cat.id }"
            :aria-pressed="categoryId === cat.id"
            @click="selectCategory(cat.id)"
          >
            {{ cat.name }}
            <span v-if="cat.photoCount != null" class="filters__chip-count">{{ cat.photoCount }}</span>
            <span v-if="cat.children?.length" class="filters__chip-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </details>

    <details class="filters__section" open>
      <summary class="filters__summary">Data</summary>
      <div class="filters__content">
        <div class="filters__fields">
          <label class="filters__label">
            <span class="filters__label-text">Od</span>
            <input
              type="text"
              class="filters__input"
              :value="dateFrom"
              placeholder="np. 1960"
              pattern="\d{4}(-\d{2}(-\d{2})?)?"
              inputmode="numeric"
              @input="onDateFromInput"
            />
          </label>
          <label class="filters__label">
            <span class="filters__label-text">Do</span>
            <input
              type="text"
              class="filters__input"
              :value="dateTo"
              placeholder="np. 1980"
              pattern="\d{4}(-\d{2}(-\d{2})?)?"
              inputmode="numeric"
              @input="onDateToInput"
            />
          </label>
        </div>
      </div>
    </details>

    <details class="filters__section" open>
      <summary class="filters__summary">Tag</summary>
      <div class="filters__content">
        <label class="filters__label">
          <span class="filters__label-text">Nazwa tagu</span>
          <input
            type="text"
            class="filters__input"
            :value="tag"
            placeholder="np. Architektura"
            @input="onTagInput"
          />
        </label>
      </div>
    </details>

    <details class="filters__section" open>
      <summary class="filters__summary">Sortowanie</summary>
      <div class="filters__content">
        <div class="filters__fields">
          <label class="filters__label">
            <span class="filters__label-text">Sortuj po</span>
            <select
              class="filters__select"
              :value="sortBy || 'relevance'"
              @change="onSortByChange"
            >
              <option value="relevance">Trafność</option>
              <option value="date">Data zdjęcia</option>
              <option value="createdAt">Data dodania</option>
            </select>
          </label>
          <label class="filters__label">
            <span class="filters__label-text">Kolejnosc</span>
            <select
              class="filters__select"
              :value="sortDir || 'desc'"
              @change="onSortDirChange"
            >
              <option value="desc">Malejąco</option>
              <option value="asc">Rosnąco</option>
            </select>
          </label>
        </div>
      </div>
    </details>
  </aside>
</template>

<style scoped>
.filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 16px;
  background: var(--surface-container-low);
}

.filters__heading {
  font-family: var(--font-label);
  font-size: var(--label-lg);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
  margin: 0;
}

.filters__reset {
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--on-surface-variant);
  font-size: var(--label-md);
  font-family: var(--font-label);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.filters__reset:hover {
  color: var(--primary);
}

.filters__section {
  padding: 12px 0;
}

.filters__section + .filters__section {
  background-image: linear-gradient(
    to right,
    var(--surface-container-high),
    var(--surface-container-high)
  );
  background-size: 100% 1px;
  background-repeat: no-repeat;
  background-position: top;
}

.filters__summary {
  font-family: var(--font-label);
  font-size: var(--label-lg);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
  cursor: pointer;
  padding: 4px 0;
  list-style: none;
  user-select: none;
}

.filters__summary::-webkit-details-marker {
  display: none;
}

.filters__content {
  padding-top: 12px;
}

.filters__cat-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 10px;
  font-size: var(--label-md);
}

.filters__cat-up {
  padding: 2px 4px;
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: var(--label-md);
  font-family: var(--font-label);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.filters__cat-up:hover {
  background: rgba(0, 70, 74, 0.08);
}

.filters__cat-sep {
  color: var(--on-surface-variant);
  opacity: 0.5;
  font-size: var(--label-md);
}

.filters__cat-current {
  padding: 2px 4px;
  font-size: var(--label-md);
  font-weight: 600;
  color: var(--on-surface);
}

.filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filters__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--ghost-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--on-surface);
  font-size: var(--label-lg);
  font-family: var(--font-label);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filters__chip:hover {
  color: var(--primary);
  background: rgba(0, 70, 74, 0.05);
}

.filters__chip--active {
  background: var(--primary);
  color: var(--on-primary);
  border-color: var(--primary);
}

.filters__chip--active:hover {
  background: var(--primary-container);
  border-color: var(--primary-container);
  color: var(--on-primary);
}

.filters__chip-count {
  font-size: var(--label-sm);
  opacity: 0.7;
}

.filters__chip-arrow {
  font-size: var(--label-md);
  opacity: 0.6;
  margin-left: 2px;
}

.filters__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters__label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filters__label-text {
  font-family: var(--font-label);
  font-size: var(--label-md);
  font-weight: 500;
  color: var(--on-surface-variant);
}

.filters__input,
.filters__select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #ccc;
  border-radius: var(--radius-md);
  background: var(--surface-container-low);
  color: var(--on-surface);
  font-size: var(--title-md);
  font-family: var(--font-body);
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

.filters__input::placeholder {
  color: var(--on-surface-variant);
}

.filters__input:focus,
.filters__select:focus {
  outline: none;
  background: var(--surface-container-lowest);
  border-color: var(--primary);
}

.filters__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236f7979' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
</style>
