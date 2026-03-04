/**
 * WORKFLOW EDITOR - Zustand Store
 * Gestion de l'etat du workflow : noeuds, edges, execution, undo/redo
 */

import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge, WorkflowNodeData, NodeStatus, ActiveTool } from './types'
import { NODE_TEMPLATES } from './templates'

// ─── Undo/Redo snapshot ─────────────────────────────────────────────────────

interface Snapshot {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// ─── Store Interface ────────────────────────────────────────────────────────

// ─── Node highlight color ────────────────────────────────────────────────────

export type NodeColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'

// ─── Drawing path (freehand annotation) ──────────────────────────────────────

export interface DrawingPath {
  id: string
  points: number[][] // [[x, y], [x, y], ...]
  color: string
  strokeWidth: number
}

interface WorkflowStore {
  // ── Graph state ────────────────────────────────────────────
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  selectedNodeIds: string[]
  workflowName: string

  // ── Undo/Redo ──────────────────────────────────────────────
  history: Snapshot[]
  future: Snapshot[]
  canUndo: boolean
  canRedo: boolean

  // ── Execution ──────────────────────────────────────────────
  isExecuting: boolean
  executionOrder: string[] // node IDs in topological order

  // ── UI state ───────────────────────────────────────────────
  showNodePicker: boolean
  nodePickerPosition: { x: number; y: number } | null
  activeTool: ActiveTool
  showSettings: boolean

  // ── Drawing (freehand) ────────────────────────────────────
  drawingPaths: DrawingPath[]
  activeDrawingPoints: number[][] | null
  drawColor: string
  drawStrokeWidth: number

  // ── Actions ────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: Connection) => void
  onSelectionChange: (params: { nodes: WorkflowNode[] }) => void

  addNode: (nodeType: string, position?: { x: number; y: number }) => void
  removeNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  duplicateSelection: () => void
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void
  updateNodeStatus: (nodeId: string, status: NodeStatus, extra?: Partial<WorkflowNodeData>) => void
  selectNode: (nodeId: string | null) => void

  // Grouping
  groupSelectedNodes: () => void
  ungroupNodes: (groupId: string) => void

  // Color
  setSelectionColor: (color: NodeColor) => void

  addStickyNote: (position?: { x: number; y: number }) => void
  removeEdge: (edgeId: string) => void
  setActiveTool: (tool: ActiveTool) => void

  // Drawing
  startDrawing: (point: number[]) => void
  continueDrawing: (point: number[]) => void
  finishDrawing: () => void
  clearDrawings: () => void
  setDrawColor: (color: string) => void
  setDrawStrokeWidth: (width: number) => void

  // Settings
  toggleSettings: () => void

  setWorkflowName: (name: string) => void
  clearWorkflow: () => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  pushSnapshot: () => void

  // Node picker
  openNodePicker: (position?: { x: number; y: number }) => void
  closeNodePicker: () => void

  // Execution
  setExecuting: (executing: boolean) => void
  setExecutionOrder: (order: string[]) => void
  getTopologicalOrder: () => string[]

  // Get selected node
  getSelectedNode: () => WorkflowNode | undefined
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let nodeIdCounter = 0
function generateNodeId(): string {
  nodeIdCounter++
  return `node_${Date.now()}_${nodeIdCounter}`
}

function createSnapshot(nodes: WorkflowNode[], edges: WorkflowEdge[]): Snapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  }
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNodeIds: [],
  workflowName: 'Sans titre',
  history: [],
  future: [],
  canUndo: false,
  canRedo: false,
  isExecuting: false,
  executionOrder: [],
  showNodePicker: false,
  nodePickerPosition: null,
  activeTool: 'select',
  showSettings: false,
  drawingPaths: [],
  activeDrawingPoints: null,
  drawColor: '#ffffff',
  drawStrokeWidth: 3,

  // ── React Flow callbacks ──────────────────────────────────

