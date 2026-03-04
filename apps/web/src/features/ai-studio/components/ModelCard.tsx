import { Star, Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { formatCost, CATEGORY_INFO } from '../models/registry'
import type { FalModel } from '../models/registry'

interface ModelCardProps {
 model: FalModel
 onClick: (model: FalModel) => void
 isSelected?: boolean
 featured?: boolean
}

export function ModelCard({
 model,
 onClick,
 isSelected = false,
 featured = false,
}: ModelCardProps) {
 const categoryInfo = CATEGORY_INFO[model.category]

 if (featured) {
 return (
 <FeaturedCard
 model={model}
 onClick={onClick}
 isSelected={isSelected}
 categoryInfo={categoryInfo}
 />
 )
 }

 return (
 <motion.button
 type="button"
 onClick={() => onClick(model)}
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.98 }}
 transition={{ type: 'spring', stiffness: 400, damping: 25 }}
 className={cn(
 'group relative w-full text-left rounded-2xl transition-all duration-300',
 'bg-white/[0.04] backdrop-blur-sm',
 'border border-white/[0.08]',
 'hover:border-tribal-accent/30 ',
 'hover:shadow-xl hover:shadow-tribal-accent/[0.08] ',
 'focus:outline-none focus:ring-2 focus:ring-tribal-accent/40 focus:ring-offset-2 ',
 isSelected &&
 'ring-2 ring-tribal-accent border-tribal-accent shadow-lg shadow-tribal-accent/15'
 )}
 >
 <div className="p-4">
 {/* Top: Provider + badges + cost */}
 <div className="flex items-center justify-between gap-2 mb-3">
 <div className="flex items-center gap-1.5 min-w-0">
 <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.06] text-white/40 truncate">
 {model.provider}
 </span>
 {model.new && (
 <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-tribal-accent text-tribal-black">
 <Sparkles className="w-2.5 h-2.5" />
 NEW
 </span>
 )}
 {model.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
 </div>
 <span className="shrink-0 text-[11px] font-mono font-bold text-tribal-accent">
 {formatCost(model)}
 </span>
 </div>

 {/* Name */}
 <h3 className="text-[15px] font-bold text-white mb-1.5 leading-snug group-hover:text-tribal-accent transition-colors">
 {model.name}
 </h3>

 {/* Description */}
 <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
 {model.description}
 </p>

 {/* Bottom: category tag + arrow */}
 <div className="flex items-center justify-between">
 <span
 className={cn(
 'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold',
 'bg-gradient-to-r bg-clip-text text-transparent',
 categoryInfo.color
 )}
 >
 {categoryInfo.label}
 </span>
 <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-tribal-accent group-hover:translate-x-0.5 transition-all" />
 </div>
 </div>
 </motion.button>
 )
}

// ─── Featured Card (larger, with gradient border) ─────────────────────────────

interface FeaturedCardProps {
 model: FalModel
 onClick: (model: FalModel) => void
 isSelected: boolean
 categoryInfo: { label: string; color: string }
}

function FeaturedCard({ model, onClick, isSelected, categoryInfo }: FeaturedCardProps) {
 return (
 <motion.button
 type="button"
 onClick={() => onClick(model)}
 whileHover={{ y: -3 }}
 whileTap={{ scale: 0.98 }}
 transition={{ type: 'spring', stiffness: 400, damping: 25 }}
 className={cn(
 'group relative w-full text-left rounded-2xl transition-all duration-300',
 'bg-white/[0.04] backdrop-blur-sm',
 'border border-white/[0.06]',
 'hover:shadow-2xl hover:shadow-tribal-accent/[0.12] ',
 'focus:outline-none focus:ring-2 focus:ring-tribal-accent/40 focus:ring-offset-2 ',
 isSelected && 'ring-2 ring-tribal-accent shadow-lg shadow-tribal-accent/20'
 )}
 >
 {/* Gradient border glow on hover */}
 <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-tribal-accent/0 via-tribal-accent/0 to-tribal-accent/0 group-hover:from-tribal-accent/30 group-hover:via-tribal-accent/20 group-hover:to-tribal-accent/30 transition-all duration-500 -z-10 blur-sm" />

 <div className="p-5">
 {/* Top row */}
 <div className="flex items-center justify-between gap-2 mb-3">
 <div className="flex items-center gap-1.5">
 <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.06] text-white/40">
 {model.provider}
 </span>
 {model.new && (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-tribal-accent text-tribal-black shadow-sm shadow-tribal-accent/20">
 <Sparkles className="w-2.5 h-2.5" />
 NEW
 </span>
 )}
 <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-tribal-accent/10 text-tribal-accent ring-1 ring-tribal-accent/20">
 {formatCost(model)}
 </span>
 </div>
 </div>

 {/* Name - bigger for featured */}
 <h3 className="text-base font-bold text-white mb-1.5 leading-snug group-hover:text-tribal-accent transition-colors">
 {model.name}
 </h3>

 {/* Description */}
 <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2 mb-4">
 {model.description}
 </p>

 {/* Bottom */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span
 className={cn(
 'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r shadow-sm',
 categoryInfo.color
 )}
 >
 {categoryInfo.label}
 </span>
 <span className="text-[10px] text-white/40 font-medium">
 {model.inputType}
 </span>
 </div>
 <div className="flex items-center gap-1 text-xs font-medium text-tribal-accent opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
 <span>Utiliser</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </div>
 </div>
 </div>
 </motion.button>
 )
}
