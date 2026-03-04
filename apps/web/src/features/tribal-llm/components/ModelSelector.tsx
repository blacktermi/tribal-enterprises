/**
 * TRIBAL LLM - Model Selector
 * Dropdown de selection de modele, groupe par categorie
 * Theme dark-only premium
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Sparkles, Zap, Brain, Code2, Globe, Gift } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  OPENROUTER_MODELS,
  MODEL_CATEGORIES,
  findModelById,
  formatPrice,
  type LlmModelInfo,
  type LlmModelCategory,
} from '../models/registry'

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
  compact?: boolean
}

const CATEGORY_ICONS: Record<LlmModelCategory, typeof Sparkles> = {
  flagship: Sparkles,
  fast: Zap,
  reasoning: Brain,
  coding: Code2,
  creative: Sparkles,
  vision: Globe,
  'open-source': Globe,
  free: Gift,
}

export function ModelSelector({ value, onChange, compact }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentModel = findModelById(value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Grouper les modeles par categorie
  const grouped = OPENROUTER_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.category]) acc[model.category] = []
      acc[model.category].push(model)
      return acc
    },
    {} as Record<LlmModelCategory, LlmModelInfo[]>
  )

  const categories = Object.keys(grouped) as LlmModelCategory[]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg border transition-all duration-200',
          'border-white/[0.08] bg-white/[0.04]',
          'hover:border-white/[0.15]',
          'focus:outline-none focus:ring-2 focus:ring-tribal-accent/20',
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
          open && 'border-tribal-accent/40 ring-2 ring-tribal-accent/20'
        )}
      >
        {currentModel && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentModel.iconColor }}
          />
        )}
        <span className="font-medium text-white/80 truncate max-w-[180px]">
          {currentModel?.name || 'Choisir un modele'}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-white/30 transition-transform flex-shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-white/[0.08] bg-tribal-gray shadow-xl shadow-black/30 z-50 scrollbar-studio">
          <div className="p-2 space-y-1">
            {categories.map(cat => {
              const catConfig = MODEL_CATEGORIES[cat]
              const CatIcon = CATEGORY_ICONS[cat]
              const models = grouped[cat]

              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 px-2 py-1.5 mt-1 first:mt-0">
                    <CatIcon className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                      {catConfig.label}
                    </span>
                  </div>

                  {models.map(model => {
                    const isSelected = model.id === value
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onChange(model.id)
                          setOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all',
                          isSelected ? 'bg-tribal-accent/10' : 'hover:bg-white/[0.06]'
                        )}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: model.iconColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isSelected ? 'text-tribal-accent' : 'text-white/80'
                              )}
                            >
                              {model.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-tribal-accent flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-white/40">{model.provider}</span>
                            <span className="text-[10px] text-white/20">|</span>
                            <span className="text-[10px] text-white/40">
                              {formatPrice(model.inputPrice)} in / {formatPrice(model.outputPrice)}{' '}
                              out
                            </span>
                            <span className="text-[10px] text-white/20">|</span>
                            <span className="text-[10px] text-white/40">
                              {(model.contextWindow / 1000).toFixed(0)}K ctx
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
