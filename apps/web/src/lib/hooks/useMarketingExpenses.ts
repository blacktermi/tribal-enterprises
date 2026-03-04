/**
 * Hook pour synchroniser les dépenses marketing (Facebook Ads) avec la comptabilité
 */

import { useState, useCallback } from 'react'
import { useAccountingStore } from '../../store/accounting'
import type { Brand } from '../../accounting/types'
import { resolveApiBase } from '../../utils/api'

interface MonthlySpendItem {
  year: number
  month: number
  platform: string
  platformLabel: string
  spendCFA: number
  spendUSD: number
}

interface MonthlySpendResponse {
  success: boolean
  data?: {
    year: number
    startMonth: number
    endMonth: number
    byPlatformAndMonth: MonthlySpendItem[]
    totalsByMonth: Record<string, { spendCFA: number; spendUSD: number }>
    grandTotal: { spendCFA: number; spendUSD: number }
  }
  error?: string
}

// Catégorie de dépense pour le marketing (avec M majuscule comme dans la liste)
const MARKETING_EXPENSE_CATEGORY = 'Marketing'

// Préfixe pour identifier les dépenses marketing synchronisées
const MARKETING_EXPENSE_PREFIX = 'MKT-FB-'

/**
 * Génère un ID unique pour une dépense marketing
 */
function generateMarketingExpenseId(platform: string, year: number, month: number): string {
  return `${MARKETING_EXPENSE_PREFIX}${platform}-${year}-${String(month).padStart(2, '0')}`
}

/**
 * Hook pour gérer la synchronisation des dépenses marketing
 */
export function useMarketingExpenses() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const invoices = useAccountingStore(s => s.invoices)
  const addInvoice = useAccountingStore(s => s.addInvoice)
  const updateInvoice = useAccountingStore(s => s.updateInvoice)
  const deleteInvoice = useAccountingStore(s => s.deleteInvoice)

  /**
   * Récupère les dépenses marketing existantes (synchronisées)
   */
  const getExistingMarketingExpenses = useCallback(() => {
    return invoices.filter(
      inv => inv.type === 'expense' && inv.id?.startsWith(MARKETING_EXPENSE_PREFIX)
    )
  }, [invoices])

  /**
   * Synchronise les dépenses marketing avec la comptabilité
   * @param year - Année à synchroniser
   * @param options - Options de synchronisation
   */
  const syncMarketingExpenses = useCallback(async (
    year: number,
    options: {
      startMonth?: number
      endMonth?: number
      overwrite?: boolean // Si true, remplace les dépenses existantes
      paymentMethod?: 'BANQUE' | 'CAISSE' | 'WAVE' | 'ORANGE_MONEY' // Méthode de paiement par défaut
    } = {}
  ): Promise<{
    success: boolean
    created: number
    updated: number
    skipped: number
    total: number
    error?: string
  }> => {
    const {
      startMonth = 1,
      endMonth = 12,
      overwrite = false,
      paymentMethod = 'BANQUE'
    } = options

    setIsLoading(true)
    setError(null)

    try {
      // Utiliser la même logique que les autres hooks pour l'URL de l'API
      const apiBase = resolveApiBase()

      // Appeler l'endpoint pour récupérer les dépenses mensuelles
      const response = await fetch(
        `${apiBase}/facebook/monthly-spend?year=${year}&startMonth=${startMonth}&endMonth=${endMonth}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const json: MonthlySpendResponse = await response.json()

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Erreur lors de la récupération des dépenses marketing')
      }

      const { byPlatformAndMonth } = json.data
      let created = 0
      let updated = 0
      let skipped = 0

      // Pour chaque dépense marketing récupérée
      for (const item of byPlatformAndMonth) {
        const expenseId = generateMarketingExpenseId(item.platform, item.year, item.month)
        const existingExpense = invoices.find(inv => inv.id === expenseId)

        // Créer la date au dernier jour du mois
        const expenseDate = new Date(item.year, item.month, 0).toISOString().split('T')[0]

        // Mapper la plateforme vers une marque
        const platformToBrand: Record<string, Brand> = {
          tribalprint: 'tribalprint',
          jerichoprint: 'jerichoprint',
          muslimprint: 'muslimprint',
          tribalverra: 'tribalverra',
        }
        const brand = platformToBrand[item.platform] || 'other'

        // Description de la dépense
        const monthName = new Date(item.year, item.month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })
        const description = `Publicité Facebook Ads - ${monthName} ${item.year}`

        // Nom du fournisseur incluant la plateforme pour identification claire
        const partnerName = `Meta Ads - ${item.platformLabel}`

        if (existingExpense) {
          if (overwrite) {
            // Mettre à jour la dépense existante
            updateInvoice(expenseId, {
              date: expenseDate,
              brand,
              expenseCategory: MARKETING_EXPENSE_CATEGORY,
              partnerName,
              lines: [{
                description,
                qty: 1,
                unitPriceHT: item.spendCFA,
                tvaRate: 0, // Pas de TVA sur les dépenses Facebook (hors CI)
              }],
              paid: true,
              paymentMethod,
            })
            updated++
          } else {
            skipped++
          }
        } else {
          // Créer une nouvelle dépense
          addInvoice({
            id: expenseId,
            type: 'expense',
            date: expenseDate,
            brand,
            expenseCategory: MARKETING_EXPENSE_CATEGORY,
            partnerName,
            ref: `FB-${item.platform.toUpperCase()}-${item.year}${String(item.month).padStart(2, '0')}`,
            lines: [{
              description,
              qty: 1,
              unitPriceHT: item.spendCFA,
              tvaRate: 0,
            }],
            paid: true,
            paymentMethod,
          })
          created++
        }
      }

      setLastSync(new Date())

      return {
        success: true,
        created,
        updated,
        skipped,
        total: byPlatformAndMonth.length,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      return {
        success: false,
        created: 0,
        updated: 0,
        skipped: 0,
        total: 0,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [invoices, addInvoice, updateInvoice])

  /**
   * Supprime toutes les dépenses marketing synchronisées
   */
  const clearMarketingExpenses = useCallback(() => {
    const marketingExpenses = getExistingMarketingExpenses()
    let deleted = 0

    for (const expense of marketingExpenses) {
      deleteInvoice(expense.id)
      deleted++
    }

    return deleted
  }, [getExistingMarketingExpenses, deleteInvoice])

  /**
   * Récupère le total des dépenses marketing synchronisées
   */
  const getMarketingExpensesTotal = useCallback(() => {
    const marketingExpenses = getExistingMarketingExpenses()
    return marketingExpenses.reduce((sum, inv) => sum + (inv.totals?.ttc || 0), 0)
  }, [getExistingMarketingExpenses])

  return {
    isLoading,
    error,
    lastSync,
    syncMarketingExpenses,
    clearMarketingExpenses,
    getExistingMarketingExpenses,
    getMarketingExpensesTotal,
  }
}
