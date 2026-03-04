/**
 * Service de Génération Automatique de Factures PDF
 *
 * Génère automatiquement une facture PDF quand une commande est passée
 *
 * Les informations de l'entreprise sont chargées depuis la base de données
 * via l'API accounting, avec fallback sur les configurations statiques par marque.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { accountingApi, type ApiCompanyInfo } from '../store/accountingApi'

// Configuration par tenant (fallback si DB non disponible)
type TenantKey =
  | 'tribal-print'
  | 'jericho-print'
  | 'muslim-print'
  | 'tribal-verra'
  | 'tribal-agency'
  | 'default'

interface CompanyInfo {
  name: string
  legalName: string
  contact: string
  address: string
  city: string
  country: string
  phone: string
  phone2: string
  email: string
  website: string
  // Informations legales (optionnelles)
  ncc?: string // Numero de Compte Contribuable
  rccm?: string // RCCM
  regimeFiscal?: string
}

// Cache pour les infos entreprise (evite les appels API repetes)
let companyInfoCache: ApiCompanyInfo | null = null
let companyInfoCacheTimestamp = 0
const COMPANY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Charge les informations entreprise depuis l'API avec cache
 */
async function loadCompanyInfoFromDB(): Promise<ApiCompanyInfo | null> {
  const now = Date.now()
  if (companyInfoCache && now - companyInfoCacheTimestamp < COMPANY_CACHE_TTL) {
    return companyInfoCache
  }

  try {
    const info = await accountingApi.getCompanyInfo()
    if (info) {
      companyInfoCache = info
      companyInfoCacheTimestamp = now
    }
    return info
  } catch (error) {
    console.warn('[InvoiceGenerator] Erreur chargement infos entreprise:', error)
    return companyInfoCache // Retourne le cache meme expire en cas d'erreur
  }
}

const TENANT_CONFIG: Record<TenantKey, CompanyInfo> = {
  'tribal-print': {
    name: 'Tribal Print',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.tribalprint@gmail.com',
    website: 'https://tribalprint.ci',
  },
  'jericho-print': {
    name: 'Jericho Print',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.jerichoprint@gmail.com',
    website: 'https://jerichoprint.ci',
  },
  'muslim-print': {
    name: 'Muslim Print',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.muslimprint@gmail.com',
    website: 'https://muslimprint.ci',
  },
  'tribal-verra': {
    name: 'Tribal Verra',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.tribalverra@gmail.com',
    website: 'https://tribalverra.ci',
  },
  'tribal-agency': {
    name: 'Tribal Agency',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.tribalagency@gmail.com',
    website: 'https://tribalagency.africa',
  },
  default: {
    name: 'Tribal Print',
    legalName: 'TRIBAL ENTERPRISES SARL',
    contact: 'Joseph Kakou',
    address: 'Koumassi Cite 147',
    city: '00225 Abidjan',
    country: "Cote d'Ivoire",
    phone: '+225 07 87 50 26 37',
    phone2: '+225 07 49 68 46 45',
    email: 'info.tribalprint@gmail.com',
    website: 'https://tribalprint.ci',
  },
}

/**
 * Récupère les informations de l'entreprise selon le tenant
 * Priorité: DB > Configuration statique par marque
 */
