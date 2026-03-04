import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { accountingApi } from './accountingApi'
import type {
  AccountingState,
  AccountingSettings,
  Invoice,
  JournalEntry,
  StockMovement,
  Partner,
  Collaborator,
  InternalTransfer,
  BankFee,
  TreasuryAdjustment,
  PaymentMethod,
  CompanyInfo,
  FNESettings,
} from '../accounting/types'

// Plus de localStorage - tout passe par l'API SQLite

// Plan Comptable OHADA - Côte d'Ivoire
// Classes : 1-Capitaux, 2-Immobilisations, 3-Stocks, 4-Tiers, 5-Trésorerie, 6-Charges, 7-Produits
const initialSettings: AccountingSettings = {
  currency: 'XOF',
  tva: {
    defaultRate: 0.18,
    rates: {
      normal: 0.18, // 18% - Taux normal CI
      reduit: 0.09, // 9% - Taux réduit
      exonere: 0, // 0% - Exonéré
    },
  },
  accounts: {
    // Classe 3 - Stocks
    '31': { code: '31', label: 'Marchandises' },
    '32': { code: '32', label: 'Matières premières et fournitures liées' },
    '33': { code: '33', label: 'Autres approvisionnements' },
    '36': { code: '36', label: 'Produits finis' },
    // Classe 4 - Tiers (OHADA)
    '401': { code: '401', label: 'Fournisseurs' },
    '408': { code: '408', label: 'Fournisseurs - Factures non parvenues' },
    '411': { code: '411', label: 'Clients' },
    '416': { code: '416', label: 'Clients douteux ou litigieux' },
    '4191': { code: '4191', label: 'Clients - Avances et acomptes reçus' },
    '4091': { code: '4091', label: 'Fournisseurs - Avances et acomptes versés' },
    '443': { code: '443', label: 'TVA facturée' },
    '4431': { code: '4431', label: 'TVA facturée sur ventes' },
    '4432': { code: '4432', label: 'TVA facturée sur prestations de services' },
    '445': { code: '445', label: 'État, TVA récupérable' },
    '4451': { code: '4451', label: 'TVA récupérable sur immobilisations' },
    '4452': { code: '4452', label: 'TVA récupérable sur achats' },
    '4454': { code: '4454', label: 'TVA récupérable sur prestations de services' },
    '447': { code: '447', label: 'État, impôts retenus à la source' },
    // Classe 5 - Trésorerie (OHADA)
    '521': { code: '521', label: 'Banques locales' },
    '571': { code: '571', label: 'Caisse' },
    '585': { code: '585', label: 'Virements de fonds (Mobile Money)' },
    // Classe 6 - Charges (OHADA)
    '601': { code: '601', label: 'Achats de marchandises' },
    '602': { code: '602', label: 'Achats de matières premières' },
    '603': { code: '603', label: 'Variations des stocks de biens achetés' },
    '604': { code: '604', label: 'Achats de fournitures consommables' },
    '605': { code: '605', label: 'Autres achats' },
    '61': { code: '61', label: 'Transports' },
    '62': { code: '62', label: 'Services extérieurs A' },
    '621': { code: '621', label: 'Sous-traitance générale' },
    '622': { code: '622', label: 'Locations et charges locatives' },
    '624': { code: '624', label: 'Entretien, réparations et maintenance' },
    '627': { code: '627', label: 'Publicité, publications, relations publiques' },
    '628': { code: '628', label: 'Autres services extérieurs' },
    '6261': { code: '6261', label: 'Abonnements et logiciels' },
    '6135': { code: '6135', label: 'Hébergement et domaines internet' },
    '63': { code: '63', label: 'Services extérieurs B' },
    '64': { code: '64', label: 'Impôts et taxes' },
    '65': { code: '65', label: 'Autres charges' },
    '66': { code: '66', label: 'Charges de personnel' },
    '661': { code: '661', label: 'Rémunérations du personnel' },
    '662': { code: '662', label: "Rémunérations de main-d'œuvre extérieure" },
    '67': { code: '67', label: 'Frais financiers et charges assimilées' },
    // Classe 7 - Produits (OHADA)
    '701': { code: '701', label: 'Ventes de marchandises' },
    '702': { code: '702', label: 'Ventes de produits finis' },
    '706': { code: '706', label: 'Services vendus' },
    '707': { code: '707', label: 'Produits accessoires' },
    '77': { code: '77', label: 'Revenus financiers et produits assimilés' },
    // Comptes legacy pour compatibilité
    '30': { code: '411', label: 'Clients' }, // Redirect vers OHADA
    '40': { code: '701', label: 'Ventes' }, // Redirect vers OHADA
    '44C': { code: '4431', label: 'TVA collectée' },
    '44D': { code: '4452', label: 'TVA déductible' },
    '41': { code: '401', label: 'Fournisseurs' },
    '51': { code: '521', label: 'Banque' },
    '53': { code: '571', label: 'Caisse' },
    '60': { code: '601', label: 'Achats' },
  },
  paymentAccounts: {
    BANQUE: '521',
    CAISSE: '571',
    WAVE: '585',
    ORANGE_MONEY: '585',
    MTN_MONEY: '585',
    MOOV_MONEY: '585',
    AUTRE: '571',
  },
  numbering: {
    sale: { prefix: 'FA-', next: 1, pad: 5 }, // Facture
    purchase: { prefix: 'FF-', next: 1, pad: 5 }, // Facture Fournisseur
    expense: { prefix: 'NF-', next: 1, pad: 5 }, // Note de Frais
    quote: { prefix: 'DEV-', next: 1, pad: 5 }, // Devis
  },
  // Informations entreprise par defaut (TRIBAL ENTERPRISES SARL)
  company: {
    raisonSociale: 'TRIBAL ENTERPRISES SARL',
    nomCommercial: 'Tribal Print',
    formeJuridique: 'sarl',
    ville: 'Abidjan',
    commune: 'Cocody',
    pays: "Cote d'Ivoire",
    activitePrincipale: 'Impression numerique et serigraphie',
    // Ces champs seront remplis apres formalisation
    ncc: '',
    rccm: '',
    regimeFiscal: 'micro-entreprise',
  },
  // Parametres FNE par defaut
  fne: {
    enabled: false,
    autoCertify: false,
    apiUrl: 'http://54.247.95.108/ws', // URL de test DGI
    defaultTaxType: 'E', // Hors taxe (exonere)
    companyType: 'PM', // Personne Morale
  },
}

