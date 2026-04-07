import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CategoryNode } from '@/types'
import { categoriesApi } from '@/api/categories.api'

export const useCategoriesStore = defineStore('categories', () => {
  const tree = ref<CategoryNode[]>([])
  const flatMap = ref<Map<number, CategoryNode>>(new Map())
  const selectedId = ref<number | null>(null)
  const isLoading = ref(false)

  function buildFlatMap(nodes: CategoryNode[]) {
    const map = new Map<number, CategoryNode>()
    function walk(list: CategoryNode[]) {
      for (const node of list) {
        map.set(node.id, node)
        if (node.children?.length) walk(node.children)
      }
    }
    walk(nodes)
    flatMap.value = map
  }

  function setTree(nodes: CategoryNode[]) {
    tree.value = nodes
    buildFlatMap(nodes)
  }

  async function fetchTree() {
    isLoading.value = true
    try {
      const data = await categoriesApi.getTree()
      setTree(data)
    } finally {
      isLoading.value = false
    }
  }

  function breadcrumbPath(id: number): CategoryNode[] {
    const path: CategoryNode[] = []
    let current = flatMap.value.get(id)
    while (current) {
      path.unshift(current)
      current = current.parentId != null ? flatMap.value.get(current.parentId) : undefined
    }
    return path
  }

  const topCategories = computed(() => tree.value)

  function childrenOf(id: number): CategoryNode[] {
    return flatMap.value.get(id)?.children ?? []
  }

  const selectedCategory = computed(() =>
    selectedId.value ? flatMap.value.get(selectedId.value) ?? null : null
  )

  return {
    tree, flatMap, selectedId, isLoading,
    topCategories, selectedCategory,
    setTree, fetchTree, breadcrumbPath, childrenOf
  }
})