async function getCompanyInfoAsync(tenant?: string): Promise<CompanyInfo> {
  // 1. Essayer de charger depuis la DB
  const dbInfo = await loadCompanyInfoFromDB()

  // 2. Determiner la config statique de base selon le tenant
  let tenantConfig: CompanyInfo

  if (!tenant) {
    tenantConfig = TENANT_CONFIG['default']
  } else {
    // Normaliser le tenant
    const normalizedTenant = tenant.toLowerCase().replace(/_/g, '-')

    if (normalizedTenant in TENANT_CONFIG) {
      tenantConfig = TENANT_CONFIG[normalizedTenant as TenantKey]
    } else if (normalizedTenant.includes('jericho')) {
      tenantConfig = TENANT_CONFIG['jericho-print']
    } else if (normalizedTenant.includes('muslim')) {
      tenantConfig = TENANT_CONFIG['muslim-print']
    } else if (normalizedTenant.includes('verra')) {
      tenantConfig = TENANT_CONFIG['tribal-verra']
    } else if (normalizedTenant.includes('tribal')) {
      tenantConfig = TENANT_CONFIG['tribal-print']
    } else {
      tenantConfig = TENANT_CONFIG['default']
    }
  }

  // 3. Si on a des infos en DB, les fusionner avec la config tenant
  if (dbInfo) {
    // Construire la liste des contacts (co-gerants)
    const contacts: string[] = []
    if (dbInfo.gerantNom && dbInfo.gerantPrenom) {
      contacts.push(`${dbInfo.gerantPrenom} ${dbInfo.gerantNom}`)
    }
    if (dbInfo.gerant2Nom && dbInfo.gerant2Prenom) {
      contacts.push(`${dbInfo.gerant2Prenom} ${dbInfo.gerant2Nom}`)
    }
    const contactString = contacts.length > 0 ? contacts.join(' & ') : tenantConfig.contact

    return {
      // Utilise le nom commercial de la marque, mais raison sociale de la DB
      name: tenantConfig.name,
      legalName: dbInfo.raisonSociale || tenantConfig.legalName,
      contact: contactString,
      address: dbInfo.adresse || tenantConfig.address,
      city: dbInfo.ville ? `${dbInfo.codePostal || '00225'} ${dbInfo.ville}` : tenantConfig.city,
      country: dbInfo.pays || tenantConfig.country,
      phone: dbInfo.telephone || tenantConfig.phone,
      phone2: dbInfo.telephoneSecondaire || tenantConfig.phone2,
      email: tenantConfig.email, // Email specifique a la marque
      website: tenantConfig.website, // Site specifique a la marque
      // Informations legales
      ncc: dbInfo.ncc,
      rccm: dbInfo.rccm,
      regimeFiscal: dbInfo.regimeFiscal,
    }
  }

  return tenantConfig
}

/**
 * Nettoie les caractères spéciaux pour l'encodage WinAnsi
 * Remplace les caractères accentués et spéciaux par leurs équivalents ASCII
 */
function sanitizeForPDF(text: string): string {
  if (!text) return ''

  return (
    text
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[ÀÁÂÃÄÅ]/g, 'A')
      .replace(/[ÈÉÊË]/g, 'E')
      .replace(/[ÌÍÎÏ]/g, 'I')
      .replace(/[ÒÓÔÕÖ]/g, 'O')
      .replace(/[ÙÚÛÜ]/g, 'U')
      .replace(/[Ý]/g, 'Y')
      .replace(/[Ñ]/g, 'N')
      .replace(/[Ç]/g, 'C')
      .replace(/[œ]/g, 'oe')
      .replace(/[Œ]/g, 'OE')
      .replace(/[æ]/g, 'ae')
      .replace(/[Æ]/g, 'AE')
      .replace(/[€]/g, 'EUR')
      .replace(/[°]/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[…]/g, '...')
      // Remplace tout autre caractère non-ASCII par un espace
      .replace(/[^\x20-\x7E]/g, ' ')
  )
}

interface OrderData {
  orderNumber: string
  orderDate: string
  tenant?: string // Tenant source (tribal-print, jericho-print, muslim-print, tribal-verra)
  customer: {
    name: string
    phone?: string
    email?: string
    address?: string
    deliveryAddress?: string // Adresse de livraison
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    options?: any // Options de personnalisation
  }>
  pricing: {
    subtotal: number
    discount?: number
    delivery_fee?: number
    total: number
  }
  contactName?: string // Nom de l'utilisateur connecté
}

/**
 * Formate les options en texte lisible pour la facture
 */
