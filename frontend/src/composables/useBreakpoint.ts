import { ref, onMounted, onUnmounted } from 'vue'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export function useBreakpoint() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const isMobile = ref(width.value < breakpoints.md)
  const isTablet = ref(width.value >= breakpoints.md && width.value < breakpoints.lg)
  const isDesktop = ref(width.value >= breakpoints.lg)

  function update() {
    width.value = window.innerWidth
    isMobile.value = width.value < breakpoints.md
    isTablet.value = width.value >= breakpoints.md && width.value < breakpoints.lg
    isDesktop.value = width.value >= breakpoints.lg
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, isMobile, isTablet, isDesktop }
}