export type AccountingStore = AccountingState & {
  // Invoices
  addInvoice: (inv: Omit<Invoice, 'totals' | 'id'> & { id?: string }) => Invoice
  updateInvoice: (id: string, updates: Partial<Omit<Invoice, 'id' | 'totals'>>) => Invoice | null
  deleteInvoice: (id: string) => void
  deleteInvoices: (ids: string[]) => void
  removeDuplicateInvoices: () => number // Retourne le nombre de doublons supprimés
  clearAllSaleInvoices: () => number // Supprime TOUTES les factures de vente, retourne le nombre
  markInvoicePaid: (id: string, method: keyof AccountingSettings['paymentAccounts']) => void
  cancelInvoicePayment: (id: string) => void
  // Acomptes
  recordDeposit: (
    invoiceId: string,
    amount: number,
    method: keyof AccountingSettings['paymentAccounts'],
    date?: string
  ) => void
  // Devis
  convertQuoteToInvoice: (quoteId: string) => Invoice | null
  updateQuoteStatus: (
    quoteId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
  ) => void
  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id'> & { id?: string }) => void
  // Stock
  addStockMovement: (mvt: Omit<StockMovement, 'id'> & { id?: string }) => void
  // Calculs clés
  computeTotals: (inv: Omit<Invoice, 'totals' | 'id'>) => { ht: number; tva: number; ttc: number }
  // CMP
  applyCMPOnSale: (sku: string, qty: number) => number // return cogs
  applyCMPOnPurchase: (sku: string, qty: number, unitCost: number) => void
  // Partners
  addPartner: (p: Omit<Partner, 'id'> & { id?: string }) => Partner
  updatePartner: (id: string, updates: Partial<Partner>) => void
  deletePartner: (id: string) => void
  clearPartners: () => void
  // Collaborators (Team)
  addCollaborator: (c: Omit<Collaborator, 'id'> & { id?: string }) => Collaborator
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => void
  deleteCollaborator: (id: string) => void
  clearCollaborators: () => void
  // Internal Transfers (Dépôts en banque, virements entre comptes)
  addInternalTransfer: (
    t: Omit<InternalTransfer, 'id' | 'createdAt'> & { id?: string }
  ) => InternalTransfer
  deleteInternalTransfer: (id: string) => void
  clearInternalTransfers: () => void
  // Bank Fees (Agios et frais bancaires)
  addBankFee: (f: Omit<BankFee, 'id' | 'createdAt'> & { id?: string }) => BankFee
  deleteBankFee: (id: string) => void
  clearBankFees: () => void
  // Treasury Adjustments (Injections de capital, retraits, corrections)
  addTreasuryAdjustment: (
    a: Omit<TreasuryAdjustment, 'id' | 'createdAt'> & { id?: string }
  ) => TreasuryAdjustment
  updateTreasuryAdjustment: (id: string, updates: Partial<TreasuryAdjustment>) => void
  deleteTreasuryAdjustment: (id: string) => void
  clearTreasuryAdjustments: () => void
  // Initial Balances (Soldes initiaux)
  setInitialBalance: (account: PaymentMethod, amount: number) => void
  // Journal
  clearJournal: () => void
  // Company Info (Informations entreprise)
  updateCompanyInfo: (updates: Partial<CompanyInfo>) => void
  // FNE Settings (Parametres FNE)
  updateFNESettings: (updates: Partial<FNESettings>) => void
  // API
  loadFromApi: () => Promise<void>
  isLoading: boolean
  isInitialized: boolean
  apiError: string | null
}

// Variable pour éviter les rechargements multiples
let isLoadingFromApi = false

