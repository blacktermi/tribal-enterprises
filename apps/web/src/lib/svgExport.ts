import { PDFDocument } from 'pdf-lib'
export function downloadSVG(svgEl: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgEl)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadPNG(svgEl: SVGSVGElement, filename: string, scale = 2) {
  // Cloner l'élément pour préserver le DOM
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  // Assurer les dimensions
  const width = Number(clone.getAttribute('width')) || svgEl.clientWidth || 300
  const height = Number(clone.getAttribute('height')) || svgEl.clientHeight || 150
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  // Sérialiser
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  // Dessiner dans un canvas et exporter en PNG
  const img = new Image()
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(width * scale * dpr)
  canvas.height = Math.floor(height * scale * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(scale * dpr, scale * dpr)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      resolve()
    }
    img.onerror = e => reject(e)
    img.src = svgUrl
  })
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export async function downloadPDF(svgEl: SVGSVGElement, filename: string, scale = 2) {
  // Convertir d'abord en PNG haute résolution
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  const width = Number(clone.getAttribute('width')) || svgEl.clientWidth || 300
  const height = Number(clone.getAttribute('height')) || svgEl.clientHeight || 150
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const img = new Image()
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(width * scale * dpr)
  canvas.height = Math.floor(height * scale * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(scale * dpr, scale * dpr)

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      resolve()
    }
    img.onerror = e => reject(e)
    img.src = svgUrl
  })

  const dataUrl = canvas.toDataURL('image/png')

  // Créer le PDF et y insérer l’image
  const pdfDoc = await PDFDocument.create()
  const pngImage = await pdfDoc.embedPng(dataUrl)
  const page = pdfDoc.addPage([width, height])
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width,
    height,
  })
  const pdfBytes = await pdfDoc.save()
  // Convertir en ArrayBuffer strict pour compat TS et BlobPart
  const ab = pdfBytes.buffer as ArrayBuffer
  const slice = ab.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
  const blob = new Blob([slice], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Helpers pour PDF multi-pages
async function svgToPngDataUrl(
  svgEl: SVGSVGElement,
  scale = 2
): Promise<{ dataUrl: string; width: number; height: number }> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  const width = Number(clone.getAttribute('width')) || svgEl.clientWidth || 300
  const height = Number(clone.getAttribute('height')) || svgEl.clientHeight || 150
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  const img = new Image()
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(width * scale * dpr)
  canvas.height = Math.floor(height * scale * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')
  ctx.scale(scale * dpr, scale * dpr)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      resolve()
    }
    img.onerror = e => reject(e)
    img.src = svgUrl
  })
  const dataUrl = canvas.toDataURL('image/png')
  return { dataUrl, width, height }
}

type PageSize = 'A4' | 'Letter'
type Orientation = 'portrait' | 'landscape'

function getPageDims(
  size: PageSize = 'A4',
  orientation: Orientation = 'landscape'
): { w: number; h: number } {
  // Dimensions en points (1 pt = 1/72")
  const sizes: Record<PageSize, { w: number; h: number }> = {
    A4: { w: 595.28, h: 841.89 }, // 210mm x 297mm
    Letter: { w: 612, h: 792 },
  }
  const s = sizes[size]
  return orientation === 'landscape' ? { w: s.h, h: s.w } : { w: s.w, h: s.h }
}

export async function downloadPDFMulti(
  svgEls: SVGSVGElement[],
  filename: string,
  opts?: { pageSize?: PageSize; orientation?: Orientation; margin?: number; scale?: number }
) {
  const pageSize = opts?.pageSize ?? 'A4'
  const orientation = opts?.orientation ?? 'landscape'
  const margin = opts?.margin ?? 24 // pts
  const scale = opts?.scale ?? 2
  const { w: pageW, h: pageH } = getPageDims(pageSize, orientation)
  const contentW = pageW - margin * 2
  const contentH = pageH - margin * 2
  const pdfDoc = await PDFDocument.create()
  for (const svg of svgEls) {
    const { dataUrl, width, height } = await svgToPngDataUrl(svg, scale)
    const pngImage = await pdfDoc.embedPng(dataUrl)
    // Calcul du fit contain pour respecter le ratio
    const ratio = Math.min(contentW / width, contentH / height)
    const drawW = width * ratio
    const drawH = height * ratio
    const x = margin + (contentW - drawW) / 2
    const y = margin + (contentH - drawH) / 2
    const page = pdfDoc.addPage([pageW, pageH])
    page.drawImage(pngImage, { x, y, width: drawW, height: drawH })
  }
  const pdfBytes = await pdfDoc.save()
  const ab = pdfBytes.buffer as ArrayBuffer
  const slice = ab.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
  const blob = new Blob([slice], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
