<script setup lang="ts">
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()

function typeIcon(type: string): string {
  switch (type) {
    case 'success': return '\u2713'
    case 'error': return '\u2715'
    case 'warning': return '\u26A0'
    default: return '\u2139'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="assertive" aria-atomic="true">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.type}`]"
          role="alert"
        >
          <span class="toast__icon" aria-hidden="true">{{ typeIcon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" @click="toastStore.dismiss(toast.id)" aria-label="Zamknij powiadomienie">
            &#x2715;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: var(--z-toast, 9000);
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
  width: calc(100% - 32px);
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--ghost-border);
  background: var(--surface-container-lowest);
  color: var(--on-surface);
  font-family: var(--font-body);
  font-size: var(--body-md);
  box-shadow: var(--shadow-md);
}

.toast--success .toast__icon { color: var(--primary); }
.toast--error .toast__icon { color: var(--error); }
.toast--warning .toast__icon { color: var(--secondary); }
.toast--info .toast__icon { color: var(--primary); }

.toast__icon {
  font-size: var(--body-lg);
  flex-shrink: 0;
}

.toast__message { flex: 1; }

.toast__close {
  background: none;
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  font-size: var(--body-md);
  line-height: 1;
  transition: color var(--transition-fast);
}

.toast__close:hover {
  color: var(--on-surface);
}

.toast-enter-active { transition: all var(--transition-normal, 250ms) ease; }
.toast-leave-active { transition: all var(--transition-fast, 150ms) ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
.toast-move { transition: transform var(--transition-normal, 250ms) ease; }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
