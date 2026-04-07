import { api } from './client'
import type { Comment } from '@/types'

interface BackendComment {
  id: number
  text: string
  photoId: number
  author: { id: number; displayName: string; avatarUrl?: string }
  createdAt: string
  updatedAt?: string
}

function toComment(c: BackendComment): Comment {
  return {
    id: c.id,
    text: c.text,
    photoId: c.photoId,
    author: {
      id: c.author.id,
      displayName: c.author.displayName,
      avatarUrl: c.author.avatarUrl ?? undefined,
    },
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? undefined,
  }
}

export const commentsApi = {
  async getByPhotoId(photoId: number): Promise<Comment[]> {
    const data: BackendComment[] = await api.get(`photos/${photoId}/comments`).json()
    return data.map(toComment)
  },

  async create(photoId: number, text: string): Promise<Comment> {
    const data: BackendComment = await api.post(`photos/${photoId}/comments`, { json: { text } }).json()
    return toComment(data)
  },

  async update(id: number, text: string): Promise<Comment> {
    const data: BackendComment = await api.put(`comments/${id}`, { json: { text } }).json()
    return toComment(data)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`comments/${id}`)
  },
}
