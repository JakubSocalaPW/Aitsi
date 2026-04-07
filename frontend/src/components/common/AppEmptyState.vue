<script setup lang="ts">
defineProps<{
  message: string
  actionLabel?: string
  actionTo?: string
}>()
</script>

<template>
  <div class="empty-state">
    <p class="empty-state__message">{{ message }}</p>
    <router-link v-if="actionTo" :to="actionTo" class="btn btn-primary">
      {{ actionLabel }}
    </router-link>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-state__message {
  font-family: var(--font-body);
  font-size: var(--body-lg);
  color: var(--on-surface-variant);
  margin-bottom: 16px;
}
</style>
