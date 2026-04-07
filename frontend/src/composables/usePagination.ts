import { computed, type Ref } from 'vue'

export function usePagination(page: Ref<number>, totalPages: Ref<number>) {
  const visiblePages = computed(() => {
    const total = totalPages.value
    const current = page.value
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: (number | '...')[] = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)

    return pages
  })

  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  return { visiblePages, hasPrev, hasNext }
}
