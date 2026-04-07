import ky from 'ky'

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('cas_token')
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      }
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem('cas_token')
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/logowanie')) {
            window.location.href = '/logowanie'
          }
        }
      }
    ]
  }
})

export { api }