function formatOptions(options: any): string[] {
  if (!options) return []

  const lines: string[] = []

  // Ligne 1: Format + Dimensions
  const line1Parts: string[] = []
  if (options.format_label) {
    line1Parts.push(options.format_label)
  } else if (options.format_code) {
    line1Parts.push(`Format ${options.format_code}`)
  }

  if (options.width_cm && options.height_cm) {
    line1Parts.push(`${options.width_cm} x ${options.height_cm} cm`)
  }

  if (line1Parts.length > 0) {
    lines.push(line1Parts.join(' - '))
  }

  // Ligne 2: Orientation + Couleur
  const line2Parts: string[] = []
  if (options.orientation) {
    line2Parts.push(options.orientation === 'paysage' ? 'Paysage' : 'Portrait')
  }

  if (options.color_mode) {
    line2Parts.push(options.color_mode === 'couleur' ? 'Couleur' : 'Noir et blanc')
  }

  if (line2Parts.length > 0) {
    lines.push(line2Parts.join(' - '))
  }

  // Ligne 3: Marie-louise + Cadre + Photos
  const line3Parts: string[] = []
  if (options.marie_louise === 'avec') {
    line3Parts.push('Avec marie-louise')
  }

  if (options.frame_color) {
    const colorMap: Record<string, string> = {
      noir: 'Cadre noir',
      blanc: 'Cadre blanc',
      naturel: 'Cadre naturel',
      dore: 'Cadre dore',
      argent: 'Cadre argent',
    }
    line3Parts.push(colorMap[options.frame_color] || `Cadre ${options.frame_color}`)
  }

  if (options.photos_count && options.photos_count > 1) {
    line3Parts.push(`${options.photos_count} photos`)
  }

  if (line3Parts.length > 0) {
    lines.push(line3Parts.join(' - '))
  }

  return lines
}

/**
 * Génère le PDF de facture pour une commande
 * Design moderne et professionnel inspiré de Pennylane
 */
