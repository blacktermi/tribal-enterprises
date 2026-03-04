// Stub for auth service

const BASE = '/api/wam'

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

export const authService = {
  async login(email: string, password: string) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async logout() {
    return request('/logout', { method: 'POST' })
  },

  async getCurrentUser() {
    return request('/me')
  },

  async getAllUsers() {
    return request('/users')
  },
}
