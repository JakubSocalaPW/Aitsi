<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore, type ThemeName } from '@/stores/theme.store'
import { useFontSizeStore, type FontSize } from '@/stores/fontsize.store'

const { t } = useI18n()
const themeStore = useThemeStore()
const fontSizeStore = useFontSizeStore()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const themeOptions: { value: ThemeName; label: string }[] = [
  { value: 'light', label: t('theme.light') },
  { value: 'dark', label: t('theme.dark') },
  { value: 'high-contrast', label: t('theme.highContrast') },
]

const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: 'small', label: t('settings.fontSmall') },
  { value: 'normal', label: t('settings.fontNormal') },
  { value: 'large', label: t('settings.fontLarge') },
]

function toggle() {
  open.value = !open.value
}

function onClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="dropdownRef" class="settings-dropdown">
    <button
      class="settings-dropdown__trigger"
      :aria-label="t('settings.label')"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="material-symbols-outlined">settings</span>
    </button>

    <div v-if="open" class="settings-dropdown__panel" :aria-label="t('settings.label')">
      <!-- Theme -->
      <div class="settings-dropdown__section">
        <span class="settings-dropdown__section-label">{{ t('settings.theme') }}</span>
        <div role="radiogroup" :aria-label="t('settings.theme')" class="settings-dropdown__options">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            role="radio"
            :aria-checked="themeStore.current === option.value"
            class="settings-dropdown__option"
            :class="{ 'settings-dropdown__option--active': themeStore.current === option.value }"
            @click="themeStore.setTheme(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Font size -->
      <div class="settings-dropdown__section">
        <span class="settings-dropdown__section-label">{{ t('settings.fontSize') }}</span>
        <div role="radiogroup" :aria-label="t('settings.fontSize')" class="settings-dropdown__options">
          <button
            v-for="option in fontSizeOptions"
            :key="option.value"
            role="radio"
            :aria-checked="fontSizeStore.current === option.value"
            class="settings-dropdown__option"
            :class="{ 'settings-dropdown__option--active': fontSizeStore.current === option.value }"
            @click="fontSizeStore.setSize(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-dropdown {
  position: relative;
}

.settings-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--on-surface-variant);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.settings-dropdown__trigger:hover {
  background: rgba(0, 0, 0, 0.05);
}

.settings-dropdown__trigger:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.settings-dropdown__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--ghost-border);
  padding: 12px;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-dropdown__section-label {
  display: block;
  font-family: var(--font-label);
  font-size: var(--label-md);
  font-weight: 600;
  color: var(--on-surface-variant);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.settings-dropdown__options {
  display: flex;
  gap: 4px;
}

.settings-dropdown__option {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--ghost-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--on-surface-variant);
  font-family: var(--font-label);
  font-size: var(--label-md);
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}

.settings-dropdown__option:hover {
  color: var(--primary);
  border-color: var(--outline-variant);
}

.settings-dropdown__option--active {
  color: var(--primary);
  background: rgba(0, 70, 74, 0.08);
  border-color: var(--primary);
  font-weight: 600;
}
</style>
