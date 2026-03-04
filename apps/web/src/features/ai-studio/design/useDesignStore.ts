import { create } from 'zustand'
import type { CanvasSize, DesignTool } from './types'

interface DesignState {
  phase: 'setup' | 'editor'
  canvasSize: CanvasSize | null
  activeTool: DesignTool
  selectedObjectProps: Record<string, unknown> | null
  history: string[]
  historyIndex: number
  currentDesignId: string | null
  setPhase: (phase: 'setup' | 'editor') => void
  setCanvasSize: (size: CanvasSize) => void
  setActiveTool: (tool: DesignTool) => void
  setSelectedObjectProps: (props: Record<string, unknown> | null) => void
  setCurrentDesignId: (id: string | null) => void
  pushHistory: (json: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  reset: () => void
}

export const useDesignStore = create<DesignState>((set, get) => ({
  phase: 'setup',
  canvasSize: null,
  activeTool: 'select',
  selectedObjectProps: null,
  history: [],
  historyIndex: -1,
  currentDesignId: null,

  setPhase: (phase) => set({ phase }),
  setCanvasSize: (canvasSize) => set({ canvasSize }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedObjectProps: (selectedObjectProps) => set({ selectedObjectProps }),
  setCurrentDesignId: (currentDesignId) => set({ currentDesignId }),

  pushHistory: (json) => {
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(json)
    // Keep max 50 snapshots
    if (newHistory.length > 50) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const { historyIndex } = get()
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 })
    }
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 })
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  reset: () =>
    set({
      phase: 'setup',
      canvasSize: null,
      activeTool: 'select',
      selectedObjectProps: null,
      history: [],
      historyIndex: -1,
      currentDesignId: null,
    }),
}))
