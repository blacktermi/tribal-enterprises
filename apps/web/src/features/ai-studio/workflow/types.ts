/**
 * WORKFLOW EDITOR - Types
 * Systeme de noeuds visuels pour pipelines AI (style Freepik Spaces)
 */

import type { Node, Edge } from '@xyflow/react'
import type { FalModel, ModelCategory } from '../models/registry'

// ─── Port Types (what flows between nodes) ──────────────────────────────────

export type PortType = 'image' | 'video' | 'audio' | 'text' | 'any'

export interface NodePort {
  id: string
  label: string
  type: PortType
  multiple?: boolean // can accept multiple connections
}

// ─── Node Execution State ───────────────────────────────────────────────────

export type NodeStatus = 'idle' | 'running' | 'success' | 'error'

// ─── Base Node Data ─────────────────────────────────────────────────────────

export interface WorkflowNodeData extends Record<string, unknown> {
  // Identity
  nodeType: WorkflowNodeType
  label: string
  description?: string

  // Model reference (for AI nodes)
  model?: FalModel
  modelId?: string
  category?: ModelCategory

  // Parameters (set by user in properties panel)
  params: Record<string, unknown>

  // Execution state
  status: NodeStatus
  outputUrls?: string[]
  error?: string
  cost?: number
  duration?: number

  // Ports
  inputs: NodePort[]
  outputs: NodePort[]
}

// ─── Node Types ─────────────────────────────────────────────────────────────

export type WorkflowNodeType =
  // Sources
  | 'input-image'
  | 'input-video'
  | 'input-audio'
  | 'input-text'
  // AI Generation
  | 'text-to-image'
  | 'text-to-video'
  | 'image-to-image'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-audio'
  | 'text-to-3d'
  // Tools
  | 'upscale'
  | 'remove-bg'
  | 'face-swap'
  | 'vectorize'
  // AI Assistant (LLM)
  | 'assistant'
  // Utility
  | 'sticky-note'
  | 'group'
  // Output
  | 'output'

// ─── Active Tool Mode ───────────────────────────────────────────────────────

export type ActiveTool = 'hand' | 'select' | 'cut' | 'connect' | 'draw' | 'note'

// ─── Sticky Note Data ───────────────────────────────────────────────────────

export interface StickyNoteData extends Record<string, unknown> {
  nodeType: 'sticky-note'
  label: string
  text: string
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple'
  // These satisfy WorkflowNodeData shape
  params: Record<string, unknown>
  status: NodeStatus
  inputs: NodePort[]
  outputs: NodePort[]
}

// ─── Node Category (for the picker) ────────────────────────────────────────

export interface NodeCategoryDef {
  id: string
  label: string
  icon: string // lucide icon name
  color: string // tailwind color
  nodeTypes: WorkflowNodeType[]
}

// ─── Workflow Node & Edge (React Flow compatible) ───────────────────────────

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge

// ─── Workflow Definition (serializable) ─────────────────────────────────────

export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
}

// ─── Node Template (for creating new nodes from picker) ─────────────────────

export interface NodeTemplate {
  type: WorkflowNodeType
  label: string
  description: string
  icon: string
  color: string
  category: string
  inputs: NodePort[]
  outputs: NodePort[]
  defaultParams: Record<string, unknown>
  // If linked to a model category, show model selector
  modelCategory?: ModelCategory
}
