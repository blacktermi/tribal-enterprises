/**
 * AI STUDIO PAGE - Hub universel de generation IA
 * Utilise StudioLayout (sidebar + header) et StudioHome (ecran d'accueil)
 */

import { useState, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { StudioLayout } from '../features/ai-studio/components/StudioLayout'
import { StudioHome } from '../features/ai-studio/components/StudioHome'
import { GenerationWorkspace } from '../features/ai-studio/components/GenerationWorkspace'
import { GenerationHistory } from '../features/ai-studio/components/GenerationHistory'
import { ProviderSettings } from '../features/ai-studio/components/ProviderSettings'
import { StudioLibrary } from '../features/ai-studio/components/StudioLibrary'
import type { StudioView } from '../features/ai-studio/components/StudioLayout'
import type { FalModel, ModelCategory } from '../features/ai-studio/models/registry'

// Lazy load WorkflowEditor — @xyflow/react is heavy, keep it in a separate chunk
const WorkflowEditor = lazy(() =>
  import('../features/ai-studio/workflow/WorkflowEditor').then(m => ({
    default: m.WorkflowEditor,
  }))
)

const DesignEditor = lazy(() =>
  import('../features/ai-studio/design/DesignEditor').then(m => ({
    default: m.DesignEditor,
  }))
)

interface AiStudioPageProps {
  standalone?: boolean
}

export default function AiStudioPage({ standalone }: AiStudioPageProps) {
  const [currentView, setCurrentView] = useState<StudioView>('home')
  const [selectedModel, setSelectedModel] = useState<FalModel | null>(null)
  const [activeCategory, setActiveCategory] = useState<ModelCategory | undefined>()

  // ─── Navigation handler (called from sidebar) ───────────────────────────────
  const handleNavigate = useCallback((view: StudioView, category?: ModelCategory) => {
    setCurrentView(view)
    setActiveCategory(category)
    // If navigating away from workspace, clear model
    if (view !== 'workspace') {
      setSelectedModel(null)
    }
  }, [])

  // ─── Select a model (from StudioHome) ───────────────────────────────────────
  const handleSelectModel = useCallback((model: FalModel) => {
    setSelectedModel(model)
    setActiveCategory(model.category)
    setCurrentView('workspace')
  }, [])

  // ─── Back from workspace ────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setSelectedModel(null)
    setCurrentView('home')
  }, [])

  // ─── Navigate to category from StudioHome ───────────────────────────────────
  const handleNavigateCategory = useCallback((category: ModelCategory) => {
    setActiveCategory(category)
    setCurrentView('home')
  }, [])

  return (
    <div className={cn(standalone ? 'h-screen min-h-screen' : 'h-full')}>
      <StudioLayout
        currentView={currentView}
        currentModelName={selectedModel?.name}
        activeCategory={activeCategory}
        onNavigate={handleNavigate}
      >
        <AnimatePresence mode="wait">
          {/* ─── Home (default) ─────────────────────────────────── */}
          {(currentView === 'home' || currentView === 'catalog') && (
            <motion.div
              key={`home-${activeCategory ?? 'all'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <StudioHome
                onSelectModel={handleSelectModel}
                onNavigateCategory={handleNavigateCategory}
                initialCategory={activeCategory}
              />
            </motion.div>
          )}

          {/* ─── Workspace ──────────────────────────────────────── */}
          {currentView === 'workspace' && selectedModel && (
            <motion.div
              key={`workspace-${selectedModel.id}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <GenerationWorkspace model={selectedModel} onBack={handleBack} />
            </motion.div>
          )}

          {/* ─── History ────────────────────────────────────────── */}
          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <GenerationHistory />
            </motion.div>
          )}

          {/* ─── Library ─────────────────────────────────────────── */}
          {currentView === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <StudioLibrary />
            </motion.div>
          )}

          {/* ─── Workflow / Spaces ─────────────────────────────────── */}
          {currentView === 'workflow' && (
            <motion.div
              key="workflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white/40 text-sm">Chargement de Spaces...</div>
                  </div>
                }
              >
                <WorkflowEditor />
              </Suspense>
            </motion.div>
          )}

          {/* ─── Design Editor ────────────────────────────────────── */}
          {currentView === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-white/40 text-sm">Chargement du Design Editor...</div>
                  </div>
                }
              >
                <DesignEditor />
              </Suspense>
            </motion.div>
          )}

          {/* ─── Provider Settings ──────────────────────────────── */}
          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <ProviderSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </StudioLayout>
    </div>
  )
}
