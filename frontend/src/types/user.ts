export type UserRole = 'viewer' | 'creator' | 'admin'

export interface User {
  id: number
  email: string
  displayName: string
  role: UserRole
  avatarUrl?: string
  isBlocked: boolean
  createdAt: string
}

export interface UserBlockPayload {
  reason: string
}
