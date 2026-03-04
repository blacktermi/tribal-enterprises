// Shared API helper and types for /ops pages
// Cookie httpOnly, zero browser storage

const API = '/api'

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers as Record<string, string> || {}) },
  })
  const json = await res.json()
  return { res, json }
}

export async function apiRaw(path: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, { ...opts, credentials: 'include' })
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export function isAdmin(role?: string) {
  if (!role) return false
  const r = role.toUpperCase()
  return r === 'SUPER_ADMIN' || r === 'ADMIN'
}