export async function generateInvoicePDF(orderData: OrderData): Promise<Blob> {
  console.log('🎨 Génération du PDF de facture avec les données:', orderData)

  // Récupérer les informations de l'entreprise selon le tenant (depuis DB ou fallback)
  const companyInfo = await getCompanyInfoAsync(orderData.tenant)
  console.log('🏢 Infos entreprise pour tenant', orderData.tenant, ':', companyInfo.name)

  // Créer le document PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  // Charger les polices
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Charger le logo
  let logoImage = null
  try {
    const logoUrl = window.location.origin + '/logo.png'
    const logoResponse = await fetch(logoUrl)
    if (logoResponse.ok) {
      const logoBytes = await logoResponse.arrayBuffer()
      logoImage = await pdfDoc.embedPng(logoBytes)
    }
  } catch (error) {
    console.warn('Logo non charge:', error)
  }

  // Couleurs modernes
  const darkText = rgb(0.15, 0.15, 0.15)
  const grayText = rgb(0.45, 0.45, 0.45)
  const lightGray = rgb(0.7, 0.7, 0.7)
  const headerBg = rgb(0.18, 0.18, 0.18) // Fond sombre pour header tableau

  // Marges
  const marginLeft = 50
  const marginRight = 50
  const contentWidth = width - marginLeft - marginRight

  let yPosition = height - 50

  // === EN-TÊTE : Titre + Date ===
  // Titre de la facture (style moderne)
  page.drawText(sanitizeForPDF(`Facture ${orderData.orderNumber}`), {
    x: marginLeft,
    y: yPosition,
    size: 22,
    font: fontBold,
    color: darkText,
  })

  // Logo en haut à droite
  if (logoImage) {
    const logoSize = 55
    page.drawImage(logoImage, {
      x: width - marginRight - logoSize,
      y: yPosition - 15,
      width: logoSize,
      height: logoSize,
    })
  }

  // Date sous le titre (format long)
  yPosition -= 22
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const formattedDate = new Date(orderData.orderDate).toLocaleDateString('fr-FR', dateOptions)
  page.drawText(sanitizeForPDF(formattedDate), {
    x: marginLeft,
    y: yPosition,
    size: 10,
    font: fontRegular,
    color: grayText,
  })

  yPosition -= 50

  // === SECTION ÉMETTEUR / DESTINATAIRE (côte à côte) ===
  const colEmetteur = marginLeft
  const colDestinataire = width / 2 + 20

  // En-têtes de section
  page.drawText('Emetteur', {
    x: colEmetteur,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })

  page.drawText('Destinataire', {
    x: colDestinataire,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })

  yPosition -= 22

  // Détails émetteur (format label: valeur)
  const contactName = orderData.contactName || companyInfo.contact
  const emetteurRows: Array<{ label: string; value: string }> = [
    { label: 'Societe :', value: companyInfo.name },
    { label: 'Raison sociale :', value: companyInfo.legalName },
    { label: 'Votre contact :', value: contactName },
    { label: 'Adresse :', value: `${companyInfo.address}` },
    { label: '', value: companyInfo.city },
    { label: 'Pays :', value: companyInfo.country },
    { label: 'Telephone :', value: companyInfo.phone },
    { label: '', value: companyInfo.phone2 },
    { label: 'Email :', value: companyInfo.email },
    { label: 'Site internet :', value: companyInfo.website },
  ]

  // Ajouter les informations legales si disponibles
  if (companyInfo.ncc) {
    emetteurRows.push({ label: 'NCC :', value: companyInfo.ncc })
  }
  if (companyInfo.rccm) {
    emetteurRows.push({ label: 'RCCM :', value: companyInfo.rccm })
  }

  // Détails destinataire
  const customerAddress = orderData.customer.deliveryAddress || orderData.customer.address || ''
  const destinataireRows = [
    { label: 'Nom :', value: orderData.customer.name, bold: true },
    { label: 'Adresse :', value: customerAddress || '' },
    { label: '', value: '00225 Abidjan' },
    { label: 'Pays :', value: "Cote d'Ivoire" },
    { label: 'Telephone :', value: orderData.customer.phone || '' },
  ].filter(row => row.value)

  // Afficher les deux colonnes
  const startY = yPosition
  let emY = startY
  let destY = startY
  const labelOffset = 70 // Espace pour les labels

  // Colonne émetteur
  emetteurRows.forEach(row => {
    if (row.label) {
      page.drawText(sanitizeForPDF(row.label), {
        x: colEmetteur,
        y: emY,
        size: 9,
        font: fontRegular,
        color: grayText,
      })
      page.drawText(sanitizeForPDF(row.value), {
        x: colEmetteur + labelOffset,
        y: emY,
        size: 9,
        font: fontBold,
        color: darkText,
      })
    } else {
      page.drawText(sanitizeForPDF(row.value), {
        x: colEmetteur + labelOffset,
        y: emY,
        size: 9,
        font: fontRegular,
        color: darkText,
      })
    }
    emY -= 14
  })

  // Colonne destinataire
  destinataireRows.forEach(row => {
    if (row.label) {
      page.drawText(sanitizeForPDF(row.label), {
        x: colDestinataire,
        y: destY,
        size: 9,
        font: fontRegular,
        color: grayText,
      })
      page.drawText(sanitizeForPDF(row.value), {
        x: colDestinataire + labelOffset,
        y: destY,
        size: 9,
        font: row.bold ? fontBold : fontRegular,
        color: darkText,
      })
    } else {
      page.drawText(sanitizeForPDF(row.value), {
        x: colDestinataire + labelOffset,
        y: destY,
        size: 9,
        font: fontRegular,
        color: darkText,
      })
    }
    destY -= 14
  })

  yPosition = Math.min(emY, destY) - 30

  // === SECTION DÉTAIL ===
  page.drawText('Detail', {
    x: marginLeft,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })

  yPosition -= 25

  // === TABLEAU MODERNE ===
  const rowHeight = 22

  // Header du tableau (fond sombre)
  page.drawRectangle({
    x: marginLeft,
    y: yPosition - 5,
    width: contentWidth,
    height: rowHeight,
    color: headerBg,
  })

  // Colonnes: Description (large) | Total (à droite)
  page.drawText('Description', {
    x: marginLeft + 10,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1), // Blanc
  })

  page.drawText('Total', {
    x: width - marginRight - 60,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  yPosition -= rowHeight + 5

  // Lignes du tableau
  orderData.items.forEach(item => {
    const optionsLines = formatOptions(item.options)

    // Description principale
    const descText = `${item.description}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`
    page.drawText(sanitizeForPDF(descText), {
      x: marginLeft + 10,
      y: yPosition,
      size: 9,
      font: fontRegular,
      color: darkText,
    })

    // Prix (sans TVA)
    const itemTotal = Math.round(item.total)
    page.drawText(sanitizeForPDF(`${itemTotal.toLocaleString('fr-FR')} Fr`), {
      x: width - marginRight - 70,
      y: yPosition,
      size: 9,
      font: fontRegular,
      color: darkText,
    })

    yPosition -= 14

    // Options sous la description (plus petit, en gris)
    optionsLines.forEach(optLine => {
      page.drawText(sanitizeForPDF(optLine), {
        x: marginLeft + 15,
        y: yPosition,
        size: 8,
        font: fontRegular,
        color: grayText,
      })
      yPosition -= 12
    })

    yPosition -= 8

    // Ligne de séparation légère
    page.drawLine({
      start: { x: marginLeft, y: yPosition + 4 },
      end: { x: width - marginRight, y: yPosition + 4 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    })

    yPosition -= 8
  })

  yPosition -= 10

  // === TOTAUX (alignés à droite, style moderne) ===
  const totalsLabelX = width - marginRight - 180
  const totalsValueX = width - marginRight - 70

  // Sans TVA (CA < 200M FCFA - exonération SARL Côte d'Ivoire)
  const subtotalHT = orderData.pricing.subtotal || orderData.pricing.total
  const deliveryFee = orderData.pricing.delivery_fee || 0
  const total = subtotalHT + deliveryFee

  // Frais de livraison (affiché en premier si présent)
  if (deliveryFee > 0) {
    page.drawText('Frais de livraison', {
      x: totalsLabelX,
      y: yPosition,
      size: 9,
      font: fontRegular,
      color: grayText,
    })
    page.drawText(sanitizeForPDF(`${deliveryFee.toLocaleString('fr-FR')} Fr`), {
      x: totalsValueX,
      y: yPosition,
      size: 9,
      font: fontRegular,
      color: darkText,
    })
    yPosition -= 16
  }

  // Mention TVA non applicable
  page.drawText('TVA non applicable, art. 293 B du CGI', {
    x: totalsLabelX - 30,
    y: yPosition,
    size: 8,
    font: fontRegular,
    color: grayText,
  })

  yPosition -= 16

  // Ligne de séparation
  page.drawLine({
    start: { x: totalsLabelX - 10, y: yPosition + 8 },
    end: { x: width - marginRight, y: yPosition + 8 },
    thickness: 1,
    color: lightGray,
  })

  yPosition -= 8

  // Total (en gras, plus grand)
  page.drawText('Total', {
    x: totalsLabelX,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })
  page.drawText(sanitizeForPDF(`${Math.round(total).toLocaleString('fr-FR')} Fr`), {
    x: totalsValueX - 10,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })

  yPosition -= 50

  // === SECTION CONDITIONS ===
  page.drawText('Conditions', {
    x: marginLeft,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkText,
  })

  yPosition -= 18

  page.drawText('Conditions de reglement :', {
    x: marginLeft,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: darkText,
  })
  page.drawText('A reception', {
    x: marginLeft + 115,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: darkText,
  })

  yPosition -= 14

  page.drawText('Mode de reglement :', {
    x: marginLeft,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: darkText,
  })
  page.drawText('Especes', {
    x: marginLeft + 100,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: darkText,
  })

  // === PIED DE PAGE ===
  page.drawText('Page 1 sur 1', {
    x: width - marginRight - 50,
    y: 40,
    size: 8,
    font: fontRegular,
    color: lightGray,
  })

  // Sauvegarder le PDF
  const pdfBytes = await pdfDoc.save()
  const buffer = new ArrayBuffer(pdfBytes.length)
  const view = new Uint8Array(buffer)
  view.set(pdfBytes)
  return new Blob([buffer], { type: 'application/pdf' })
}

/**
 * Télécharge automatiquement la facture PDF
 */
export function downloadInvoicePDF(blob: Blob, orderNumber: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Facture_${orderNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Génère et télécharge automatiquement la facture pour une commande
 */
export async function generateAndDownloadInvoice(orderData: OrderData): Promise<void> {
  try {
    console.log(`📄 Génération facture pour commande ${orderData.orderNumber}...`)

    const pdfBlob = await generateInvoicePDF(orderData)
    downloadInvoicePDF(pdfBlob, orderData.orderNumber)

    console.log(`✅ Facture ${orderData.orderNumber} générée et téléchargée`)
  } catch (error) {
    console.error('❌ Erreur génération facture:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GÉNÉRATION PDF DEVIS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuoteData {
  id: string
  date: string
  validUntil?: string
  partnerName: string
  brand?: string
  lines: Array<{
    description: string
    qty: number
    unitPriceHT: number
  }>
  totals: {
    ht: number
    tva: number
    ttc: number
  }
}

/**
 * Génère un PDF de devis
 */
export async function generateQuotePDF(quoteData: QuoteData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const marginLeft = 50
  const marginRight = 50

  const darkText = rgb(0.1, 0.1, 0.1)
  const lightGray = rgb(0.5, 0.5, 0.5)
  const accentColor = rgb(0.4, 0.2, 0.8) // Violet pour devis

  let y = height - 50

  // === EN-TÊTE ===
  // Titre DEVIS
  page.drawText('DEVIS', {
    x: marginLeft,
    y,
    size: 28,
    font: fontBold,
    color: accentColor,
  })

  // Numéro du devis
  page.drawText(quoteData.id, {
    x: width - marginRight - 150,
    y,
    size: 14,
    font: fontBold,
    color: darkText,
  })

  y -= 20
  page.drawText(`Date: ${formatDateForPDF(quoteData.date)}`, {
    x: width - marginRight - 150,
    y,
    size: 10,
    font: fontRegular,
    color: lightGray,
  })

  if (quoteData.validUntil) {
    y -= 14
    page.drawText(sanitizeForPDF(`Valide jusqu'au: ${formatDateForPDF(quoteData.validUntil)}`), {
      x: width - marginRight - 150,
      y,
      size: 10,
      font: fontRegular,
      color: lightGray,
    })
  }

  // === ENTREPRISE ===
  y = height - 100

  // Charger les infos entreprise depuis la DB avec fallback sur config statique
  const company = await getCompanyInfoAsync(quoteData.brand)

  page.drawText(sanitizeForPDF(company.name), {
    x: marginLeft,
    y,
    size: 12,
    font: fontBold,
    color: darkText,
  })
  y -= 14
  page.drawText(sanitizeForPDF(company.legalName), {
    x: marginLeft,
    y,
    size: 9,
    font: fontRegular,
    color: lightGray,
  })
  y -= 12
  page.drawText(sanitizeForPDF(`${company.address}, ${company.city}`), {
    x: marginLeft,
    y,
    size: 9,
    font: fontRegular,
    color: lightGray,
  })
  y -= 12
  page.drawText(sanitizeForPDF(`Tel: ${company.phone}`), {
    x: marginLeft,
    y,
    size: 9,
    font: fontRegular,
    color: lightGray,
  })

  // Afficher NCC et RCCM si disponibles
  if (company.ncc) {
    y -= 12
    page.drawText(sanitizeForPDF(`NCC: ${company.ncc}`), {
      x: marginLeft,
      y,
      size: 9,
      font: fontRegular,
      color: lightGray,
    })
  }
  if (company.rccm) {
    y -= 12
    page.drawText(sanitizeForPDF(`RCCM: ${company.rccm}`), {
      x: marginLeft,
      y,
      size: 9,
      font: fontRegular,
      color: lightGray,
    })
  }

  // === CLIENT ===
  y -= 40
  page.drawText('CLIENT', {
    x: marginLeft,
    y,
    size: 10,
    font: fontBold,
    color: accentColor,
  })
  y -= 16
  page.drawText(sanitizeForPDF(quoteData.partnerName), {
    x: marginLeft,
    y,
    size: 12,
    font: fontBold,
    color: darkText,
  })

  // === TABLEAU DES LIGNES ===
  y -= 50

  // En-tête du tableau
  const colX = [marginLeft, marginLeft + 250, marginLeft + 320, marginLeft + 400]
  page.drawRectangle({
    x: marginLeft - 5,
    y: y - 5,
    width: width - marginLeft - marginRight + 10,
    height: 20,
    color: rgb(0.95, 0.93, 0.98),
  })

  page.drawText('Description', { x: colX[0], y, size: 9, font: fontBold, color: darkText })
  page.drawText('Qte', { x: colX[1], y, size: 9, font: fontBold, color: darkText })
  page.drawText('Prix unit.', { x: colX[2], y, size: 9, font: fontBold, color: darkText })
  page.drawText('Total', { x: colX[3], y, size: 9, font: fontBold, color: darkText })

  y -= 25

  // Lignes du devis
  for (const line of quoteData.lines) {
    const lineTotal = line.qty * line.unitPriceHT

    // Tronquer la description si trop longue
    const desc =
      line.description.length > 40 ? line.description.slice(0, 37) + '...' : line.description

    page.drawText(sanitizeForPDF(desc), {
      x: colX[0],
      y,
      size: 9,
      font: fontRegular,
      color: darkText,
    })
    page.drawText(String(line.qty), { x: colX[1], y, size: 9, font: fontRegular, color: darkText })
    page.drawText(`${line.unitPriceHT.toLocaleString('fr-FR')} F`, {
      x: colX[2],
      y,
      size: 9,
      font: fontRegular,
      color: darkText,
    })
    page.drawText(`${lineTotal.toLocaleString('fr-FR')} F`, {
      x: colX[3],
      y,
      size: 9,
      font: fontBold,
      color: darkText,
    })

    y -= 18
  }

  // Ligne séparatrice
  y -= 10
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: width - marginRight, y },
    thickness: 0.5,
    color: lightGray,
  })

  // === TOTAUX ===
  y -= 25
  const totalsX = width - marginRight - 150

  page.drawText('Total HT:', { x: totalsX, y, size: 10, font: fontRegular, color: darkText })
  page.drawText(`${quoteData.totals.ht.toLocaleString('fr-FR')} F`, {
    x: totalsX + 80,
    y,
    size: 10,
    font: fontBold,
    color: darkText,
  })

  y -= 16
  page.drawText('TVA (0%):', { x: totalsX, y, size: 10, font: fontRegular, color: lightGray })
  page.drawText(sanitizeForPDF('Exonéré'), {
    x: totalsX + 80,
    y,
    size: 10,
    font: fontRegular,
    color: lightGray,
  })

  y -= 20
  page.drawRectangle({
    x: totalsX - 10,
    y: y - 8,
    width: 160,
    height: 28,
    color: rgb(0.95, 0.93, 0.98),
    borderColor: accentColor,
    borderWidth: 1,
  })
  page.drawText('TOTAL TTC:', { x: totalsX, y, size: 12, font: fontBold, color: darkText })
  page.drawText(`${quoteData.totals.ttc.toLocaleString('fr-FR')} F`, {
    x: totalsX + 80,
    y,
    size: 12,
    font: fontBold,
    color: accentColor,
  })

  // === CONDITIONS ===
  y -= 60
  page.drawText('Conditions:', { x: marginLeft, y, size: 9, font: fontBold, color: darkText })
  y -= 14
  page.drawText(
    sanitizeForPDF("• Ce devis est valable pendant 30 jours a compter de sa date d'emission."),
    {
      x: marginLeft,
      y,
      size: 8,
      font: fontRegular,
      color: lightGray,
    }
  )
  y -= 12
  page.drawText(sanitizeForPDF('• Acompte de 50% a la commande, solde a la livraison.'), {
    x: marginLeft,
    y,
    size: 8,
    font: fontRegular,
    color: lightGray,
  })
  y -= 12
  page.drawText(sanitizeForPDF('• TVA non applicable - Article 293 B du CGI (CA < 200M FCFA).'), {
    x: marginLeft,
    y,
    size: 8,
    font: fontRegular,
    color: lightGray,
  })

  // === PIED DE PAGE ===
  page.drawText('Page 1 sur 1', {
    x: width - marginRight - 50,
    y: 40,
    size: 8,
    font: fontRegular,
    color: lightGray,
  })

  // Sauvegarder
  const pdfBytes = await pdfDoc.save()
  const buffer = new ArrayBuffer(pdfBytes.length)
  const view = new Uint8Array(buffer)
  view.set(pdfBytes)
  return new Blob([buffer], { type: 'application/pdf' })
}

/**
 * Télécharge automatiquement le devis PDF
 */
export function downloadQuotePDF(blob: Blob, quoteId: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Devis_${quoteId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Génère et télécharge automatiquement un devis
 */
export async function generateAndDownloadQuote(quoteData: QuoteData): Promise<void> {
  console.log('📄 [generateAndDownloadQuote] Données reçues:', JSON.stringify(quoteData, null, 2))
  try {
    console.log(`📄 Génération devis ${quoteData.id}...`)
    const pdfBlob = await generateQuotePDF(quoteData)
    downloadQuotePDF(pdfBlob, quoteData.id)
    console.log(`✅ Devis ${quoteData.id} généré et téléchargé`)
  } catch (error) {
    console.error('❌ Erreur génération devis:', error)
    throw error
  }
}

/**
 * Formate une date pour le PDF
 */
function formatDateForPDF(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
