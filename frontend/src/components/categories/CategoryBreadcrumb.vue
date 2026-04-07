<script setup lang="ts">
defineProps<{
  path: Array<{ id: number; name: string }>
}>()
</script>

<template>
  <nav aria-label="Sciezka kategorii" class="category-breadcrumb">
    <ol>
      <li v-for="(item, i) in path" :key="item.id">
        <router-link v-if="i < path.length - 1" :to="`/przegladaj/${item.id}`">
          {{ item.name }}
        </router-link>
        <span v-else aria-current="page">{{ item.name }}</span>
        <span v-if="i < path.length - 1" class="category-breadcrumb__separator" aria-hidden="true"> › </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.category-breadcrumb ol {
  list-style: none;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0;
  margin: 0;
}

.category-breadcrumb li {
  display: inline-flex;
  align-items: center;
}

.category-breadcrumb a {
  color: var(--primary);
  font-size: var(--label-lg);
  text-decoration: none;
}

.category-breadcrumb a:hover {
  color: var(--primary-container);
  text-decoration: underline;
}

.category-breadcrumb a:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.category-breadcrumb span[aria-current="page"] {
  color: var(--on-surface);
  font-weight: 600;
  font-size: var(--label-lg);
}

.category-breadcrumb__separator {
  color: var(--on-surface-variant);
  margin: 0 4px;
}
</style>
