import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ArrowLeft,
  Sparkles,
  Upload,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Check,
  Maximize2,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Zap,
  Star,
  UserRound,
  Import,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { formatCost, CATEGORY_INFO } from '../models/registry'
import { useRunModel } from '../hooks/useAiStudio'
import type { FalModel, ModelParam } from '../models/registry'
import type { GenerationResult } from '../api/aiStudioApi'

// ─── Batch Types ──────────────────────────────────────────────────────────────

type ReferenceType = 'style' | 'character' | 'import'

interface ReferenceImage {
  type: ReferenceType
  file: File
  preview: string
}

interface BatchItem {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: GenerationResult
  localResultUrl?: string
  error?: string
  duration?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BATCH_SIZE = 50

// ─── Local Image Processing ───────────────────────────────────────────────────

function applyGrayscale(canvas: HTMLCanvasElement, intensity: number, contrast: number): void {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const factor = intensity / 100

  // Contrast adjustment: -50 to +50 mapped to multiplier
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let i = 0; i < data.length; i += 4) {
    // Luminance perceptuelle (ITU-R BT.709)
    const gray = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])

    // Blend original and grayscale based on intensity
    let r = Math.round(data[i] * (1 - factor) + gray * factor)
    let g = Math.round(data[i + 1] * (1 - factor) + gray * factor)
    let b = Math.round(data[i + 2] * (1 - factor) + gray * factor)

    // Apply contrast
    if (contrast !== 0) {
      r = Math.round(contrastFactor * (r - 128) + 128)
      g = Math.round(contrastFactor * (g - 128) + 128)
      b = Math.round(contrastFactor * (b - 128) + 128)
    }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
}

function applySepia(canvas: HTMLCanvasElement, intensity: number): void {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const factor = intensity / 100

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Sepia formula
    const sr = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b)
    const sg = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b)
    const sb = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b)

    data[i] = Math.round(r * (1 - factor) + sr * factor)
    data[i + 1] = Math.round(g * (1 - factor) + sg * factor)
    data[i + 2] = Math.round(b * (1 - factor) + sb * factor)
  }

  ctx.putImageData(imageData, 0, 0)
}

async function processLocalModel(
  modelId: string,
  file: File,
  params: Record<string, unknown>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Impossible de creer le contexte canvas'))
        return
      }
      ctx.drawImage(img, 0, 0)

      const intensity = (params.intensity as number) ?? 100
      const contrast = (params.contrast as number) ?? 0

      if (modelId === 'local/grayscale') {
        applyGrayscale(canvas, intensity, contrast)
      } else if (modelId === 'local/sepia') {
        applySepia(canvas, intensity)
      }

      const resultUrl = canvas.toDataURL('image/png')
      resolve(resultUrl)
    }
    img.onerror = () => reject(new Error("Impossible de charger l'image"))
    img.src = URL.createObjectURL(file)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GenerationWorkspaceProps {
  model: FalModel
  onBack: () => void
}

