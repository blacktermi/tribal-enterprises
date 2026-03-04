import { useState, useEffect, lazy, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import { api, isAdmin } from './api'
import type { User } from './api'
import {
  Smartphone, Megaphone, Calculator, Sparkles, Brain, MessageSquare,
  LogOut, Menu, ChevronLeft,
} from 'lucide-react'

// Lazy-load sub-pages
const OpsLicenses = lazy(() => import('./OpsLicenses'))
const OpsMarketing = lazy(() => import('./OpsMarketing'))
const OpsAccounting = lazy(() => import('./OpsAccounting'))
const OpsStudio = lazy(() => import('./OpsStudio'))
const OpsAnalyst = lazy(() => import('./OpsAnalyst'))
const OpsLlm = lazy(() => import('./OpsLlm'))

// ─── Navigation config ──────────────────────────────────────────────────────

type PageId = 'licenses' | 'marketing' | 'accounting' | 'studio' | 'analyst' | 'llm'

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Smartphone; adminOnly?: boolean; color: string }[] = [
  { id: 'licenses', label: 'WAM Licences', icon: Smartphone, adminOnly: true, color: 'text-emerald-400' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-purple-400' },
  { id: 'accounting', label: 'Comptabilite', icon: Calculator, color: 'text-cyan-400' },
  { id: 'studio', label: 'Tribal Studio', icon: Sparkles, color: 'text-amber-400' },
  { id: 'analyst', label: 'Tribal Analyst', icon: Brain, color: 'text-blue-400' },
  { id: 'llm', label: 'Tribal LLM', icon: MessageSquare, color: 'text-violet-400' },
]

// ─── Login Screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email et mot de passe requis'); return }
    try {
      setLoading(true)
      const { res, json } = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok || !json.success) {
        const msg = json.error || json.message || 'Identifiants incorrects'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
        return
      }
      const { json: meJson } = await api('/wam/me')
      const user = meJson.success && meJson.data ? meJson.data : (json.data?.user || json.user)
      if (!user) { setError('Reponse serveur invalide'); return }
      onLogin(user)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-tribal-accent/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-tribal-accent/[0.02] rounded-full blur-[100px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block">
            <img src="/logotypo.png" alt="Tribal Enterprise" className="h-6 mx-auto opacity-60 hover:opacity-100 transition-opacity" />
          </Link>
          <div className="mt-6">
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-tribal-accent/60">Espace membre</span>
          </div>
          <h1 className="text-2xl font-display font-bold mt-2">Ops Console</h1>
          <p className="text-white/30 text-sm mt-2">Connectez-vous avec votre compte Tribal Ops</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-2 uppercase tracking-widest">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 transition-colors placeholder:text-white/20" placeholder="votre@email.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-2 uppercase tracking-widest">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 transition-colors placeholder:text-white/20" placeholder="Votre mot de passe" autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm hover:bg-tribal-accent-light transition-colors disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-white/15 text-[11px] mt-8">&copy; {new Date().getFullYear()} Tribal Enterprise SARL</p>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ user, page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }: {
  user: User; page: PageId; setPage: (p: PageId) => void
  collapsed: boolean; setCollapsed: (v: boolean) => void
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void
  onLogout: () => void
}) {
  const admin = isAdmin(user.role)
  const items = NAV_ITEMS.filter(i => !i.adminOnly || admin)

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.04] shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <Link to="/" onClick={() => setMobileOpen(false)}>
          <img src="/logo.png" alt="Tribal" className="w-8 h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-tribal-accent/60">Ops</span>
            <p className="text-sm font-display font-bold leading-none truncate">Console</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.map(item => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setMobileOpen(false) }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all text-sm font-medium ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'} ${
                active
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? item.color : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-white/[0.04] px-3 py-3 shrink-0 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-tribal-accent/10 flex items-center justify-center text-tribal-accent text-xs font-bold shrink-0">{user.name?.charAt(0) || '?'}</div>
          }
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/60 truncate">{user.name}</p>
              <p className="text-[10px] text-white/25 truncate">{user.email}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} title="Deconnexion" className={`flex items-center gap-2 text-white/25 hover:text-red-400 transition-colors ${collapsed ? 'p-2' : 'mt-2 px-1 py-1.5 w-full'}`}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[11px] font-medium uppercase tracking-wider">Deconnexion</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen border-r border-white/[0.04] bg-tribal-black/90 backdrop-blur-2xl z-40 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        {nav}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-tribal-black border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 left-0 h-screen w-[260px] border-r border-white/[0.04] bg-tribal-black z-50 lg:hidden">
            {nav}
          </aside>
        </>
      )}
    </>
  )
}

// ─── Error Boundary ─────────────────────────────────────────────────────────

class PageErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[OpsPage] Error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-white/80 mb-2">Erreur de chargement</h3>
          <p className="text-sm text-white/40 max-w-md mb-4">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white transition-colors">
            Reessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Loading fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <svg className="w-6 h-6 text-tribal-accent/40 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
      </svg>
    </div>
  )
}

// ─── Main OpsPage ────────────────────────────────────────────────────────────

export function OpsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState<PageId>('marketing')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    api('/wam/me')
      .then(({ json }) => {
        if (json.success && json.data) {
          setUser(json.data)
          // Admin default: licenses, sinon marketing
          if (isAdmin(json.data.role)) setPage('licenses')
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleLogout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/30">
        <svg className="w-5 h-5 text-tribal-accent/40 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        <span className="text-sm">Verification...</span>
      </div>
    </div>
  )

  if (!user) return <div className="grain"><LoginScreen onLogin={u => { setUser(u); if (isAdmin(u.role)) setPage('licenses'); else setPage('marketing') }} /></div>

  const admin = isAdmin(user.role)

  return (
    <div className="grain min-h-screen bg-tribal-black text-white">
      <Sidebar
        user={user} page={page} setPage={setPage}
        collapsed={collapsed} setCollapsed={setCollapsed}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <div className={`min-h-screen transition-all duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]'}`}>
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-white/[0.04] bg-tribal-black/80 backdrop-blur-2xl">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-display font-bold">{NAV_ITEMS.find(i => i.id === page)?.label}</span>
          <button onClick={handleLogout} className="p-2 -mr-2 text-white/30 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {page === 'licenses' && admin && <OpsLicenses user={user} />}
              {page === 'marketing' && <OpsMarketing />}
              {page === 'accounting' && <OpsAccounting />}
              {page === 'studio' && <OpsStudio />}
              {page === 'analyst' && <OpsAnalyst />}
              {page === 'llm' && <OpsLlm />}
            </Suspense>
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  )
}
