/**
 * STORE INDEX - Re-exports + Tribal Ops global store stub
 * The original useTribalOpsStore comes from Tribal Ops app.
 * This is a minimal stub so that pages referencing it compile.
 */

import { create } from 'zustand'

// ─── Re-exports ──────────────────────────────────────────────────────────────
export { useAccountingStore } from './accounting'
export { useAccountingFilters } from './accountingFilters'

// ─── Global app store (stub) ─────────────────────────────────────────────────

interface TribalOpsState {
  sidebarMobileOpen: boolean
  setSidebarMobileOpen: (open: boolean) => void
}

export const useTribalOpsStore = create<TribalOpsState>((set) => ({
  sidebarMobileOpen: false,
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
}))
