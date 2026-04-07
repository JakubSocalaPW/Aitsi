import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FontSize = 'small' | 'normal' | 'large'

export const useFontSizeStore = defineStore('fontsize', () => {
  const current = ref<FontSize>(getInitialSize())

  function getInitialSize(): FontSize {
    const stored = localStorage.getItem('cas_fontsize') as FontSize | null
    if (stored && ['small', 'normal', 'large'].includes(stored)) return stored
    return 'normal'
  }

  function setSize(size: FontSize) {
    current.value = size
    document.documentElement.setAttribute('data-fontsize', size)
    localStorage.setItem('cas_fontsize', size)
  }

  // Apply initial size
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-fontsize', current.value)
  }

  return { current, setSize }
})
