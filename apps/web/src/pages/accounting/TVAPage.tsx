import React from 'react'
import { motion } from 'framer-motion'
import { Receipt, Info } from 'lucide-react'

export const TVAPage: React.FC = () => {
 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden glass rounded-2xl p-4 md:p-6 text-white"
 >
 <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
 <div className="relative flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Receipt className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">TVA</h1>
 <p className="text-white/70 text-sm">
 Suivi de la Taxe sur la Valeur Ajoutee
 </p>
 </div>
 </div>
 </motion.div>

 {/* Message principal */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-8 text-center"
 >
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
 <Info className="w-8 h-8 text-amber-400" />
 </div>
 <h2 className="text-2xl font-bold text-amber-300 mb-2">
 TVA non applicable
 </h2>
 <p className="text-amber-400 text-lg mb-4">
 SARL exoneree
 </p>
 <div className="max-w-md mx-auto space-y-2 text-sm text-amber-400">
 <p>
 Tribal Enterprises SARL est exoneree de TVA conformement a
 l'article 293 B du Code General des Impots (CA &lt; 200M FCFA).
 </p>
 <p>
 Les factures sont emises sans TVA. Aucune declaration n'est requise.
 </p>
 </div>
 </motion.div>
 </div>
 )
}
