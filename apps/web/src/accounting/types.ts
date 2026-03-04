// Types de base pour le module Comptabilité - Système OHADA (Côte d'Ivoire)
export type Currency = 'XOF' | 'EUR' | 'USD'

// Marques/Pôles d'activité
export type Brand =
  | 'tribalprint'
  | 'jerichoprint'
  | 'muslimprint'
  | 'tribalverra'
  | 'tribalagency'
  | 'other'

export const BRAND_LABELS: Record<Brand, string> = {
  tribalprint: 'Tribal Print',
  jerichoprint: 'Jericho Print',
  muslimprint: 'Muslim Print',
  tribalverra: 'Tribal Verra',
  tribalagency: 'Tribal Agency',
  other: 'Autre',
}

export const BRAND_COLORS: Record<Brand, { bg: string; text: string; border: string }> = {
  tribalprint: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  jerichoprint: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  muslimprint: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  tribalverra: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  tribalagency: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  other: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
  },
}

// Configuration TVA Côte d'Ivoire
export type TVAConfig = {
  defaultRate: number // 18% en Côte d'Ivoire
  rates: {
    normal: number // 18% - Taux normal
    reduit: number // 9% - Taux réduit (certains produits de première nécessité)
    exonere: number // 0% - Exonéré
  }
}

export type PaymentMethod =
  | 'BANQUE'
  | 'CAISSE'
  | 'WAVE'
  | 'ORANGE_MONEY'
  | 'MTN_MONEY'
  | 'MOOV_MONEY'
  | 'AUTRE'

// Liste ordonnée des méthodes de paiement (source unique)
export const PAYMENT_METHODS: PaymentMethod[] = [
  'CAISSE',
  'BANQUE',
  'WAVE',
  'ORANGE_MONEY',
  'MTN_MONEY',
  'MOOV_MONEY',
  'AUTRE',
]

// Labels pour les méthodes de paiement
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CAISSE: 'Caisse (Espèces)',
  BANQUE: 'Banque',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  MOOV_MONEY: 'Moov Money',
  AUTRE: 'Autre',
}

// Statuts de commande considérés comme "payés/livrés" (source unique)
export const PAID_STATUSES = [
  'livré',
  'livrée',
  'livré et payé',
  'livrée et payée',
  'terminé',
  'terminée',
  'completed',
  'delivered',
  'fait',
  'payé',
  'payée',
] as const

// Helper pour vérifier si un statut est considéré payé
export function isPaidStatus(status: string | undefined): boolean {
  if (!status) return false
  return PAID_STATUSES.some(s => status.toLowerCase().includes(s.toLowerCase()))
}

export type PartnerType = 'client' | 'fournisseur'

// Type Partner enrichi pour OHADA
export type Partner = {
  id: string
  name: string
  type: PartnerType
  // Informations de contact
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string // Par défaut: Côte d'Ivoire
  // Informations fiscales (OHADA)
  compteContribuable?: string // Numéro de Compte Contribuable (NCC)
  rccm?: string // Registre du Commerce et du Crédit Mobilier
  regimeFiscal?: 'reel-normal' | 'reel-simplifie' | 'micro-entreprise' | 'particulier'
  // Conditions commerciales
  delaiPaiement?: number // En jours (ex: 30, 60, 90)
  plafondCredit?: number // Montant max en XOF
  // Métadonnées
  notes?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

// ===== COLLABORATEURS (Équipe) =====

export type CollaboratorType = 'associe' | 'salarie' | 'freelance' | 'stagiaire' | 'contractuel'

export const COLLABORATOR_TYPE_LABELS: Record<CollaboratorType, string> = {
  associe: 'Associé / Gérant',
  salarie: 'Salarié',
  freelance: 'Freelance',
  stagiaire: 'Stagiaire',
  contractuel: 'Contractuel',
}

export type PaymentFrequency =
  | 'mensuel'
  | 'bimensuel'
  | 'hebdomadaire'
  | 'journalier'
  | 'projet'
  | 'horaire'

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  mensuel: 'Mensuel',
  bimensuel: 'Bimensuel (2x/mois)',
  hebdomadaire: 'Hebdomadaire',
  journalier: 'Journalier',
  projet: 'Par projet',
  horaire: "À l'heure",
}

