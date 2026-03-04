/**
 * TRIBAL ANALYST - Page principale
 * Navigation tabs : Dashboard | Chat IA | Insights
 */

import { useState, useCallback } from 'react'
import { BarChart3, MessageSquare, Lightbulb, Menu, Brain } from 'lucide-react'
import { cn } from '../lib/utils'
import { AnalystSidebar } from '../features/tribal-analyst/components/AnalystSidebar'
import { AnalystChatView } from '../features/tribal-analyst/components/AnalystChatView'
import { AnalystInsightsPanel } from '../features/tribal-analyst/components/AnalystInsightsPanel'
import { AnalystDashboard } from '../features/tribal-analyst/components/AnalystDashboard'

type AnalystTab = 'dashboard' | 'chat' | 'insights'

const TABS: Array<{ id: AnalystTab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'chat', label: 'Chat IA', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
]

export default function TribalAnalystPage() {
  const [activeTab, setActiveTab] = useState<AnalystTab>('dashboard')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen(prev => !prev), [])
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), [])

  const sidebarToggle = (
    <button
      onClick={toggleMobileSidebar}
      className="p-2 rounded-lg text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors lg:hidden"
      title="Historique"
    >
      <Menu className="w-5 h-5" />
    </button>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14))] lg:h-[calc(100vh-theme(spacing.16))] -m-3 sm:-m-4 lg:-m-6 rounded-none overflow-hidden bg-tribal-black">
      {/* Header bar avec tabs */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/[0.06] bg-tribal-black/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-tribal-accent flex items-center justify-center shadow-sm">
              <Brain className="w-3.5 h-3.5 text-tribal-black" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">
              Tribal Analyst
            </span>
          </div>

          {/* Tabs - Rule 8 */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? 'bg-white/[0.08] text-tribal-accent shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right side - mobile sidebar toggle (chat only) */}
        {activeTab === 'chat' && <div className="lg:hidden">{sidebarToggle}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 min-w-0">
            <AnalystDashboard />
          </div>
        )}

        {/* Chat tab - with sidebar */}
        {activeTab === 'chat' && (
          <>
            <AnalystSidebar
              currentConversationId={currentConversationId}
              onSelectConversation={setCurrentConversationId}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={closeMobileSidebar}
            />
            <div className="flex-1 min-w-0 flex flex-col">
              <AnalystChatView
                conversationId={currentConversationId}
                onConversationCreated={setCurrentConversationId}
              />
            </div>
          </>
        )}

        {/* Insights tab */}
        {activeTab === 'insights' && (
          <div className="flex-1 min-w-0">
            <AnalystInsightsFullPage />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Insights Full Page (adapte depuis le panel) ──────────────────────────────

function AnalystInsightsFullPage() {
  // Reutiliser AnalystInsightsPanel en mode full-page (sans onClose)
  return (
    <div className="h-full overflow-y-auto">
      <AnalystInsightsPanel onClose={() => {}} isFullPage />
    </div>
  )
}
