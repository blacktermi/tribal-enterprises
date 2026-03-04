import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Canvas as FabricCanvas,
  Rect,
  Circle,
  Triangle,
  Line,
  IText,
  FabricImage,
  ActiveSelection,
} from 'fabric'
import type { FabricObject } from 'fabric'
import {
  MousePointer2,
  Hand,
  Type,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  ImagePlus,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ChevronLeft,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Check,
  Loader2,
  Clock,
  X,
} from 'lucide-react'
import { useDesignStore } from './useDesignStore'
import { SIZE_PRESETS, FONT_LIST, DEFAULT_SHAPE_PROPS, DEFAULT_TEXT_PROPS, UNIT_TO_PX, UNIT_LABELS } from './constants'
import type { CanvasSize, DesignTool, ExportFormat } from './types'
import {
  useDesigns,
  useDesignDetail,
  useCreateDesign,
  useUpdateDesign,
  useDeleteDesign,
} from '../hooks/useAiStudio'

function downloadFile(content: string, filename: string, type?: string) {
  const link = document.createElement('a')
  if (type) {
    const blob = new Blob([content], { type })
    link.href = URL.createObjectURL(blob)
  } else {
    link.href = content
  }
  link.download = filename
  link.click()
}

// ---------- Dimension Picker (Phase Setup) ----------

