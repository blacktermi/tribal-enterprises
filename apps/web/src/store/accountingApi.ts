/**
 * API Service pour la comptabilité
 * Appels API vers PostgreSQL via le backend Express
 */

import { resolveApiBase } from '../utils/api'

const API_BASE = `${resolveApiBase()}/accounting`

// Types pour les réponses API
export interface ApiInvoice {
  id: string
  ref?: string
  type: 'sale' | 'expense' | 'purchase' | 'quote'
  partnerId?: string
  partnerName?: string
  partnerPhone?: string
  partnerEmail?: string
  date: string
  dueDate?: string
  validUntil?: string
  brand?: string
  lines: Array<{
    description?: string
    qty: number
    unitPriceHT: number
    tvaRate?: number
    sku?: string
  }>
  totals: { ht: number; tva: number; ttc: number }
  paid?: boolean
  paidAt?: string
  paymentMethod?: string
  depositAmount?: number
  depositPaidAt?: string
  depositMethod?: string
  quoteStatus?: string
  convertedToInvoiceId?: string
  expenseCategory?: string
  notes?: string
}

export interface ApiPartner {
  id: string
  name: string
  type: 'client' | 'fournisseur'
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface ApiCollaborator {
  id: string
  name: string
  type: string // 'associe', 'salarie', 'freelance', 'stagiaire', 'contractuel'
  poste: string // Poste/Rôle
  brand?: string
  department?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  salary?: number
  paymentFrequency?: string // 'mensuel', 'hebdomadaire', etc.
  paymentMethod?: string // 'CAISSE', 'BANQUE', 'WAVE', etc.
  startDate?: string
  endDate?: string
  contractType?: string // 'cdi', 'cdd', 'freelance', 'stage', 'interim'
  cnpsNumber?: string
  bankAccount?: string
  emergencyContact?: string
  notes?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiTransfer {
  id: string
  date: string
  fromAccount: string
  toAccount: string
  amount: number
  memo?: string
}

export interface ApiBankFee {
  id: string
  date: string
  type: string
  amount: number
  memo?: string
}

export interface ApiJournalEntry {
  id: string
  date: string
  ref?: string
  brand?: string
  lines: Array<{
    account: string
    label?: string
    debit?: number
    credit?: number
  }>
}

// Informations legales de l'entreprise
export interface ApiCompanyInfo {
  // Identite
  raisonSociale: string
  nomCommercial?: string
  formeJuridique?: string // 'sarl', 'sa', 'sas', 'ei', 'snc', 'gie', 'autre'
  capitalSocial?: number

  // Adresse
  adresse?: string
  ville?: string
  commune?: string
  codePostal?: string
  pays?: string

  // Contact
  telephone?: string
  telephoneSecondaire?: string
  email?: string
  siteWeb?: string

  // Informations fiscales DGI
  ncc?: string // Numero de Compte Contribuable
  rccm?: string // RCCM
  regimeFiscal?: string // 'reel-normal', 'reel-simplifie', 'taxe-forfaitaire', 'micro-entreprise'
  centreImpots?: string

  // Activite
  activitePrincipale?: string
  codeNace?: string

  // Co-gerants (SARL avec 2 co-gerants)
  gerantNom?: string // Co-gerant 1
  gerantPrenom?: string
  gerantContact?: string
  gerant2Nom?: string // Co-gerant 2
  gerant2Prenom?: string
  gerant2Contact?: string

  // Banque
  banqueNom?: string
  banqueIban?: string

  // Dates
  dateCreation?: string
  dateImmatriculation?: string
}

// Parametres FNE
export interface ApiFNESettings {
  enabled: boolean
  autoCertify: boolean
  apiUrl?: string
  apiKey?: string
  defaultTaxType?: string // 'A', 'B', 'C', 'D', 'E', 'F'
  tfe?: string
  companyType?: 'PM' | 'PP'
  totalCertified?: number
  lastCertifiedAt?: string
  balanceSticker?: number
}

// Helper fetch avec credentials: 'include' pour envoyer le cookie auth
const authFetch = (url: string, init?: RequestInit) =>
  fetch(url, { credentials: 'include', ...init })

// Fonctions API

export const accountingApi = {
  // === FACTURES/DÉPENSES ===

  async getInvoices(type?: string, brand?: string): Promise<ApiInvoice[]> {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (brand) params.set('brand', brand)
    const url = `${API_BASE}/invoices${params.toString() ? '?' + params.toString() : ''}`
    const res = await authFetch(url)
    if (!res.ok) throw new Error('Erreur chargement factures')
    return res.json()
  },

  async createInvoice(invoice: Omit<ApiInvoice, 'id'> & { id?: string }): Promise<ApiInvoice> {
    const res = await authFetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    })
    if (!res.ok) throw new Error('Erreur création facture')
    return res.json()
  },

