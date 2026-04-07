import { api } from './client'
import type { LoginResponse, User } from '@/types'

export const authApi = {
  async loginWithFacebook(accessToken: string): Promise<LoginResponse> {
    return api.post('auth/facebook', { json: { accessToken } }).json()
  },

  async loginWithGoogle(credential: string): Promise<LoginResponse> {
    return api.post('auth/google', { json: { credential } }).json()
  },

  async me(): Promise<User> {
    return api.get('auth/me').json()
  }
}
