<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  size?: 'sm' | 'md' | 'lg'
}>(), { label: 'Ladowanie...', size: 'md' })
</script>

<template>
  <div class="spinner-container" :class="`spinner--${size}`" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.spinner {
  border: 3px solid var(--surface-container-high);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner--sm .spinner { width: 20px; height: 20px; border-width: 2px; }
.spinner--md .spinner { width: 32px; height: 32px; }
.spinner--lg .spinner { width: 44px; height: 44px; border-width: 4px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 1.5s; }
}
</style>
