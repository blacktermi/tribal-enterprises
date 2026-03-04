/**
 * STUDIO HOME - Page d'accueil minimaliste style Google
 * Greeting centre + recherche avec dropdown de modeles
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
 MODEL_REGISTRY,
 CATEGORY_INFO,
 searchModels,
 getModelsByCategory,
 formatCost,
} from '../models/registry'
import type { FalModel, ModelCategory } from '../models/registry'

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudioHomeProps {
 onSelectModel: (model: FalModel) => void
 onNavigateCategory: (category: ModelCategory) => void
 initialCategory?: ModelCategory
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioHome({
 onSelectModel,
 onNavigateCategory: _onNavigateCategory,
 initialCategory,
}: StudioHomeProps) {
 const [searchQuery, setSearchQuery] = useState('')
 const [isOpen, setIsOpen] = useState(false)
 const [activeTab] = useState<'all' | ModelCategory>(initialCategory ?? 'all')
 const containerRef = useRef<HTMLDivElement>(null)

 const filteredModels = useMemo(() => {
 if (searchQuery.trim()) {
 return searchModels(searchQuery.trim())
 }
 if (activeTab === 'all') {
 return MODEL_REGISTRY
 }
 return getModelsByCategory(activeTab)
 }, [searchQuery, activeTab])

 // Fermer le dropdown au clic exterieur
 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false)
 }
 }
 document.addEventListener('mousedown', handleClick)
 return () => document.removeEventListener('mousedown', handleClick)
 }, [])

 function handleSelect(model: FalModel) {
 setIsOpen(false)
 setSearchQuery('')
 onSelectModel(model)
 }

 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
 {/* ─── Greeting ──────────────────────────────────────── */}
 <div className="flex items-center gap-2.5 mb-2">
 <Sparkles className="w-5 h-5 text-tribal-accent" />
 <h1 className="text-xl font-bold font-display text-white tracking-tight">Tribal Studio</h1>
 </div>
 <p className="text-white/30 text-sm mb-8">Que voulez-vous creer ?</p>

 {/* ─── Search + Dropdown ─────────────────────────────── */}
 <div ref={containerRef} className="relative w-full max-w-lg">
 {/* Input */}
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
 <input
 type="text"
 value={searchQuery}
 onChange={e => {
 setSearchQuery(e.target.value)
 setIsOpen(true)
 }}
 onFocus={() => setIsOpen(true)}
 placeholder="Rechercher un modele..."
 className={cn(
 'w-full pl-11 pr-16 py-3 rounded-xl text-sm transition-all duration-200',
 'bg-white/[0.05] border border-white/[0.08]',
 'text-white placeholder-white/25',
 'focus:outline-none focus:ring-1 focus:ring-tribal-accent/40 focus:border-tribal-accent/30',
 isOpen && 'rounded-b-none border-b-white/[0.04]'
 )}
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
 >
 <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
 </button>
 </div>
 </div>

 {/* Dropdown */}
 {isOpen && (
 <div
 className={cn(
 'absolute z-50 w-full max-h-80 overflow-y-auto',
 'bg-tribal-gray border border-white/[0.08] border-t-0 rounded-b-xl',
 'scrollbar-thin scrollbar-thumb-white/10'
 )}
 >
 {filteredModels.length > 0 ? (
 <div className="py-1">
 {filteredModels.map(model => (
 <DropdownItem key={model.id} model={model} onClick={handleSelect} />
 ))}
 </div>
 ) : (
 <div className="py-6 text-center">
 <p className="text-xs text-white/30">Aucun modele trouve</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* ─── Hint ──────────────────────────────────────────── */}
 <p className="mt-4 text-[11px] text-white/15">
 {MODEL_REGISTRY.length} modeles disponibles · Utilisez la sidebar pour filtrer
 </p>
 </div>
 )
}

// ─── Dropdown Item ────────────────────────────────────────────────────────────

function DropdownItem({ model, onClick }: { model: FalModel; onClick: (m: FalModel) => void }) {
 const categoryInfo = CATEGORY_INFO[model.category]

 return (
 <button
 type="button"
 onClick={() => onClick(model)}
 className={cn(
 'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors',
 'hover:bg-white/[0.06] focus:outline-none focus:bg-white/[0.06]'
 )}
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-white truncate">{model.name}</span>
 {model.new && (
 <span className="shrink-0 px-1 py-px rounded text-[9px] font-bold bg-tribal-accent/15 text-tribal-accent">
 NEW
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[10px] text-white/25">{model.provider}</span>
 <span className="text-white/10">·</span>
 <span
 className={cn(
 'text-[10px] font-medium bg-gradient-to-r bg-clip-text text-transparent',
 categoryInfo.color
 )}
 >
 {categoryInfo.label}
 </span>
 </div>
 </div>
 <span className="shrink-0 text-[11px] font-mono text-tribal-accent/70">
 {formatCost(model)}
 </span>
 </button>
 )
}
