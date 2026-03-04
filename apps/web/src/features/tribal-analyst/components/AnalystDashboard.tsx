/**
 * TRIBAL ANALYST - Dashboard Business
 * Vue KPIs, graphiques recharts, synthese complete
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Truck,
  AlertTriangle,
  Target,
  Wallet,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useBusinessInsights, useRefreshAnalystCache } from '../hooks/useTribalAnalyst'

import type { BusinessSnapshot } from '../api/analystApi'

// ─── Couleurs ──────────────────────────────────────────────────────────────────

const BRAND_COLORS: Record<string, string> = {
  tribalprint: '#3B82F6',
  muslimprint: '#10B981',
  jerichoprint: '#F59E0B',
  tribalverra: '#8B5CF6',
  'tribal-print': '#3B82F6',
  'muslim-print': '#10B981',
  'jericho-print': '#F59E0B',
  'tribal-verra': '#8B5CF6',
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4']

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  PROCESSING: 'En cours',
  READY: 'Prete',
  SHIPPED: 'Expediee',
  DELIVERED: 'Livree',
  CANCELLED: 'Annulee',
  REFUNDED: 'Remboursee',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M F`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k F`
  return `${Math.round(amount)} F`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

// ─── Custom Tooltip - Rule 13 ─────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-tribal-gray border border-white/[0.06] rounded-lg shadow-lg p-2.5 text-xs">
      {label && <p className="font-semibold text-white/80 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/40">{p.name}:</span>
          <span className="font-medium text-white">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card - Rule 14 ─────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  change?: number | null
  icon: React.ElementType
  color: string
  bgColor: string
  subtitle?: string
}

function KpiCard({ label, value, change, icon: Icon, color, bgColor, subtitle }: KpiCardProps) {
  return (
    <div className="glass rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-4.5 h-4.5', color)} />
        </div>
        {change !== null && change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
              change >= 0
                ? 'text-emerald-400 bg-emerald-900/20'
                : 'text-red-400 bg-red-900/20'
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
      {subtitle && (
        <div className="text-[10px] text-white/50 mt-0.5">{subtitle}</div>
      )}
    </div>
  )
}

// ─── Section Card - Rule 14 ─────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'glass rounded-2xl overflow-hidden',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function AnalystDashboard() {
  const { data, isLoading, error } = useBusinessInsights()
  const refreshCache = useRefreshAnalystCache()

  const snapshot = data?.snapshot
  const insights = data?.insights || []

  const handleRefresh = async () => {
    await refreshCache.mutateAsync()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-3 text-tribal-accent animate-spin" />
          <p className="text-sm text-white/40">
            Chargement du dashboard business...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm text-white/60 mb-2">
            Erreur lors du chargement des donnees
          </p>
          <p className="text-xs text-white/40 mb-4">
            {(error as Error).message}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-xs rounded-lg bg-tribal-accent text-tribal-black font-semibold hover:bg-tribal-accent-light transition-colors"
          >
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  if (!snapshot) return null

  return (
    <DashboardContent
      snapshot={snapshot}
      insights={insights}
      onRefresh={handleRefresh}
      isRefreshing={refreshCache.isPending}
    />
  )
}

// ─── Dashboard Content ─────────────────────────────────────────────────────────

function DashboardContent({
  snapshot,
  insights,
  onRefresh,
  isRefreshing,
}: {
  snapshot: BusinessSnapshot
  insights: Array<{
    type: string
    severity: string
    title: string
    description: string
    value?: string | number
    change?: number
  }>
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const { orders, accounting, customers, products, marketing, treasury, delivery, collaborators } =
    snapshot

  // ─── Calculated values ──────────────────────────────────────────────────
  const revenueChange = pctChange(accounting.currentMonth.revenue, accounting.previousMonth.revenue)
  const ordersChange = pctChange(orders.currentMonth.count, orders.previousMonth.count)
  const customersChange = pctChange(customers.newThisMonth, customers.newPreviousMonth)
  const profitChange = pctChange(accounting.currentMonth.profit, accounting.previousMonth.profit)
  const marketingSpendChange = pctChange(marketing.currentMonthSpend, marketing.previousMonthSpend)

  // ─── Chart data ─────────────────────────────────────────────────────────

  const brandRevenueData = useMemo(
    () =>
      orders.byBrand.map(b => ({
        name: b.brand.replace(/(tribal|muslim|jericho)(print|verra)/i, '$1 $2'),
        CA: b.revenue,
        Commandes: b.count,
        fill: BRAND_COLORS[b.brand.toLowerCase()] || PIE_COLORS[0],
      })),
    [orders.byBrand]
  )

  const statusData = useMemo(
    () =>
      Object.entries(orders.byStatus)
        .filter(([, v]) => v > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status] || status,
          value: count,
        })),
    [orders.byStatus]
  )

  const expenseData = useMemo(
    () =>
      accounting.expensesByCategory
        .filter(e => e.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8)
        .map(e => ({
          name: e.category.length > 15 ? e.category.slice(0, 14) + '...' : e.category,
          Montant: e.amount,
        })),
    [accounting.expensesByCategory]
  )

  const marketingBrandData = useMemo(
    () =>
      marketing.byBrand.map(b => ({
        name: b.brand.replace(/(tribal|muslim|jericho)(print|verra)/i, '$1 $2'),
        Depenses: b.spend,
        ROAS: b.roas,
        fill: BRAND_COLORS[b.brand.toLowerCase()] || PIE_COLORS[0],
      })),
    [marketing.byBrand]
  )

  const cityData = useMemo(
    () =>
      customers.byCity
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(c => ({ name: c.city || 'Inconnue', Clients: c.count })),
    [customers.byCity]
  )

  const highInsights = insights.filter(i => i.severity === 'high')

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-white">Dashboard Business</h1>
            <p className="text-xs text-white/40 mt-0.5">
              Periode : {snapshot.period.currentMonth} {snapshot.period.year} · Mis a jour{' '}
              {new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-white/60 hover:border-tribal-accent/40 hover:text-tribal-accent transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            Actualiser
          </button>
        </div>

        {/* Alertes urgentes */}
        {highInsights.length > 0 && (
          <div className="space-y-2">
            {highInsights.slice(0, 3).map((ins, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-red-300">
                    {ins.title}
                  </span>
                  <span className="text-[11px] text-red-400/70 ml-2">
                    {ins.description.slice(0, 80)}
                    {ins.description.length > 80 ? '...' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI Grid - ligne 1 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            label="CA ce mois"
            value={formatCurrency(accounting.currentMonth.revenue)}
            change={revenueChange}
            icon={DollarSign}
            color="text-emerald-500"
            bgColor="bg-emerald-900/20"
            subtitle={`YTD: ${formatCurrency(accounting.yearToDate.revenue)}`}
          />
          <KpiCard
            label="Commandes ce mois"
            value={String(orders.currentMonth.count)}
            change={ordersChange}
            icon={ShoppingCart}
            color="text-blue-500"
            bgColor="bg-blue-900/20"
            subtitle={`Total: ${formatNumber(orders.total)}`}
          />
          <KpiCard
            label="Benefice"
            value={formatCurrency(accounting.currentMonth.profit)}
            change={profitChange}
            icon={accounting.currentMonth.profit >= 0 ? TrendingUp : TrendingDown}
            color={accounting.currentMonth.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}
            bgColor={
              accounting.currentMonth.profit >= 0
                ? 'bg-emerald-900/20'
                : 'bg-red-900/20'
            }
            subtitle={`Marge: ${
              accounting.currentMonth.revenue > 0
                ? Math.round(
                    (accounting.currentMonth.profit / accounting.currentMonth.revenue) * 100
                  )
                : 0
            }%`}
          />
          <KpiCard
            label="Nouveaux clients"
            value={String(customers.newThisMonth)}
            change={customersChange}
            icon={Users}
            color="text-violet-500"
            bgColor="bg-violet-900/20"
            subtitle={`Total: ${formatNumber(customers.total)}`}
          />
          <KpiCard
            label="Depenses marketing"
            value={formatCurrency(marketing.currentMonthSpend)}
            change={marketingSpendChange}
            icon={Target}
            color="text-amber-500"
            bgColor="bg-amber-900/20"
          />
        </div>

        {/* KPI Grid - ligne 2 : mini KPIs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <MiniKpiCard label="Panier moyen" value={formatCurrency(orders.averageOrderValue)} />
          <MiniKpiCard
            label="Impayes"
            value={String(accounting.unpaidInvoices.count)}
            alert={accounting.unpaidInvoices.count > 0}
          />
          <MiniKpiCard
            label="Masse salariale"
            value={formatCurrency(collaborators.totalSalaryMass)}
          />
          <MiniKpiCard label="Tresorerie" value={formatCurrency(treasury.totalBalance)} />
          <MiniKpiCard
            label="Livraison"
            value={`${delivery.successRate}%`}
            alert={delivery.successRate < 85}
          />
          <MiniKpiCard
            label="Collaborateurs"
            value={`${collaborators.active}/${collaborators.total}`}
          />
        </div>

        {/* Graphiques ligne 1 - Rule 13 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Chiffre d'affaires par marque">
            {brandRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={brandRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="CA" radius={[6, 6, 0, 0]}>
                    {brandRevenueData.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (<EmptyChart message="Aucune donnee de CA par marque" />)}
          </SectionCard>

          <SectionCard title="Repartition des commandes par statut">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                    {statusData.map((_entry, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px' }} formatter={v => <span className="text-white/60">{v}</span>} />
                  <Tooltip formatter={(value: number, name: string) => [`${value} commande${value > 1 ? 's' : ''}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (<EmptyChart message="Aucune donnee de statut" />)}
          </SectionCard>
        </div>

        {/* Graphiques ligne 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Top depenses par categorie">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Montant" fill="#EF4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<EmptyChart message="Aucune depense ce mois" />)}
          </SectionCard>

          <SectionCard title="Marketing par marque">
            {marketingBrandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={marketingBrandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Depenses" radius={[6, 6, 0, 0]}>
                    {marketingBrandData.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (<EmptyChart message="Aucune depense marketing" />)}
          </SectionCard>
        </div>

        {/* Graphique villes + Top produits + Top clients */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Clients par ville">
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="Clients" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<EmptyChart message="Aucune donnee ville" />)}
          </SectionCard>

          <SectionCard title="Top produits">
            <div className="space-y-2">
              {orders.topProducts.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-white/40 w-4">#{i + 1}</span>
                    <span className="text-xs text-white/80 truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-white">{formatCurrency(p.revenue)}</span>
                    <span className="text-[10px] text-white/50 ml-1">({p.count})</span>
                  </div>
                </div>
              ))}
              {orders.topProducts.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4">Aucun produit</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Top clients">
            <div className="space-y-2">
              {customers.topCustomers.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-white/40 w-4">#{i + 1}</span>
                    <span className="text-xs text-white/80 truncate">{c.name || c.email}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-white">{formatCurrency(c.totalSpent)}</span>
                    <span className="text-[10px] text-white/50 ml-1">({c.totalOrders} cmd)</span>
                  </div>
                </div>
              ))}
              {customers.topCustomers.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4">Aucun client</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Tresorerie + Livraison + Impayes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SectionCard title="Tresorerie">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-900/20">
                <span className="text-xs font-medium text-white/60">Solde total</span>
                <span className="text-sm font-bold text-tribal-accent">{formatCurrency(treasury.totalBalance)}</span>
              </div>
              {treasury.accounts.map((acc, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs',
                  acc.belowThreshold ? 'bg-red-900/20 border border-red-800/40' : 'bg-white/[0.03]'
                )}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wallet className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="text-white/60 truncate">{acc.name}</span>
                    {acc.belowThreshold && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                  </div>
                  <span className={cn('font-semibold shrink-0', acc.belowThreshold ? 'text-red-400' : 'text-white')}>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Livraison">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Reussies" value={String(delivery.successfulDeliveries)} color="text-emerald-400" />
                <MiniStat label="Echouees" value={String(delivery.failedDeliveries)} color="text-red-400" />
                <MiniStat label="Taux" value={`${delivery.successRate}%`} color={delivery.successRate >= 85 ? 'text-emerald-400' : 'text-red-400'} />
              </div>
              {delivery.drivers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Livreurs</span>
                  {delivery.drivers.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Truck className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="text-white/60 truncate">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/50">{d.deliveries} liv.</span>
                        <span className={cn('font-medium', d.successRate >= 85 ? 'text-emerald-500' : 'text-red-500')}>{d.successRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {delivery.pendingSettlements > 0 && (
                <div className="text-[11px] text-amber-400 bg-amber-900/20 rounded-lg px-3 py-1.5">
                  {delivery.pendingSettlements} reglement(s) en attente
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Impayes & Effectifs">
            <div className="space-y-3">
              {(accounting.unpaidInvoices.count > 0 || accounting.unpaidExpenses.count > 0) && (
                <div className="space-y-1.5">
                  {accounting.unpaidInvoices.count > 0 && (
                    <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-amber-900/20">
                      <span className="text-amber-300">{accounting.unpaidInvoices.count} facture(s) impayee(s)</span>
                      <span className="font-semibold text-amber-300">{formatCurrency(accounting.unpaidInvoices.totalTTC)}</span>
                    </div>
                  )}
                  {accounting.unpaidExpenses.count > 0 && (
                    <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-orange-900/20">
                      <span className="text-orange-300">{accounting.unpaidExpenses.count} depense(s) non reglee(s)</span>
                      <span className="font-semibold text-orange-300">{formatCurrency(accounting.unpaidExpenses.totalTTC)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Effectifs</span>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Collaborateurs" value={`${collaborators.active}/${collaborators.total}`} color="text-white" />
                  <MiniStat label="Masse salariale" value={formatCurrency(collaborators.totalSalaryMass)} color="text-white" />
                </div>
                {collaborators.byType.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {collaborators.byType.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/60">{t.type}: {t.count}</span>
                    ))}
                  </div>
                )}
              </div>
              {products.byCategory.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Produits ({products.total})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {products.byCategory.slice(0, 6).map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/20 text-blue-300 border border-blue-800/40">{c.category}: {c.count}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Campagnes marketing */}
        {marketing.topCampaigns.length > 0 && (
          <SectionCard title="Top campagnes marketing">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-white/40">
                    <th className="pb-2 font-medium">Campagne</th>
                    <th className="pb-2 font-medium text-right">Depenses</th>
                    <th className="pb-2 font-medium text-right">Impressions</th>
                    <th className="pb-2 font-medium text-right">Clics</th>
                    <th className="pb-2 font-medium text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {marketing.topCampaigns.slice(0, 8).map((c, i) => (
                    <tr key={i} className="text-white/80">
                      <td className="py-1.5 pr-4 max-w-[200px] truncate">{c.name}</td>
                      <td className="py-1.5 text-right font-medium">{formatCurrency(c.spend)}</td>
                      <td className="py-1.5 text-right">{formatNumber(c.impressions)}</td>
                      <td className="py-1.5 text-right">{formatNumber(c.clicks)}</td>
                      <td className={cn('py-1.5 text-right font-semibold', c.roas >= 2 ? 'text-emerald-500' : c.roas >= 1 ? 'text-amber-500' : 'text-red-500')}>
                        {c.roas.toFixed(1)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}

// ─── Mini components ───────────────────────────────────────────────────────────

function MiniKpiCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={cn(
      'rounded-lg p-2.5 text-center border',
      alert ? 'border-amber-800/40 bg-amber-900/20' : 'border-white/[0.06] bg-white/[0.03]'
    )}>
      <div className={cn('text-sm font-bold', alert ? 'text-amber-400' : 'text-white')}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/[0.03]">
      <div className={cn('text-sm font-bold', color)}>{value}</div>
      <div className="text-[9px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <div className="text-center">
        <Package className="w-8 h-8 mx-auto mb-2 text-white/30" />
        <p className="text-xs text-white/40">{message}</p>
      </div>
    </div>
  )
}
