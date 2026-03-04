/**
 * TRIBAL LLM - Chat View
 * Layout style ChatGPT/Claude : messages pleine largeur, pas de bulles
 * Support multimedia : upload fichiers, drag&drop, paste images, preview attachments
 * Edition de messages user avec re-generation de la reponse
 * Theme dark-only premium
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  Square,
  Bot,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Zap,
  Brain,
  Code2,
  MessageSquare,
  AlertTriangle,
  X,
  FileText,
  Music,
  Image as ImageIcon,
  Download,
  Eye,
  ArrowDown,
  Pencil,
  Mic,
  MicOff,
  Camera,
  File,
  Headphones,
  Plus,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { cn } from '../../../lib/utils'
import {
  useConversation,
  useCreateConversation,
  useStreamMessage,
  useUploadFiles,
  useEditAndRestream,
} from '../hooks/useTribalLlm'
import { ModelSelector } from './ModelSelector'
import {
  getDefaultModel,
  findModelById,
  getFeaturedModels,
  type LlmModelInfo,
} from '../models/registry'

import type { LlmMessageRecord, LlmAttachment } from '../api/llmApi'

// ─── Web Speech API types (non standard, prefix webkit) ──────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onstart: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// ─── Types pour les fichiers en attente ──────────────────────────────────────

interface PendingFile {
  file: File
  preview?: string
  type: 'image' | 'document' | 'audio'
  id: string
}

function getFileType(mimeType: string): 'image' | 'document' | 'audio' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// ─── Rendu Markdown simple (maison, sans dependance) ─────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langLabel = lang || 'code'
    return `<div class="md-codeblock-wrapper"><div class="md-codeblock-header"><span class="md-codeblock-lang">${langLabel}</span></div><pre class="md-codeblock"><code>${code.trimEnd()}</code></pre></div>`
  })

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

// ─── Composant affichage des attachments ─────────────────────────────────────

interface AttachmentDisplayProps {
  attachments: LlmAttachment[]
  isUser: boolean
}

function AttachmentDisplay({ attachments, isUser }: AttachmentDisplayProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const images = attachments.filter(a => a.type === 'image')
  const docs = attachments.filter(a => a.type === 'document')
  const audios = attachments.filter(a => a.type === 'audio')

  return (
    <>
      {/* Images grid */}
      {images.length > 0 && (
        <div
          className={cn(
            'flex flex-wrap gap-1.5 mb-2',
            images.length === 1 ? 'max-w-xs' : 'max-w-sm'
          )}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxUrl(img.url)}
              className="relative group/img rounded-lg overflow-hidden border border-white/[0.08] hover:ring-2 hover:ring-tribal-accent/50 transition-all"
            >
              <img
                src={img.url}
                alt={img.filename}
                className={cn(
                  'object-cover',
                  images.length === 1 ? 'max-h-64 w-auto rounded-lg' : 'w-24 h-24'
                )}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <Eye className="w-5 h-5 text-white drop-shadow-md" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Documents */}
      {docs.map((doc, i) => (
        <a
          key={i}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-2 mb-1.5 px-3 py-2 rounded-lg text-xs transition-colors',
            isUser
              ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white/70'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60'
          )}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate flex-1">{doc.filename}</span>
          <span className="text-[10px] opacity-60">{formatFileSize(doc.size)}</span>
          <Download className="w-3 h-3 opacity-40" />
        </a>
      ))}

      {/* Audio */}
      {audios.map((audio, i) => (
        <div key={i} className="mb-1.5">
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] text-white/40 truncate">{audio.filename}</span>
          </div>
          <audio
            controls
            preload="metadata"
            className="w-full max-w-xs h-8"
            style={{ filter: isUser ? 'invert(1) hue-rotate(180deg)' : 'none' }}
          >
            <source src={audio.url} type={audio.mimeType} />
          </audio>
        </div>
      ))}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

// ─── Composant message style ChatGPT/Claude ──────────────────────────────────

interface MessageBubbleProps {
  message: LlmMessageRecord
  isStreaming?: boolean
  isEditing?: boolean
  editContent?: string
  onStartEdit?: (messageId: string, content: string) => void
  onCancelEdit?: () => void
  onSubmitEdit?: (content: string) => void
  onEditContentChange?: (content: string) => void
  canEdit?: boolean
}