export type Collaborator = {
  id: string
  name: string
  type: CollaboratorType
  // Poste et affectation
  poste: string // Ex: Designer, Développeur, Commercial...
  brand?: Brand // Pôle/Marque rattaché
  department?: string // Département (optionnel)
  // Coordonnées
  phone?: string
  email?: string
  address?: string
  city?: string
  // Rémunération
  salary?: number // Salaire mensuel ou tarif selon frequency
  paymentFrequency?: PaymentFrequency
  paymentMethod?: PaymentMethod
  // Contrat
  startDate?: string // Date d'embauche (ISO)
  endDate?: string // Date de fin si CDD/mission (ISO)
  contractType?: 'cdi' | 'cdd' | 'freelance' | 'stage' | 'interim'
  // Informations légales (Côte d'Ivoire)
  cnpsNumber?: string // Numéro CNPS (Caisse Nationale de Prévoyance Sociale)
  bankAccount?: string // RIB/IBAN pour virements
  emergencyContact?: string // Contact d'urgence
  // Métadonnées
  notes?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export type InvoiceLine = {
  sku?: string
  description?: string
  qty: number
  unitPriceHT: number
  tvaRate?: number // default TVAConfig.defaultRate
}

export type InvoiceType = 'sale' | 'purchase' | 'expense' | 'quote'

export type Invoice = {
  id: string // ex: INV-001, PUR-001, DEV-001
  type: InvoiceType
  brand?: Brand // Marque/Pôle d'activité
  date: string // ISO
  dueDate?: string // ISO, optionnel
  validUntil?: string // ISO, date de validité pour les devis
  ref?: string // Référence externe (ex: ID commande)
  partnerId?: string
  partnerName?: string
  partnerPhone?: string // Téléphone du client
  partnerEmail?: string // Email du client
  // Compte comptable associé (OHADA)
  accountCode?: string // Code du compte comptable (ex: '701', '706')
  // Catégorie de dépense (optionnelle, uniquement pertinente pour type 'expense')
  expenseCategory?: string
  // Investissement (immobilisation) - pour type 'expense' uniquement
  isInvestment?: boolean // Si true, c'est un investissement (ordinateur, machine, véhicule...)
  investmentDuration?: number // Durée d'amortissement en années (ex: 3, 5, 10)
  // Charges sociales - pour type 'expense' uniquement
  isChargesSociales?: boolean // Si true, c'est une cotisation sociale (CNPS, mutuelle, retraite...)
  memo?: string // Description/notes
  lines: InvoiceLine[]
  totals: { ht: number; tva: number; ttc: number }
  paidAt?: string // Date de paiement (ISO)
  paid?: boolean
  paymentMethod?: PaymentMethod
  // Gestion des acomptes
  depositAmount?: number // Montant de l'acompte versé
  depositDate?: string // Date du versement de l'acompte
  depositMethod?: PaymentMethod // Méthode de paiement de l'acompte
  // Pour les devis
  quoteStatus?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted' // Statut du devis
  convertedToInvoiceId?: string // ID de la facture si le devis a été converti
}

export type Account = {
  code: string // ex: '30' Clients, '40' Ventes, '44' TVA
  label: string
}

export type JournalEntryLine = {
  account: string // code
  debit?: number
  credit?: number
}

export type JournalEntry = {
  id: string
  date: string // ISO
  brand?: Brand // Marque/Pôle d'activité
  ref?: string // lien facture
  memo?: string
  lines: JournalEntryLine[]
}

// Virements internes entre comptes de trésorerie (ex: Caisse -> Banque)
export type InternalTransfer = {
  id: string
  date: string // ISO
  fromAccount: PaymentMethod // CAISSE, WAVE, ORANGE_MONEY...
  toAccount: PaymentMethod // BANQUE généralement
  amount: number
  memo?: string // Description (ex: "Dépôt hebdo semaine 52")
  createdAt: string
}

// Frais bancaires (agios, frais de tenue de compte, etc.)
export type BankFee = {
  id: string
  date: string // ISO
  type: 'agio' | 'frais_tenue' | 'frais_virement' | 'frais_prelevement' | 'autres'
  amount: number
  memo?: string // Description
  createdAt: string
}

export const BANK_FEE_LABELS: Record<BankFee['type'], string> = {
  agio: 'Agios (découvert)',
  frais_tenue: 'Frais de tenue de compte',
  frais_virement: 'Frais de virement',
  frais_prelevement: 'Frais de prélèvement',
  autres: 'Autres frais bancaires',
}

// ===== AJUSTEMENTS DE TRÉSORERIE =====
// Pour les injections de capital, retraits, corrections manuelles

export type TreasuryAdjustmentType =
  | 'capital_injection' // Apport de capital (associé)
  | 'capital_withdrawal' // Retrait de capital
  | 'loan_received' // Emprunt reçu
  | 'loan_repayment' // Remboursement d'emprunt
  | 'correction' // Correction/régularisation
  | 'other' // Autre mouvement

export const TREASURY_ADJUSTMENT_LABELS: Record<TreasuryAdjustmentType, string> = {
  capital_injection: 'Apport de capital',
  capital_withdrawal: 'Retrait de capital',
  loan_received: 'Emprunt reçu',
  loan_repayment: 'Remboursement emprunt',
  correction: 'Correction/Régularisation',
  other: 'Autre mouvement',
}

export type TreasuryAdjustment = {
  id: string
  date: string // ISO
  type: TreasuryAdjustmentType
  account: PaymentMethod // Compte impacté (WAVE, BANQUE, etc.)
  amount: number // Positif = entrée, Négatif = sortie
  memo?: string // Description
  associateName?: string // Nom de l'associé (pour apports/retraits de capital)
  createdAt: string
}

export type StockMovement = {
  id: string
  date: string // ISO
  brand?: Brand // Marque/Pôle d'activité
  sku: string
  qty: number // + entrée, - sortie
  unitCost?: number // pour CMP
}

export type CMPState = {
  [sku: string]: { stockQty: number; cmp: number }
}

// ===== INFORMATIONS ENTREPRISE (FNE / DGI) =====
// Pour la facturation normalisee et les declarations fiscales

export type RegimeFiscal =
  | 'reel-normal' // CA > 150M FCFA - Regime reel normal
  | 'reel-simplifie' // CA 50M-150M FCFA - Regime reel simplifie
  | 'taxe-forfaitaire' // CA < 50M FCFA - Taxe forfaitaire (TFE)
  | 'micro-entreprise' // Micro-entreprise (exoneree)

export const REGIME_FISCAL_LABELS: Record<RegimeFiscal, string> = {
  'reel-normal': 'Reel Normal (CA > 150M)',
  'reel-simplifie': 'Reel Simplifie (50-150M)',
  'taxe-forfaitaire': 'Taxe Forfaitaire (< 50M)',
  'micro-entreprise': 'Micro-entreprise (exoneree)',
}

export type FormeJuridique =
  | 'sarl' // SARL - Societe a responsabilite limitee
  | 'sa' // SA - Societe anonyme
  | 'sas' // SAS - Societe par actions simplifiee
  | 'ei' // EI - Entreprise individuelle
  | 'snc' // SNC - Societe en nom collectif
  | 'gie' // GIE - Groupement d'interet economique
  | 'autre'

export const FORME_JURIDIQUE_LABELS: Record<FormeJuridique, string> = {
  sarl: 'SARL - Societe a responsabilite limitee',
  sa: 'SA - Societe anonyme',
  sas: 'SAS - Societe par actions simplifiee',
  ei: 'EI - Entreprise individuelle',
  snc: 'SNC - Societe en nom collectif',
  gie: "GIE - Groupement d'interet economique",
  autre: 'Autre',
}

// Types de taxe FNE (DGI Cote d'Ivoire)
export type FNETaxType =
  | 'A' // TVA 18%
  | 'B' // TVA 9%
  | 'C' // Exonere (exportation)
  | 'D' // Taxe speciale
  | 'E' // Hors taxe
  | 'F' // Taxe sur boissons

export const FNE_TAX_TYPE_LABELS: Record<FNETaxType, string> = {
  A: 'TVA 18% (Taux normal)',
  B: 'TVA 9% (Taux reduit)',
  C: 'Exonere (Exportation)',
  D: 'Taxe speciale',
  E: 'Hors taxe',
  F: 'Taxe sur boissons',
}

// Informations legales de l'entreprise
export type CompanyInfo = {
  // Identite
  raisonSociale: string // Raison sociale complete
  nomCommercial?: string // Nom commercial (si different)
  formeJuridique?: FormeJuridique
  capitalSocial?: number // Capital social en FCFA

  // Adresse
  adresse?: string // Adresse complete
  ville?: string // Ville (ex: Abidjan)
  commune?: string // Commune (ex: Cocody, Plateau, Marcory...)
  codePostal?: string // Code postal (optionnel en CI)
  pays?: string // Pays (default: Cote d'Ivoire)

  // Contact
  telephone?: string // Telephone principal
  telephoneSecondaire?: string
  email?: string
  siteWeb?: string

  // Informations fiscales DGI
  ncc?: string // Numero de Compte Contribuable (ex: CI-ABJ-2024-00001)
  rccm?: string // RCCM (ex: CI-ABJ-2024-B-12345)
  regimeFiscal?: RegimeFiscal
  centreImpots?: string // Centre des impots de rattachement

  // Activite
  activitePrincipale?: string // Description activite principale
  codeNace?: string // Code NACE/APE si applicable

  // Co-gerants / Representants legaux (SARL avec 2 co-gerants)
  gerantNom?: string // Co-gerant 1 - Nom
  gerantPrenom?: string // Co-gerant 1 - Prenom
  gerantContact?: string // Co-gerant 1 - Contact
  gerant2Nom?: string // Co-gerant 2 - Nom
  gerant2Prenom?: string // Co-gerant 2 - Prenom
  gerant2Contact?: string // Co-gerant 2 - Contact

  // Banque principale
  banqueNom?: string
  banqueIban?: string // RIB/IBAN

  // Dates importantes
  dateCreation?: string // Date de creation (ISO)
  dateImmatriculation?: string // Date immatriculation RCCM
}

// Parametres FNE (Facture Normalisee Electronique)
export type FNESettings = {
  // Activation
  enabled: boolean // Service FNE active
  autoCertify: boolean // Certification automatique des factures

  // API DGI
  apiUrl?: string // URL de l'API FNE (test ou production)
  apiKey?: string // Cle API / Token JWT

  // Parametres par defaut
  defaultTaxType?: FNETaxType // Type de taxe par defaut (ex: 'E' pour hors taxe)

  // Informations specifiques FNE
  tfe?: string // Taxe Forfaitaire d'Entreprise (si regime TFE)
  companyType?: 'PM' | 'PP' // PM = Personne Morale, PP = Personne Physique

  // Statistiques (lecture seule, mises a jour par le backend)
  totalCertified?: number // Nombre total de factures certifiees
  lastCertifiedAt?: string // Date derniere certification (ISO)
  balanceSticker?: number // Solde de stickers restants
}

export type AccountingSettings = {
  currency: Currency
  tva: TVAConfig
  accounts: Record<string, Account> // par code
  paymentAccounts: Record<PaymentMethod, string> // map vers comptes (banque, caisse...)
  numbering?: {
    sale: { prefix: string; next: number; pad: number }
    purchase: { prefix: string; next: number; pad: number }
    expense: { prefix: string; next: number; pad: number }
    quote?: { prefix: string; next: number; pad: number }
  }
  // Informations entreprise et FNE
  company?: CompanyInfo
  fne?: FNESettings
}

export type AccountingState = {
  invoices: Invoice[]
  journal: JournalEntry[]
  partners: Partner[]
  collaborators: Collaborator[]
  internalTransfers: InternalTransfer[]
  bankFees: BankFee[]
  treasuryAdjustments: TreasuryAdjustment[] // Ajustements manuels (apports, retraits, corrections)
  initialBalances: Record<PaymentMethod, number> // Soldes initiaux par compte
  stocks: StockMovement[]
  cmp: CMPState
  settings: AccountingSettings
}
