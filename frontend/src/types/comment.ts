export interface Comment {
  id: number
  text: string
  photoId: number
  author: { id: number; displayName: string; avatarUrl?: string }
  createdAt: string
  updatedAt?: string
}
