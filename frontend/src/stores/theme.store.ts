import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeName = 'light' | 'dark' | 'high-contrast'

export const useThemeStore = defineStore('theme', () => {
  const current = ref<ThemeName>(getInitialTheme())

  function getInitialTheme(): ThemeName {
    const stored = localStorage.getItem('cas_theme') as ThemeName | null
    if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) return stored
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-contrast: more)').matches) return 'high-contrast'
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    }
    return 'light'
  }

  function setTheme(name: ThemeName) {
    current.value = name
    document.documentElement.setAttribute('data-theme', name)
    localStorage.setItem('cas_theme', name)
  }

  // Apply initial theme
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', current.value)
  }

  return { current, setTheme }
})