function toPixels(value: number, unit: CanvasSize['unit']): number {
  return Math.round(value * UNIT_TO_PX[unit])
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DimensionPicker() {
  const { setCanvasSize, setPhase, setCurrentDesignId } = useDesignStore()
  const [customWidth, setCustomWidth] = useState(1080)
  const [customHeight, setCustomHeight] = useState(1080)
  const [unit, setUnit] = useState<CanvasSize['unit']>('px')

  const { data: designsData, isLoading: designsLoading } = useDesigns()
  const deleteDesign = useDeleteDesign()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const categories = Array.from(new Set(SIZE_PRESETS.map((p) => p.category)))

  const handlePreset = (width: number, height: number) => {
    setCurrentDesignId(null)
    setCanvasSize({ width, height, unit: 'px' })
    setPhase('editor')
  }

  const handleCustom = () => {
    if (customWidth > 0 && customHeight > 0) {
      const widthPx = toPixels(customWidth, unit)
      const heightPx = toPixels(customHeight, unit)
      setCurrentDesignId(null)
      setCanvasSize({ width: widthPx, height: heightPx, unit })
      setPhase('editor')
    }
  }

  const handleOpenDesign = (design: { id: string; width: number; height: number; unit: string }) => {
    setCurrentDesignId(design.id)
    setCanvasSize({ width: design.width, height: design.height, unit: design.unit as CanvasSize['unit'] })
    setPhase('editor')
  }

  const handleDeleteDesign = (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    deleteDesign.mutate(id, {
      onSettled: () => setDeletingId(null),
    })
  }

  // Apercu en pixels quand l'unite n'est pas px
  const previewW = toPixels(customWidth, unit)
  const previewH = toPixels(customHeight, unit)

  const designs = designsData?.designs || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white/90">Creer un Design</h1>
          <p className="text-white/50 text-sm">
            Choisissez un format preset ou definissez des dimensions personnalisees
          </p>
        </div>

        {/* ─── Mes Designs ─────────────────────────────────── */}
        {!designsLoading && designs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} />
              Mes designs ({designs.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden
                    hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]
                    transition-all duration-200 group relative"
                >
                  <button
                    onClick={() => handleOpenDesign(design)}
                    className="w-full text-left"
                  >
                    {design.thumbnail ? (
                      <div className="aspect-square bg-white/[0.02] flex items-center justify-center overflow-hidden">
                        <img
                          src={design.thumbnail}
                          alt={design.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-white/[0.02] flex items-center justify-center">
                        <span className="text-white/20 text-xs">{design.width}x{design.height}</span>
                      </div>
                    )}
                    <div className="p-3">
                      <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors block truncate">
                        {design.name}
                      </span>
                      <span className="text-white/30 text-xs block mt-0.5">
                        {design.width} x {design.height} px
                      </span>
                      <span className="text-white/20 text-[10px] block mt-0.5">
                        {formatDate(design.updatedAt)}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDesign(design.id)
                    }}
                    disabled={deletingId === design.id}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/40 hover:text-red-400
                      flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    {deletingId === design.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SIZE_PRESETS.filter((p) => p.category === cat).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset.width, preset.height)}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-left
                    hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]
                    transition-all duration-200 group"
                >
                  <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                    {preset.name}
                  </span>
                  <span className="block text-white/30 text-xs mt-1">
                    {preset.width} x {preset.height} px
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">
            Dimensions personnalisees
          </h2>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-white/40">Largeur</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                min={1}
                step={unit === 'px' ? 1 : 0.1}
                className="w-28 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2
                  text-white text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <span className="text-white/20 pb-2.5">x</span>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Hauteur</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                min={1}
                step={unit === 'px' ? 1 : 0.1}
                className="w-28 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2
                  text-white text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Unite</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as CanvasSize['unit'])}
                className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2
                  text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                {UNIT_LABELS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCustom}
              className="px-6 py-2 rounded-lg font-medium text-sm text-white
                bg-gradient-to-r from-violet-600 to-purple-600
                hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Creer le design
            </button>
          </div>
          {unit !== 'px' && customWidth > 0 && customHeight > 0 && (
            <p className="text-xs text-white/30 mt-2">
              = {previewW} x {previewH} px (96 DPI)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Toolbar Item ----------

interface ToolbarBtnProps {
  icon: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title?: string
}

function ToolbarBtn({ icon, active, disabled, onClick, title }: ToolbarBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
        ${active ? 'bg-violet-500/20 text-violet-400' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon}
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="h-px bg-white/10 mx-2 my-1" />
}

// ---------- Properties Bar ----------

function PropertiesBar({
  props,
  onPropChange,
  onDuplicate,
  onDelete,
}: {
  props: Record<string, unknown>
  onPropChange: (key: string, value: unknown) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const isText = props.type === 'i-text'

  return (
    <div className="h-12 bg-[#0c0c14] border-b border-white/[0.06] px-4 flex items-center gap-3 text-xs">
      {isText ? (
        <>
          <select
            value={(props.fontFamily as string) || 'Inter'}
            onChange={(e) => onPropChange('fontFamily', e.target.value)}
            className="bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white text-xs
              focus:outline-none focus:border-violet-500/50"
          >
            {FONT_LIST.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            type="number"
            value={(props.fontSize as number) || 32}
            onChange={(e) => onPropChange('fontSize', Number(e.target.value))}
            min={8}
            max={200}
            className="w-16 bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white text-xs
              focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={() => onPropChange('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')}
            className={`w-7 h-7 flex items-center justify-center rounded font-bold text-sm
              ${props.fontWeight === 'bold' ? 'bg-violet-500/20 text-violet-400' : 'text-white/50 hover:text-white/80'}`}
          >
            B
          </button>
          <button
            onClick={() => onPropChange('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`w-7 h-7 flex items-center justify-center rounded italic text-sm
              ${props.fontStyle === 'italic' ? 'bg-violet-500/20 text-violet-400' : 'text-white/50 hover:text-white/80'}`}
          >
            I
          </button>
          <label className="flex items-center gap-1 text-white/40">
            <input
              type="color"
              value={(props.fill as string) || '#ffffff'}
              onChange={(e) => onPropChange('fill', e.target.value)}
              className="w-5 h-5 rounded border-none cursor-pointer bg-transparent"
            />
          </label>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onPropChange('textAlign', 'left')}
              className={`w-7 h-7 flex items-center justify-center rounded
                ${props.textAlign === 'left' ? 'text-violet-400' : 'text-white/50 hover:text-white/80'}`}
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => onPropChange('textAlign', 'center')}
              className={`w-7 h-7 flex items-center justify-center rounded
                ${props.textAlign === 'center' ? 'text-violet-400' : 'text-white/50 hover:text-white/80'}`}
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => onPropChange('textAlign', 'right')}
              className={`w-7 h-7 flex items-center justify-center rounded
                ${props.textAlign === 'right' ? 'text-violet-400' : 'text-white/50 hover:text-white/80'}`}
            >
              <AlignRight size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="flex items-center gap-1 text-white/40">
            Fill
            <input
              type="color"
              value={(props.fill as string) || '#6366f1'}
              onChange={(e) => onPropChange('fill', e.target.value)}
              className="w-5 h-5 rounded border-none cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1 text-white/40">
            Stroke
            <input
              type="color"
              value={(props.stroke as string) || '#000000'}
              onChange={(e) => onPropChange('stroke', e.target.value)}
              className="w-5 h-5 rounded border-none cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1 text-white/40">
            Epaisseur
            <input
              type="number"
              value={(props.strokeWidth as number) ?? 0}
              onChange={(e) => onPropChange('strokeWidth', Number(e.target.value))}
              min={0}
              max={20}
              className="w-14 bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white text-xs
                focus:outline-none focus:border-violet-500/50"
            />
          </label>
          <label className="flex items-center gap-1 text-white/40">
            Opacite
            <input
              type="range"
              value={(props.opacity as number) ?? 1}
              onChange={(e) => onPropChange('opacity', Number(e.target.value))}
              min={0}
              max={1}
              step={0.05}
              className="w-20 accent-violet-500"
            />
          </label>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onDuplicate}
          title="Dupliquer (Ctrl+D)"
          className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={onDelete}
          title="Supprimer"
          className="w-7 h-7 flex items-center justify-center rounded text-white/50 hover:text-red-400 hover:bg-white/[0.04]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ---------- Save Status Indicator ----------

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  return (
    <span className={`flex items-center gap-1 text-xs transition-opacity ${
      status === 'saved' ? 'text-emerald-400/70' :
      status === 'saving' ? 'text-white/40' :
      status === 'error' ? 'text-red-400/70' : ''
    }`}>
      {status === 'saving' && <><Loader2 size={12} className="animate-spin" /> Sauvegarde...</>}
      {status === 'saved' && <><Check size={12} /> Sauvegarde</>}
      {status === 'error' && 'Erreur sauvegarde'}
    </span>
  )
}

// ---------- Main Editor ----------

export function DesignEditor() {
  const store = useDesignStore()
  const {
    phase,
    canvasSize,
    activeTool,
    selectedObjectProps,
    history,
    historyIndex,
    currentDesignId,
    setActiveTool,
    setSelectedObjectProps,
    setCurrentDesignId,
    pushHistory,
    undo,
    redo,
    reset,
  } = store

  const fabricRef = useRef<FabricCanvas | null>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLoadingRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedJsonRef = useRef<string>('')

  const [showExportMenu, setShowExportMenu] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // ─── Design persistence hooks ──────────────────────────────────────────
  const createDesign = useCreateDesign()
  const updateDesign = useUpdateDesign()
  const { data: designDetail } = useDesignDetail(currentDesignId)

  // ─── Generate thumbnail ────────────────────────────────────────────────
  const generateThumbnail = useCallback((): string | null => {
    const canvas = fabricRef.current
    if (!canvas) return null
    try {
      return canvas.toDataURL({ format: 'png', multiplier: 0.2, quality: 0.7 })
    } catch {
      return null
    }
  }, [])

  // ─── Save function ────────────────────────────────────────────────────
  const performSave = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvasSize) return

    const canvasJson = canvas.toJSON() as Record<string, unknown>
    const jsonStr = JSON.stringify(canvasJson)

    // Skip if nothing changed
    if (jsonStr === lastSavedJsonRef.current) return

    const thumbnail = generateThumbnail()
    const designId = useDesignStore.getState().currentDesignId

    if (designId) {
      // Update existing
      setSaveStatus('saving')
      updateDesign.mutate(
        { id: designId, data: { canvasJson, thumbnail } },
        {
          onSuccess: () => {
            lastSavedJsonRef.current = jsonStr
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
          },
          onError: () => {
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
          },
        }
      )
    } else {
      // Create new
      setSaveStatus('saving')
      createDesign.mutate(
        {
          name: 'Sans titre',
          width: canvasSize.width,
          height: canvasSize.height,
          unit: canvasSize.unit,
          canvasJson,
        },
        {
          onSuccess: (created) => {
            setCurrentDesignId(created.id)
            lastSavedJsonRef.current = jsonStr
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
          },
          onError: () => {
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
          },
        }
      )
    }
  }, [canvasSize, createDesign, updateDesign, setCurrentDesignId, generateThumbnail])

  // ---------- Update selected object props ----------
  const updateSelectedProps = useCallback(
    (obj: FabricObject | undefined) => {
      if (!obj) {
        setSelectedObjectProps(null)
        return
      }
      setSelectedObjectProps({
        type: obj.type,
        fill: obj.fill as string,
        stroke: obj.stroke as string,
        strokeWidth: obj.strokeWidth,
        opacity: obj.opacity,
        ...(obj instanceof IText
          ? {
              fontSize: obj.fontSize,
              fontFamily: obj.fontFamily,
              fontWeight: obj.fontWeight,
              fontStyle: obj.fontStyle,
              textAlign: obj.textAlign,
            }
          : {}),
      })
    },
    [setSelectedObjectProps],
  )

  // ---------- Init fabric canvas ----------
  useEffect(() => {
    if (phase !== 'editor' || !canvasElRef.current || !canvasSize) return

    const canvas = new FabricCanvas(canvasElRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
    })
    fabricRef.current = canvas

    // Fit canvas in container
    if (containerRef.current) {
      const padding = 60
      const scaleX = (containerRef.current.clientWidth - padding * 2) / canvasSize.width
      const scaleY = (containerRef.current.clientHeight - padding * 2) / canvasSize.height
      const zoom = Math.min(scaleX, scaleY, 1)
      canvas.setZoom(zoom)
      canvas.setDimensions({
        width: canvasSize.width * zoom,
        height: canvasSize.height * zoom,
      })
    }

    // Save initial state
    pushHistory(JSON.stringify(canvas.toJSON()))

    const saveState = () => {
      if (isLoadingRef.current) return
      pushHistory(JSON.stringify(canvas.toJSON()))
    }
    canvas.on('object:added', saveState)
    canvas.on('object:modified', saveState)
    canvas.on('object:removed', saveState)

    canvas.on('selection:created', (e) => updateSelectedProps(e.selected?.[0]))
    canvas.on('selection:updated', (e) => updateSelectedProps(e.selected?.[0]))
    canvas.on('selection:cleared', () => setSelectedObjectProps(null))

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, canvasSize])

  // ---------- Load existing design into canvas ----------
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !designDetail || !currentDesignId) return

    isLoadingRef.current = true
    canvas.loadFromJSON(designDetail.canvasJson as string).then(() => {
      canvas.renderAll()
      isLoadingRef.current = false
      // Set last saved ref so auto-save doesn't re-save immediately
      lastSavedJsonRef.current = JSON.stringify(canvas.toJSON())
      // Re-push history from loaded state
      pushHistory(JSON.stringify(canvas.toJSON()))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designDetail, currentDesignId])

  // ---------- Auto-save every 30s ----------
  useEffect(() => {
    if (phase !== 'editor') return

    autoSaveTimerRef.current = setInterval(() => {
      performSave()
    }, 30_000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [phase, performSave])

  // ---------- Undo / Redo: reload canvas from history ----------
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || history.length === 0 || historyIndex < 0) return

    const json = history[historyIndex]
    isLoadingRef.current = true
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll()
      isLoadingRef.current = false
    })
  }, [historyIndex, history])

  // ---------- Tool click on canvas (text) ----------
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || phase !== 'editor') return

    const handleMouseDown = (opt: { e: MouseEvent }) => {
      if (activeTool !== 'text') return
      const pointer = canvas.getScenePoint(opt.e)
      const text = new IText('Tapez ici', {
        left: pointer.x,
        top: pointer.y,
        ...DEFAULT_TEXT_PROPS,
      })
      canvas.add(text)
      canvas.setActiveObject(text)
      setActiveTool('select')
    }

    canvas.on('mouse:down', handleMouseDown as never)
    return () => {
      canvas.off('mouse:down', handleMouseDown as never)
    }
  }, [activeTool, phase, setActiveTool])

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    if (phase !== 'editor') return

    const handler = (e: KeyboardEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        performSave()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = canvas.getActiveObject()
        if (active && !(active instanceof IText && (active as IText).isEditing)) {
          e.preventDefault()
          canvas.remove(active)
          canvas.discardActiveObject()
          canvas.renderAll()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        const active = canvas.getActiveObject()
        if (active) {
          active.clone().then((cloned: FabricObject) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
            canvas.add(cloned)
            canvas.setActiveObject(cloned)
            canvas.renderAll()
          })
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        canvas.discardActiveObject()
        const allObjects = canvas.getObjects()
        if (allObjects.length > 0) {
          const selection = new ActiveSelection(allObjects, { canvas })
          canvas.setActiveObject(selection)
          canvas.renderAll()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, undo, redo, performSave])

  // ---------- Add shape helpers ----------
  const randomOffset = () => Math.floor(Math.random() * 80) - 40

  const addShape = useCallback(
    (tool: DesignTool) => {
      const canvas = fabricRef.current
      if (!canvas || !canvasSize) return

      const cx = canvasSize.width / 2 + randomOffset()
      const cy = canvasSize.height / 2 + randomOffset()

      let obj: FabricObject | null = null

      switch (tool) {
        case 'rect':
          obj = new Rect({ left: cx - 100, top: cy - 75, width: 200, height: 150, ...DEFAULT_SHAPE_PROPS })
          break
        case 'circle':
          obj = new Circle({ left: cx - 75, top: cy - 75, radius: 75, ...DEFAULT_SHAPE_PROPS })
          break
        case 'triangle':
          obj = new Triangle({ left: cx - 100, top: cy - 87, width: 200, height: 175, ...DEFAULT_SHAPE_PROPS })
          break
        case 'line':
          obj = new Line([cx - 100, cy, cx + 100, cy], { stroke: '#ffffff', strokeWidth: 2 })
          break
      }

      if (obj) {
        canvas.add(obj)
        canvas.setActiveObject(obj)
        canvas.renderAll()
        setActiveTool('select')
      }
    },
    [canvasSize, setActiveTool],
  )

  // ---------- Image upload ----------
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      FabricImage.fromURL(dataUrl).then((img) => {
        const canvas = fabricRef.current
        if (!canvas) return
        // Scale down if larger than canvas
        const maxW = (canvas.width || 800) * 0.8
        const maxH = (canvas.height || 600) * 0.8
        if (img.width && img.height) {
          const scale = Math.min(maxW / img.width, maxH / img.height, 1)
          img.scale(scale)
        }
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  // ---------- Property change on selected object ----------
  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const active = canvas.getActiveObject()
      if (!active) return
      active.set(key as keyof FabricObject, value as never)
      canvas.renderAll()
      updateSelectedProps(active)
      pushHistory(JSON.stringify(canvas.toJSON()))
    },
    [pushHistory, updateSelectedProps],
  )

  // ---------- Duplicate & Delete ----------
  const handleDuplicate = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return
    active.clone().then((cloned: FabricObject) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
    })
  }, [])

  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return
    canvas.remove(active)
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [])

  // ---------- Export ----------
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const canvas = fabricRef.current
      if (!canvas || !canvasSize) return

      // Save before export
      performSave()

      canvas.discardActiveObject()
      canvas.renderAll()

      if (format === 'svg') {
        const svg = canvas.toSVG()
        downloadFile(svg, 'design.svg', 'image/svg+xml')
      } else if (format === 'pdf') {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 })
        const { jsPDF } = await import('jspdf')
        const pdf = new jsPDF({
          orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvasSize.width, canvasSize.height],
        })
        pdf.addImage(dataUrl, 'PNG', 0, 0, canvasSize.width, canvasSize.height)
        pdf.save('design.pdf')
      } else {
        const dataUrl = canvas.toDataURL({
          format,
          multiplier: 2,
          quality: format === 'jpeg' ? 0.9 : undefined,
        })
        downloadFile(dataUrl, `design.${format}`)
      }

      setShowExportMenu(false)
    },
    [canvasSize, performSave],
  )

  // ---------- Tool definitions ----------
  const tools: { tool: DesignTool; icon: React.ReactNode; title: string }[] = [
    { tool: 'select', icon: <MousePointer2 size={18} />, title: 'Selection (V)' },
    { tool: 'pan', icon: <Hand size={18} />, title: 'Deplacer' },
    { tool: 'text', icon: <Type size={18} />, title: 'Texte' },
    { tool: 'rect', icon: <Square size={18} />, title: 'Rectangle' },
    { tool: 'circle', icon: <CircleIcon size={18} />, title: 'Cercle' },
    { tool: 'triangle', icon: <TriangleIcon size={18} />, title: 'Triangle' },
    { tool: 'line', icon: <Minus size={18} />, title: 'Ligne' },
    { tool: 'image', icon: <ImagePlus size={18} />, title: 'Image' },
  ]

  const handleToolClick = (tool: DesignTool) => {
    if (tool === 'image') {
      fileInputRef.current?.click()
      return
    }
    if (['rect', 'circle', 'triangle', 'line'].includes(tool)) {
      addShape(tool)
      return
    }
    setActiveTool(tool)
    const canvas = fabricRef.current
    if (canvas) {
      canvas.isDrawingMode = false
      canvas.defaultCursor = tool === 'pan' ? 'grab' : 'default'
    }
  }

  // ---------- Render ----------

  if (phase === 'setup') {
    return <DimensionPicker />
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="h-11 bg-[#0c0c14] border-b border-white/[0.06] px-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            // Save before going back
            performSave()
            reset()
          }}
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft size={16} />
          Retour
        </button>
        <span className="text-white/20 text-xs">
          {canvasSize?.width} x {canvasSize?.height} px
        </span>

        <div className="ml-auto flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <button
            onClick={performSave}
            title="Sauvegarder (Ctrl+S)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60
              hover:text-white/90 hover:bg-white/[0.06] transition-colors"
          >
            <Save size={14} />
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left toolbar */}
        <div className="w-[52px] bg-[#0c0c14] border-r border-white/[0.06] flex flex-col items-center gap-1 py-2 shrink-0">
          {tools.map((t) => (
            <ToolbarBtn
              key={t.tool}
              icon={t.icon}
              active={activeTool === t.tool}
              onClick={() => handleToolClick(t.tool)}
              title={t.title}
            />
          ))}

          <ToolbarSeparator />

          <ToolbarBtn
            icon={<Undo2 size={18} />}
            disabled={!store.canUndo()}
            onClick={undo}
            title="Annuler (Ctrl+Z)"
          />
          <ToolbarBtn
            icon={<Redo2 size={18} />}
            disabled={!store.canRedo()}
            onClick={redo}
            title="Retablir (Ctrl+Y)"
          />
          <ToolbarBtn icon={<Trash2 size={18} />} onClick={handleDelete} title="Supprimer" />

          <ToolbarSeparator />

          <div className="relative">
            <ToolbarBtn
              icon={<Download size={18} />}
              onClick={() => setShowExportMenu((v) => !v)}
              title="Exporter"
            />
            {showExportMenu && (
              <div className="absolute left-12 top-0 bg-[#15152a] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50 min-w-[120px]">
                {(['png', 'jpeg', 'svg', 'pdf'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Properties bar */}
          {selectedObjectProps && (
            <PropertiesBar
              props={selectedObjectProps}
              onPropChange={handlePropChange}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          )}

          {/* Pasteboard */}
          <div
            ref={containerRef}
            className="flex-1 bg-[#1a1a2e] overflow-hidden flex items-center justify-center"
          >
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}
