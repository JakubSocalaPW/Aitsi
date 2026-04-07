export interface AuthState {
  user: import('./user').User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
}

export interface LoginResponse {
  token: string
  user: import('./user').User
}
