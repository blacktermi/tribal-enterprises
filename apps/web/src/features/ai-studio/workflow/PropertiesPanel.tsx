/**
 * WORKFLOW PROPERTIES PANEL - Panneau de proprietes du noeud selectionne
 * Affiche les parametres du modele, le selecteur de modele, et les controles
 */

import { useState, useCallback, useRef } from 'react'
import { X, ChevronDown, Upload, Trash2, Settings2, Bot, MessageSquare } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from './store'
import { NODE_TEMPLATES } from './templates'
import { getModelsByCategory, type FalModel, type ModelCategory } from '../models/registry'

// ─── LLM Models disponibles via OpenRouter (fevrier 2026) ───────────────────

const LLM_MODELS = [
  // OpenAI — derniere generation
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', tag: 'Dernier' },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', tag: 'Flagship' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', tag: 'Puissant' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', tag: 'Rapide' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', tag: 'Ultra rapide' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', tag: 'Equilibre' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', tag: 'Economique' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'OpenAI', tag: 'Raisonnement' },
  { id: 'openai/o3', name: 'o3', provider: 'OpenAI', tag: 'Raisonnement pro' },
  { id: 'openai/o3-pro', name: 'o3 Pro', provider: 'OpenAI', tag: 'Raisonnement max' },
  // Anthropic — derniere generation
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    tag: 'Dernier',
  },
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    tag: 'Premium',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    tag: 'Equilibre',
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    tag: 'Performant',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    tag: 'Rapide',
  },
  // Google — derniere generation
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', tag: 'Premium' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', tag: 'Rapide' },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    tag: 'Economique',
  },
  // xAI — derniere generation
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', tag: 'Dernier' },
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', tag: 'Rapide' },
  { id: 'x-ai/grok-3', name: 'Grok 3', provider: 'xAI', tag: 'Performant' },
  // DeepSeek
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', tag: 'Dernier' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Raisonnement' },
  // Meta
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    tag: 'Open Source',
  },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', tag: 'Open Source' },
  // Mistral
  {
    id: 'mistralai/mistral-large-2512',
    name: 'Mistral Large 3',
    provider: 'Mistral',
    tag: 'Premium EU',
  },
  { id: 'mistralai/codestral-2508', name: 'Codestral', provider: 'Mistral', tag: 'Code' },
  // GitHub Models (gratuit avec Copilot Pro)
  // OpenAI
  { id: 'github::openai/gpt-4.1', name: '[GitHub] GPT-4.1', provider: 'GitHub', tag: 'Gratuit' },
  {
    id: 'github::openai/gpt-4.1-mini',
    name: '[GitHub] GPT-4.1 Mini',
    provider: 'GitHub',
    tag: 'Gratuit rapide',
  },
  {
    id: 'github::openai/gpt-4.1-nano',
    name: '[GitHub] GPT-4.1 Nano',
    provider: 'GitHub',
    tag: 'Ultra rapide',
  },
  { id: 'github::openai/gpt-5', name: '[GitHub] GPT-5', provider: 'GitHub', tag: 'Puissant' },
  {
    id: 'github::openai/gpt-5-mini',
    name: '[GitHub] GPT-5 Mini',
    provider: 'GitHub',
    tag: 'Gratuit rapide',
  },
  {
    id: 'github::openai/gpt-5-nano',
    name: '[GitHub] GPT-5 Nano',
    provider: 'GitHub',
    tag: 'Ultra rapide',
  },
  {
    id: 'github::openai/gpt-5-chat',
    name: '[GitHub] GPT-5 Chat',
    provider: 'GitHub',
    tag: 'Conversation',
  },
  { id: 'github::openai/o3', name: '[GitHub] o3', provider: 'GitHub', tag: 'Raisonnement' },
  {
    id: 'github::openai/o3-mini',
    name: '[GitHub] o3 Mini',
    provider: 'GitHub',
    tag: 'Raisonnement rapide',
  },
  {
    id: 'github::openai/o4-mini',
    name: '[GitHub] o4 Mini',
    provider: 'GitHub',
    tag: 'Raisonnement rapide',
  },
  { id: 'github::openai/o1', name: '[GitHub] o1', provider: 'GitHub', tag: 'Raisonnement' },
  // DeepSeek
  {
    id: 'github::deepseek/DeepSeek-R1',
    name: '[GitHub] DeepSeek R1',
    provider: 'GitHub',
    tag: 'Raisonnement',
  },
  {
    id: 'github::deepseek/DeepSeek-R1-0528',
    name: '[GitHub] DeepSeek R1 0528',
    provider: 'GitHub',
    tag: 'Raisonnement',
  },
  {
    id: 'github::deepseek/DeepSeek-V3-0324',
    name: '[GitHub] DeepSeek V3',
    provider: 'GitHub',
    tag: 'Polyvalent',
  },
  // Meta
  {
    id: 'github::meta/Llama-3.3-70B-Instruct',
    name: '[GitHub] Llama 3.3 70B',
    provider: 'GitHub',
    tag: 'Open Source',
  },
  {
    id: 'github::meta/Llama-4-Scout-17B-16E-Instruct',
    name: '[GitHub] Llama 4 Scout',
    provider: 'GitHub',
    tag: 'Open Source',
  },
  {
    id: 'github::meta/Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: '[GitHub] Llama 4 Maverick',
    provider: 'GitHub',
    tag: 'Open Source',
  },
  // Microsoft
  {
    id: 'github::microsoft/MAI-DS-R1',
    name: '[GitHub] MAI-DS-R1',
    provider: 'GitHub',
    tag: 'Raisonnement',
  },
  {
    id: 'github::microsoft/Phi-4-reasoning',
    name: '[GitHub] Phi 4 Reasoning',
    provider: 'GitHub',
    tag: 'Raisonnement compact',
  },
  // Mistral
  {
    id: 'github::Codestral-2501',
    name: '[GitHub] Codestral',
    provider: 'GitHub',
    tag: 'Code',
  },
  {
    id: 'github::mistral-medium-2505',
    name: '[GitHub] Mistral Medium 3',
    provider: 'GitHub',
    tag: 'Equilibre',
  },
  // xAI
  { id: 'github::xai/grok-3', name: '[GitHub] Grok 3', provider: 'GitHub', tag: 'Puissant' },
  {
    id: 'github::xai/grok-3-mini',
    name: '[GitHub] Grok 3 Mini',
    provider: 'GitHub',
    tag: 'Rapide',
  },
  // Cohere
  {
    id: 'github::cohere/cohere-command-a',
    name: '[GitHub] Command A',
    provider: 'GitHub',
    tag: 'RAG',
  },
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNodeData, removeNode, selectNode } = useWorkflowStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center px-6">
          <Settings2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-xs text-white/30">Selectionnez un noeud pour voir ses proprietes</p>
        </div>
      </div>
    )
  }

  const data = selectedNode.data
  const template = NODE_TEMPLATES[data.nodeType]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white truncate">{data.label}</span>
        </div>
        <button
          type="button"
          onClick={() => selectNode(null)}
          className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-studio p-4 space-y-4">
        {/* Node label */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
            Nom du noeud
          </label>
          <input
            type="text"
            value={data.label}
            onChange={e => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          />
        </div>

        {/* Model selector (for AI nodes) */}
        {template?.modelCategory && (
          <ModelSelector
            category={template.modelCategory}
            selectedModel={data.model}
            onSelect={model => {
              updateNodeData(selectedNode.id, {
                model,
                modelId: model.id,
                label: model.name,
              })
            }}
          />
        )}

        {/* Model parameters */}
        {data.model && (
          <ModelParams
            model={data.model}
            params={data.params}
            onChange={params => updateNodeData(selectedNode.id, { params })}
          />
        )}

        {/* Input source (for source nodes) */}
        {data.nodeType.startsWith('input-') && (
          <SourceInput
            nodeType={data.nodeType}
            params={data.params}
            onChange={params => updateNodeData(selectedNode.id, { params })}
          />
        )}

        {/* Text prompt (for input-text) */}
        {data.nodeType === 'input-text' && (
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
              Texte / Prompt
            </label>
            <textarea
              value={(data.params.text as string) ?? ''}
              onChange={e =>
                updateNodeData(selectedNode.id, {
                  params: { ...data.params, text: e.target.value },
                })
              }
              rows={4}
              className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
              placeholder="Entrez votre prompt ici..."
            />
          </div>
        )}

        {/* ── Assistant LLM Settings ──────────────────────────────── */}
        {data.nodeType === 'assistant' && (
          <AssistantSettings
            params={data.params}
            onChange={params => updateNodeData(selectedNode.id, { params })}
          />
        )}

        {/* Output preview */}
        {data.outputUrls && data.outputUrls.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
              Resultat
            </label>
            {data.nodeType === 'assistant' ? (
              /* Text preview for assistant nodes */
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="w-3 h-3 text-pink-400" />
                    <span className="text-[10px] font-medium text-pink-400">Reponse</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap">
                    {data.outputUrls[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(data.outputUrls?.[0] ?? '')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Copier la reponse
                </button>
              </div>
            ) : (
              /* Image/video/audio preview for other nodes */
              <div className="grid grid-cols-2 gap-2">
                {data.outputUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-colors"
                  >
                    <img src={url} alt="" className="w-full aspect-square object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {data.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-[10px] text-red-400">{data.error}</span>
          </div>
        )}
      </div>

      {/* Footer: delete */}
      <div className="shrink-0 p-3 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => {
            removeNode(selectedNode.id)
            selectNode(null)
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer ce noeud
        </button>
      </div>
    </div>
  )
}

// ─── Assistant LLM Settings Sub-component ───────────────────────────────────

function AssistantSettings({
  params,
  onChange,
}: {
  params: Record<string, unknown>
  onChange: (params: Record<string, unknown>) => void
}) {
  const [modelOpen, setModelOpen] = useState(false)
  const currentModelId = (params.model as string) ?? 'anthropic/claude-sonnet-4.5'
  const currentModel = LLM_MODELS.find(m => m.id === currentModelId)
  const systemPrompt = (params.systemPrompt as string) ?? ''
  const temperature = (params.temperature as number) ?? 0.7
  const maxTokens = (params.maxTokens as number) ?? 4096

  // Group models by provider
  const providers = [...new Set(LLM_MODELS.map(m => m.provider))]

  return (
    <div className="space-y-3">
      {/* LLM Model Selector */}
      <div>
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
          Modele LLM
        </label>
        <button
          type="button"
          onClick={() => setModelOpen(!modelOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">{currentModel?.name ?? currentModelId}</span>
            {currentModel?.tag && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-pink-500/15 text-pink-400">
                {currentModel.tag}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-white/30 transition-transform shrink-0',
              modelOpen && 'rotate-180'
            )}
          />
        </button>

        {modelOpen && (
          <div className="mt-1 max-h-56 overflow-y-auto scrollbar-studio rounded-lg border border-white/[0.08] bg-[#1a1a2e]">
            {providers.map(provider => (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[9px] font-bold text-white/20 uppercase tracking-wider sticky top-0 bg-[#1a1a2e]">
                  {provider}
                </div>
                {LLM_MODELS.filter(m => m.provider === provider).map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange({ ...params, model: model.id })
                      setModelOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors flex items-center justify-between',
                      currentModelId === model.id ? 'text-pink-400 bg-pink-500/10' : 'text-white/70'
                    )}
                  >
                    <span className="font-medium">{model.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">
                      {model.tag}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div>
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
          Prompt systeme
        </label>
        <textarea
          value={systemPrompt}
          onChange={e => onChange({ ...params, systemPrompt: e.target.value })}
          rows={4}
          placeholder="Tu es un assistant utile et creatif..."
          className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-pink-500/30 resize-none"
        />
      </div>

      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-white/40">Temperature</label>
          <span className="text-[10px] text-pink-400 font-mono">{temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={e => onChange({ ...params, temperature: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-pink-500"
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-white/20">Precis</span>
          <span className="text-[9px] text-white/20">Creatif</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-white/40">Max Tokens</label>
          <span className="text-[10px] text-pink-400 font-mono">{maxTokens.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={256}
          max={16384}
          step={256}
          value={maxTokens}
          onChange={e => onChange({ ...params, maxTokens: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-pink-500"
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-white/20">256</span>
          <span className="text-[9px] text-white/20">16 384</span>
        </div>
      </div>
    </div>
  )
}

// ─── Model Selector Sub-component ───────────────────────────────────────────

function ModelSelector({
  category,
  selectedModel,
  onSelect,
}: {
  category: ModelCategory
  selectedModel?: FalModel
  onSelect: (model: FalModel) => void
}) {
  const [open, setOpen] = useState(false)
  const models = getModelsByCategory(category)

  return (
    <div>
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
        Modele IA
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white hover:bg-white/[0.06] transition-colors"
      >
        <span className={selectedModel ? 'text-white' : 'text-white/30'}>
          {selectedModel?.name ?? 'Choisir un modele...'}
        </span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-white/30 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto scrollbar-studio rounded-lg border border-white/[0.08] bg-[#1a1a2e]">
          {models.map(model => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onSelect(model)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors',
                selectedModel?.id === model.id
                  ? 'text-violet-400 bg-violet-500/10'
                  : 'text-white/70'
              )}
            >
              <span className="font-medium block">{model.name}</span>
              <span className="text-[10px] text-white/30">
                {model.provider} · ${model.costPerUnit}/{model.costUnit}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Model Params Sub-component ─────────────────────────────────────────────

function ModelParams({
  model,
  params,
  onChange,
}: {
  model: FalModel
  params: Record<string, unknown>
  onChange: (params: Record<string, unknown>) => void
}) {
  // Filter out prompt (handled separately or via input port)
  const visibleParams = model.params.filter(p => p.key !== 'prompt')

  if (visibleParams.length === 0) return null

  return (
    <div>
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 block">
        Parametres
      </label>
      <div className="space-y-3">
        {visibleParams.map(param => (
          <ParamInput
            key={param.key}
            param={param}
            value={params[param.key] ?? param.default}
            onChange={val => onChange({ ...params, [param.key]: val })}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Single Param Input ─────────────────────────────────────────────────────

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: {
    key: string
    label: string
    type: string
    options?: Array<{ value: string; label: string }>
    default?: unknown
    min?: number
    max?: number
    step?: number
    placeholder?: string
  }
  value: unknown
  onChange: (val: unknown) => void
}) {
  switch (param.type) {
    case 'select':
      return (
        <div>
          <label className="text-[10px] text-white/40 mb-1 block">{param.label}</label>
          <select
            value={String(value ?? param.default ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500/30 appearance-none"
          >
            {param.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )

    case 'slider':
    case 'number':
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-white/40">{param.label}</label>
            <span className="text-[10px] text-white/50 font-mono">
              {String(value ?? param.default ?? 0)}
            </span>
          </div>
          <input
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={Number(value ?? param.default ?? 0)}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-violet-500"
          />
        </div>
      )

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-white/40">{param.label}</label>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              'w-8 h-4.5 rounded-full transition-colors relative',
              value ? 'bg-violet-500' : 'bg-white/[0.12]'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform',
                value ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      )

    case 'textarea':
      return (
        <div>
          <label className="text-[10px] text-white/40 mb-1 block">{param.label}</label>
          <textarea
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            rows={3}
            placeholder={param.placeholder}
            className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
          />
        </div>
      )

    default: // text
      return (
        <div>
          <label className="text-[10px] text-white/40 mb-1 block">{param.label}</label>
          <input
            type="text"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={param.placeholder}
            className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      )
  }
}

// ─── Source Input (file upload for input-image/video/audio nodes) ────────────

function SourceInput({
  nodeType,
  params,
  onChange,
}: {
  nodeType: string
  params: Record<string, unknown>
  onChange: (params: Record<string, unknown>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const fileUrl = params.fileUrl as string | undefined
  const fileName = params.fileName as string | undefined

  const accept =
    nodeType === 'input-image' ? 'image/*' : nodeType === 'input-video' ? 'video/*' : 'audio/*'

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const url = URL.createObjectURL(file)
      onChange({ ...params, fileUrl: url, fileName: file.name, file })
    },
    [params, onChange]
  )

  return (
    <div>
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5 block">
        Fichier source
      </label>

      {fileUrl ? (
        <div className="space-y-2">
          {nodeType === 'input-image' && (
            <img src={fileUrl} alt="" className="w-full rounded-lg object-cover max-h-32" />
          )}
          {nodeType === 'input-video' && (
            <video src={fileUrl} className="w-full rounded-lg max-h-32" controls />
          )}
          {nodeType === 'input-audio' && <audio src={fileUrl} className="w-full" controls />}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 truncate">{fileName}</span>
            <button
              type="button"
              onClick={() =>
                onChange({ ...params, fileUrl: undefined, fileName: undefined, file: undefined })
              }
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] text-white/30 hover:text-white/50 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Cliquer pour importer</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  )
}
