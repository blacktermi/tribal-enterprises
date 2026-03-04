/**
 * Page Factures Clients - Génération des factures PDF pour les commandes
 * Affichée dans la section Comptabilité
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Loader2, Search, Filter, Download, Calendar } from 'lucide-react'
import { generateAndDownloadInvoice } from '../../services/invoiceGenerator'
import { useAuth } from '../../contexts/AuthContext'
import { useAccountingFilters } from '../../store/accountingFilters'
import { AccountingFiltersBar } from '../../components/accounting/AccountingFiltersBar'

// Mapping des slugs produits vers labels lisibles
const PRODUCT_LABELS: Record<string, string> = {
 'tableaux-aluminium': 'Tableau Aluminium',
 tableauxaluminium: 'Tableau Aluminium',
 'tableau-aluminium': 'Tableau Aluminium',
 'tableaux-bois': 'Tableau Bois',
 tableauxbois: 'Tableau Bois',
 'tableau-bois': 'Tableau Bois',
 'tableaux-canvas': 'Tableau Canvas',
 tableauxcanvas: 'Tableau Canvas',
 canvas: 'Tableau Canvas',
 posters: 'Poster',
 poster: 'Poster',
 'metal-posters': 'Metal Poster',
 metalposters: 'Metal Poster',
 polaroids: 'Polaroid',
 polaroid: 'Polaroid',
 'mini-photos': 'Mini Photo',
 miniphotos: 'Mini Photo',
 'photo-carte': 'Photo Carte',
 photocarte: 'Photo Carte',
 'photo-strips': 'Photo Strip',
 photostrips: 'Photo Strip',
 'album-photo': 'Album Photo',
 albumphoto: 'Album Photo',
 'cartes-visite': 'Carte de Visite',
 cartesvisite: 'Carte de Visite',
 'cartes-invitation': 'Carte Invitation',
 cartesinvitation: 'Carte Invitation',
 'cartes-remerciement': 'Carte Remerciement',
 cartesremerciement: 'Carte Remerciement',
 mugs: 'Mug',
 mug: 'Mug',
 stickers: 'Sticker',
 sticker: 'Sticker',
 'tote-bags': 'Tote Bag',
 totebags: 'Tote Bag',
}

// Convertir un slug en label lisible
function getProductLabel(slug?: string | null, fallback?: string): string | null {
 if (!slug) return fallback || null
 const normalized = slug.toLowerCase().replace(/[_\\s]/g, '-')
 return (
 PRODUCT_LABELS[normalized] || PRODUCT_LABELS[normalized.replace(/-/g, '')] || fallback || null
 )
}

// Règles pour détecter le type de produit à partir du SKU
const SKU_CATEGORY_RULES: Array<{ pattern: RegExp; label: string }> = [
 { pattern: /^tb-bois/i, label: 'Tableau Bois' },
 { pattern: /^tb[-_]?/i, label: 'Tableau Aluminium' },
 { pattern: /^jp[-_]?/i, label: 'Tableau Aluminium' },
 { pattern: /^mp[-_]?/i, label: 'Tableau Aluminium' },
 { pattern: /^tp[-_]?/i, label: 'Tableau Aluminium' },
 { pattern: /^vp[-_]?/i, label: 'Miroir' },
 { pattern: /^tableaux?-bois/i, label: 'Tableau Bois' },
 { pattern: /^tableaux?/i, label: 'Tableau Aluminium' },
 { pattern: /^mtp[-_]?/i, label: 'Metal Poster' },
 { pattern: /^canvas/i, label: 'Tableau Canvas' },
 { pattern: /^cv[-_]?/i, label: 'Tableau Canvas' },
 { pattern: /^mg[-_]?/i, label: 'Mug' },
 { pattern: /^mug/i, label: 'Mug' },
 { pattern: /^st[-_]?/i, label: 'Sticker' },
 { pattern: /^pol[-_]?/i, label: 'Polaroid' },
 { pattern: /^poster/i, label: 'Poster' },
 { pattern: /^miroir/i, label: 'Miroir' },
]

// Détecter le type de produit à partir des attributs (pack, format_code, marie_louise, etc.)
function getProductLabelFromAttributes(attributes: any): string | null {
 if (!attributes) return null

 // Vérifier d'abord pack ou pack_label
 const pack = attributes.pack || attributes.pack_label
 if (pack && typeof pack === 'string') {
 const packLower = pack.toLowerCase()
 if (packLower.includes('tableau') && packLower.includes('aluminium')) return 'Tableau Aluminium'
 if (packLower.includes('tableau') && packLower.includes('bois')) return 'Tableau Bois'
 if (packLower.includes('tableau') && packLower.includes('canvas')) return 'Tableau Canvas'
 if (packLower.includes('poster') && packLower.includes('metal')) return 'Metal Poster'
 if (packLower.includes('poster')) return 'Poster'
 if (packLower.includes('polaroid')) return 'Polaroid'
 if (packLower.includes('mug')) return 'Mug'
 if (packLower.includes('sticker')) return 'Sticker'
 if (packLower.includes('miroir')) return 'Miroir'
 }

 // Détecter les tableaux par leurs attributs caractéristiques
 if (attributes.format_code || attributes.marie_louise || attributes.frame_color) {
 // C'est un tableau - déterminer le type
 if (attributes.frame_type === 'bois' || attributes.material === 'bois') {
 return 'Tableau Bois'
 }
 if (attributes.frame_type === 'canvas' || attributes.material === 'canvas') {
 return 'Tableau Canvas'
 }
 // Par défaut c'est un tableau aluminium
 return 'Tableau Aluminium'
 }

 return null
}

// Détecter le type de produit à partir du SKU
function getProductLabelFromSku(sku?: string | null): string | null {
 if (!sku) return null
 for (const rule of SKU_CATEGORY_RULES) {
 if (rule.pattern.test(sku)) {
 return rule.label
 }
 }
 return null
}

// Type pour les commandes avec leurs données JSON
interface OrderItemRecord {
 id: string
 order_number?: string
 customer_name?: string
 customer_email?: string
 customer_phone?: string
 customer_address?: string
 created_at?: string | Date
 status?: string
 product_label?: string
 product_slug?: string
 uploads?: any[]
 price_total?: number
 price_delivery?: number
 price_discount?: number
 options?: any
 tags?: any
}

export const FacturesClientsPage: React.FC = () => {
 const { user } = useAuth()
 const { selectedYear, selectedPeriod, selectedMonth } = useAccountingFilters()
 const [orders, setOrders] = useState<OrderItemRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [generatingInvoices, setGeneratingInvoices] = useState<Record<string, boolean>>({})
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')

 // Calculer les dates de filtre basées sur les filtres globaux
 const dateFilters = useMemo(() => {
 const now = new Date()
 let startDate: string | undefined
 let endDate: string | undefined

 if (selectedPeriod === 'all') {
 // Pas de filtre de date
 } else if (selectedPeriod === 'year') {
 startDate = `${selectedYear}-01-01`
 endDate = `${selectedYear}-12-31`
 } else if (selectedPeriod === 'month') {
 const month = selectedMonth ?? now.getMonth()
 const monthStr = String(month + 1).padStart(2, '0')
 startDate = `${selectedYear}-${monthStr}-01`
 const lastDay = new Date(selectedYear, month + 1, 0).getDate()
 endDate = `${selectedYear}-${monthStr}-${lastDay}`
 } else if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(now.getMonth() / 3)
 const startMonth = currentQuarter * 3
 startDate = `${selectedYear}-${String(startMonth + 1).padStart(2, '0')}-01`
 const endMonth = startMonth + 2
 const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate()
 endDate = `${selectedYear}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`
 } else if (selectedPeriod === 'week') {
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 startDate = weekAgo.toISOString().slice(0, 10)
 endDate = now.toISOString().slice(0, 10)
 }

 return { startDate, endDate }
 }, [selectedYear, selectedPeriod, selectedMonth])

 // Charger les commandes
 useEffect(() => {
 loadOrders()
 }, [dateFilters.startDate, dateFilters.endDate])

 const loadOrders = async () => {
 try {
 setLoading(true)
 // Construire l'URL avec les filtres de date
 const params = new URLSearchParams({ allTenants: 'true', limit: '500' })
 if (dateFilters.startDate) params.set('startDate', dateFilters.startDate)
 if (dateFilters.endDate) params.set('endDate', dateFilters.endDate)

 const response = await fetch(`/api/orders?${params.toString()}`)
 const data = await response.json()

 // API V2 structure: { success: true, data: { data: [...], pagination: {...} } }
 const items = data.data?.items || data.items || []
 if (items.length > 0) {
 setOrders(items)
 }
 } catch (error) {
 console.error('Erreur lors du chargement des commandes:', error)
 alert('Erreur lors du chargement des commandes')
 } finally {
 setLoading(false)
 }
 }

 // Générer et télécharger la facture pour une commande
 const generateInvoice = useCallback(async (order: OrderItemRecord) => {
 setGeneratingInvoices(prev => ({ ...prev, [order.id]: true }))

 try {
 console.log('📄 Génération facture pour commande:', order)

 const orderAny = order as any

 // Essayer d'abord depuis pricing (structure principale)
 let subtotal = 0
 let delivery = 0
 let discount = 0
 let total = 0

 if (orderAny.pricing) {
 // Structure avec objet pricing
 subtotal = Number(orderAny.pricing.subtotal || 0)
 delivery = Number(orderAny.pricing.delivery_fee || 0)
 discount = Number(orderAny.pricing.discount || 0)
 total = Number(orderAny.pricing.total || 0)
 } else {
 // Fallback vers anciennes structures
 subtotal = Number(order.price_total || orderAny.total_price || orderAny.unit_price || 0)
 delivery = Number(order.price_delivery || orderAny.delivery_fee || 0)
 discount = Number(order.price_discount || orderAny.discount || 0)
 total = subtotal + delivery - discount
 }

 console.log('💰 Prix extraits:', { subtotal, delivery, discount, total })

 // Le prix de base est déjà HT (hors taxes)
 const subtotalHT = total || subtotal // C'est déjà le HT
 const quantity = (order as any).quantity || 1

 // Extraire l'adresse de livraison depuis delivery.commune ou options
 let deliveryAddress = ''
 if (orderAny.delivery?.commune) {
 deliveryAddress = orderAny.delivery.commune
 if (orderAny.delivery.lieu) {
 deliveryAddress += `, ${orderAny.delivery.lieu}`
 }
 deliveryAddress += ', Abidjan'
 } else {
 // Fallback: essayer depuis options ou tags
 try {
 const options =
 typeof order.options === 'string' ? JSON.parse(order.options) : order.options
 const tags = typeof order.tags === 'string' ? JSON.parse(order.tags) : order.tags

 if (options?.delivery_address) {
 deliveryAddress = options.delivery_address
 } else if (tags?.delivery_address) {
 deliveryAddress = tags.delivery_address
 }
 } catch (e) {
 // Ignorer les erreurs de parsing
 }
 }

 // Extraire les informations du contact
 const customerName = orderAny.contact?.name || order.customer_name || 'Client'
 const customerPhone = orderAny.contact?.phone || order.customer_phone
 const customerEmail = orderAny.contact?.email || order.customer_email
 const customerAddress = orderAny.contact?.address || order.customer_address || deliveryAddress

 console.log('👤 Client:', { customerName, customerPhone, customerEmail, customerAddress })

 // Extraire les items de la commande
 let invoiceItems: Array<{
 description: string
 quantity: number
 unitPrice: number
 total: number
 options?: any
 }> = []

 // Si la commande a des items (plusieurs produits)
 if (orderAny.items && Array.isArray(orderAny.items) && orderAny.items.length > 0) {
 invoiceItems = orderAny.items.map((item: any) => {
 const attributes = item.attributes || {}
 // Chercher le slug dans plusieurs emplacements possibles (original_product_slug ajouté par le backend V2)
 const slug =
 attributes.original_product_slug || attributes.product_slug || attributes.slug || null
 const sku = item.sku || null
 // item.name contient souvent le product_label stocké par le backend
 const itemName = typeof item.name === 'string' ? item.name : null
 const productName =
 getProductLabel(slug) ||
 getProductLabelFromSku(sku) ||
 getProductLabel(sku) ||
 itemName ||
 attributes.original_product_label ||
 attributes.product_label ||
 'Produit'
 const qty = item.quantity || 1
 const unitPrice = item.unitPrice || item.unit_price || 0
 const itemTotal = item.total || unitPrice * qty

 // Construire la description avec le type de produit
 let description = productName || 'Produit'
 if (item.options?.format_label) {
 description += ` - ${item.options.format_label}`
 } else if (item.format) {
 description += ` - ${item.format}`
 }

 return {
 description,
 quantity: qty,
 unitPrice: Math.round(unitPrice),
 total: Math.round(itemTotal),
 options: item.options,
 }
 })
 } else {
 // Fallback: utiliser les infos du record
 const productName =
 getProductLabel(order.product_slug) ||
 getProductLabelFromSku(order.product_slug) ||
 order.product_label ||
 'Produit'

 invoiceItems = [
 {
 description: productName,
 quantity,
 unitPrice: Math.round(subtotalHT / quantity),
 total: subtotalHT,
 options: orderAny.options || order.options,
 },
 ]
 }

 // Construire les données de la facture
 const invoiceData = {
 orderNumber: order.order_number || order.id,
 orderDate: order.created_at
 ? typeof order.created_at === 'string'
 ? order.created_at
 : order.created_at.toISOString()
 : new Date().toISOString(),
 tenant: orderAny.tenant || orderAny.source,
 customer: {
 name: customerName,
 phone: customerPhone,
 email: customerEmail,
 address: customerAddress,
 deliveryAddress: deliveryAddress || undefined,
 },
 items: invoiceItems,
 pricing: {
 subtotal: subtotalHT,
 delivery_fee: delivery > 0 ? delivery : 0,
 discount: discount > 0 ? discount : 0,
 total: subtotalHT,
 },
 contactName: user?.name || 'Joseph Kakou',
 }

 console.log('📋 Données facture préparées:', invoiceData)

 await generateAndDownloadInvoice(invoiceData)
 alert('✅ Facture générée avec succès !')
 } catch (error) {
 console.error('❌ Erreur génération facture:', error)
 alert('❌ Erreur lors de la génération de la facture: ' + (error as Error).message)
 } finally {
 setGeneratingInvoices(prev => ({ ...prev, [order.id]: false }))
 }
 }, [])

 // Filtrer les commandes
 const filteredOrders = orders.filter(order => {
 const orderAny = order as any
 const customerName = orderAny.contact?.name || order.customer_name || ''
 const customerEmail = orderAny.contact?.email || order.customer_email || ''
 const orderNumber = orderAny.ref || order.order_number || ''

 const matchesSearch =
 !searchTerm ||
 customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
 customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

 const matchesStatus = statusFilter === 'all' || order.status === statusFilter

 return matchesSearch && matchesStatus
 })

 // Calculer les totaux - EXCLURE les commandes REDO
 // Les REDO sont des reprises de commandes déjà comptabilisées
 const ordersForRevenue = filteredOrders.filter(order => {
 const status = (order.status || '').toLowerCase()
 if (status === 'redo') return false
 const metadata = (order as any).metadata || (order as any).tags?.metadata || {}
 if (metadata.is_redo === true) return false
 return true
 })

 const totalRevenue = ordersForRevenue.reduce((sum, order) => {
 const orderAny = order as any
 // Essayer d'abord depuis pricing.total
 if (orderAny.pricing?.total) {
 return sum + Number(orderAny.pricing.total)
 }
 // Sinon calculer
 const subtotal = Number(order.price_total || orderAny.total_price || orderAny.unit_price || 0)
 const delivery = Number(order.price_delivery || orderAny.pricing?.delivery_fee || 0)
 const discount = Number(order.price_discount || orderAny.pricing?.discount || 0)
 return sum + (subtotal + delivery - discount)
 }, 0)

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
 <span className="ml-3 text-white/60">Chargement des commandes...</span>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Filtres globaux */}
 <AccountingFiltersBar title="Factures Clients" />

 {/* En-tête avec statistiques */}
 <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-2xl p-6 border border-white/[0.04]">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold text-white mb-1">
 Factures Clients
 </h2>
 <p className="text-white/60">
 Générez et téléchargez les factures pour vos commandes
 </p>
 </div>
 <div className="text-right">
 <div className="text-2xl sm:text-3xl font-bold text-blue-400">
 {filteredOrders.length}
 </div>
 <div className="text-sm text-white/60">Commandes</div>
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-white/[0.06]">
 <div className="flex items-center justify-between">
 <div className="text-sm text-white/60">
 Chiffre d'affaires total
 </div>
 <div className="text-2xl font-bold text-white">
 {totalRevenue.toLocaleString()} FCFA
 </div>
 </div>
 </div>
 </div>

 {/* Filtres et recherche */}
 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
 <div className="flex flex-col md:flex-row gap-4">
 {/* Recherche */}
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher par nom, email ou numéro de commande..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-white/[0.06] rounded-lg bg-white/[0.03] text-white placeholder:text-white/40 focus:outline-none focus:outline-none focus:ring-blue-500 focus:border-transparent"
 />
 </div>

 {/* Filtre par statut */}
 <div className="flex items-center gap-2">
 <Filter className="w-5 h-5 text-white/50" />
 <select
 value={statusFilter}
 onChange={e => setStatusFilter(e.target.value)}
 className="px-4 py-2.5 border border-white/[0.06] rounded-lg bg-white/[0.03] text-white focus:outline-none focus:outline-none focus:ring-blue-500"
 >
 <option value="all">Tous les statuts</option>
 <option value="pending">En attente</option>
 <option value="confirmed">Confirmé</option>
 <option value="in_production">En production</option>
 <option value="ready">Prêt</option>
 <option value="delivered">Livré</option>
 <option value="cancelled">Annulé</option>
 </select>
 </div>

 {/* Bouton rafraîchir */}
 <button
 onClick={loadOrders}
 className="px-4 py-2.5 bg-tribal-black hover:bg-white/[0.06] text-white/80 rounded-lg transition-colors flex items-center gap-2"
 >
 <Download className="w-4 h-4" />
 Actualiser
 </button>
 </div>
 </div>

 {/* Liste des commandes */}
 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-tribal-black border-b border-white/[0.06]">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 Date
 </div>
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 N° Commande
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 Client
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 Produit
 </th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
 Total TTC
 </th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
 Statut
 </th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
 Action
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/[0.06]">
 {filteredOrders.length === 0 ? (
 <tr>
 <td
 colSpan={7}
 className="px-6 py-12 text-center text-white/50"
 >
 Aucune commande trouvée
 </td>
 </tr>
 ) : (
 filteredOrders.map(order => {
 const orderAny = order as any
 const orderDate = order.created_at
 ? new Date(order.created_at).toLocaleDateString('fr-FR')
 : '-'

 // Extraire le total depuis pricing si disponible, sinon calculer
 let total = 0
 if (orderAny.pricing?.total) {
 total = Number(orderAny.pricing.total)
 } else {
 const subtotal = Number(
 order.price_total || orderAny.total_price || orderAny.unit_price || 0
 )
 const delivery = Number(
 order.price_delivery || orderAny.pricing?.delivery_fee || 0
 )
 const discount = Number(order.price_discount || orderAny.pricing?.discount || 0)
 total = subtotal + delivery - discount
 }

 const statusColors: Record<string, string> = {
 pending: ' text-yellow-400',
 confirmed: ' text-blue-400',
 in_production: ' text-indigo-400',
 ready: ' text-emerald-400',
 delivered: ' text-green-400',
 cancelled: ' text-red-300',
 redo: ' text-orange-400',
 }

 const statusLabels: Record<string, string> = {
 pending: 'En attente',
 confirmed: 'Confirmé',
 in_production: 'En production',
 ready: 'Prêt',
 delivered: 'Livré',
 cancelled: 'Annulé',
 redo: 'A reprendre',
 }

 return (
 <tr
 key={order.id}
 className="hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-6 py-4 text-sm text-white">
 {orderDate}
 </td>
 <td className="px-6 py-4 text-sm font-medium text-white">
 {orderAny.ref || order.order_number || order.id.substring(0, 8)}
 </td>
 <td className="px-6 py-4">
 <div className="text-sm font-medium text-white">
 {orderAny.contact?.name || order.customer_name || '-'}
 </div>
 <div className="text-xs text-white/50">
 {orderAny.contact?.email ||
 order.customer_email ||
 orderAny.contact?.phone ||
 order.customer_phone ||
 ''}
 </div>
 </td>
 <td className="px-6 py-4 text-sm text-white">
 {(() => {
 // Essayer d'abord les items
 if (
 orderAny.items &&
 Array.isArray(orderAny.items) &&
 orderAny.items.length > 0
 ) {
 const firstItem = orderAny.items[0]
 const attributes = firstItem.attributes || {}
 const slug =
 attributes.original_product_slug ||
 attributes.product_slug ||
 attributes.slug ||
 null
 const sku = firstItem.sku || null
 const itemName =
 typeof firstItem.name === 'string' ? firstItem.name : null
 // Ajouter getProductLabelFromAttributes pour détecter depuis les attributs (format_code, marie_louise, etc.)
 const label =
 getProductLabel(slug) ||
 getProductLabelFromAttributes(attributes) ||
 getProductLabelFromSku(sku) ||
 getProductLabel(sku) ||
 itemName ||
 attributes.original_product_label ||
 attributes.product_label ||
 null
 if (label) {
 return orderAny.items.length > 1
 ? `${label} (+${orderAny.items.length - 1})`
 : label
 }
 }
 // Fallback vers les champs du record
 return (
 getProductLabel(order.product_slug) ||
 getProductLabelFromSku(order.product_slug) ||
 order.product_label ||
 '-'
 )
 })()}
 </td>
 <td className="px-6 py-4 text-sm font-semibold text-right text-white">
 {total.toLocaleString()} FCFA
 </td>
 <td className="px-6 py-4 text-center">
 <span
 className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
 statusColors[order.status as keyof typeof statusColors] ||
 'bg-tribal-black text-white'
 }`}
 >
 {statusLabels[order.status as keyof typeof statusLabels] || order.status}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <button
 onClick={() => generateInvoice(order)}
 disabled={generatingInvoices[order.id]}
 className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-tribal-accent hover:bg-tribal-accent-light rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {generatingInvoices[order.id] ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Génération...
 </>
 ) : (
 <>
 <FileText className="w-4 h-4" />
 Facture
 </>
 )}
 </button>
 </td>
 </tr>
 )
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Légende */}
 <div className="bg-blue-900/20 border border-white/[0.06] rounded-lg p-4">
 <div className="flex items-start gap-3">
 <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
 <div className="flex-1">
 <h3 className="font-semibold text-white mb-1">À propos des factures</h3>
 <p className="text-sm text-white/60">
 Cliquez sur le bouton"Facture" pour générer et télécharger automatiquement une
 facture PDF professionnelle pour la commande sélectionnée. La facture inclut toutes
 les informations nécessaires : client, produits, prix, livraison, réduction et totaux
 en FCFA.
 </p>
 </div>
 </div>
 </div>
 </div>
 )
}
