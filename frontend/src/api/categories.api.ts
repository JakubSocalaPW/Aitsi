import { api } from './client'
import { photosApi } from './photos.api'
import type { Category, CategoryNode, CategoryCreatePayload, PaginatedResponse, PhotoSummary } from '@/types'

function buildTree(flat: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>()
  const roots: CategoryNode[] = []

  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export const categoriesApi = {
  async getTree(): Promise<CategoryNode[]> {
    const flat: Category[] = await api.get('categories').json()
    return buildTree(flat)
  },

  async getById(id: number): Promise<CategoryNode> {
    const cat: Category = await api.get(`categories/${id}`).json()
    return { ...cat, children: [] }
  },

  async getPhotos(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<PhotoSummary>> {
    return photosApi.search({ categoryId: id, page: params?.page, pageSize: params?.pageSize })
  },

  async create(data: CategoryCreatePayload): Promise<CategoryNode> {
    return api.post('categories', { json: data }).json()
  },

  async update(id: number, data: Partial<CategoryCreatePayload>): Promise<CategoryNode> {
    return api.put(`categories/${id}`, { json: data }).json()
  },

  async delete(id: number): Promise<void> {
    await api.delete(`categories/${id}`)
  }
}