export function GenerationWorkspace({ model, onBack }: GenerationWorkspaceProps) {
  const categoryInfo = CATEGORY_INFO[model.category]
  const runModel = useRunModel()
  const isLocalModel = model.backend === 'local'

  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {}
    for (const param of model.params) {
      if (param.default !== undefined) {
        defaults[param.key] = param.default
      }
    }
    return defaults
  })

  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [localResultUrl, setLocalResultUrl] = useState<string | null>(null)
  const [localProcessing, setLocalProcessing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Batch state ──────────────────────────────────────────────────────────
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [isBatchRunning, setIsBatchRunning] = useState(false)
  const [isBatchPaused, setIsBatchPaused] = useState(false)
  const batchPausedRef = useRef(false)
  const batchAbortRef = useRef(false)

  // ─── References state ────────────────────────────────────────────────────
  const [references, setReferences] = useState<ReferenceImage[]>([])
  const refInputRef = useRef<HTMLInputElement>(null)
  const [activeRefType, setActiveRefType] = useState<ReferenceType>('style')

  // Detect batch mode: multiple images uploaded on a model that takes 1 image at a time
  const isBatchMode =
    model.acceptsImage && (model.maxImages ?? 1) === 1 && uploadedImages.length > 1

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      for (const img of uploadedImages) {
        URL.revokeObjectURL(img.preview)
      }
      for (const item of batchItems) {
        URL.revokeObjectURL(item.preview)
      }
      for (const ref of references) {
        URL.revokeObjectURL(ref.preview)
      }
    }
  }, [uploadedImages, batchItems, references])

  // ─── Reference helpers ──────────────────────────────────────────────────
  const addReference = useCallback((type: ReferenceType, file: File) => {
    // Remplacer si meme type existe deja
    setReferences(prev => {
      const existing = prev.find(r => r.type === type)
      if (existing) URL.revokeObjectURL(existing.preview)
      return [
        ...prev.filter(r => r.type !== type),
        { type, file, preview: URL.createObjectURL(file) },
      ]
    })
  }, [])

  const removeReference = useCallback((type: ReferenceType) => {
    setReferences(prev => {
      const ref = prev.find(r => r.type === type)
      if (ref) URL.revokeObjectURL(ref.preview)
      return prev.filter(r => r.type !== type)
    })
  }, [])

  const handleRefInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith('image/')) {
        addReference(activeRefType, file)
      }
      e.target.value = ''
    },
    [activeRefType, addReference]
  )

  const openRefPicker = useCallback((type: ReferenceType) => {
    setActiveRefType(type)
    setTimeout(() => refInputRef.current?.click(), 0)
  }, [])

  const updateFormValue = useCallback((key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleFileDrop = useCallback(
    (files: FileList | null) => {
      if (!files || !model.acceptsImage) return
      const effectiveMax = (model.maxImages ?? 1) === 1 ? MAX_BATCH_SIZE : (model.maxImages ?? 1)
      const newImages: Array<{ file: File; preview: string }> = []

      for (
        let i = 0;
        i < files.length && uploadedImages.length + newImages.length < effectiveMax;
        i++
      ) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          newImages.push({ file, preview: URL.createObjectURL(file) })
        }
      }

      setUploadedImages(prev => [...prev, ...newImages])
      setBatchItems([])
      setResult(null)
      setLocalResultUrl(null)
      setLocalError(null)
    },
    [model.acceptsImage, model.maxImages, uploadedImages.length]
  )

  const removeImage = useCallback(
    (index: number) => {
      if (isBatchRunning) return
      setUploadedImages(prev => {
        const removed = prev[index]
        if (removed) URL.revokeObjectURL(removed.preview)
        return prev.filter((_, i) => i !== index)
      })
      setBatchItems([])
      setResult(null)
      setLocalResultUrl(null)
      setLocalError(null)
    },
    [isBatchRunning]
  )

  const clearAllImages = useCallback(() => {
    if (isBatchRunning) return
    for (const img of uploadedImages) {
      URL.revokeObjectURL(img.preview)
    }
    setUploadedImages([])
    setBatchItems([])
    setResult(null)
    setLocalResultUrl(null)
    setLocalError(null)
  }, [isBatchRunning, uploadedImages])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileDrop(e.dataTransfer.files)
    },
    [handleFileDrop]
  )

  // ─── Single image submit (remote API) ─────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (isLocalModel) {
      // Local processing (single image)
      if (uploadedImages.length === 0) return
      setLocalProcessing(true)
      setLocalError(null)
      setLocalResultUrl(null)
      try {
        const resultUrl = await processLocalModel(model.id, uploadedImages[0].file, formValues)
        setLocalResultUrl(resultUrl)
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : 'Erreur de traitement')
      } finally {
        setLocalProcessing(false)
      }
      return
    }

    const input: Record<string, unknown> = { ...formValues }

    const inputUrls: string[] = []
    for (const img of uploadedImages) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(img.file)
      })
      inputUrls.push(dataUrl)
    }

    // Injecter les references dans l'input
    for (const ref of references) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(ref.file)
      })
      if (ref.type === 'style') {
        input.style_image_url = dataUrl
      } else if (ref.type === 'character') {
        input.character_image_url = dataUrl
      } else if (ref.type === 'import') {
        // Import = image de reference directe
        if (!inputUrls.length) inputUrls.push(dataUrl)
        else input.reference_image_url = dataUrl
      }
    }

    const prompt = (formValues.prompt ?? formValues.text ?? '') as string

    try {
      const res = await runModel.mutateAsync({
        modelId: model.id,
        type: model.inputType,
        prompt: prompt || undefined,
        input,
        inputUrls: inputUrls.length > 0 ? inputUrls : undefined,
        provider: model.backend,
      })
      setResult(res)
    } catch {
      // Error is handled via runModel.error
    }
  }, [formValues, uploadedImages, model, runModel, isLocalModel, references])

  // ─── Batch submit ─────────────────────────────────────────────────────────

  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }, [])

  const handleBatchSubmit = useCallback(async () => {
    if (uploadedImages.length === 0) return

    batchAbortRef.current = false
    batchPausedRef.current = false
    setIsBatchPaused(false)
    setIsBatchRunning(true)

    const items: BatchItem[] = uploadedImages.map((img, idx) => ({
      id: `batch-${idx}-${Date.now()}`,
      file: img.file,
      preview: img.preview,
      status: 'pending' as const,
    }))
    setBatchItems(items)

    const prompt = (formValues.prompt ?? formValues.text ?? '') as string
    const input: Record<string, unknown> = { ...formValues }
    const results = [...items]

    const processOne = async (itemIndex: number): Promise<void> => {
      if (batchAbortRef.current) return

      while (batchPausedRef.current && !batchAbortRef.current) {
        await new Promise(r => setTimeout(r, 200))
      }
      if (batchAbortRef.current) return

      const item = results[itemIndex]
      item.status = 'processing'
      setBatchItems([...results])

      const startTime = Date.now()

      try {
        if (isLocalModel) {
          // Local processing — instantaneous on canvas
          const resultUrl = await processLocalModel(model.id, item.file, input)
          item.status = 'completed'
          item.localResultUrl = resultUrl
          item.duration = Date.now() - startTime
        } else {
          const dataUrl = await fileToDataUrl(item.file)
          const res = await runModel.mutateAsync({
            modelId: model.id,
            type: model.inputType,
            prompt: prompt || undefined,
            input,
            inputUrls: [dataUrl],
            provider: model.backend,
          })
          item.status = 'completed'
          item.result = res
          item.duration = Date.now() - startTime
        }
      } catch (err: unknown) {
        item.status = 'failed'
        item.error = err instanceof Error ? err.message : 'Erreur inconnue'
        item.duration = Date.now() - startTime
      }

      setBatchItems([...results])
    }

    // Launch ALL items in parallel (no concurrency limit)
    await Promise.all(results.map((_, idx) => processOne(idx)))

    setIsBatchRunning(false)
  }, [uploadedImages, formValues, model, runModel, fileToDataUrl, isLocalModel])

  const handleBatchPauseResume = useCallback(() => {
    batchPausedRef.current = !batchPausedRef.current
    setIsBatchPaused(batchPausedRef.current)
  }, [])

  const handleBatchCancel = useCallback(() => {
    batchAbortRef.current = true
    batchPausedRef.current = false
    setIsBatchPaused(false)
    setIsBatchRunning(false)
  }, [])

  const handleRetryFailed = useCallback(async () => {
    if (batchItems.length === 0) return

    const failedIndices = batchItems
      .map((item, idx) => (item.status === 'failed' ? idx : -1))
      .filter(idx => idx >= 0)
    if (failedIndices.length === 0) return

    batchAbortRef.current = false
    batchPausedRef.current = false
    setIsBatchPaused(false)
    setIsBatchRunning(true)

    const input: Record<string, unknown> = { ...formValues }
    const prompt = (formValues.prompt ?? formValues.text ?? '') as string
    const results = [...batchItems]

    for (const idx of failedIndices) {
      results[idx].status = 'pending'
      results[idx].error = undefined
      results[idx].result = undefined
      results[idx].localResultUrl = undefined
      results[idx].duration = undefined
    }
    setBatchItems([...results])

    const processOne = async (realIdx: number): Promise<void> => {
      if (batchAbortRef.current) return
      while (batchPausedRef.current && !batchAbortRef.current) {
        await new Promise(r => setTimeout(r, 200))
      }
      if (batchAbortRef.current) return

      const item = results[realIdx]
      item.status = 'processing'
      setBatchItems([...results])

      const startTime = Date.now()
      try {
        if (isLocalModel) {
          const resultUrl = await processLocalModel(model.id, item.file, input)
          item.status = 'completed'
          item.localResultUrl = resultUrl
          item.duration = Date.now() - startTime
        } else {
          const dataUrl = await fileToDataUrl(item.file)
          const res = await runModel.mutateAsync({
            modelId: model.id,
            type: model.inputType,
            prompt: prompt || undefined,
            input,
            inputUrls: [dataUrl],
            provider: model.backend,
          })
          item.status = 'completed'
          item.result = res
          item.duration = Date.now() - startTime
        }
      } catch (err: unknown) {
        item.status = 'failed'
        item.error = err instanceof Error ? err.message : 'Erreur inconnue'
        item.duration = Date.now() - startTime
      }
      setBatchItems([...results])
    }

    await Promise.all(failedIndices.map(idx => processOne(idx)))

    setIsBatchRunning(false)
  }, [batchItems, formValues, model, runModel, fileToDataUrl, isLocalModel])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }, [])

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      // Fetch as blob to force real download (cross-origin URLs don't support <a download>)
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke after a short delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleDownloadAll = useCallback(() => {
    const completedItems = batchItems.filter(item => item.status === 'completed')
    completedItems.forEach((item, idx) => {
      const url = item.localResultUrl || item.result?.generation.outputUrls[0]
      if (!url) return
      const ext = item.localResultUrl ? 'png' : 'jpg'
      const filename = `batch-${idx + 1}-${item.file.name.replace(/\.[^.]+$/, '')}.${ext}`
      // Stagger downloads to avoid browser throttling
      setTimeout(() => handleDownload(url, filename), idx * 300)
    })
  }, [batchItems, handleDownload])

  // ─── Computed ─────────────────────────────────────────────────────────────

  const isRequiredMissing = model.params.some(p => p.required && !formValues[p.key])
  const needsImage = model.acceptsImage && uploadedImages.length === 0
  const isProcessing = isLocalModel ? localProcessing : runModel.isPending
  const canSubmit = !isRequiredMissing && !needsImage && !isProcessing && !isBatchRunning

  const batchCompleted = batchItems.filter(i => i.status === 'completed').length
  const batchFailed = batchItems.filter(i => i.status === 'failed').length
  const batchProcessing = batchItems.filter(i => i.status === 'processing').length
  const batchTotal = batchItems.length
  const batchProgress = batchTotal > 0 ? ((batchCompleted + batchFailed) / batchTotal) * 100 : 0
  const batchTotalCost = batchItems.reduce((sum, i) => sum + (i.result?.generation.cost ?? 0), 0)
  const batchTotalDuration = batchItems.reduce((sum, i) => sum + (i.duration ?? 0), 0)
  const batchDone = batchTotal > 0 && !isBatchRunning && batchCompleted + batchFailed === batchTotal

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 p-2 rounded-xl text-white/40 hover:bg-white/[0.08] hover:text-white/70 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white truncate">{model.name}</h2>
            <span className="shrink-0 text-[11px] text-white/30">{model.provider}</span>
            {isLocalModel && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-tribal-accent/10 text-tribal-accent">
                <Zap className="w-2.5 h-2.5" />
                Local
              </span>
            )}
            {model.backend === 'openrouter' && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-tribal-accent/10 text-tribal-accent">
                OpenRouter
              </span>
            )}
            {model.backend === 'vectorizer' && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/10 text-blue-400">
                Vectorizer.AI
              </span>
            )}
            <span
              className={cn(
                'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white bg-gradient-to-r',
                categoryInfo.color
              )}
            >
              {categoryInfo.label}
            </span>
            {isBatchMode && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <Layers className="w-3 h-3" />
                Batch ({uploadedImages.length})
              </span>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5 truncate">{model.description}</p>
        </div>

        <span
          className={cn(
            'shrink-0 inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-mono font-semibold',
            isLocalModel
              ? 'bg-tribal-accent/10 text-tribal-accent'
              : 'bg-tribal-accent/10 text-tribal-accent'
          )}
        >
          {isLocalModel ? 'Gratuit' : formatCost(model)}
        </span>
      </motion.div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: parameters */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-4"
        >
          {model.params.map((param, idx) => (
            <motion.div
              key={param.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.04 }}
            >
              <ParamField
                param={param}
                value={formValues[param.key]}
                onChange={val => updateFormValue(param.key, val)}
              />
            </motion.div>
          ))}

          {/* ─── References section (text-to-image only) ───────────────── */}
          {model.inputType === 'text-to-image' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider">
                  References
                </label>
                {references.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      for (const ref of references) URL.revokeObjectURL(ref.preview)
                      setReferences([])
                    }}
                    className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tout retirer
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {(['style', 'character', 'import'] as ReferenceType[]).map(type => {
                  const ref = references.find(r => r.type === type)
                  const config = {
                    style: { icon: Star, label: 'Style', color: 'text-tribal-accent' },
                    character: { icon: UserRound, label: 'Personnage', color: 'text-blue-400' },
                    import: { icon: Import, label: 'Importer', color: 'text-amber-400' },
                  }[type]
                  const Icon = config.icon
                  return (
                    <div key={type} className="relative group">
                      {ref ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/[0.08]">
                          <img
                            src={ref.preview}
                            alt={config.label}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeReference(type)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-white/70 py-0.5">
                            {config.label}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRefPicker(type)}
                          className="flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all"
                        >
                          <Icon className={cn('w-4 h-4', config.color)} />
                          <span className="text-[10px] text-white/40">{config.label}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                onChange={handleRefInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Image drop zone */}
          {model.acceptsImage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/70">
                  Image{isBatchMode ? 's' : ''} source
                  {isBatchMode && (
                    <span className="ml-1 text-xs text-amber-400 font-normal">
                      Mode batch - {uploadedImages.length} images
                    </span>
                  )}
                </label>
                {uploadedImages.length > 1 && !isBatchRunning && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tout supprimer
                  </button>
                )}
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isBatchRunning && fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all duration-200',
                  isBatchRunning
                    ? 'border-white/[0.06] bg-white/[0.02] cursor-not-allowed opacity-60'
                    : isDragging
                      ? 'border-tribal-accent bg-tribal-accent/10 cursor-pointer'
                      : 'border-white/[0.08] hover:border-tribal-accent/50 bg-white/[0.03] cursor-pointer'
                )}
              >
                <Upload
                  className={cn(
                    'w-8 h-8 transition-colors',
                    isDragging ? 'text-tribal-accent' : 'text-white/40'
                  )}
                />
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">
                    {isBatchMode
                      ? 'Ajoutez encore des images'
                      : 'Glissez une ou plusieurs images ici'}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    ou cliquez pour parcourir (max {MAX_BATCH_SIZE} pour le batch)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => handleFileDrop(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Image previews grid */}
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {uploadedImages.map((img, idx) => {
                    const batchItem = batchItems[idx]
                    return (
                      <div
                        key={img.preview}
                        className={cn(
                          'relative group w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300',
                          batchItem?.status === 'completed'
                            ? 'border-tribal-accent shadow-tribal-accent/20 shadow-md'
                            : batchItem?.status === 'failed'
                              ? 'border-red-500 shadow-red-500/20 shadow-md'
                              : batchItem?.status === 'processing'
                                ? 'border-tribal-accent shadow-tribal-accent/20 shadow-md animate-pulse'
                                : 'border-white/[0.08]'
                        )}
                      >
                        <img
                          src={img.preview}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {batchItem && batchItem.status !== 'pending' && (
                          <div
                            className={cn(
                              'absolute inset-0 flex items-center justify-center',
                              batchItem.status === 'completed'
                                ? 'bg-tribal-accent/20'
                                : batchItem.status === 'failed'
                                  ? 'bg-red-500/30'
                                  : 'bg-tribal-accent/20'
                            )}
                          >
                            {batchItem.status === 'completed' && (
                              <CheckCircle2 className="w-6 h-6 text-white drop-shadow-lg" />
                            )}
                            {batchItem.status === 'failed' && (
                              <XCircle className="w-6 h-6 text-white drop-shadow-lg" />
                            )}
                            {batchItem.status === 'processing' && (
                              <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow-lg" />
                            )}
                          </div>
                        )}
                        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold bg-black/60 text-white px-1 rounded">
                          {idx + 1}
                        </span>
                        {!isBatchRunning && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              removeImage(idx)
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Generate / Batch buttons */}
          {isBatchMode ? (
            <div className="space-y-3">
              {/* Batch progress bar */}
              {batchItems.length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-tribal-accent font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {batchCompleted}
                      </span>
                      {batchFailed > 0 && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          {batchFailed}
                        </span>
                      )}
                      {batchProcessing > 0 && (
                        <span className="flex items-center gap-1 text-tribal-accent font-semibold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {batchProcessing}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/40 font-mono">
                      <span className="font-semibold text-white/70">
                        {batchCompleted + batchFailed}/{batchTotal}
                      </span>
                      {batchTotalCost > 0 && <span>${batchTotalCost.toFixed(4)}</span>}
                      {batchTotalDuration > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {(batchTotalDuration / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        batchFailed > 0 && batchCompleted === 0
                          ? 'bg-red-500'
                          : batchFailed > 0
                            ? 'bg-tribal-accent'
                            : 'bg-tribal-accent'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${batchProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-center text-white/30 font-medium">
                    {isBatchRunning
                      ? isLocalModel
                        ? 'Traitement local en cours...'
                        : `Traitement en cours — toutes les images en parallele`
                      : batchDone
                        ? `Termine — ${batchCompleted} image${batchCompleted > 1 ? 's' : ''} traitee${batchCompleted > 1 ? 's' : ''}`
                        : ''}
                  </p>
                </div>
              )}

              {/* Batch action buttons */}
              <div className="flex gap-2">
                {!isBatchRunning && !batchDone && (
                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={!canSubmit}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300',
                      canSubmit
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]'
                        : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    Traiter {uploadedImages.length} images
                    {isLocalModel && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Gratuit</span>
                    )}
                  </button>
                )}

                {isBatchRunning && (
                  <>
                    <button
                      type="button"
                      onClick={handleBatchPauseResume}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 transition-all"
                    >
                      {isBatchPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          Reprendre
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchCancel}
                      className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </>
                )}

                {batchDone && (
                  <div className="flex gap-2 w-full">
                    {batchFailed > 0 && (
                      <button
                        type="button"
                        onClick={handleRetryFailed}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Relancer {batchFailed} echec{batchFailed > 1 ? 's' : ''}
                      </button>
                    )}
                    {batchCompleted > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-tribal-accent/15 text-tribal-accent hover:bg-tribal-accent/25 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Tout telecharger ({batchCompleted})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearAllImages}
                      className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-white/[0.06] text-white/50 hover:bg-white/[0.10] transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Nouveau batch
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.01 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300',
                canSubmit
                  ? isLocalModel
                    ? 'bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black shadow-lg shadow-tribal-accent/20 hover:shadow-tribal-accent/30'
                    : 'bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black shadow-lg shadow-tribal-accent/20 hover:shadow-tribal-accent/30'
                  : 'bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.06]'
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLocalModel ? (
                <Zap className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isProcessing ? 'Traitement en cours...' : isLocalModel ? 'Appliquer' : 'Generer'}
            </motion.button>
          )}
        </motion.div>

        {/* Right: results */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-4"
        >
          {/* ─── BATCH RESULTS ──────────────────────────────────────────────── */}
          {isBatchMode && batchItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Resultats batch
                </h3>
                {batchDone && (
                  <span className="text-xs text-white/40">
                    {batchCompleted} reussi{batchCompleted > 1 ? 's' : ''}
                    {batchTotalCost > 0 ? ` · $${batchTotalCost.toFixed(4)}` : ''}
                    {' · '}
                    {(batchTotalDuration / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-studio">
                {batchItems.map((item, idx) => (
                  <BatchResultCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onZoom={url => setLightboxUrl(url)}
                    onDownload={url => handleDownload(url, `batch-${idx + 1}-${item.file.name}`)}
                    onCopyUrl={url => handleCopyUrl(url)}
                    copiedUrl={copiedUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── SINGLE MODE RESULTS ───────────────────────────────────────── */}
          {!isBatchMode && (
            <>
              {/* Loading state */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'flex flex-col items-center justify-center p-12 rounded-xl border',
                      isLocalModel
                        ? 'bg-tribal-accent/10 border-tribal-accent/20'
                        : 'bg-tribal-accent/10 border-tribal-accent/20'
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          'w-16 h-16 rounded-full border-4 animate-spin',
                          isLocalModel
                            ? 'border-tribal-accent/30 border-t-tribal-accent'
                            : 'border-tribal-accent/30 border-t-tribal-accent'
                        )}
                      />
                      {isLocalModel ? (
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-tribal-accent animate-pulse" />
                      ) : (
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-tribal-accent animate-pulse" />
                      )}
                    </div>
                    <p
                      className={cn(
                        'mt-4 text-sm font-semibold',
                        isLocalModel ? 'text-tribal-accent' : 'text-tribal-accent'
                      )}
                    >
                      Traitement en cours...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state (remote or local) */}
              {(runModel.isError || localError) && (
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-red-900/20 border border-red-800/50">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-400">Erreur de traitement</p>
                    <p className="text-xs text-red-400/80 mt-1 max-w-xs">
                      {localError ||
                        runModel.error?.message ||
                        'Une erreur inattendue est survenue.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reessayer
                  </button>
                </div>
              )}

              {/* Local result */}
              {localResultUrl && !localProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-tribal-accent" />
                      Resultat
                    </h3>
                    <span className="text-xs text-tribal-accent font-medium">
                      Traitement local · Gratuit
                    </span>
                  </div>
                  <div className="group/result relative rounded-xl overflow-hidden border border-white/[0.06]">
                    <img
                      src={localResultUrl}
                      alt="Result"
                      className="w-full object-contain max-h-[500px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-300 flex items-end p-2">
                      <div className="flex items-center gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(localResultUrl)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              localResultUrl,
                              `${model.name.toLowerCase().replace(/\s+/g, '-')}-${uploadedImages[0]?.file.name || 'result'}`
                            )
                          }
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Remote results */}
              {result && !runModel.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Resultats</h3>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>${result.generation.cost.toFixed(4)}</span>
                      <span>·</span>
                      <span>{(result.generation.duration / 1000).toFixed(1)}s</span>
                      {result.generation.seed != null && (
                        <>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(result.generation.seed))
                              updateFormValue('seed', result.generation.seed)
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-colors font-mono"
                            title="Copier et reutiliser le seed"
                          >
                            Seed: {result.generation.seed}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {result.generation.outputUrls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.generation.outputUrls.map((url, idx) => (
                        <ResultMedia
                          key={url}
                          url={url}
                          index={idx}
                          modelCategory={model.category}
                          onZoom={() => setLightboxUrl(url)}
                          onDownload={() => handleDownload(url, `generation-${idx + 1}`)}
                          onCopyUrl={() => handleCopyUrl(url)}
                          isCopied={copiedUrl === url}
                        />
                      ))}
                    </div>
                  )}

                  {result.generation.outputUrls.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <ImageIcon className="w-8 h-8 text-white/30 mb-2" />
                      <p className="text-xs text-white/40">Aucun resultat genere</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Initial empty state */}
              {!result && !localResultUrl && !isProcessing && !runModel.isError && !localError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col items-center justify-center p-16 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-dashed border-white/[0.06]"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center mb-5',
                      isLocalModel
                        ? 'bg-tribal-accent/10'
                        : 'bg-tribal-accent/10'
                    )}
                  >
                    {isLocalModel ? (
                      <Zap className="w-7 h-7 text-tribal-accent" />
                    ) : (
                      <Sparkles className="w-7 h-7 text-tribal-accent" />
                    )}
                  </motion.div>
                  <p className="text-sm font-medium text-white/35">
                    {isLocalModel
                      ? 'Chargez une image et appliquez le filtre'
                      : 'Configurez les parametres et lancez la generation'}
                  </p>
                  <p className="text-[11px] text-white/20 mt-1.5">Les resultats s&apos;afficheront ici</p>
                </motion.div>
              )}
            </>
          )}

          {/* Batch empty state */}
          {isBatchMode && batchItems.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-gradient-to-br from-amber-900/10 to-orange-900/10 border border-dashed border-amber-700/30">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 flex items-center justify-center mb-4">
                <Layers className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-white/40">
                Mode batch : {uploadedImages.length} images
              </p>
              <p className="text-xs text-white/30 mt-1">
                Chaque image sera traitee avec les memes parametres
              </p>
              <p className="text-[10px] text-white/20 mt-2">
                {isLocalModel
                  ? 'Traitement local · Toutes en parallele · Gratuit'
                  : `Toutes en parallele · Cout estime : ~$${(uploadedImages.length * model.costPerUnit).toFixed(2)}`}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightboxUrl}
                alt="Generation result"
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-3 -right-3 p-2 rounded-full bg-white/10 shadow-lg text-white/70 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Batch Result Card ────────────────────────────────────────────────────────

interface BatchResultCardProps {
  item: BatchItem
  index: number
  onZoom: (url: string) => void
  onDownload: (url: string) => void
  onCopyUrl: (url: string) => void
  copiedUrl: string | null
}

function BatchResultCard({
  item,
  index,
  onZoom,
  onDownload,
  onCopyUrl,
  copiedUrl,
}: BatchResultCardProps) {
  const outputUrl = item.localResultUrl || item.result?.generation.outputUrls[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'rounded-xl overflow-hidden border-2 transition-all duration-300',
        item.status === 'completed'
          ? 'border-tribal-accent/30'
          : item.status === 'failed'
            ? 'border-red-800/50'
            : item.status === 'processing'
              ? 'border-tribal-accent/30'
              : 'border-white/[0.06]'
      )}
    >
      <div className="relative aspect-square bg-white/[0.03]">
        {item.status === 'completed' && outputUrl ? (
          <div className="group/result relative w-full h-full">
            <img
              src={outputUrl}
              alt={`Batch ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-300 flex items-end p-2">
              <div className="flex items-center gap-1 w-full">
                <button
                  type="button"
                  onClick={() => onZoom(outputUrl)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDownload(outputUrl)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onCopyUrl(outputUrl)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
                >
                  {copiedUrl === outputUrl ? (
                    <Check className="w-3 h-3 text-tribal-accent" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : item.status === 'processing' ? (
          <div className="w-full h-full relative">
            <img
              src={item.preview}
              alt={`Source ${index + 1}`}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <Loader2 className="w-8 h-8 text-tribal-accent animate-spin" />
              <span className="text-[10px] font-semibold text-white mt-2">Traitement...</span>
            </div>
          </div>
        ) : item.status === 'failed' ? (
          <div className="w-full h-full relative">
            <img
              src={item.preview}
              alt={`Source ${index + 1}`}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/30 p-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <span className="text-[10px] font-semibold text-red-300 mt-1 text-center line-clamp-2">
                {item.error || 'Erreur'}
              </span>
            </div>
          </div>
        ) : (
          <img
            src={item.preview}
            alt={`Source ${index + 1}`}
            className="w-full h-full object-cover opacity-60"
          />
        )}

        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <span
            className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-md',
              item.status === 'completed'
                ? 'bg-tribal-accent text-tribal-black'
                : item.status === 'failed'
                  ? 'bg-red-500 text-white'
                  : item.status === 'processing'
                    ? 'bg-tribal-accent text-tribal-black'
                    : 'bg-black/50 text-white'
            )}
          >
            #{index + 1}
          </span>
        </div>

        {item.duration !== undefined && item.duration > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded-md">
            {(item.duration / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      <div className="px-2 py-1.5 bg-white/[0.03]">
        <p className="text-[10px] text-white/40 truncate">{item.file.name}</p>
      </div>
    </motion.div>
  )
}

// ─── Param Field Renderer ─────────────────────────────────────────────────────

interface ParamFieldProps {
  param: ModelParam
  value: unknown
  onChange: (value: unknown) => void
}

function ParamField({ param, value, onChange }: ParamFieldProps) {
  const baseInputClass = cn(
    'w-full rounded-xl border text-sm transition-all duration-200',
    'bg-white/[0.03] border-white/[0.06]',
    'text-white placeholder-white/20',
    'focus:outline-none focus:ring-1 focus:ring-tribal-accent/30 focus:border-tribal-accent/20 focus:bg-white/[0.05]'
  )

  switch (param.type) {
    case 'textarea': {
      const textValue = (value as string) ?? ''
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {param.label}
              {param.required && <span className="ml-1 text-tribal-accent">*</span>}
            </label>
            {textValue.length > 0 && (
              <span className="text-[10px] text-white/20 font-mono">{textValue.length}</span>
            )}
          </div>
          <textarea
            value={textValue}
            onChange={e => onChange(e.target.value)}
            placeholder={param.placeholder}
            rows={4}
            className={cn(baseInputClass, 'px-4 py-3 resize-y min-h-[100px]')}
          />
        </div>
      )
    }

    case 'text': {
      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            {param.label}
            {param.required && <span className="ml-1 text-tribal-accent">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={param.placeholder}
            className={cn(baseInputClass, 'px-4 py-2.5')}
          />
        </div>
      )
    }

    case 'number': {
      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{param.label}</label>
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={e => {
              const v = e.target.value
              onChange(v === '' ? undefined : Number(v))
            }}
            placeholder={param.placeholder}
            min={param.min}
            max={param.max}
            step={param.step}
            className={cn(baseInputClass, 'px-4 py-2.5')}
          />
        </div>
      )
    }

    case 'select': {
      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{param.label}</label>
          <select
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            className={cn(
              baseInputClass,
              'px-4 py-2.5 appearance-none bg-no-repeat bg-right pr-10'
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25em 1.25em',
            }}
          >
            <option value="">Choisir...</option>
            {param.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    case 'slider': {
      const numValue = (value as number) ?? param.default ?? param.min ?? 0
      const min = param.min ?? 0
      const max = param.max ?? 100
      const step = param.step ?? 1
      const percent = ((numValue - min) / (max - min)) * 100

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{param.label}</label>
            <span className="text-xs font-mono font-semibold text-tribal-accent bg-tribal-accent/10 px-2.5 py-0.5 rounded-lg">
              {numValue}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/20 font-mono w-6 text-right">{min}</span>
            <div className="relative flex-1 h-8 flex items-center">
              <div className="absolute inset-x-0 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-tribal-accent rounded-full transition-all duration-150"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <input
                type="range"
                value={numValue}
                onChange={e => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute w-4 h-4 rounded-full bg-white shadow-lg shadow-tribal-accent/20 border-2 border-tribal-accent pointer-events-none transition-all duration-150"
                style={{ left: `calc(${percent}% - 8px)` }}
              />
            </div>
            <span className="text-[10px] text-white/20 font-mono w-6">{max}</span>
          </div>
        </div>
      )
    }

    case 'boolean': {
      const checked = (value as boolean) ?? (param.default as boolean) ?? false

      return (
        <div className="flex items-center justify-between py-1.5">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{param.label}</label>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300',
              checked ? 'bg-tribal-accent shadow-lg shadow-tribal-accent/20' : 'bg-white/[0.08]'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 mt-0.5 ml-0.5',
                checked ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Result Media Component ───────────────────────────────────────────────────

interface ResultMediaProps {
  url: string
  index: number
  modelCategory: string
  onZoom: () => void
  onDownload: () => void
  onCopyUrl: () => void
  isCopied: boolean
}

function ResultMedia({
  url,
  index,
  modelCategory,
  onZoom,
  onDownload,
  onCopyUrl,
  isCopied,
}: ResultMediaProps) {
  const isVideo = modelCategory.includes('video') || url.match(/\.(mp4|webm|mov)(\?|$)/i)
  const isAudio = modelCategory === 'audio' || url.match(/\.(mp3|wav|ogg|flac)(\?|$)/i)
  const isSvg = url.match(/\.svg(\?|$)/i)
  const isVectorFile = url.match(/\.(eps|pdf|dxf)(\?|$)/i)

  if (isVideo) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black">
        <video src={url} controls className="w-full" preload="metadata" />
        <div className="flex items-center gap-1 p-2 bg-white/[0.03]">
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white/50 hover:bg-white/[0.08] transition-colors"
          >
            <Download className="w-3 h-3" />
            Telecharger
          </button>
          <button
            type="button"
            onClick={onCopyUrl}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white/50 hover:bg-white/[0.08] transition-colors"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-tribal-accent" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {isCopied ? 'Copie !' : 'Copier URL'}
          </button>
        </div>
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.06] p-4 bg-white/[0.03] space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          Audio {index + 1}
        </div>
        <audio src={url} controls className="w-full" preload="metadata" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white/50 hover:bg-white/[0.08] transition-colors"
          >
            <Download className="w-3 h-3" />
            Telecharger
          </button>
          <button
            type="button"
            onClick={onCopyUrl}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white/50 hover:bg-white/[0.08] transition-colors"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-tribal-accent" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {isCopied ? 'Copie !' : 'Copier URL'}
          </button>
        </div>
      </div>
    )
  }

  // SVG (can render inline as image)
  if (isSvg) {
    return (
      <div className="group/result relative rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
        <div className="relative bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]">
          <img
            src={url}
            alt={`SVG ${index + 1}`}
            className="w-full object-contain max-h-[500px] p-4"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-300 flex items-end p-2">
          <div className="flex items-center gap-1 w-full">
            <button
              type="button"
              onClick={onZoom}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
            >
              <Download className="w-3 h-3" />
              SVG
            </button>
            <button
              type="button"
              onClick={onCopyUrl}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-tribal-accent" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vector file (EPS, PDF, DXF) — can't render inline, show download card
  if (isVectorFile) {
    const ext = url.match(/\.(eps|pdf|dxf)(\?|$)/i)?.[1]?.toUpperCase() || 'FILE'
    return (
      <div className="rounded-xl overflow-hidden border border-white/[0.06] p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 space-y-3">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-800/40 to-indigo-800/40 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-400">{ext}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Fichier vectoriel {ext}</p>
            <p className="text-xs text-white/40 mt-0.5">
              Ce format ne peut pas etre affiche directement
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Telecharger {ext}
          </button>
          <button
            type="button"
            onClick={onCopyUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:bg-white/[0.08] transition-colors"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-tribal-accent" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {isCopied ? 'Copie !' : 'Copier URL'}
          </button>
        </div>
      </div>
    )
  }

  // Image (default)
  return (
    <div className="group/result relative rounded-xl overflow-hidden border border-white/[0.06]">
      <img
        src={url}
        alt={`Result ${index + 1}`}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-300 flex items-end p-2">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={onZoom}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onCopyUrl}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-tribal-accent" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