export const useAccountingStore = create<AccountingStore>()(
  subscribeWithSelector((set, get) => ({
    invoices: [],
    journal: [],
    isLoading: true,
    isInitialized: false,
    apiError: null,
    partners: [],
    collaborators: [],
    internalTransfers: [],
    bankFees: [],
    treasuryAdjustments: [],
    initialBalances: {
      BANQUE: 0,
      CAISSE: 0,
      WAVE: 0,
      ORANGE_MONEY: 0,
      MTN_MONEY: 0,
      MOOV_MONEY: 0,
      AUTRE: 0,
    },
    stocks: [],
    cmp: {},
    settings: initialSettings,

    computeTotals: inv => {
      const defaultRate = get().settings.tva.defaultRate
      const ht = inv.lines.reduce((s, l) => s + l.qty * l.unitPriceHT, 0)
      const tvaSum = inv.lines.reduce(
        (s, l) =>
          s + l.qty * l.unitPriceHT * (typeof l.tvaRate === 'number' ? l.tvaRate : defaultRate),
        0
      )
      const tva = Math.round(tvaSum)
      const ttc = ht + tva
      return { ht, tva, ttc }
    },

    addInvoice: inv => {
      // PROTECTION CONTRE LES DOUBLONS: Si une facture avec la même ref existe déjà, ne pas créer de doublon
      if (inv.ref) {
        const existingInvoice = get().invoices.find(i => i.ref === inv.ref && i.type === inv.type)
        if (existingInvoice) {
          console.warn(
            `[addInvoice] ⚠️ Facture déjà existante pour ref=${inv.ref}, retour de l'existante`
          )
          return existingInvoice
        }
      }

      // Génération d'ID suivant la numérotation si pas d'ID fourni
      let id = inv.id
      if (!id) {
        const s = get().settings
        const numConf = s.numbering?.[inv.type]
        if (numConf) {
          let n = numConf.next
          // Protection : si l'ID existe deja dans le store, avancer le compteur
          const existingIds = new Set(get().invoices.map(i => i.id))
          let candidate = `${numConf.prefix}${String(n).padStart(numConf.pad, '0')}`
          while (existingIds.has(candidate)) {
            n++
            candidate = `${numConf.prefix}${String(n).padStart(numConf.pad, '0')}`
          }
          id = candidate
          // Incrémenter le compteur
          set(state => ({
            settings: {
              ...state.settings,
              numbering: {
                ...state.settings.numbering!,
                [inv.type]: { ...numConf, next: n + 1 },
              },
            },
          }))
        } else {
          id = `${inv.type.toUpperCase().slice(0, 3)}-${Date.now()}`
        }
      }
      const totals = get().computeTotals(inv)
      const newInv: Invoice = { ...inv, id, totals } as Invoice
      // Enregistrer le partenaire si fourni par nom
      if (newInv.partnerName && !newInv.partnerId) {
        const existing = get().partners.find(
          p => p.name.toLowerCase() === newInv.partnerName!.toLowerCase()
        )
        if (!existing) {
          const created = get().addPartner({
            name: newInv.partnerName!,
            type: newInv.type === 'sale' || newInv.type === 'quote' ? 'client' : 'fournisseur',
          })
          newInv.partnerId = created.id
        } else {
          newInv.partnerId = existing.id
        }
      }
      // Journal entry auto - propager la marque/pôle
      const j: JournalEntry = {
        id: `J-${Date.now()}`,
        date: inv.date,
        brand: inv.brand, // Marque/Pôle d'activité
        ref: id,
        lines: [],
      }
      const acc = get().settings.accounts
      if (inv.type === 'sale') {
        j.lines.push({ account: acc['30'].code, debit: totals.ttc })
        j.lines.push({ account: acc['40'].code, credit: totals.ht })
        j.lines.push({ account: acc['44C'].code, credit: totals.tva })
      } else if (inv.type === 'purchase') {
        j.lines.push({ account: acc['20'].code, debit: totals.ht })
        j.lines.push({ account: acc['44D'].code, debit: totals.tva })
        j.lines.push({ account: acc['41'].code, credit: totals.ttc })
        // CMP sur achats par ligne (si sku fourni)
        inv.lines.forEach(l => {
          if (!l.sku) return
          get().applyCMPOnPurchase(l.sku, l.qty, l.unitPriceHT)
        })
      } else if (inv.type === 'expense') {
        // Mapping catégorie de dépense → compte comptable OHADA
        const expenseCategoryAccountMap: Record<string, string> = {
          Salaires: '661',
          "Main d'\u0153uvre (Atelier)": '662',
          'Sous-traitance Impression': '621',
          'Sous-traitance Fabrication': '621',
          Fournitures: '604',
          Matériel: '605',
          Loyer: '622',
          Marketing: '627',
          'Abonnements & Logiciels': '6261',
          'Hébergement & Domaines': '6135',
          Déplacements: '61',
          Services: '628',
          'Frais généraux': '65',
          Autre: '65',
          'Remuneration Associes': '661',
          'Livraison (Reprise)': '61',
        }
        const expenseAccount =
          expenseCategoryAccountMap[(inv as any).expenseCategory] || acc['61']?.code || '65'
        j.lines.push({ account: expenseAccount, debit: totals.ht })
        j.lines.push({ account: acc['44D'].code, debit: totals.tva })
        j.lines.push({ account: acc['41'].code, credit: totals.ttc })
      }

      set(state => ({
        invoices: [newInv, ...state.invoices],
        journal: [j, ...state.journal],
      }))

      // Sauvegarder vers l'API (async, non bloquant)
      console.log(
        '[addInvoice] 📤 Sauvegarde vers API:',
        newInv.id,
        newInv.type,
        newInv.partnerName
      )
      accountingApi
        .createInvoice(newInv as any)
        .then(saved => console.log('[addInvoice] ✅ Sauvegardé:', saved.id))
        .catch(err => {
          console.error('[addInvoice] ❌ Erreur sauvegarde API:', err)
        })
      accountingApi.createJournalEntry(j as any).catch(err => {
        console.error('[addInvoice] Erreur sauvegarde journal API:', err)
      })

      // COGS/Stock si vente
      if (inv.type === 'sale') {
        inv.lines.forEach(l => {
          if (!l.sku) return
          const cogs = get().applyCMPOnSale(l.sku!, l.qty)
          // COGS entry - propager la marque
          const je: JournalEntry = {
            id: `J-${Date.now()}-COGS`,
            date: inv.date,
            brand: inv.brand, // Marque/Pôle d'activité
            ref: id,
            lines: [
              { account: acc['42'].code, debit: cogs },
              { account: acc['21'].code, credit: cogs },
            ],
          }
          set(state => ({ journal: [je, ...state.journal] }))
        })
      }
      return newInv
    },

    updateInvoice: (id, updates) => {
      const inv = get().invoices.find(i => i.id === id)
      if (!inv) return null

      // Recalculer les totaux si les lignes ont changé
      const newLines = updates.lines || inv.lines
      const totals = get().computeTotals({ ...inv, ...updates, lines: newLines })

      const updatedInv: Invoice = {
        ...inv,
        ...updates,
        lines: newLines,
        totals,
      }

      set(state => ({
        invoices: state.invoices.map(i => (i.id === id ? updatedInv : i)),
      }))

      // Sauvegarder vers l'API
      accountingApi.updateInvoice(id, { ...updates, totals } as any).catch(err => {
        console.error('[updateInvoice] Erreur sauvegarde API:', err)
      })

      return updatedInv
    },

    markInvoicePaid: (id, method) => {
      const inv = get().invoices.find(i => i.id === id)
      if (!inv) return

      // Si déjà payée avec la même méthode (case-insensitive), ne rien faire
      const existingMethod = inv.paymentMethod?.toUpperCase()
      const newMethod = method.toUpperCase()
      if (inv.paid && existingMethod === newMethod) {
        console.log(`[markInvoicePaid] Facture ${id} déjà payée via ${method}, ignorée`)
        return
      }

      // Si déjà payée avec une autre méthode, d'abord annuler l'ancien paiement
      if (inv.paid && inv.paymentMethod && existingMethod !== newMethod) {
        console.log(`[markInvoicePaid] Changement de méthode: ${inv.paymentMethod} → ${method}`)
        get().cancelInvoicePayment(id)
      }

      const acc = get().settings.accounts
      const payAcc = get().settings.paymentAccounts[method]
      if (!payAcc) {
        console.error(`[markInvoicePaid] Méthode de paiement inconnue: ${method}`)
        return
      }

      let lines: JournalEntry['lines'] = []
      if (inv.type === 'sale') {
        // Encaissement client
        lines = [
          { account: payAcc, debit: inv.totals.ttc },
          { account: acc['30'].code, credit: inv.totals.ttc },
        ]
      } else {
        // Règlement fournisseur (achat/dépense)
        lines = [
          { account: acc['41'].code, debit: inv.totals.ttc },
          { account: payAcc, credit: inv.totals.ttc },
        ]
      }
      const j: JournalEntry = {
        id: `J-${Date.now()}-PAY`,
        date: inv.date,
        brand: inv.brand, // Propager la marque/pôle
        ref: id,
        lines,
      }
      set(state => ({
        journal: [j, ...state.journal],
        invoices: state.invoices.map(x =>
          x.id === id
            ? {
                ...x,
                paid: true,
                paymentMethod: method,
                paidAt: new Date().toISOString().slice(0, 10),
              }
            : x
        ),
      }))

      // Sauvegarder vers l'API
      console.log(`[markInvoicePaid] 📤 Sauvegarde API: ${id} payé via ${method}`)
      accountingApi
        .updateInvoice(id, {
          paid: true,
          paymentMethod: method,
          paidAt: new Date().toISOString().slice(0, 10),
        })
        .catch(err => {
          console.error('[markInvoicePaid] ❌ Erreur sauvegarde API:', err)
        })
    },

    cancelInvoicePayment: id => {
      const inv = get().invoices.find(i => i.id === id)
      if (!inv || !inv.paid || !inv.paymentMethod) return
      const acc = get().settings.accounts
      const payAcc = get().settings.paymentAccounts[inv.paymentMethod]
      let lines: JournalEntry['lines'] = []
      if (inv.type === 'sale') {
        // Annulation d'encaissement client: inversion
        lines = [
          { account: payAcc, credit: inv.totals.ttc },
          { account: acc['30'].code, debit: inv.totals.ttc },
        ]
      } else {
        // Annulation d'un règlement fournisseur: inversion
        lines = [
          { account: acc['41'].code, credit: inv.totals.ttc },
          { account: payAcc, debit: inv.totals.ttc },
        ]
      }
      const j: JournalEntry = {
        id: `J-${Date.now()}-PAY-REV`,
        date: new Date().toISOString(),
        brand: inv.brand, // Propager la marque/pôle
        ref: id,
        lines,
      }
      set(state => ({
        journal: [j, ...state.journal],
        invoices: state.invoices.map(x =>
          x.id === id ? { ...x, paid: false, paymentMethod: undefined } : x
        ),
      }))
    },

    // === Gestion des acomptes ===
    recordDeposit: (invoiceId, amount, method, date) => {
      const inv = get().invoices.find(i => i.id === invoiceId)
      if (!inv) return
      // Acomptes pour les ventes ET les devis (un devis peut recevoir un acompte avant conversion)
      if (inv.type !== 'sale' && inv.type !== 'quote') return

      const payAcc = get().settings.paymentAccounts[method]
      if (!payAcc) {
        console.error(`[recordDeposit] Méthode de paiement inconnue: ${method}`)
        return
      }

      const depositDate = date || new Date().toISOString().slice(0, 10)

      // Écriture comptable pour l'acompte (compte OHADA 4191 - Clients, avances et acomptes reçus)
      const j: JournalEntry = {
        id: `J-${Date.now()}-DEP`,
        date: depositDate,
        brand: inv.brand,
        ref: invoiceId,
        memo: `Acompte reçu${inv.type === 'quote' ? ' (devis)' : ''} - ${amount.toLocaleString('fr-FR')} FCFA`,
        lines: [
          { account: payAcc, debit: amount }, // Trésorerie (caisse, banque, mobile money)
          { account: '4191', credit: amount }, // 4191 - Clients, avances et acomptes reçus
        ],
      }

      set(state => ({
        journal: [j, ...state.journal],
        invoices: state.invoices.map(x =>
          x.id === invoiceId
            ? {
                ...x,
                depositAmount: (x.depositAmount || 0) + amount,
                depositDate: depositDate,
                depositMethod: method,
              }
            : x
        ),
      }))

      // Sauvegarder l'écriture comptable vers l'API
      accountingApi.createJournalEntry(j as any).catch(err => {
        console.error('[recordDeposit] Erreur sauvegarde journal API:', err)
      })
    },

    // === Gestion des devis ===
    convertQuoteToInvoice: quoteId => {
      const quote = get().invoices.find(i => i.id === quoteId && i.type === 'quote')
      if (!quote) {
        console.error(`[convertQuoteToInvoice] Devis non trouvé: ${quoteId}`)
        return null
      }

      // Créer une nouvelle facture à partir du devis
      const newInvoice = get().addInvoice({
        type: 'sale',
        brand: quote.brand,
        date: new Date().toISOString().slice(0, 10),
        ref: quote.ref,
        partnerId: quote.partnerId,
        partnerName: quote.partnerName,
        lines: quote.lines,
      })

      // Mettre à jour le devis comme accepté et lié à la facture
      set(state => ({
        invoices: state.invoices.map(x =>
          x.id === quoteId
            ? { ...x, quoteStatus: 'accepted' as const, convertedToInvoiceId: newInvoice.id }
            : x
        ),
      }))

      return newInvoice
    },

    updateQuoteStatus: (quoteId, status) => {
      set(state => ({
        invoices: state.invoices.map(x =>
          x.id === quoteId && x.type === 'quote' ? { ...x, quoteStatus: status } : x
        ),
      }))

      // Sauvegarder vers l'API
      accountingApi.updateInvoice(quoteId, { quoteStatus: status } as any).catch(err => {
        console.error('[updateQuoteStatus] Erreur API:', err)
      })
    },

    deleteInvoice: id => {
      // Supprimer la facture et les écritures de journal associées
      set(state => ({
        invoices: state.invoices.filter(i => i.id !== id),
        journal: state.journal.filter(j => j.ref !== id),
      }))

      // Supprimer de l'API
      accountingApi.deleteInvoice(id).catch(err => {
        console.error('[deleteInvoice] Erreur API:', err)
      })
    },

    deleteInvoices: ids => {
      // Supprimer plusieurs factures et leurs écritures de journal
      const idsSet = new Set(ids)
      set(state => ({
        invoices: state.invoices.filter(i => !idsSet.has(i.id)),
        journal: state.journal.filter(j => !j.ref || !idsSet.has(j.ref)),
      }))

      // Supprimer de l'API
      accountingApi.deleteInvoices(ids).catch(err => {
        console.error('[deleteInvoices] Erreur API:', err)
      })
    },

    removeDuplicateInvoices: () => {
      // Supprimer les factures en double (même ref + même type)
      const state = get()
      const seen = new Map<string, string>() // clé: "ref|type" -> id de la première facture
      const duplicateIds: string[] = []

      for (const invoice of state.invoices) {
        if (invoice.ref) {
          const key = `${invoice.ref}|${invoice.type}`
          if (seen.has(key)) {
            // C'est un doublon - on garde la première, on supprime celle-ci
            duplicateIds.push(invoice.id)
          } else {
            seen.set(key, invoice.id)
          }
        }
      }

      if (duplicateIds.length > 0) {
        console.log(
          `[removeDuplicateInvoices] 🧹 Suppression de ${duplicateIds.length} factures en double`
        )
        const idsSet = new Set(duplicateIds)
        set(state => ({
          invoices: state.invoices.filter(i => !idsSet.has(i.id)),
          journal: state.journal.filter(j => !j.ref || !idsSet.has(j.ref)),
        }))
      }

      return duplicateIds.length
    },

    clearAllSaleInvoices: () => {
      // Supprimer TOUTES les factures de vente (type === 'sale')
      const state = get()
      const saleInvoices = state.invoices.filter(i => i.type === 'sale')
      const saleInvoiceIds = new Set(saleInvoices.map(i => i.id))

      console.log(
        `[clearAllSaleInvoices] 🗑️ Suppression de ${saleInvoices.length} factures de vente`
      )

      set(state => ({
        invoices: state.invoices.filter(i => i.type !== 'sale'),
        journal: state.journal.filter(j => !j.ref || !saleInvoiceIds.has(j.ref)),
      }))

      return saleInvoices.length
    },

    addJournalEntry: entry => {
      const id = entry.id || `J-${Date.now()}`
      const je: JournalEntry = { ...entry, id } as JournalEntry
      // Validation: équilibre
      const debit = je.lines.reduce((s, l) => s + (l.debit || 0), 0)
      const credit = je.lines.reduce((s, l) => s + (l.credit || 0), 0)
      if (debit !== credit) throw new Error('Écriture déséquilibrée (débit ≠ crédit)')
      set(state => ({ journal: [je, ...state.journal] }))
    },

    addStockMovement: mvt => {
      const id = mvt.id || `M-${Date.now()}`
      const mov: StockMovement = { ...mvt, id } as StockMovement
      set(state => ({ stocks: [mov, ...state.stocks] }))
    },

    addPartner: p => {
      const id = p.id || `P-${Date.now()}`
      const partner: Partner = { ...p, id } as Partner
      const exists = get().partners.some(
        e => e.name.toLowerCase() === partner.name.toLowerCase() && e.type === partner.type
      )
      if (!exists) {
        set(state => ({ partners: [partner, ...state.partners] }))

        // Sauvegarder vers l'API
        accountingApi.createPartner(partner as any).catch(err => {
          console.error('[addPartner] Erreur API:', err)
        })
      }
      return partner
    },

    clearPartners: () => {
      set({ partners: [] })
    },

    updatePartner: (id, updates) => {
      const oldPartner = get().partners.find(p => p.id === id)
      const oldName = oldPartner?.name

      set(state => ({
        partners: state.partners.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      }))

      // Si le nom a changé, mettre à jour toutes les factures associées
      if (updates.name && oldName && updates.name !== oldName) {
        const invoicesToUpdate = get().invoices.filter(
          inv => inv.partnerId === id || inv.partnerName === oldName
        )
        invoicesToUpdate.forEach(inv => {
          get().updateInvoice(inv.id, { partnerName: updates.name, partnerId: id })
        })
      }

      // Mettre à jour dans l'API
      accountingApi.updatePartner(id, updates).catch(err => {
        console.error('[updatePartner] Erreur API:', err)
      })
    },

    deletePartner: id => {
      set(state => ({ partners: state.partners.filter(p => p.id !== id) }))

      // Supprimer de l'API
      accountingApi.deletePartner(id).catch(err => {
        console.error('[deletePartner] Erreur API:', err)
      })
    },

    addCollaborator: c => {
      const id = c.id || `COLLAB-${Date.now()}`
      const now = new Date().toISOString()
      const collaborator: Collaborator = {
        ...c,
        id,
        createdAt: c.createdAt || now,
        updatedAt: now,
        isActive: c.isActive !== undefined ? c.isActive : true,
      } as Collaborator
      set(state => ({ collaborators: [collaborator, ...state.collaborators] }))

      // Sauvegarder vers l'API
      accountingApi.createCollaborator(collaborator as any).catch(err => {
        console.error('[addCollaborator] Erreur API:', err)
      })

      return collaborator
    },

    updateCollaborator: (id, updates) => {
      set(state => ({
        collaborators: state.collaborators.map(c =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      }))

      // Sauvegarder vers l'API
      accountingApi.updateCollaborator(id, updates as any).catch(err => {
        console.error('[updateCollaborator] Erreur API:', err)
      })
    },

    deleteCollaborator: id => {
      set(state => ({
        collaborators: state.collaborators.filter(c => c.id !== id),
      }))

      // Supprimer de l'API
      accountingApi.deleteCollaborator(id).catch(err => {
        console.error('[deleteCollaborator] Erreur API:', err)
      })
    },

    clearCollaborators: () => {
      set({ collaborators: [] })
    },

    // === Virements Internes (Dépôts en banque) ===
    addInternalTransfer: t => {
      const newTransfer: InternalTransfer = {
        ...t,
        id: t.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }

      // Générer l'écriture comptable
      // Débit: Compte destination (ex: 521 Banque)
      // Crédit: Compte origine (ex: 571 Caisse ou 585 Mobile Money)
      const payAccounts = get().settings.paymentAccounts
      const fromAccount = payAccounts[t.fromAccount] || '571'
      const toAccount = payAccounts[t.toAccount] || '521'

      const journalEntry: Omit<JournalEntry, 'id'> = {
        date: t.date,
        ref: `VIR-${newTransfer.id.slice(-4).toUpperCase()}`,
        memo: t.memo || `Virement ${t.fromAccount} → ${t.toAccount}`,
        lines: [
          { account: toAccount, debit: t.amount },
          { account: fromAccount, credit: t.amount },
        ],
      }
      get().addJournalEntry(journalEntry)

      set(state => ({
        internalTransfers: [...state.internalTransfers, newTransfer],
      }))

      // Sauvegarder vers l'API
      accountingApi.createTransfer(newTransfer as any).catch(err => {
        console.error('[addInternalTransfer] Erreur API:', err)
      })

      return newTransfer
    },

    deleteInternalTransfer: id => {
      set(state => ({
        internalTransfers: state.internalTransfers.filter(t => t.id !== id),
      }))

      // Supprimer de l'API
      accountingApi.deleteTransfer(id).catch(err => {
        console.error('[deleteInternalTransfer] Erreur API:', err)
      })
    },

    clearInternalTransfers: () => {
      set({ internalTransfers: [] })
    },

    // === Frais bancaires (Agios) ===
    addBankFee: f => {
      const newFee: BankFee = {
        ...f,
        id: f.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }

      // Générer l'écriture comptable (OHADA: 631 Frais bancaires)
      // Débit: 631 Frais bancaires
      // Crédit: 521 Banque
      const journalEntry: Omit<JournalEntry, 'id'> = {
        date: f.date,
        ref: `AGIO-${newFee.id.slice(-4).toUpperCase()}`,
        memo: f.memo || `Frais bancaires: ${f.type}`,
        lines: [
          { account: '631', debit: f.amount }, // 631 Frais bancaires
          { account: '521', credit: f.amount }, // 521 Banque
        ],
      }
      get().addJournalEntry(journalEntry)

      set(state => ({
        bankFees: [...state.bankFees, newFee],
      }))

      // Sauvegarder vers l'API
      accountingApi.createBankFee(newFee as any).catch(err => {
        console.error('[addBankFee] Erreur API:', err)
      })

      return newFee
    },

    deleteBankFee: id => {
      set(state => ({
        bankFees: state.bankFees.filter(f => f.id !== id),
      }))

      // Supprimer de l'API
      accountingApi.deleteBankFee(id).catch(err => {
        console.error('[deleteBankFee] Erreur API:', err)
      })
    },

    clearBankFees: () => {
      set({ bankFees: [] })
    },

    // === Ajustements de Trésorerie (Apports, Retraits, Corrections) ===
    addTreasuryAdjustment: a => {
      const newAdjustment: TreasuryAdjustment = {
        ...a,
        id: a.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }

      // Générer l'écriture comptable selon le type
      // Apport de capital: Débit Trésorerie, Crédit 101 Capital
      // Retrait de capital: Débit 101 Capital, Crédit Trésorerie
      const payAccounts = get().settings.paymentAccounts
      const accountCode = payAccounts[a.account] || '571'

      let lines: JournalEntry['lines'] = []
      let memo = a.memo || ''

      if (a.type === 'capital_injection' || a.type === 'loan_received') {
        // Entrée de trésorerie
        lines = [
          { account: accountCode, debit: Math.abs(a.amount) },
          { account: '101', credit: Math.abs(a.amount) }, // 101 Capital social
        ]
        memo = memo || `Apport de capital${a.associateName ? ` - ${a.associateName}` : ''}`
      } else if (a.type === 'capital_withdrawal' || a.type === 'loan_repayment') {
        // Sortie de trésorerie
        lines = [
          { account: '101', debit: Math.abs(a.amount) }, // 101 Capital social
          { account: accountCode, credit: Math.abs(a.amount) },
        ]
        memo = memo || `Retrait de capital${a.associateName ? ` - ${a.associateName}` : ''}`
      } else {
        // Correction ou autre: mouvement simple
        if (a.amount >= 0) {
          lines = [
            { account: accountCode, debit: Math.abs(a.amount) },
            { account: '758', credit: Math.abs(a.amount) }, // 758 Produits divers
          ]
        } else {
          lines = [
            { account: '658', debit: Math.abs(a.amount) }, // 658 Charges diverses
            { account: accountCode, credit: Math.abs(a.amount) },
          ]
        }
        memo = memo || 'Ajustement de trésorerie'
      }

      const journalEntry: Omit<JournalEntry, 'id'> = {
        date: a.date,
        ref: `ADJ-${newAdjustment.id.slice(-4).toUpperCase()}`,
        memo,
        lines,
      }
      get().addJournalEntry(journalEntry)

      set(state => ({
        treasuryAdjustments: [...state.treasuryAdjustments, newAdjustment],
      }))

      // Sauvegarder vers l'API (quand l'endpoint sera créé)
      // accountingApi.createTreasuryAdjustment(newAdjustment).catch(err => {
      //   console.error('[addTreasuryAdjustment] Erreur API:', err)
      // })

      return newAdjustment
    },

    updateTreasuryAdjustment: (id, updates) => {
      set(state => ({
        treasuryAdjustments: state.treasuryAdjustments.map(a =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }))
    },

    deleteTreasuryAdjustment: id => {
      set(state => ({
        treasuryAdjustments: state.treasuryAdjustments.filter(a => a.id !== id),
      }))
    },

    clearTreasuryAdjustments: () => {
      set({ treasuryAdjustments: [] })
    },

    // === Soldes initiaux ===
    setInitialBalance: (account, amount) => {
      set(state => ({
        initialBalances: {
          ...state.initialBalances,
          [account]: amount,
        },
      }))

      // Sauvegarder vers l'API
      accountingApi.setInitialBalance(account, amount).catch(err => {
        console.error('[setInitialBalance] Erreur API:', err)
      })
    },

    clearJournal: () => {
      set({ journal: [] })
    },

    // === Informations Entreprise ===
    updateCompanyInfo: updates => {
      const currentCompany = get().settings.company || initialSettings.company!
      set(state => ({
        settings: {
          ...state.settings,
          company: {
            ...currentCompany,
            ...updates,
          } as CompanyInfo,
        },
      }))

      // Sauvegarder vers l'API
      accountingApi.updateCompanyInfo(updates).catch(err => {
        console.error('[updateCompanyInfo] Erreur API:', err)
      })
    },

    // === Parametres FNE ===
    updateFNESettings: updates => {
      const currentFne = get().settings.fne || initialSettings.fne!
      set(state => ({
        settings: {
          ...state.settings,
          fne: {
            ...currentFne,
            ...updates,
          } as FNESettings,
        },
      }))

      // Sauvegarder vers l'API
      accountingApi.updateFNESettings(updates).catch(err => {
        console.error('[updateFNESettings] Erreur API:', err)
      })
    },

    applyCMPOnPurchase: (sku, qty, unitCost) => {
      const s = get().cmp[sku] || { stockQty: 0, cmp: 0 }
      const totalCost = s.stockQty * s.cmp + qty * unitCost
      const newQty = s.stockQty + qty
      const newCMP = newQty > 0 ? Math.round(totalCost / newQty) : s.cmp
      set(state => ({ cmp: { ...state.cmp, [sku]: { stockQty: newQty, cmp: newCMP } } }))
    },

    applyCMPOnSale: (sku, qty) => {
      const s = get().cmp[sku] || { stockQty: 0, cmp: 0 }
      const usedQty = Math.min(qty, s.stockQty)
      const cogs = Math.round(usedQty * s.cmp)
      set(state => ({
        cmp: { ...state.cmp, [sku]: { stockQty: Math.max(0, s.stockQty - usedQty), cmp: s.cmp } },
      }))
      return cogs
    },

    // === Chargement depuis l'API SQLite ===
    loadFromApi: async () => {
      if (isLoadingFromApi) {
        console.log('[Accounting] Chargement déjà en cours...')
        return
      }

      isLoadingFromApi = true
      set({ isLoading: true, apiError: null })

      try {
        console.log('[Accounting] 📥 Chargement depuis API SQLite...')

        // Charger toutes les données en parallèle
        const [invoices, partners, collaborators, transfers, bankFees, initialBalances, journal] =
          await Promise.all([
            accountingApi.getInvoices().catch(() => []),
            accountingApi.getPartners().catch(() => []),
            accountingApi.getCollaborators().catch(() => []),
            accountingApi.getTransfers().catch(() => []),
            accountingApi.getBankFees().catch(() => []),
            accountingApi.getInitialBalances().catch(() => ({})),
            accountingApi.getJournal().catch(() => []),
          ])

        console.log('[Accounting] ✅ Données chargées:', {
          invoices: invoices.length,
          partners: partners.length,
          collaborators: collaborators.length,
          transfers: transfers.length,
          bankFees: bankFees.length,
          journal: journal.length,
        })

        // Cast pour eviter les erreurs de type sur initialBalances
        const balances = initialBalances as Record<string, number>

        // Recalculer les compteurs de numerotation a partir des factures existantes
        // pour eviter les collisions d'ID apres un rechargement de page
        const currentNumbering = get().settings.numbering
        if (currentNumbering) {
          const updatedNumbering = { ...currentNumbering }
          for (const [type, conf] of Object.entries(updatedNumbering)) {
            if (!conf?.prefix) continue
            let maxNum = 0
            for (const inv of invoices) {
              if (inv.id?.startsWith(conf.prefix)) {
                const numPart = inv.id.slice(conf.prefix.length)
                const parsed = parseInt(numPart, 10)
                if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed
              }
            }
            if (maxNum >= conf.next) {
              updatedNumbering[type as keyof typeof updatedNumbering] = { ...conf, next: maxNum + 1 }
              console.log(`[Accounting] Compteur ${conf.prefix} ajuste: ${conf.next} -> ${maxNum + 1}`)
            }
          }
          set(state => ({
            settings: { ...state.settings, numbering: updatedNumbering },
          }))
        }

        set({
          invoices: invoices as Invoice[],
          partners: partners as Partner[],
          collaborators: collaborators as Collaborator[],
          internalTransfers: transfers as InternalTransfer[],
          bankFees: bankFees as BankFee[],
          initialBalances: {
            BANQUE: balances.BANQUE || 0,
            CAISSE: balances.CAISSE || 0,
            WAVE: balances.WAVE || 0,
            ORANGE_MONEY: balances.ORANGE_MONEY || 0,
            MTN_MONEY: balances.MTN_MONEY || 0,
            MOOV_MONEY: balances.MOOV_MONEY || 0,
            AUTRE: balances.AUTRE || 0,
          },
          journal: journal as JournalEntry[],
          isLoading: false,
          isInitialized: true,
        })
      } catch (error) {
        console.error('[Accounting] ❌ Erreur chargement API:', error)
        set({
          isLoading: false,
          isInitialized: true,
          apiError: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      } finally {
        isLoadingFromApi = false
      }
    },
  }))
)

// Auto-load au démarrage de l'app
if (typeof window !== 'undefined') {
  // Petit délai pour éviter les conflits de chargement
  setTimeout(() => {
    useAccountingStore.getState().loadFromApi()
  }, 100)
}
