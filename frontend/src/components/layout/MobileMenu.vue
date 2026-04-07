<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore, type ThemeName } from '@/stores/theme.store'
import { useFontSizeStore, type FontSize } from '@/stores/fontsize.store'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const fontSizeStore = useFontSizeStore()

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

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (event.key === 'Tab' && menuRef.value) {
    const focusable = menuRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

function handleNavClick() {
  emit('close')
}

function handleLogout() {
  authStore.logout()
  emit('close')
  router.push({ name: 'landing' })
}

onMounted(async () => {
  previouslyFocusedElement = document.activeElement as HTMLElement
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'

  await nextTick()
  closeButtonRef.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  previouslyFocusedElement?.focus()
})
</script>

<template>
  <div
    id="mobile-menu"
    ref="menuRef"
    class="mobile-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Menu nawigacyjne"
  >
    <div class="mobile-menu__backdrop" @click="emit('close')" />
    <div class="mobile-menu__panel">
      <div class="mobile-menu__header">
        <span class="mobile-menu__title">Menu</span>
        <button
          ref="closeButtonRef"
          class="mobile-menu__close"
          :aria-label="t('common.cancel')"
          @click="emit('close')"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <nav class="mobile-menu__nav" role="navigation" aria-label="Menu nawigacyjne">
        <ul class="mobile-menu__list">
          <li>
            <router-link to="/przegladaj" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.browse') }}
            </router-link>
          </li>
          <li>
            <router-link to="/kroniki" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.feed') }}
            </router-link>
          </li>
          <li>
            <router-link to="/mapa" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.map') }}
            </router-link>
          </li>
          <li v-if="authStore.isCreator">
            <router-link to="/panel-tworcy" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.creatorDashboard') }}
            </router-link>
          </li>
          <li v-if="authStore.isAdmin">
            <router-link to="/admin" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.admin') }}
            </router-link>
          </li>
        </ul>

        <ul v-if="authStore.isAuthenticated" class="mobile-menu__list mobile-menu__list--user">
          <li>
            <router-link to="/moje-zdjecia" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.myPhotos') }}
            </router-link>
          </li>
          <li v-if="authStore.isCreator">
            <router-link to="/dodaj-zdjecie" class="mobile-menu__link" @click="handleNavClick">
              {{ t('nav.upload') }}
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="mobile-menu__settings">
        <div class="mobile-menu__settings-section">
          <span class="mobile-menu__settings-label">{{ t('settings.theme') }}</span>
          <div role="radiogroup" :aria-label="t('settings.theme')" class="mobile-menu__settings-options">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              role="radio"
              :aria-checked="themeStore.current === option.value"
              class="mobile-menu__settings-btn"
              :class="{ 'mobile-menu__settings-btn--active': themeStore.current === option.value }"
              @click="themeStore.setTheme(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="mobile-menu__settings-section">
          <span class="mobile-menu__settings-label">{{ t('settings.fontSize') }}</span>
          <div role="radiogroup" :aria-label="t('settings.fontSize')" class="mobile-menu__settings-options">
            <button
              v-for="option in fontSizeOptions"
              :key="option.value"
              role="radio"
              :aria-checked="fontSizeStore.current === option.value"
              class="mobile-menu__settings-btn"
              :class="{ 'mobile-menu__settings-btn--active': fontSizeStore.current === option.value }"
              @click="fontSizeStore.setSize(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="mobile-menu__footer">
        <template v-if="authStore.isAuthenticated">
          <button class="mobile-menu__link" @click="handleLogout">
            {{ t('nav.logout') }}
          </button>
        </template>
        <template v-else>
          <router-link to="/logowanie" class="mobile-menu__link" @click="handleNavClick">
            {{ t('nav.login') }}
          </router-link>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  justify-content: flex-end;
}

.mobile-menu__backdrop {
  position: absolute;
  inset: 0;
  background: var(--overlay);
  animation: fade-in var(--transition-normal) ease;
}

.mobile-menu__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(320px, 85vw);
  height: 100%;
  background: var(--surface-container-lowest);
  box-shadow: var(--shadow-lg);
  animation: slide-in-right var(--transition-normal) ease;
  overflow-y: auto;
}

.mobile-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface-container-low);
}

.mobile-menu__title {
  font-family: var(--font-headline);
  font-size: var(--headline-sm);
  color: var(--on-surface);
  line-height: 1;
}

.mobile-menu__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--on-surface);
  font-size: 1.5rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.mobile-menu__close:hover {
  background: var(--surface-container);
}

.mobile-menu__close:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.mobile-menu__nav {
  flex: 1;
  padding: 8px 0;
}

.mobile-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-menu__list--user {
  border-top: 1px solid var(--ghost-border);
  padding-top: 8px;
  margin-top: 8px;
}

.mobile-menu__link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 8px 16px;
  color: var(--on-surface);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: var(--body-lg);
  font-weight: 500;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.mobile-menu__link:hover {
  background: var(--surface-container-low);
}

.mobile-menu__link:focus-visible {
  outline: var(--focus-ring);
  outline-offset: -2px;
}

.mobile-menu__link.router-link-active {
  color: var(--primary);
  font-weight: 600;
}

.mobile-menu__settings {
  padding: 16px;
  background: var(--surface-container-low);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-menu__settings-label {
  display: block;
  font-family: var(--font-label);
  font-size: var(--label-md);
  font-weight: 600;
  color: var(--on-surface-variant);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mobile-menu__settings-options {
  display: flex;
  gap: 4px;
}

.mobile-menu__settings-btn {
  flex: 1;
  padding: 8px 6px;
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

.mobile-menu__settings-btn:hover {
  color: var(--primary);
  border-color: var(--outline-variant);
}

.mobile-menu__settings-btn--active {
  color: var(--primary);
  background: rgba(0, 70, 74, 0.08);
  border-color: var(--primary);
  font-weight: 600;
}

.mobile-menu__footer {
  padding: 16px;
  background: var(--surface-container-low);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu__backdrop,
  .mobile-menu__panel {
    animation: none;
  }
}
</style>
