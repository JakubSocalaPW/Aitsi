import { api } from './client'
import type { User, UserBlockPayload, PaginatedResponse } from '@/types'

export interface AdminStats {
  totalPhotos: number
  totalUsers: number
  blockedUsers: number
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
}
