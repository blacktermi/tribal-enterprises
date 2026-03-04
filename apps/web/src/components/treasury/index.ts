// Stub: Treasury components barrel — ported from Tribal Ops
// TODO: port full treasury components from tribal-ops

import React from 'react'

export const FEE_TYPE_LABELS: Record<string, string> = {
  BANK_FEE: 'Frais bancaires',
  MOBILE_FEE: 'Frais mobile money',
  TRANSFER_FEE: 'Frais de virement',
  OTHER: 'Autre',
}

export const ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  CREDIT: 'Crédit',
  DEBIT: 'Débit',
  CORRECTION: 'Correction',
}

export function formatCurrency(amount: number, currency = 'XOF'): string {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

// Placeholder components
export function TreasurySummaryCard(props: any) {
  return React.createElement('div', { className: 'p-4 rounded-xl border' }, 'Treasury Summary')
}

export function TransferForm(props: any) {
  return React.createElement('div', null, 'Transfer Form')
}

export function TransferList(props: any) {
  return React.createElement('div', null, 'Transfer List')
}

export function FeeForm(props: any) {
  return React.createElement('div', null, 'Fee Form')
}

export function AdjustmentForm(props: any) {
  return React.createElement('div', null, 'Adjustment Form')
}
