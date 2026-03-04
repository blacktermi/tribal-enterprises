import { useState, useMemo } from 'react'
import { Search, Sparkles, X, LayoutGrid, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../../lib/utils'
import {
 MODEL_REGISTRY,
 CATEGORY_INFO,
 getFeaturedModels,
 searchModels,
 getModelsByCategory,
 getModelsByBackend,
} from '../models/registry'
import { ModelCard } from './ModelCard'
import type { FalModel, ModelCategory, ProviderBackend } from '../models/registry'

interface ModelCatalogProps {
 onSelectModel: (model: FalModel) => void
 selectedModelId?: string
}

type FilterCategory = 'all' | ModelCategory
type FilterBackend = 'all' | ProviderBackend

const BACKEND_CHIPS: Array<{ key: FilterBackend; label: string; gradient: string }> = [
 { key: 'all', label: 'Tous', gradient: '' },
 { key: 'fal', label: 'fal.ai', gradient: 'from-tribal-accent to-tribal-accent-dark' },
 { key: 'openrouter', label: 'OpenRouter', gradient: 'from-tribal-accent to-tribal-accent-dark' },
 { key: 'vectorizer', label: 'Vectorizer.AI', gradient: 'from-blue-500 to-indigo-600' },
]

export function ModelCatalog({ onSelectModel, selectedModelId }: ModelCatalogProps) {
 const [searchQuery, setSearchQuery] = useState('')
 const [activeCategory, setActiveCategory] = useState<FilterCategory>('all')
 const [activeBackend, setActiveBackend] = useState<FilterBackend>('all')

 const categories = useMemo(() => {
 const entries = Object.entries(CATEGORY_INFO) as Array<
 [ModelCategory, (typeof CATEGORY_INFO)[ModelCategory]]
 >
 return entries.map(([key, info]) => ({
 key,
 ...info,
 count: getModelsByCategory(key).length,
 }))
 }, [])

 const featuredModels = useMemo(() => {
 const featured = getFeaturedModels()
 if (activeBackend === 'all') return featured
 return featured.filter(m => m.backend === activeBackend)
 }, [activeBackend])

 const filteredModels = useMemo(() => {
 let models: FalModel[]
 if (searchQuery.trim()) {
 models = searchModels(searchQuery.trim())
 } else if (activeCategory === 'all') {
 models = MODEL_REGISTRY
 } else {
 models = getModelsByCategory(activeCategory)
 }
 // Apply backend filter
 if (activeBackend !== 'all') {
 models = models.filter(m => m.backend === activeBackend)
 }
 return models
 }, [searchQuery, activeCategory, activeBackend])

 const showFeatured = !searchQuery.trim() && activeCategory === 'all'
 const nonFeaturedModels = showFeatured ? filteredModels.filter(m => !m.featured) : filteredModels

 return (
 <div className="space-y-5">
 {/* Search + filter row */}
 <div className="flex items-center gap-3">
 {/* Search */}
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Rechercher un modele..."
 className={cn(
 'w-full pl-9 pr-9 py-2.5 rounded-xl text-sm transition-all duration-200',
 'bg-white/[0.04] backdrop-blur-sm',
 'border border-white/[0.08]',
 'text-white placeholder-white/25',
 'focus:outline-none focus:ring-2 focus:ring-tribal-accent/30 focus:border-tribal-accent/50 '
 )}
 />
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-400 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Model count */}
 <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
 <LayoutGrid className="w-3.5 h-3.5" />
 <span className="font-semibold text-white/40">
 {filteredModels.length}
 </span>
 modeles
 </div>
 </div>

 {/* Backend filter + Category filter chips */}
 <div className="flex items-center gap-3 overflow-x-auto pb-1 -mb-1 scrollbar-none">
 {/* Backend filter */}
 <div className="flex items-center gap-1 shrink-0">
 <Globe className="w-3.5 h-3.5 text-white/30 mr-0.5" />
 {BACKEND_CHIPS.map(chip => (
 <button
 key={chip.key}
 type="button"
 onClick={() => {
 setActiveBackend(chip.key)
 setSearchQuery('')
 }}
 className={cn(
 'shrink-0 inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
 activeBackend === chip.key
 ? chip.gradient
 ? `bg-gradient-to-r ${chip.gradient} text-white shadow-sm`
 : 'bg-tribal-accent text-tribal-black shadow-sm shadow-tribal-accent/20'
 : 'bg-white/[0.04] text-white/40 border border-white/[0.08] hover:border-white/[0.12] hover:text-white/60'
 )}
 >
 {chip.label}
 </button>
 ))}
 </div>

 <div className="w-px h-5 bg-white/[0.06] shrink-0" />

 {/* Category filter chips */}
 <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
 <CategoryChip
 label="Tous"
 count={
 activeBackend === 'all'
 ? MODEL_REGISTRY.length
 : getModelsByBackend(activeBackend).length
 }
 isActive={activeCategory === 'all'}
 onClick={() => {
 setActiveCategory('all')
 setSearchQuery('')
 }}
 />
 {categories.map(cat => {
 const count =
 activeBackend === 'all'
 ? cat.count
 : getModelsByCategory(cat.key).filter(m => m.backend === activeBackend).length
 if (count === 0) return null
 return (
 <CategoryChip
 key={cat.key}
 label={cat.label}
 count={count}
 isActive={activeCategory === cat.key}
 gradientColor={cat.color}
 onClick={() => {
 setActiveCategory(cat.key)
 setSearchQuery('')
 }}
 />
 )
 })}
 </div>
 </div>

 {/* Featured section */}
 {showFeatured && featuredModels.length > 0 && (
 <section>
 <div className="flex items-center gap-2 mb-3">
 <Sparkles className="w-4 h-4 text-amber-500" />
 <h3 className="text-sm font-bold text-white">Recommandes</h3>
 <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-white/[0.04] to-transparent" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
 {featuredModels.map((model, i) => (
 <motion.div
 key={model.id}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.04, duration: 0.3 }}
 >
 <ModelCard
 model={model}
 onClick={onSelectModel}
 isSelected={selectedModelId === model.id}
 featured
 />
 </motion.div>
 ))}
 </div>
 </section>
 )}

 {/* All / filtered models */}
 {nonFeaturedModels.length > 0 ? (
 <section>
 {showFeatured && (
 <div className="flex items-center gap-2 mb-3">
 <LayoutGrid className="w-4 h-4 text-white/40" />
 <h3 className="text-sm font-bold text-white">Tous les modeles</h3>
 <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
 </div>
 )}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
 {nonFeaturedModels.map((model, i) => (
 <motion.div
 key={model.id}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.03, duration: 0.25 }}
 >
 <ModelCard
 model={model}
 onClick={onSelectModel}
 isSelected={selectedModelId === model.id}
 />
 </motion.div>
 ))}
 </div>
 </section>
 ) : (
 !showFeatured && (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <div className="w-14 h-14 rounded-2xl bg-white/[0.06]/60 flex items-center justify-center mb-4">
 <Search className="w-6 h-6 text-white/40" />
 </div>
 <h3 className="text-sm font-semibold text-white mb-1">
 Aucun modele trouve
 </h3>
 <p className="text-xs text-white/40 max-w-xs mb-4">
 Essayez avec d&apos;autres termes ou changez de categorie.
 </p>
 <button
 type="button"
 onClick={() => {
 setSearchQuery('')
 setActiveCategory('all')
 setActiveBackend('all')
 }}
 className="px-4 py-2 rounded-lg text-xs font-semibold bg-tribal-accent/10 text-tribal-accent hover:bg-tribal-accent/20 transition-colors"
 >
 Reinitialiser
 </button>
 </div>
 )
 )}
 </div>
 )
}

// ─── Category Chip ────────────────────────────────────────────────────────────

interface CategoryChipProps {
 label: string
 count: number
 isActive: boolean
 gradientColor?: string
 onClick: () => void
}

function CategoryChip({ label, count, isActive, gradientColor, onClick }: CategoryChipProps) {
 return (
 <button
 type="button"
 onClick={onClick}
 className={cn(
 'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
 isActive
 ? gradientColor
 ? `bg-gradient-to-r ${gradientColor} text-white shadow-sm`
 : 'bg-tribal-accent text-tribal-black shadow-sm shadow-tribal-accent/20'
 : 'bg-white/[0.04] text-white/40 border border-white/[0.08] hover:border-white/[0.12] hover:text-white/60'
 )}
 >
 {label}
 <span
 className={cn(
 'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
 isActive
 ? 'bg-white/20 text-white'
 : 'bg-white/[0.06] text-white/40'
 )}
 >
 {count}
 </span>
 </button>
 )
}
