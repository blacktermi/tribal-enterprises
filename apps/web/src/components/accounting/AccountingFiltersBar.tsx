import React from 'react'
import { Calendar, ChevronDown, Store } from 'lucide-react'
import {
  useAccountingFilters,
  AVAILABLE_YEARS,
  AVAILABLE_MONTHS,
  PERIOD_OPTIONS,
  PLATFORM_OPTIONS,
  getYearLabel,
} from '../../store/accountingFilters'

interface AccountingFiltersBarProps {
  title?: string
  subtitle?: string
}

export const AccountingFiltersBar: React.FC<AccountingFiltersBarProps> = ({
  title = 'Comptabilité',
  subtitle,
}) => {
  const {
    selectedYear,
    selectedPeriod,
    selectedMonth,
    selectedPlatform,
    setSelectedYear,
    setSelectedPeriod,
    setSelectedMonth,
    setSelectedPlatform,
  } = useAccountingFilters()

  const getPeriodLabel = () => {
    if (selectedYear === null) {
      return 'Toutes les années'
    }
    switch (selectedPeriod) {
      case 'all':
        return 'Toutes les données'
      case 'year':
        return `Année ${selectedYear}`
      case 'quarter':
        return `Trimestre en cours ${selectedYear}`
      case 'month': {
        const monthIndex = selectedMonth ?? new Date().getMonth()
        const monthName = AVAILABLE_MONTHS[monthIndex]?.label || ''
        return `${monthName} ${selectedYear}`
      }
      case 'week':
        return 'Cette semaine'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl glass text-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">
            {title} {selectedYear}
          </h2>
          <p className="text-white/60 text-sm">{subtitle || getPeriodLabel()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Sélecteur de plateforme */}
        <div className="relative">
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
            className="appearance-none pl-8 pr-8 py-2 rounded-lg bg-white/[0.04] text-white border border-white/[0.08] focus:outline-none focus:border-tribal-accent/40 text-sm font-medium cursor-pointer"
          >
            {PLATFORM_OPTIONS.map(({ value, label, emoji }) => (
              <option key={value} value={value} className="text-gray-900">
                {emoji} {label}
              </option>
            ))}
          </select>
          <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
        </div>

        {/* Sélecteur d'année */}
        <div className="relative">
          <select
            value={selectedYear ?? 'all'}
            onChange={e =>
              setSelectedYear(e.target.value === 'all' ? null : Number(e.target.value))
            }
            className="appearance-none px-4 py-2 pr-8 rounded-lg bg-white/[0.04] text-white border border-white/[0.08] focus:outline-none focus:border-tribal-accent/40 text-sm font-medium cursor-pointer"
          >
            {AVAILABLE_YEARS.map(year => (
              <option key={year ?? 'all'} value={year ?? 'all'} className="text-gray-900">
                {getYearLabel(year)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
        </div>

        {/* Sélecteur de mois (visible uniquement si période = mois) */}
        {selectedPeriod === 'month' && (
          <div className="relative">
            <select
              value={selectedMonth ?? new Date().getMonth()}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="appearance-none px-4 py-2 pr-8 rounded-lg bg-white/[0.04] text-white border border-white/[0.08] focus:outline-none focus:border-tribal-accent/40 text-sm font-medium cursor-pointer"
            >
              {AVAILABLE_MONTHS.map(({ value, label }) => (
                <option key={value} value={value} className="text-gray-900">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        )}

        {/* Sélecteur de période */}
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                selectedPeriod === key
                  ? 'bg-tribal-accent text-tribal-black'
                  : 'text-white/80 hover:bg-white/[0.06]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Composant compact pour les pages avec moins d'espace
export const AccountingFiltersCompact: React.FC = () => {
  const {
    selectedYear,
    selectedPeriod,
    selectedMonth,
    selectedPlatform,
    setSelectedYear,
    setSelectedPeriod,
    setSelectedMonth,
    setSelectedPlatform,
  } = useAccountingFilters()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sélecteur de plateforme */}
      <select
        value={selectedPlatform}
        onChange={e => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium focus:outline-none focus:border-tribal-accent/40"
      >
        {PLATFORM_OPTIONS.map(({ value, label, emoji }) => (
          <option key={value} value={value} className="text-gray-900">
            {emoji} {label}
          </option>
        ))}
      </select>

      {/* Sélecteur d'année */}
      <select
        value={selectedYear ?? 'all'}
        onChange={e => setSelectedYear(e.target.value === 'all' ? null : Number(e.target.value))}
        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium focus:outline-none focus:border-tribal-accent/40"
      >
        {AVAILABLE_YEARS.map(year => (
          <option key={year ?? 'all'} value={year ?? 'all'} className="text-gray-900">
            {getYearLabel(year)}
          </option>
        ))}
      </select>

      {/* Sélecteur de mois (visible uniquement si période = mois) */}
      {selectedPeriod === 'month' && (
        <select
          value={selectedMonth ?? new Date().getMonth()}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium focus:outline-none focus:border-tribal-accent/40"
        >
          {AVAILABLE_MONTHS.map(({ value, label }) => (
            <option key={value} value={value} className="text-gray-900">
              {label}
            </option>
          ))}
        </select>
      )}

      {/* Sélecteur de période */}
      <div className="flex gap-0.5 p-0.5 bg-white/[0.04] rounded-lg">
        {PERIOD_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedPeriod(key)}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              selectedPeriod === key
                ? 'bg-white/[0.06] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