  onNodesChange: changes => {
    set(state => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  onEdgesChange: changes => {
    set(state => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  onConnect: connection => {
    // Validate connection: check port type compatibility
    const { nodes } = get()
    const sourceNode = nodes.find(n => n.id === connection.source)
    const targetNode = nodes.find(n => n.id === connection.target)

    if (!sourceNode || !targetNode) return

    const sourceData = sourceNode.data
    const targetData = targetNode.data

    const sourcePort = sourceData.outputs.find(p => p.id === connection.sourceHandle)
    const targetPort = targetData.inputs.find(p => p.id === connection.targetHandle)

    if (!sourcePort || !targetPort) return

    // Type check: 'any' accepts all, otherwise must match
    if (
      targetPort.type !== 'any' &&
      sourcePort.type !== 'any' &&
      sourcePort.type !== targetPort.type
    ) {
      return // Incompatible types
    }

    get().pushSnapshot()
    set(state => ({
      edges: addEdge(
        {
          ...connection,
          type: 'custom',
          animated: true,
          style: { stroke: 'rgba(52, 211, 153, 0.5)', strokeWidth: 2.5 },
        },
        state.edges
      ),
    }))
  },

  // ── Selection tracking ─────────────────────────────────────

  onSelectionChange: ({ nodes: selectedNodes }) => {
    set({
      selectedNodeIds: selectedNodes.map(n => n.id),
      selectedNodeId: selectedNodes.length === 1 ? selectedNodes[0].id : null,
    })
  },

  // ── Node operations ───────────────────────────────────────

  addNode: (nodeType, position) => {
    const template = NODE_TEMPLATES[nodeType]
    if (!template) return

    get().pushSnapshot()

    const id = generateNodeId()
    const newNode: WorkflowNode = {
      id,
      type: 'workflow',
      position: position ?? { x: 250, y: 200 + get().nodes.length * 120 },
      data: {
        nodeType: template.type,
        label: template.label,
        description: template.description,
        params: { ...template.defaultParams },
        status: 'idle',
        inputs: [...template.inputs],
        outputs: [...template.outputs],
      },
    }

    set(state => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      showNodePicker: false,
    }))
  },

  removeNode: nodeId => {
    get().pushSnapshot()
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== nodeId),
      edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }))
  },

  duplicateNode: nodeId => {
    const { nodes } = get()
    const original = nodes.find(n => n.id === nodeId)
    if (!original) return

    get().pushSnapshot()

    const id = generateNodeId()
    const newNode: WorkflowNode = {
      ...JSON.parse(JSON.stringify(original)),
      id,
      position: {
        x: original.position.x + 40,
        y: original.position.y + 40,
      },
    }
    newNode.data.status = 'idle'
    newNode.data.outputUrls = undefined
    newNode.data.error = undefined

    set(state => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
    }))
  },

  updateNodeData: (nodeId, data) => {
    set(state => ({
      nodes: state.nodes.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
    }))
  },

  updateNodeStatus: (nodeId, status, extra) => {
    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, status, ...extra } } : n
      ),
    }))
  },

  selectNode: nodeId => set({ selectedNodeId: nodeId }),

  addStickyNote: position => {
    get().pushSnapshot()
    const id = generateNodeId()
    const newNode: WorkflowNode = {
      id,
      type: 'sticky-note',
      position: position ?? { x: 300, y: 300 },
      data: {
        nodeType: 'sticky-note',
        label: 'Note',
        text: '',
        color: 'yellow',
        params: {},
        status: 'idle',
        inputs: [],
        outputs: [],
      },
    }
    set(state => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      activeTool: 'hand',
    }))
  },

  removeEdge: edgeId => {
    get().pushSnapshot()
    set(state => ({
      edges: state.edges.filter(e => e.id !== edgeId),
    }))
  },

  // ── Duplicate selection (multiple nodes + their interconnecting edges) ──

  duplicateSelection: () => {
    const { nodes, edges, selectedNodeIds } = get()
    if (selectedNodeIds.length === 0) return

    // Fallback: if only 1 selected, use duplicateNode
    if (selectedNodeIds.length === 1) {
      get().duplicateNode(selectedNodeIds[0])
      return
    }

    get().pushSnapshot()

    const selectedSet = new Set(selectedNodeIds)
    const idMap = new Map<string, string>()

    // Clone selected nodes with offset
    const newNodes: WorkflowNode[] = []
    for (const nodeId of selectedNodeIds) {
      const original = nodes.find(n => n.id === nodeId)
      if (!original) continue

      const newId = generateNodeId()
      idMap.set(nodeId, newId)

      const cloned: WorkflowNode = {
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        selected: true,
        position: {
          x: original.position.x + 60,
          y: original.position.y + 60,
        },
      }
      cloned.data.status = 'idle'
      cloned.data.outputUrls = undefined
      cloned.data.error = undefined
      newNodes.push(cloned)
    }

    // Clone edges between selected nodes
    const newEdges: WorkflowEdge[] = []
    for (const edge of edges) {
      if (selectedSet.has(edge.source) && selectedSet.has(edge.target)) {
        const newSource = idMap.get(edge.source)
        const newTarget = idMap.get(edge.target)
        if (newSource && newTarget) {
          newEdges.push({
            ...JSON.parse(JSON.stringify(edge)),
            id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            source: newSource,
            target: newTarget,
          })
        }
      }
    }

    // Deselect originals
    const updatedNodes = nodes.map(n => (selectedSet.has(n.id) ? { ...n, selected: false } : n))

    set({
      nodes: [...updatedNodes, ...newNodes],
      edges: [...edges, ...newEdges],
      selectedNodeIds: newNodes.map(n => n.id),
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
    })
  },

  // ── Group selected nodes ───────────────────────────────────

  groupSelectedNodes: () => {
    const { nodes, selectedNodeIds } = get()
    if (selectedNodeIds.length < 2) return

    get().pushSnapshot()

    const selectedSet = new Set(selectedNodeIds)
    const selectedNodes = nodes.filter(n => selectedSet.has(n.id))

    // Compute bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const node of selectedNodes) {
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      // Approximate node size (240 x 120)
      maxX = Math.max(maxX, node.position.x + 240)
      maxY = Math.max(maxY, node.position.y + 120)
    }

    const padding = 40
    const groupId = generateNodeId()

    // Create group node
    const groupNode: WorkflowNode = {
      id: groupId,
      type: 'group',
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      },
      data: {
        nodeType: 'group',
        label: 'Groupe',
        params: {},
        status: 'idle',
        inputs: [],
        outputs: [],
        color: 'purple',
      },
    }

    // Reparent children: set parentId and adjust position to be relative
    const updatedNodes = nodes.map(n => {
      if (selectedSet.has(n.id)) {
        return {
          ...n,
          parentId: groupId,
          position: {
            x: n.position.x - (minX - padding),
            y: n.position.y - (minY - padding),
          },
          extent: 'parent' as const,
        }
      }
      return n
    })

    set({
      nodes: [groupNode, ...updatedNodes],
      selectedNodeIds: [groupId],
      selectedNodeId: null,
    })
  },

  // ── Ungroup ────────────────────────────────────────────────

  ungroupNodes: groupId => {
    const { nodes } = get()
    const groupNode = nodes.find(n => n.id === groupId)
    if (!groupNode || groupNode.data.nodeType !== 'group') return

    get().pushSnapshot()

    const groupPos = groupNode.position

    // Restore children to absolute positions, remove parentId
    const updatedNodes = nodes
      .filter(n => n.id !== groupId)
      .map(n => {
        if (n.parentId === groupId) {
          return {
            ...n,
            parentId: undefined,
            extent: undefined,
            position: {
              x: n.position.x + groupPos.x,
              y: n.position.y + groupPos.y,
            },
          }
        }
        return n
      })

    set({
      nodes: updatedNodes,
      selectedNodeIds: [],
      selectedNodeId: null,
    })
  },

  // ── Set color on selected nodes ────────────────────────────

  setSelectionColor: color => {
    const { nodes, selectedNodeIds } = get()
    if (selectedNodeIds.length === 0) return

    const selectedSet = new Set(selectedNodeIds)
    set({
      nodes: nodes.map(n =>
        selectedSet.has(n.id) ? { ...n, data: { ...n.data, highlightColor: color } } : n
      ),
    })
  },

  setActiveTool: tool => set({ activeTool: tool }),

  // ── Drawing (freehand annotation) ──────────────────────────

  startDrawing: point => {
    set({ activeDrawingPoints: [point] })
  },

  continueDrawing: point => {
    const { activeDrawingPoints } = get()
    if (!activeDrawingPoints) return
    set({ activeDrawingPoints: [...activeDrawingPoints, point] })
  },

  finishDrawing: () => {
    const { activeDrawingPoints, drawColor, drawStrokeWidth, drawingPaths } = get()
    if (!activeDrawingPoints || activeDrawingPoints.length < 2) {
      set({ activeDrawingPoints: null })
      return
    }
    const newPath: DrawingPath = {
      id: `draw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      points: activeDrawingPoints,
      color: drawColor,
      strokeWidth: drawStrokeWidth,
    }
    set({
      drawingPaths: [...drawingPaths, newPath],
      activeDrawingPoints: null,
    })
  },

  clearDrawings: () => set({ drawingPaths: [], activeDrawingPoints: null }),

  setDrawColor: color => set({ drawColor: color }),

  setDrawStrokeWidth: width => set({ drawStrokeWidth: width }),

  toggleSettings: () => set(state => ({ showSettings: !state.showSettings })),

  setWorkflowName: name => set({ workflowName: name }),

  clearWorkflow: () => {
    get().pushSnapshot()
    set({ nodes: [], edges: [], selectedNodeId: null, selectedNodeIds: [] })
  },

  // ── Undo/Redo ─────────────────────────────────────────────
  //
  // History stores snapshots of (nodes, edges) BEFORE each mutation.
  // historyIndex points to the snapshot we would restore on undo.
  // A separate `future` stack stores snapshots for redo.
  //
  // pushSnapshot() → called BEFORE every mutation
  //   saves current state to history, clears future
  //
  // undo() → restores history[last], pushes current to future
  // redo() → restores future[last], pushes current to history

  pushSnapshot: () => {
    const { nodes, edges, history } = get()
    const snapshot = createSnapshot(nodes, edges)
    const newHistory = [...history, snapshot]
    // Keep max 50 snapshots
    if (newHistory.length > 50) newHistory.shift()
    set({
      history: newHistory,
      future: [], // clear redo stack on new action
      canUndo: true,
      canRedo: false,
    })
  },

  undo: () => {
    const { history, future, nodes, edges } = get()
    if (history.length === 0) return

    // Save current state to future (for redo)
    const current = createSnapshot(nodes, edges)
    const newFuture = [...future, current]

    // Pop last snapshot from history
    const newHistory = [...history]
    const snapshot = newHistory.pop()!

    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      history: newHistory,
      future: newFuture,
      canUndo: newHistory.length > 0,
      canRedo: true,
      selectedNodeId: null,
      selectedNodeIds: [],
    })
  },

  redo: () => {
    const { history, future, nodes, edges } = get()
    if (future.length === 0) return

    // Save current state to history (for undo)
    const current = createSnapshot(nodes, edges)
    const newHistory = [...history, current]

    // Pop last snapshot from future
    const newFuture = [...future]
    const snapshot = newFuture.pop()!

    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      history: newHistory,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      selectedNodeId: null,
      selectedNodeIds: [],
    })
  },

  // ── Node Picker ───────────────────────────────────────────

  openNodePicker: position => {
    set({
      showNodePicker: true,
      nodePickerPosition: position ?? null,
    })
  },

  closeNodePicker: () => {
    set({ showNodePicker: false, nodePickerPosition: null })
  },

  // ── Execution ─────────────────────────────────────────────

  setExecuting: executing => set({ isExecuting: executing }),

  setExecutionOrder: order => set({ executionOrder: order }),

  getTopologicalOrder: () => {
    const { nodes, edges } = get()
    const visited = new Set<string>()
    const order: string[] = []
    const inDegree = new Map<string, number>()

    // Initialize
    for (const node of nodes) {
      inDegree.set(node.id, 0)
    }
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    }

    // BFS (Kahn's algorithm)
    const queue: string[] = []
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id)
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      order.push(nodeId)

      for (const edge of edges) {
        if (edge.source === nodeId) {
          const newDeg = (inDegree.get(edge.target) ?? 1) - 1
          inDegree.set(edge.target, newDeg)
          if (newDeg === 0) queue.push(edge.target)
        }
      }
    }

    return order
  },

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get()
    return nodes.find(n => n.id === selectedNodeId)
  },
}))
