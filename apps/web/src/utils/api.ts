// Utilitaire pour résoudre l'URL de base de l'API
export function resolveApiBase(): string {
  const { hostname, protocol } = window.location

  // En local (dev) — utiliser /api (Vite proxy redirige vers le backend)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api'
  }

  // Production ou autre domaine — utiliser l'API sur le même protocole/domaine
  return `${protocol}//${hostname}/api`
}
