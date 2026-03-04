import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import type { User } from './api'
import {
  Search, RefreshCw, Plus, Smartphone, CheckCircle, Clock, Pause, Trash2, Check,
} from 'lucide-react'

interface License {
  id: string; userId: string; status: string; plan: string; expiresAt: string; createdAt: string
  user: { id: string; name: string; email: string; avatar?: string }
}
interface MyLicense { status: string; plan: string | null; expiresAt: string | null; daysLeft: number }
interface TeamUser { id: string; name: string; email: string; avatar?: string; role: string }

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Actif' },
  TRIAL: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'Essai' },
  EXPIRED: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', label: 'Expire' },
  SUSPENDED: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Suspendu' },
}

function Avatar({ name, src }: { name: string; src?: string }) {
  return src ? <img src={src} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-tribal-accent/10 flex items-center justify-center text-tribal-accent text-xs font-bold shrink-0">{name?.charAt(0) || '?'}</div>
}

// ─── Admin view ──────────────────────────────────────────────────────────────

function AdminLicenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [plan, setPlan] = useState('pro')
  const [days, setDays] = useState(30)
  const [err, setErr] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try { setLoading(true); const { json } = await api('/wam/licenses'); if (json.success) setLicenses(json.data || []) } catch {} finally { setLoading(false) }
  }, [])

  const loadUsers = useCallback(async () => {
    try { setLoadingUsers(true); const { json } = await api('/wam/users-without-license'); if (json.success) setTeamUsers(json.data || []) } catch {} finally { setLoadingUsers(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = licenses.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search) { const s = search.toLowerCase(); return l.user.name.toLowerCase().includes(s) || l.user.email.toLowerCase().includes(s) }
    return true
  })

  const stats = { total: licenses.length, active: licenses.filter(l => l.status === 'ACTIVE').length, trial: licenses.filter(l => l.status === 'TRIAL').length, expired: licenses.filter(l => l.status === 'EXPIRED' || l.status === 'SUSPENDED').length }

  const action = async (id: string, a: string) => {
    if (a === 'delete' && !confirm('Supprimer cette licence ?')) return
    if (a === 'delete') await api(`/wam/licenses/${id}`, { method: 'DELETE' })
    else if (a === 'activate') await api(`/wam/licenses/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE', extendDays: 30 }) })
    else if (a === 'extend') await api(`/wam/licenses/${id}`, { method: 'PATCH', body: JSON.stringify({ extendDays: 30 }) })
    else if (a === 'suspend') await api(`/wam/licenses/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'SUSPENDED' }) })
    load()
  }

  const openModal = () => { setMode('existing'); setSelectedId(''); setUserSearch(''); setForm({ name: '', email: '', password: '' }); setPlan('pro'); setDays(30); setErr(''); setShowModal(true); loadUsers() }

  const create = async () => {
    setErr('')
    if (mode === 'existing') {
      if (!selectedId) { setErr('Selectionnez un membre'); return }
      try { setCreating(true); const { res, json } = await api('/wam/licenses', { method: 'POST', body: JSON.stringify({ userId: selectedId, plan, status: 'ACTIVE', daysValid: days }) }); if (!res.ok || !json.success) { setErr(json.error || 'Erreur'); return }; setShowModal(false); load() } catch { setErr('Erreur reseau') } finally { setCreating(false) }
    } else {
      if (!form.name || !form.email || !form.password) { setErr('Tous les champs sont requis'); return }
      try {
        setCreating(true)
        const { res, json } = await api('/wam/register', { method: 'POST', body: JSON.stringify(form) })
        if (!res.ok || !json.success) { setErr(json.error || 'Erreur'); return }
        if (days !== 7) { const { json: list } = await api('/wam/licenses'); const lic = (list.data || []).find((l: License) => l.user.email === form.email); if (lic) await api(`/wam/licenses/${lic.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE', extendDays: days - 7 }) }) }
        setShowModal(false); load()
      } catch { setErr('Erreur reseau') } finally { setCreating(false) }
    }
  }

  const filteredUsers = teamUsers.filter(u => { if (!userSearch) return true; const s = userSearch.toLowerCase(); return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) })
  const selected = teamUsers.find(u => u.id === selectedId)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const daysLeft = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ v: stats.total, l: 'Total', c: 'text-tribal-accent' }, { v: stats.active, l: 'Actives', c: 'text-emerald-400' }, { v: stats.trial, l: 'Essai', c: 'text-blue-400' }, { v: stats.expired, l: 'Expirees', c: 'text-red-400' }].map(s => (
          <div key={s.l} className="glass rounded-2xl p-5"><p className={`text-3xl font-display font-bold ${s.c}`}>{s.v}</p><p className="text-white/30 text-[12px] font-medium tracking-wider uppercase mt-1">{s.l}</p></div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-tribal-accent/30 placeholder:text-white/20" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm focus:outline-none focus:border-tribal-accent/30">
          <option value="all">Tous</option><option value="ACTIVE">Actif</option><option value="TRIAL">Essai</option><option value="EXPIRED">Expire</option><option value="SUSPENDED">Suspendu</option>
        </select>
        <button onClick={load} className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white transition-colors text-sm"><RefreshCw className="w-4 h-4 mx-auto" /></button>
        <button onClick={openModal} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm hover:bg-tribal-accent-light transition-colors"><Plus className="w-4 h-4" />Nouvelle licence</button>
      </div>

      {/* Table */}
      {loading ? <div className="flex justify-center py-24"><RefreshCw className="w-5 h-5 text-tribal-accent/40 animate-spin" /></div> : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <Smartphone className="w-12 h-12 text-white/10" />
          <p className="text-white/25 text-sm">Aucune licence trouvee</p>
          <button onClick={openModal} className="text-tribal-accent text-sm font-medium hover:underline">Attribuer une premiere licence</button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-white/25 text-[11px] uppercase tracking-wider">
              <th className="text-left px-6 py-4 font-medium">Utilisateur</th><th className="text-left px-4 py-4 font-medium">Plan</th><th className="text-left px-4 py-4 font-medium">Statut</th><th className="text-left px-4 py-4 font-medium">Expiration</th><th className="text-left px-4 py-4 font-medium">Jours</th><th className="text-right px-6 py-4 font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(l => { const d = daysLeft(l.expiresAt); const st = statusStyles[l.status] ?? statusStyles.EXPIRED!; return (
                <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={l.user.name} src={l.user.avatar} /><div><p className="font-medium text-white/80">{l.user.name}</p><p className="text-[12px] text-white/25">{l.user.email}</p></div></div></td>
                  <td className="px-4 py-4"><span className="text-white/50 font-medium text-xs uppercase tracking-wider">{l.plan}</span></td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${st.bg} ${st.text}`}>{st.label}</span></td>
                  <td className="px-4 py-4 text-white/30">{fmtDate(l.expiresAt)}</td>
                  <td className="px-4 py-4"><span className={`font-semibold ${d <= 3 ? 'text-red-400' : d <= 7 ? 'text-amber-400' : 'text-white/50'}`}>{d}j</span></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-end gap-1">
                    {(l.status === 'EXPIRED' || l.status === 'SUSPENDED') && <button onClick={() => action(l.id, 'activate')} title="Activer +30j" className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"><CheckCircle className="w-4 h-4" /></button>}
                    {(l.status === 'ACTIVE' || l.status === 'TRIAL') && <button onClick={() => action(l.id, 'extend')} title="Prolonger +30j" className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><Clock className="w-4 h-4" /></button>}
                    {l.status !== 'SUSPENDED' && <button onClick={() => action(l.id, 'suspend')} title="Suspendre" className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"><Pause className="w-4 h-4" /></button>}
                    <button onClick={() => action(l.id, 'delete')} title="Supprimer" className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div></div>
      )}

      {/* Modal */}
      {showModal && <>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50">
          <div className="glass rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50">
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-display font-bold">Attribuer une licence</h3>
              <p className="text-white/30 text-sm mt-1">Membre existant ou nouveau compte</p>
            </div>
            <div className="flex px-6 gap-1 border-b border-white/[0.04]">
              {(['existing', 'new'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${mode === m ? 'text-tribal-accent border-tribal-accent' : 'text-white/30 border-transparent hover:text-white/50'}`}>
                  {m === 'existing' ? 'Membre existant' : 'Nouveau compte'}
                </button>
              ))}
            </div>
            <div className="px-6 py-5">
              {err && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{err}</div>}
              {mode === 'existing' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-tribal-accent/30 placeholder:text-white/20" placeholder="Rechercher un membre..." />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto rounded-xl border border-white/[0.04] bg-white/[0.02]">
                    {loadingUsers ? <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-tribal-accent/40 animate-spin" /></div> : filteredUsers.length === 0 ? (
                      <p className="text-center py-10 text-white/20 text-sm">{teamUsers.length === 0 ? 'Tous les membres ont deja une licence' : 'Aucun resultat'}</p>
                    ) : (
                      <div className="divide-y divide-white/[0.03]">{filteredUsers.map(u => (
                        <button key={u.id} onClick={() => setSelectedId(u.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selectedId === u.id ? 'bg-tribal-accent/[0.06] border-l-2 border-tribal-accent' : 'hover:bg-white/[0.02] border-l-2 border-transparent'}`}>
                          <Avatar name={u.name} src={u.avatar} />
                          <div className="flex-1 min-w-0"><p className="font-medium text-white/70 text-sm truncate">{u.name}</p><p className="text-[11px] text-white/25 truncate">{u.email}</p></div>
                          <span className="text-[10px] text-white/20 uppercase tracking-wider shrink-0">{u.role}</span>
                          {selectedId === u.id && <Check className="w-4 h-4 text-tribal-accent shrink-0" />}
                        </button>
                      ))}</div>
                    )}
                  </div>
                  {selected && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tribal-accent/[0.06] border border-tribal-accent/20 text-sm"><Check className="w-4 h-4 text-tribal-accent shrink-0" /><span className="text-tribal-accent/80">Selectionne : <strong className="text-tribal-accent">{selected.name}</strong></span></div>}
                </div>
              ) : (
                <div className="space-y-4">
                  {(['Nom complet', 'Email', 'Mot de passe'] as const).map((label, i) => {
                    const key = ['name', 'email', 'password'][i] as keyof typeof form
                    const type = key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'
                    return (
                      <div key={key}>
                        <label className="block text-[11px] font-medium text-white/30 mb-2 uppercase tracking-widest">{label}</label>
                        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-tribal-accent/30 placeholder:text-white/20" />
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/[0.04]">
                <div>
                  <label className="block text-[11px] font-medium text-white/30 mb-2 uppercase tracking-widest">Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-tribal-accent/30"><option value="pro">Pro</option><option value="starter">Starter</option><option value="team">Team</option></select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/30 mb-2 uppercase tracking-widest">Duree (jours)</label>
                  <input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 30)} className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-tribal-accent/30" min="1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.04]">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-white/40 hover:text-white/60 text-sm font-medium transition-colors">Annuler</button>
              <button onClick={create} disabled={creating} className="px-5 py-2.5 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm hover:bg-tribal-accent-light transition-colors disabled:opacity-50">
                {creating ? 'Creation...' : mode === 'existing' ? 'Attribuer la licence' : 'Creer le compte + licence'}
              </button>
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}

// ─── User view (non-admin) ───────────────────────────────────────────────────

function UserLicense() {
  const [license, setLicense] = useState<MyLicense | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/wam/license').then(({ json }) => { if (json.success) setLicense(json.data) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const st = license ? statusStyles[license.status] || statusStyles.EXPIRED : null
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <div className="flex items-center justify-center py-24"><RefreshCw className="w-5 h-5 text-tribal-accent/40 animate-spin" /></div>

  if (!license || !license.plan) return (
    <div className="max-w-2xl mx-auto glass rounded-2xl p-10 text-center">
      <Smartphone className="w-12 h-12 text-white/15 mx-auto mb-6" />
      <h2 className="text-xl font-display font-bold mb-2">Pas de licence WAM</h2>
      <p className="text-white/30 text-sm mb-6">Vous n'avez pas encore de licence WhatsApp Manager.</p>
      <Link to="/produits/whatsapp-manager" className="inline-flex px-6 py-3 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm hover:bg-tribal-accent-light transition-colors">Decouvrir WhatsApp Manager</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto glass rounded-2xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold">WhatsApp Manager</h2>
        {st && <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${st.bg} ${st.text}`}>{st.label}</span>}
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]"><span className="text-white/30 text-sm">Plan</span><span className="text-white/70 font-medium text-sm uppercase tracking-wider">{license.plan}</span></div>
        {license.expiresAt && <div className="flex items-center justify-between py-3 border-b border-white/[0.04]"><span className="text-white/30 text-sm">Expiration</span><span className="text-white/70 text-sm">{formatDate(license.expiresAt)}</span></div>}
        <div className="flex items-center justify-between py-3"><span className="text-white/30 text-sm">Jours restants</span><span className={`font-bold text-lg ${license.daysLeft <= 3 ? 'text-red-400' : license.daysLeft <= 7 ? 'text-amber-400' : 'text-tribal-accent'}`}>{license.daysLeft}j</span></div>
      </div>
      {license.status === 'EXPIRED' && (
        <div className="pt-4 border-t border-white/[0.04]">
          <p className="text-red-400/60 text-sm mb-4">Votre abonnement a expire. Contactez un administrateur pour renouveler.</p>
          <a href="/#contact" className="inline-flex px-5 py-2.5 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm hover:bg-tribal-accent-light transition-colors">Nous contacter</a>
        </div>
      )}
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function OpsLicenses({ user }: { user: User }) {
  const admin = user.role?.toUpperCase() === 'SUPER_ADMIN' || user.role?.toUpperCase() === 'ADMIN'
  return admin ? <AdminLicenses /> : <UserLicense />
}