  async updateInvoice(id: string, updates: Partial<ApiInvoice>): Promise<ApiInvoice> {
    const res = await authFetch(`${API_BASE}/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Erreur mise à jour facture')
    return res.json()
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression facture')
  },

  async deleteInvoices(ids: string[]): Promise<number> {
    const res = await authFetch(`${API_BASE}/invoices/delete-many`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) throw new Error('Erreur suppression multiple')
    const data = await res.json()
    return data.count
  },

  // === PARTENAIRES ===

  async getPartners(): Promise<ApiPartner[]> {
    const res = await authFetch(`${API_BASE}/partners`)
    if (!res.ok) throw new Error('Erreur chargement partenaires')
    return res.json()
  },

  async createPartner(partner: Omit<ApiPartner, 'id'>): Promise<ApiPartner> {
    const res = await authFetch(`${API_BASE}/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    })
    if (!res.ok) throw new Error('Erreur création partenaire')
    return res.json()
  },

  async deletePartner(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/partners/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression partenaire')
  },

  async updatePartner(id: string, updates: Partial<ApiPartner>): Promise<ApiPartner> {
    const res = await authFetch(`${API_BASE}/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Erreur mise à jour partenaire')
    return res.json()
  },

  // === COLLABORATEURS ===

  async getCollaborators(): Promise<ApiCollaborator[]> {
    const res = await authFetch(`${API_BASE}/collaborators`)
    if (!res.ok) throw new Error('Erreur chargement collaborateurs')
    return res.json()
  },

  async createCollaborator(collaborator: Omit<ApiCollaborator, 'id'>): Promise<ApiCollaborator> {
    const res = await authFetch(`${API_BASE}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collaborator),
    })
    if (!res.ok) throw new Error('Erreur création collaborateur')
    return res.json()
  },

  async updateCollaborator(
    id: string,
    updates: Partial<ApiCollaborator>
  ): Promise<ApiCollaborator> {
    const res = await authFetch(`${API_BASE}/collaborators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Erreur mise à jour collaborateur')
    return res.json()
  },

  async deleteCollaborator(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/collaborators/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression collaborateur')
  },

  // === VIREMENTS INTERNES ===

  async getTransfers(): Promise<ApiTransfer[]> {
    const res = await authFetch(`${API_BASE}/transfers`)
    if (!res.ok) throw new Error('Erreur chargement virements')
    return res.json()
  },

  async createTransfer(transfer: Omit<ApiTransfer, 'id'>): Promise<ApiTransfer> {
    const res = await authFetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transfer),
    })
    if (!res.ok) throw new Error('Erreur création virement')
    return res.json()
  },

  async deleteTransfer(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/transfers/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression virement')
  },

  // === FRAIS BANCAIRES ===

  async getBankFees(): Promise<ApiBankFee[]> {
    const res = await authFetch(`${API_BASE}/bank-fees`)
    if (!res.ok) throw new Error('Erreur chargement frais bancaires')
    return res.json()
  },

  async createBankFee(fee: Omit<ApiBankFee, 'id'>): Promise<ApiBankFee> {
    const res = await authFetch(`${API_BASE}/bank-fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fee),
    })
    if (!res.ok) throw new Error('Erreur création frais bancaire')
    return res.json()
  },

  async deleteBankFee(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/bank-fees/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression frais bancaire')
  },

  // === SOLDES INITIAUX ===

  async getInitialBalances(): Promise<Record<string, number>> {
    const res = await authFetch(`${API_BASE}/initial-balances`)
    if (!res.ok) throw new Error('Erreur chargement soldes')
    return res.json()
  },

  async setInitialBalance(account: string, amount: number): Promise<void> {
    const res = await authFetch(`${API_BASE}/initial-balances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, amount }),
    })
    if (!res.ok) throw new Error('Erreur mise à jour solde')
  },

  // === JOURNAL ===

  async getJournal(): Promise<ApiJournalEntry[]> {
    const res = await authFetch(`${API_BASE}/journal`)
    if (!res.ok) throw new Error('Erreur chargement journal')
    return res.json()
  },

  async createJournalEntry(
    entry: Omit<ApiJournalEntry, 'id'> & { id?: string }
  ): Promise<ApiJournalEntry> {
    const res = await authFetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new Error('Erreur création écriture')
    return res.json()
  },

  // === PARAMÈTRES ===

  async getSettings(): Promise<{ numbering: any; config: any; company?: any; fne?: any }> {
    const res = await authFetch(`${API_BASE}/settings`)
    if (!res.ok) throw new Error('Erreur chargement paramètres')
    return res.json()
  },

  async updateSettings(updates: { numbering?: any; config?: any }): Promise<void> {
    const res = await authFetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Erreur mise à jour paramètres')
  },

  // === INFORMATIONS ENTREPRISE ===

  async getCompanyInfo(): Promise<ApiCompanyInfo | null> {
    const res = await authFetch(`${API_BASE}/company`)
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error('Erreur chargement infos entreprise')
    }
    return res.json()
  },

  async updateCompanyInfo(data: Partial<ApiCompanyInfo>): Promise<ApiCompanyInfo> {
    const res = await authFetch(`${API_BASE}/company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur mise à jour infos entreprise')
    return res.json()
  },

  // === PARAMÈTRES FNE ===

  async getFNESettings(): Promise<ApiFNESettings | null> {
    const res = await authFetch(`${API_BASE}/fne-settings`)
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error('Erreur chargement paramètres FNE')
    }
    return res.json()
  },

  async updateFNESettings(data: Partial<ApiFNESettings>): Promise<ApiFNESettings> {
    const res = await authFetch(`${API_BASE}/fne-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur mise à jour paramètres FNE')
    return res.json()
  },
}
