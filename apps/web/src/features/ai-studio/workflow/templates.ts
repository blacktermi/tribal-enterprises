/**
 * WORKFLOW EDITOR - Node Templates
 * Definit les templates disponibles dans le node picker
 */

import type { NodeTemplate, NodeCategoryDef } from './types'

// ─── Node Categories ────────────────────────────────────────────────────────

export const NODE_CATEGORIES: NodeCategoryDef[] = [
  {
    id: 'sources',
    label: 'Sources',
    icon: 'Upload',
    color: 'emerald',
    nodeTypes: ['input-image', 'input-video', 'input-audio', 'input-text'],
  },
  {
    id: 'generation',
    label: 'Generation',
    icon: 'Sparkles',
    color: 'violet',
    nodeTypes: ['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-3d'],
  },
  {
    id: 'transformation',
    label: 'Transformation',
    icon: 'Repeat',
    color: 'blue',
    nodeTypes: ['image-to-image', 'image-to-video', 'video-to-video'],
  },
  {
    id: 'tools',
    label: 'Outils',
    icon: 'Wrench',
    color: 'amber',
    nodeTypes: ['upscale', 'remove-bg', 'face-swap', 'vectorize'],
  },
  {
    id: 'output',
    label: 'Sortie',
    icon: 'Download',
    color: 'cyan',
    nodeTypes: ['output'],
  },
  {
    id: 'assistant',
    label: 'Assistant IA',
    icon: 'Bot',
    color: 'pink',
    nodeTypes: ['assistant'],
  },
]

// ─── Node Templates ─────────────────────────────────────────────────────────

