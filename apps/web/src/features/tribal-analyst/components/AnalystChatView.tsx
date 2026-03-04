/**
 * TRIBAL ANALYST - Chat View
 * Layout style ChatGPT/Claude simplifie pour l'analyste business
 * Pas d'upload, pas d'edition de messages
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  Square,
  Brain,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  AlertTriangle,
  X,
  ArrowDown,
  TrendingUp,
  BarChart3,
  Users,
  ShoppingCart,
  Target,
  Zap,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { cn } from '../../../lib/utils'
import {
  useAnalystConversation,
  useCreateAnalystConversation,
  useStreamAnalystMessage,
} from '../hooks/useTribalAnalyst'

import type { AnalystMessage } from '../api/analystApi'

// ─── Rendu Markdown simple (maison, sans dependance) ─────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) =>
      `<pre class="md-codeblock" data-lang="${lang}"><code>${code.trimEnd()}</code></pre>`
  )

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Headers (h1-h3)
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
  html = html.replace(/((?:<li class="md-oli">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="md-hr" />')

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  )

  // Line breaks → paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p class="md-p">')

  // Single newlines → <br> (but not inside pre)
  html = html.replace(/(?<!<\/pre>|<pre[^>]*>)\n(?!<pre|<\/pre>)/g, '<br />')

  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<')) {
    html = `<p class="md-p">${html}</p>`
  }

  return html
}

// ─── Composant message ───────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AnalystMessage
  isStreaming?: boolean
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderedContent = useMemo(
    () => (isUser ? null : renderMarkdown(message.content)),
    [message.content, isUser]
  )

  // Message User
  if (isUser) {
    return (
      <div className="max-w-3xl mx-auto flex justify-end">
        <div className="max-w-[80%]">
          <div className="px-4 py-2.5 rounded-2xl bg-tribal-accent/10 text-white text-sm leading-relaxed border border-tribal-accent/20">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Message Assistant
  return (
    <div className="group max-w-3xl mx-auto">
      <div
        className="markdown-content prose prose-sm prose-invert max-w-none text-white/80 text-sm leading-tight"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderedContent || '') }}
      />

      {/* Typing animation pendant streaming */}
      {isStreaming && (
        <span className="inline-flex items-center gap-0.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      )}

      {/* Actions sous le message (hover) */}
      {!isStreaming && message.content && (
        <div className="mt-2 flex items-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/60 transition-colors p-1 rounded-md hover:bg-white/[0.04]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-tribal-accent" />
                <span className="text-tribal-accent">Copie</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>

          {message.duration && (
            <span className="text-[10px] text-white/40">
              {(message.duration / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Ecran d'accueil ─────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  onQuickPrompt: (prompt: string) => void
  isCreating: boolean
}

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Bilan mensuel',
    prompt: 'Fais-moi un bilan complet de ce mois : CA, commandes, depenses, benefice, et tendances.',
    color: 'text-blue-500',
    bg: 'bg-blue-900/20 border-blue-800/40',
  },
  {
    icon: BarChart3,
    label: 'Performance marques',
    prompt: 'Quelles marques performent le mieux ? Compare le CA, les commandes et le ROAS par marque.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-900/20 border-indigo-800/40',
  },
  {
    icon: ShoppingCart,
    label: 'Analyse depenses',
    prompt: 'Analyse mes depenses et identifie les economies possibles. Quelles categories coutent le plus ?',
    color: 'text-violet-500',
    bg: 'bg-violet-900/20 border-violet-800/40',
  },
  {
    icon: Target,
    label: 'ROAS par marque',
    prompt: 'Quel est mon ROAS par marque ? Quelles campagnes marketing sont les plus rentables ?',
    color: 'text-cyan-500',
    bg: 'bg-cyan-900/20 border-cyan-800/40',
  },
  {
    icon: Zap,
    label: 'Mois vs precedent',
    prompt: 'Compare ce mois vs le mois dernier sur tous les indicateurs : CA, commandes, clients, depenses.',
    color: 'text-amber-500',
    bg: 'bg-amber-900/20 border-amber-800/40',
  },
  {
    icon: Users,
    label: 'Clients rentables',
    prompt: 'Quels clients sont les plus rentables ? Donne-moi le top 10 avec leur CA et nombre de commandes.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-900/20 border-emerald-800/40',
  },
]

function WelcomeScreen({ onQuickPrompt, isCreating }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl w-full">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-tribal-accent flex items-center justify-center shadow-lg shadow-tribal-accent/20">
          <Brain className="w-8 h-8 text-tribal-black" />
        </div>

        <h2 className="text-2xl font-display font-bold text-white mb-2">Tribal Analyst</h2>
        <p className="text-white/40 mb-8">
          Votre analyste IA business. Posez vos questions sur les commandes, la comptabilite, le
          marketing, les clients et plus encore.
        </p>

        {/* Quick prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {QUICK_PROMPTS.map(qp => {
            const Icon = qp.icon
            return (
              <button
                key={qp.label}
                onClick={() => onQuickPrompt(qp.prompt)}
                disabled={isCreating}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                  qp.bg
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', qp.color)} />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-white/80 block">{qp.label}</span>
                  <span className="text-[11px] text-white/40 line-clamp-2">{qp.prompt}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface AnalystChatViewProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
  headerRight?: React.ReactNode
  headerLeft?: React.ReactNode
}

export function AnalystChatView({
  conversationId,
  onConversationCreated,
  headerRight,
  headerLeft,
}: AnalystChatViewProps) {
  const { data: conversation, refetch: refetchConversation } = useAnalystConversation(conversationId)
  const createConversation = useCreateAnalystConversation()
  const { streamMessage } = useStreamAnalystMessage()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isNearBottomRef = useRef(true)

  // Messages combines (DB + streaming en cours)
  const messages: AnalystMessage[] = useMemo(() => {
    const dbMessages = conversation?.messages || []
    if (isStreaming && streamingContent) {
      return [
        ...dbMessages,
        {
          id: streamingMessageId || 'streaming',
          conversationId: conversationId || '',
          role: 'assistant' as const,
          content: streamingContent,
          model: null,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          duration: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]
    }
    return dbMessages
  }, [conversation?.messages, isStreaming, streamingContent, streamingMessageId, conversationId])

  // ─── Scroll intelligent ──────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const threshold = 100
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const nearBottom = distanceFromBottom < threshold
    isNearBottomRef.current = nearBottom
    setShowScrollButton(!nearBottom)
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    adjustTextarea()
  }, [input, adjustTextarea])

  // ─── Envoyer un message ─────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingMessageId(null)
    setStreamError(null)

    isNearBottomRef.current = true
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      let activeConversationId = conversationId

      if (!activeConversationId) {
        const conv = await createConversation.mutateAsync({})
        activeConversationId = conv.id
        onConversationCreated(conv.id)
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      await refetchConversation()

      await streamMessage(
        activeConversationId,
        content,
        chunk => {
          if (chunk.type === 'delta' && chunk.content) {
            setStreamingContent(prev => prev + chunk.content)
          }
          if (chunk.type === 'done' && chunk.messageId) {
            setStreamingMessageId(chunk.messageId)
          }
          if (chunk.type === 'error' && chunk.error) {
            setStreamError(chunk.error)
          }
        },
        {},
        controller.signal
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Erreur streaming:', err)
        setStreamError((err as Error).message || 'Erreur inconnue lors du streaming')
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingMessageId(null)
      abortControllerRef.current = null
      await refetchConversation()
    }
  }, [input, isStreaming, conversationId, createConversation, onConversationCreated, refetchConversation, streamMessage])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick prompt depuis l'ecran d'accueil
  const handleQuickPrompt = useCallback(
    async (prompt: string) => {
      setInput(prompt)
      setTimeout(async () => {
        setInput('')
        setIsStreaming(true)
        setStreamingContent('')
        setStreamingMessageId(null)
        setStreamError(null)

        isNearBottomRef.current = true

        try {
          const conv = await createConversation.mutateAsync({})
          onConversationCreated(conv.id)

          const controller = new AbortController()
          abortControllerRef.current = controller

          await streamMessage(
            conv.id,
            prompt,
            chunk => {
              if (chunk.type === 'delta' && chunk.content) {
                setStreamingContent(prev => prev + chunk.content)
              }
              if (chunk.type === 'done' && chunk.messageId) {
                setStreamingMessageId(chunk.messageId)
              }
              if (chunk.type === 'error' && chunk.error) {
                setStreamError(chunk.error)
              }
            },
            {},
            controller.signal
          )
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Erreur streaming:', err)
            setStreamError((err as Error).message || 'Erreur inconnue')
          }
        } finally {
          setIsStreaming(false)
          setStreamingContent('')
          setStreamingMessageId(null)
          abortControllerRef.current = null
          await refetchConversation()
        }
      }, 100)
    },
    [createConversation, onConversationCreated, streamMessage, refetchConversation]
  )

  // Si aucune conversation selectionnee → ecran d'accueil
  if (!conversationId) {
    return (
      <div className="flex flex-col h-full relative">
        {headerLeft && <div className="absolute top-3 left-3 z-10">{headerLeft}</div>}
        {headerRight && <div className="absolute top-3 right-3 z-10">{headerRight}</div>}
        <WelcomeScreen onQuickPrompt={handleQuickPrompt} isCreating={createConversation.isPending} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-tribal-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {headerLeft}
          <div className="w-8 h-8 rounded-lg bg-tribal-accent flex items-center justify-center flex-shrink-0 hidden sm:flex">
            <Brain className="w-4 h-4 text-tribal-black" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {conversation?.title || 'Nouvelle analyse'}
            </h3>
            <p className="text-[10px] text-white/40">Analyste IA Business</p>
          </div>
        </div>
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[300px] text-white/40">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Posez votre question pour commencer l'analyse</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {/* Erreur de streaming */}
          {streamError && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{streamError}</span>
                <button onClick={() => setStreamError(null)} className="shrink-0 text-white/40 hover:text-white/60 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bouton scroll-to-bottom */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-tribal-gray border border-white/[0.06] shadow-lg flex items-center justify-center text-white/60 hover:bg-white/[0.08] transition-all hover:shadow-xl"
          title="Aller en bas"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-tribal-black/50 backdrop-blur-sm">
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-sm focus-within:border-tribal-accent/40 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question business..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-white/80 placeholder-white/25 focus:outline-none disabled:opacity-50 max-h-[200px]"
            />

            {isStreaming ? (
              <button onClick={handleStop} className="m-2 p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors" title="Arreter la generation">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  'm-2 p-2 rounded-xl transition-all',
                  input.trim()
                    ? 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20 hover:bg-tribal-accent-light hover:shadow-lg hover:shadow-tribal-accent/30'
                    : 'bg-white/[0.04] text-white/40 cursor-not-allowed'
                )}
                title="Envoyer (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Indicateur de streaming */}
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-tribal-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyse en cours...</span>
              <button onClick={handleStop} className="flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors ml-auto">
                Arreter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