function MessageBubble({
  message,
  isStreaming,
  isEditing,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onEditContentChange,
  canEdit,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
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

  // Extraire les attachments du metadata
  const attachments: LlmAttachment[] = useMemo(() => {
    if (!message.metadata || typeof message.metadata !== 'object') return []
    const meta = message.metadata as Record<string, unknown>
    if (Array.isArray(meta.attachments)) return meta.attachments as LlmAttachment[]
    return []
  }, [message.metadata])

  // Auto-resize du textarea d'edition
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const el = editTextareaRef.current
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`
      el.focus()
      // Placer le curseur a la fin
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [isEditing])

  // Auto-resize pendant la frappe
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const el = editTextareaRef.current
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`
    }
  }, [editContent, isEditing])

  // ─── Message User ────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="max-w-3xl mx-auto flex justify-end group">
        <div className="max-w-[80%] relative">
          {/* Attachments au-dessus du texte */}
          {attachments.length > 0 && (
            <div className="flex justify-end mb-1.5">
              <AttachmentDisplay attachments={attachments} isUser />
            </div>
          )}

          {isEditing ? (
            // ─── Mode edition ──────────────────────────────────────────
            <div className="rounded-2xl bg-white/[0.08] overflow-hidden">
              <textarea
                ref={editTextareaRef}
                value={editContent || ''}
                onChange={e => onEditContentChange?.(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const trimmed = (editContent || '').trim()
                    if (trimmed) onSubmitEdit?.(trimmed)
                  }
                  if (e.key === 'Escape') {
                    onCancelEdit?.()
                  }
                }}
                className="w-full resize-none bg-transparent px-4 py-2.5 text-sm text-white focus:outline-none max-h-[300px]"
                rows={1}
              />
              <div className="flex items-center justify-end gap-2 px-3 pb-2">
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 text-xs text-white/50 hover:text-white/80 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const trimmed = (editContent || '').trim()
                    if (trimmed) onSubmitEdit?.(trimmed)
                  }}
                  disabled={!(editContent || '').trim()}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg transition-colors',
                    (editContent || '').trim()
                      ? 'bg-tribal-accent text-tribal-black hover:bg-tribal-accent-light'
                      : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                  )}
                >
                  Envoyer
                </button>
              </div>
            </div>
          ) : (
            // ─── Mode normal ───────────────────────────────────────────
            <>
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.08] text-white/90 text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Bouton edit (visible au hover) */}
              {canEdit && (
                <button
                  onClick={() => onStartEdit?.(message.id, message.content)}
                  className="absolute -left-2 -top-3 lg:-left-8 lg:top-1/2 lg:-translate-y-1/2 p-1 rounded-md text-white/20 hover:text-white/50 hover:bg-white/[0.06] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                  title="Modifier le message"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Message Assistant ───────────────────────────────────────────────────
  return (
    <div className="group max-w-3xl mx-auto">
      {/* Attachments (rare pour assistant, mais au cas ou) */}
      {attachments.length > 0 && <AttachmentDisplay attachments={attachments} isUser={false} />}

      {/* Contenu Markdown pleine largeur */}
      <div
        className="markdown-content prose prose-sm prose-invert max-w-none text-white/80 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderedContent || '') }}
      />

      {/* Typing animation pendant streaming */}
      {isStreaming && (
        <span className="inline-flex items-center gap-0.5 mt-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </span>
      )}

      {/* Actions sous le message assistant (hover) */}
      {!isStreaming && message.content && (
        <div className="mt-2 flex items-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/60 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
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

          {message.model && (
            <span className="text-[10px] text-white/30">
              {findModelById(message.model)?.name || message.model}
              {message.duration ? ` · ${(message.duration / 1000).toFixed(1)}s` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Preview des fichiers en attente ──────────────────────────────────────────

interface PendingFilesPreviewProps {
  files: PendingFile[]
  onRemove: (id: string) => void
  isUploading: boolean
}

function PendingFilesPreview({ files, onRemove, isUploading }: PendingFilesPreviewProps) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
      {files.map(pf => (
        <div
          key={pf.id}
          className="relative group/pf flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04]"
        >
          {pf.type === 'image' && pf.preview ? (
            <img src={pf.preview} alt={pf.file.name} className="w-10 h-10 rounded object-cover" />
          ) : pf.type === 'audio' ? (
            <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-purple-400" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
          )}

          <div className="min-w-0 max-w-[120px]">
            <p className="text-[10px] font-medium text-white/70 truncate">{pf.file.name}</p>
            <p className="text-[9px] text-white/40">{formatFileSize(pf.file.size)}</p>
          </div>

          {isUploading ? (
            <Loader2 className="w-3 h-3 text-tribal-accent animate-spin shrink-0" />
          ) : (
            <button
              onClick={() => onRemove(pf.id)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover/pf:opacity-100 transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Ecran d'accueil (pas de conversation selectionnee) ──────────────────────

interface WelcomeScreenProps {
  onSelectModel: (model: LlmModelInfo) => void
}

function WelcomeScreen({ onSelectModel }: WelcomeScreenProps) {
  const featured = getFeaturedModels()

  const CATEGORY_ICONS = {
    flagship: Sparkles,
    fast: Zap,
    reasoning: Brain,
    coding: Code2,
  } as Record<string, typeof Sparkles>

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-tribal-accent flex items-center justify-center shadow-lg shadow-tribal-accent/20">
          <Bot className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold font-display text-white mb-2">Tribal LLM</h2>
        <p className="text-white/50 mb-8">
          Discutez avec les meilleurs modeles IA. Choisissez un modele pour commencer.
        </p>

        {/* Featured models grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {featured.map(model => {
            const CatIcon = CATEGORY_ICONS[model.category] || MessageSquare
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(model)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-md transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${model.iconColor}15` }}
                >
                  <CatIcon className="w-5 h-5" style={{ color: model.iconColor }} />
                </div>
                <span className="text-sm font-medium text-white/80 group-hover:text-tribal-accent transition-colors">
                  {model.name}
                </span>
                <span className="text-[10px] text-white/40">{model.provider}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface LlmChatViewProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
  headerRight?: React.ReactNode
  headerLeft?: React.ReactNode
}

export function LlmChatView({
  conversationId,
  onConversationCreated,
  headerRight,
  headerLeft,
}: LlmChatViewProps) {
  const { data: conversation, refetch: refetchConversation } = useConversation(conversationId)
  const createConversation = useCreateConversation()
  const { streamMessage } = useStreamMessage()
  const { editAndRestream } = useEditAndRestream()
  const uploadFiles = useUploadFiles()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [selectedModel, setSelectedModel] = useState(() => getDefaultModel().id)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  // ─── Speech-to-text (Web Speech API) ─────────────────────────────────
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // ─── Etat edition de message ──────────────────────────────────────────
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isNearBottomRef = useRef(true)

  // ─── Speech-to-text helpers ──────────────────────────────────────────
  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!speechSupported) return
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'fr-FR'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      if (finalTranscript) {
        setInput(prev => prev + finalTranscript)
      }
      // On pourrait afficher l'interim dans un placeholder, mais
      // pour la simplicite on attend les resultats finaux
      void interimTranscript
    }

    recognition.onerror = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [speechSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  // Messages combines (DB + streaming en cours)
  const messages: LlmMessageRecord[] = useMemo(() => {
    const dbMessages = conversation?.messages || []
    if (isStreaming && streamingContent) {
      return [
        ...dbMessages,
        {
          id: streamingMessageId || 'streaming',
          conversationId: conversationId || '',
          role: 'assistant' as const,
          content: streamingContent,
          model: selectedModel,
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
  }, [
    conversation?.messages,
    isStreaming,
    streamingContent,
    streamingMessageId,
    conversationId,
    selectedModel,
  ])

  // Sync selected model with conversation
  useEffect(() => {
    if (conversation?.model) {
      setSelectedModel(conversation.model)
    }
  }, [conversation?.model])

  // ─── Scroll intelligent ──────────────────────────────────────────────────

  // Detecter si on est pres du bas
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const threshold = 100
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const nearBottom = distanceFromBottom < threshold
    isNearBottomRef.current = nearBottom
    setShowScrollButton(!nearBottom)
  }, [])

  // Auto-scroll seulement si l'utilisateur est deja en bas
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Scroll to bottom au clic
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

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach(pf => {
        if (pf.preview) URL.revokeObjectURL(pf.preview)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Gestion des fichiers ───────────────────────────────────────────────

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PendingFile[] = Array.from(files)
      .slice(0, 5) // Max 5 fichiers
      .map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        type: getFileType(file.type),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }))

    setPendingFiles(prev => {
      // Limiter a 5 fichiers total
      const combined = [...prev, ...newFiles].slice(0, 5)
      return combined
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setPendingFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const handleFileSelect = useCallback((accept?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        accept ||
        'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.pdf,.txt,.md,.csv,.doc,.docx,audio/mpeg,audio/wav,audio/ogg,audio/webm,video/mp4,video/webm,video/quicktime'
      fileInputRef.current.click()
    }
    setShowAttachMenu(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files)
        e.target.value = '' // Reset pour pouvoir re-selectionner le meme fichier
      }
    },
    [addFiles]
  )

  // Fermer le menu attach au clic exterieur
  useEffect(() => {
    if (!showAttachMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAttachMenu])

  // Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  // Paste images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        addFiles(files)
      }
    },
    [addFiles]
  )

  // ─── Edition de message ─────────────────────────────────────────────────

  const handleStartEdit = useCallback(
    (messageId: string, content: string) => {
      if (isStreaming) return
      setEditingMessageId(messageId)
      setEditContent(content)
    },
    [isStreaming]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditContent('')
  }, [])

  const handleSubmitEdit = useCallback(
    async (newContent: string) => {
      if (!conversationId || !editingMessageId || isStreaming) return

      const messageId = editingMessageId
      setEditingMessageId(null)
      setEditContent('')
      setIsStreaming(true)
      setStreamingContent('')
      setStreamingMessageId(null)
      setStreamError(null)

      // Forcer le scroll en bas
      isNearBottomRef.current = true
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

      try {
        const controller = new AbortController()
        abortControllerRef.current = controller

        await editAndRestream(
          conversationId,
          messageId,
          newContent,
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
          { model: selectedModel },
          controller.signal
        )
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erreur edit+stream:', err)
          setStreamError((err as Error).message || 'Erreur inconnue')
        }
      } finally {
        setIsStreaming(false)
        setStreamingContent('')
        setStreamingMessageId(null)
        abortControllerRef.current = null
        await refetchConversation()
      }
    },
    [
      conversationId,
      editingMessageId,
      isStreaming,
      selectedModel,
      editAndRestream,
      refetchConversation,
    ]
  )

  // ─── Envoyer un message ─────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if ((!content && pendingFiles.length === 0) || isStreaming) return

    const filesToUpload = [...pendingFiles]
    setInput('')
    setPendingFiles([])
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingMessageId(null)
    setStreamError(null)

    // Forcer le scroll en bas quand l'utilisateur envoie un message
    isNearBottomRef.current = true
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      let activeConversationId = conversationId

      // Creer la conversation si aucune selectionnee
      if (!activeConversationId) {
        const conv = await createConversation.mutateAsync({
          model: selectedModel,
          provider: findModelById(selectedModel)?.providerSlug || 'openrouter',
        })
        activeConversationId = conv.id
        onConversationCreated(conv.id)
      }

      // Upload les fichiers si present
      let attachments: LlmAttachment[] | undefined
      if (filesToUpload.length > 0) {
        setIsUploading(true)
        try {
          const uploadResult = await uploadFiles.mutateAsync(filesToUpload.map(pf => pf.file))
          attachments = uploadResult.files
        } finally {
          setIsUploading(false)
        }
      }

      // Cleanup previews
      filesToUpload.forEach(pf => {
        if (pf.preview) URL.revokeObjectURL(pf.preview)
      })

      // Abort controller pour pouvoir arreter
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Refetch pour voir le message user dans la DB avant le stream
      await refetchConversation()

      // Stream la reponse
      await streamMessage(
        activeConversationId,
        content || '(fichiers joints)',
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
        { model: selectedModel, attachments },
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
      setIsUploading(false)
      abortControllerRef.current = null
      // Refetch pour obtenir les messages finaux de la DB
      await refetchConversation()
    }
  }, [
    input,
    pendingFiles,
    isStreaming,
    conversationId,
    selectedModel,
    createConversation,
    onConversationCreated,
    refetchConversation,
    streamMessage,
    uploadFiles,
  ])

  // Arreter le streaming
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  // Gestion du clavier dans le textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Creer une conversation depuis l'ecran d'accueil
  const handleWelcomeModelSelect = async (model: LlmModelInfo) => {
    setSelectedModel(model.id)
    try {
      const conv = await createConversation.mutateAsync({
        model: model.id,
        provider: model.providerSlug || 'openrouter',
      })
      onConversationCreated(conv.id)
    } catch {
      // handled by React Query
    }
  }

  // Si aucune conversation selectionnee → ecran d'accueil
  if (!conversationId) {
    return (
      <div className="flex flex-col h-full relative">
        {headerLeft && <div className="absolute top-3 left-3 z-10">{headerLeft}</div>}
        {headerRight && <div className="absolute top-3 right-3 z-10">{headerRight}</div>}
        <WelcomeScreen onSelectModel={handleWelcomeModelSelect} />
      </div>
    )
  }

  const currentModel = findModelById(selectedModel)

  return (
    <div
      className={cn(
        'flex flex-col h-full relative',
        isDragging && 'ring-2 ring-tribal-accent/50 ring-inset'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-tribal-accent/10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-tribal-dark shadow-xl border-2 border-dashed border-tribal-accent/50">
            <ImageIcon className="w-8 h-8 text-tribal-accent" />
            <p className="text-sm font-medium text-tribal-accent">Deposez vos fichiers ici</p>
            <p className="text-[10px] text-white/40">Images, documents, audio (max 5 fichiers)</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {headerLeft}
          <div className="w-8 h-8 rounded-lg bg-tribal-accent flex items-center justify-center flex-shrink-0 hidden sm:flex">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {conversation?.title || 'Nouvelle conversation'}
            </h3>
            {currentModel && (
              <p className="text-[10px] text-white/40">
                {currentModel.provider} · {currentModel.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} compact />
          {headerRight}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-studio"
      >
        <div className="px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[300px] text-white/30">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Envoyez un message pour commencer</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              isEditing={editingMessageId === msg.id}
              editContent={editingMessageId === msg.id ? editContent : undefined}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={handleSubmitEdit}
              onEditContentChange={setEditContent}
              canEdit={msg.role === 'user' && !isStreaming && msg.id !== 'streaming'}
            />
          ))}

          {/* Erreur de streaming inline discret */}
          {streamError && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{streamError}</span>
                <button
                  onClick={() => setStreamError(null)}
                  className="shrink-0 text-white/40 hover:text-white/60 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bouton scroll-to-bottom flottant */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] shadow-lg flex items-center justify-center text-white/60 hover:bg-white/[0.12] transition-all hover:shadow-xl"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Pending files preview */}
      <PendingFilesPreview files={pendingFiles} onRemove={removeFile} isUploading={isUploading} />

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-sm focus-within:border-tribal-accent/40 transition-all">
            {/* Bouton attach avec menu */}
            <div className="relative ml-2 mb-2.5" ref={attachMenuRef}>
              <button
                onClick={() => setShowAttachMenu(prev => !prev)}
                disabled={isStreaming || pendingFiles.length >= 5}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  pendingFiles.length >= 5
                    ? 'text-white/20 cursor-not-allowed'
                    : showAttachMenu
                      ? 'text-tribal-accent bg-tribal-accent/10'
                      : 'text-white/40 hover:text-tribal-accent hover:bg-tribal-accent/10'
                )}
              >
                <Plus
                  className={cn('w-4 h-4 transition-transform', showAttachMenu && 'rotate-45')}
                />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/[0.08] bg-tribal-gray shadow-xl shadow-black/40 overflow-hidden z-50">
                  <button
                    onClick={() =>
                      handleFileSelect('image/jpeg,image/png,image/gif,image/webp,image/svg+xml')
                    }
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/70 hover:text-tribal-accent hover:bg-white/[0.04] transition-colors"
                  >
                    <Camera className="w-4 h-4 text-tribal-accent" />
                    Photo / Image
                  </button>
                  <button
                    onClick={() => handleFileSelect('.pdf,.txt,.md,.csv,.doc,.docx')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/70 hover:text-cyan-400 hover:bg-white/[0.04] transition-colors"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Document
                  </button>
                  <button
                    onClick={() => handleFileSelect('audio/mpeg,audio/wav,audio/ogg,audio/webm')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/70 hover:text-tribal-accent hover:bg-white/[0.04] transition-colors"
                  >
                    <Headphones className="w-4 h-4 text-tribal-accent" />
                    Audio
                  </button>
                  <button
                    onClick={() => handleFileSelect('video/mp4,video/webm,video/quicktime')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/70 hover:text-amber-400 hover:bg-white/[0.04] transition-colors"
                  >
                    <File className="w-4 h-4 text-amber-400" />
                    Multimedia
                  </button>
                </div>
              )}
            </div>

            {/* Bouton micro speech-to-text */}
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={isStreaming}
                className={cn(
                  'mb-2.5 p-1.5 rounded-lg transition-all',
                  isListening
                    ? 'text-red-400 bg-red-500/15 animate-pulse'
                    : 'text-white/40 hover:text-tribal-accent hover:bg-tribal-accent/10'
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                pendingFiles.length > 0
                  ? 'Ajoutez un message ou envoyez les fichiers...'
                  : 'Ecrivez votre message...'
              }
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none disabled:opacity-50 max-h-[200px]"
            />

            {isStreaming ? (
              <button
                onClick={handleStop}
                className="m-2 p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && pendingFiles.length === 0}
                className={cn(
                  'm-2 p-2 rounded-xl transition-all',
                  input.trim() || pendingFiles.length > 0
                    ? 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20 hover:shadow-lg hover:shadow-tribal-accent/30'
                    : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Indicateur de streaming */}
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-tribal-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{isUploading ? 'Upload des fichiers...' : 'Generation en cours...'}</span>
              <button
                onClick={handleStop}
                className="flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                Arreter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
