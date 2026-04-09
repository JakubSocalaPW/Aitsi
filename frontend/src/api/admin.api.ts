import { api } from './client'
import type { User, UserBlockPayload, PaginatedResponse, PhotoSummary } from '@/types'
import { type BackendPhoto, toSummary } from './photos.api'

export interface AdminStats {
  totalPhotos: number
  totalUsers: number
  blockedUsers: number
  pendingPhotos: number
}

export const adminApi = {
  async getUsers(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<User>> {
    const searchParams: Record<string, string> = {}
    if (params?.page) searchParams.page = String(params.page)
    if (params?.pageSize) searchParams.pageSize = String(params.pageSize)
    return api.get('admin/users', { searchParams }).json()
  },

  async blockUser(id: number, data: UserBlockPayload): Promise<void> {
    await api.put(`admin/users/${id}/block`, { json: data })
  },

  async unblockUser(id: number): Promise<void> {
    await api.put(`admin/users/${id}/unblock`)
  },

  async getStats(): Promise<AdminStats> {
    return api.get('admin/stats').json()
  },

  async getPendingPhotos(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<PhotoSummary>> {
    const searchParams: Record<string, string> = {}
    if (params?.page) searchParams.page = String(params.page)
    if (params?.pageSize) searchParams.pageSize = String(params.pageSize)
    const res: { items: BackendPhoto[]; page: number; pageSize: number; totalCount: number; totalPages: number } =
      await api.get('admin/photos/pending', { searchParams }).json()
    return {
      items: res.items.map(toSummary),
      page: res.page,
      pageSize: res.pageSize,
      totalCount: res.totalCount,
      totalPages: res.totalPages,
    }
  },

  async approvePhoto(id: number): Promise<void> {
    await api.put(`admin/photos/${id}/approve`)
  },
}