export const NODE_TEMPLATES: Record<string, NodeTemplate> = {
  // ── Sources ─────────────────────────────────────────────────
  'input-image': {
    type: 'input-image',
    label: 'Image Source',
    description: 'Importer une image depuis votre ordinateur',
    icon: 'Image',
    color: 'emerald',
    category: 'sources',
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }],
    defaultParams: {},
  },
  'input-video': {
    type: 'input-video',
    label: 'Video Source',
    description: 'Importer une video depuis votre ordinateur',
    icon: 'Video',
    color: 'emerald',
    category: 'sources',
    inputs: [],
    outputs: [{ id: 'video', label: 'Video', type: 'video' }],
    defaultParams: {},
  },
  'input-audio': {
    type: 'input-audio',
    label: 'Audio Source',
    description: 'Importer un fichier audio',
    icon: 'Mic',
    color: 'emerald',
    category: 'sources',
    inputs: [],
    outputs: [{ id: 'audio', label: 'Audio', type: 'audio' }],
    defaultParams: {},
  },
  'input-text': {
    type: 'input-text',
    label: 'Texte / Prompt',
    description: 'Saisir un prompt ou du texte',
    icon: 'Type',
    color: 'emerald',
    category: 'sources',
    inputs: [],
    outputs: [{ id: 'text', label: 'Texte', type: 'text' }],
    defaultParams: { text: '' },
  },

  // ── Generation ──────────────────────────────────────────────
  'text-to-image': {
    type: 'text-to-image',
    label: "Generateur d'Images",
    description: "Generer des images a partir d'un prompt",
    icon: 'ImagePlus',
    color: 'violet',
    category: 'generation',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }],
    defaultParams: {},
    modelCategory: 'image-generation',
  },
  'text-to-video': {
    type: 'text-to-video',
    label: 'Generateur de Videos',
    description: "Generer des videos a partir d'un prompt ou image",
    icon: 'Film',
    color: 'violet',
    category: 'generation',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text' },
      { id: 'image', label: 'Image (optionnel)', type: 'image' },
    ],
    outputs: [{ id: 'video', label: 'Video', type: 'video' }],
    defaultParams: {},
    modelCategory: 'video-generation',
  },
  'text-to-audio': {
    type: 'text-to-audio',
    label: 'Generateur Audio',
    description: "Generer de l'audio (voix, musique, SFX)",
    icon: 'Music',
    color: 'violet',
    category: 'generation',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text' }],
    outputs: [{ id: 'audio', label: 'Audio', type: 'audio' }],
    defaultParams: {},
    modelCategory: 'audio',
  },
  'text-to-3d': {
    type: 'text-to-3d',
    label: 'Generateur 3D',
    description: "Generer un modele 3D a partir d'un prompt ou image",
    icon: 'Box',
    color: 'violet',
    category: 'generation',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text' },
      { id: 'image', label: 'Image (optionnel)', type: 'image' },
    ],
    outputs: [{ id: 'file', label: 'Modele 3D', type: 'any' }],
    defaultParams: {},
    modelCategory: '3d',
  },

  // ── Transformation ──────────────────────────────────────────
  'image-to-image': {
    type: 'image-to-image',
    label: "Edition d'Image",
    description: "Transformer une image avec l'IA",
    icon: 'Wand2',
    color: 'blue',
    category: 'transformation',
    inputs: [
      { id: 'image', label: 'Image', type: 'image' },
      { id: 'prompt', label: 'Prompt', type: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }],
    defaultParams: {},
    modelCategory: 'image-editing',
  },
  'image-to-video': {
    type: 'image-to-video',
    label: 'Image vers Video',
    description: 'Animer une image en video',
    icon: 'Play',
    color: 'blue',
    category: 'transformation',
    inputs: [
      { id: 'image', label: 'Image', type: 'image' },
      { id: 'prompt', label: 'Prompt (optionnel)', type: 'text' },
    ],
    outputs: [{ id: 'video', label: 'Video', type: 'video' }],
    defaultParams: {},
    modelCategory: 'video-generation',
  },
  'video-to-video': {
    type: 'video-to-video',
    label: 'Edition Video',
    description: 'Transformer ou editer une video',
    icon: 'Film',
    color: 'blue',
    category: 'transformation',
    inputs: [
      { id: 'video', label: 'Video', type: 'video' },
      { id: 'prompt', label: 'Prompt', type: 'text' },
    ],
    outputs: [{ id: 'video', label: 'Video', type: 'video' }],
    defaultParams: {},
    modelCategory: 'video-editing',
  },

  // ── Tools ───────────────────────────────────────────────────
  upscale: {
    type: 'upscale',
    label: 'Upscale',
    description: "Augmenter la resolution d'une image",
    icon: 'ArrowUpRight',
    color: 'amber',
    category: 'tools',
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image HD', type: 'image' }],
    defaultParams: {},
    modelCategory: 'upscale',
  },
  'remove-bg': {
    type: 'remove-bg',
    label: 'Detourage',
    description: "Supprimer le fond d'une image",
    icon: 'Eraser',
    color: 'amber',
    category: 'tools',
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image detouree', type: 'image' }],
    defaultParams: {},
    modelCategory: 'remove-bg',
  },
  'face-swap': {
    type: 'face-swap',
    label: 'Face Swap',
    description: 'Echanger les visages entre deux images',
    icon: 'Repeat',
    color: 'amber',
    category: 'tools',
    inputs: [
      { id: 'source', label: 'Source', type: 'image' },
      { id: 'target', label: 'Cible', type: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Resultat', type: 'image' }],
    defaultParams: {},
    modelCategory: 'face-swap',
  },
  vectorize: {
    type: 'vectorize',
    label: 'Vectorisation',
    description: 'Convertir une image en vecteur SVG',
    icon: 'PenTool',
    color: 'amber',
    category: 'tools',
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'SVG', type: 'image' }],
    defaultParams: {},
    modelCategory: 'vectorize',
  },

  // ── Output ──────────────────────────────────────────────────
  output: {
    type: 'output',
    label: 'Sortie',
    description: 'Point de sortie du workflow — telechargement et apercu',
    icon: 'Download',
    color: 'cyan',
    category: 'output',
    inputs: [{ id: 'input', label: 'Resultat', type: 'any' }],
    outputs: [],
    defaultParams: {},
  },

  // ── Assistant IA (LLM) ─────────────────────────────────────
  assistant: {
    type: 'assistant',
    label: 'Assistant IA',
    description: 'Envoyer un prompt a un LLM (GPT, Claude, Gemini...)',
    icon: 'Bot',
    color: 'pink',
    category: 'assistant',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text' },
      { id: 'context', label: 'Contexte (optionnel)', type: 'text' },
    ],
    outputs: [{ id: 'text', label: 'Reponse', type: 'text' }],
    defaultParams: {
      model: 'anthropic/claude-sonnet-4.5',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
}

export function getTemplatesByCategory(categoryId: string): NodeTemplate[] {
  return Object.values(NODE_TEMPLATES).filter(t => t.category === categoryId)
}
