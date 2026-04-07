import { ref } from 'vue'

const announcement = ref('')
const politeness = ref<'polite' | 'assertive'>('polite')

export function useAnnouncer() {
  function announce(message: string, level: 'polite' | 'assertive' = 'polite') {
    // Clear first to ensure re-announcement of same message
    announcement.value = ''
    politeness.value = level
    requestAnimationFrame(() => {
      announcement.value = message
    })
  }

  return { announcement, politeness, announce }
}
