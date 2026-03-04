import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { label: 'Accueil', href: '/#accueil' },
  { label: 'Vision', href: '/#vision' },
  { label: 'Marques', href: '/#marques' },
  { label: 'Produits', href: '/produits', route: true },
  { label: 'Contact', href: '/#contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleAnchorClick = (href: string) => {
    setOpen(false)
    if (isHome && href.startsWith('/#')) {
      const el = document.querySelector(href.replace('/', ''))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      aria-label="Navigation principale"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'py-3 bg-tribal-black/70 backdrop-blur-2xl border-b border-white/[0.04]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group" aria-label="Tribal Enterprise — Accueil">
          <img
            src="/logo.png"
            alt="Logo Tribal Enterprise"
            width={36}
            height={36}
            className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) =>
            l.route ? (
              <Link
                key={l.href}
                to={l.href}
                className="relative px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-300 tracking-widest uppercase group"
              >
                {l.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-tribal-accent transition-all duration-300 group-hover:w-4/5" />
              </Link>
            ) : (
              <a
                key={l.href}
                href={isHome ? l.href.replace('/', '') : l.href}
                onClick={() => handleAnchorClick(l.href)}
                className="relative px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-300 tracking-widest uppercase group"
              >
                {l.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-tribal-accent transition-all duration-300 group-hover:w-4/5" />
              </a>
            )
          )}
        </div>

        {/* CTA */}
        <a
          href={isHome ? '#contact' : '/#contact'}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-tribal-accent hover:text-tribal-black hover:border-tribal-accent transition-all duration-400 backdrop-blur-sm"
        >
          Nous Contacter
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
          aria-label="Menu"
        >
          <span className={`w-5 h-[1.5px] bg-white rounded transition-all duration-300 ${open ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
          <span className={`w-5 h-[1.5px] bg-white rounded transition-all duration-300 ${open ? 'opacity-0 scale-0' : ''}`} />
          <span className={`w-5 h-[1.5px] bg-white rounded transition-all duration-300 ${open ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pt-4 pb-6 bg-tribal-black/90 backdrop-blur-2xl border-t border-white/[0.04] space-y-1">
          {links.map((l) =>
            l.route ? (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-medium text-white/50 hover:text-tribal-accent transition-colors tracking-widest uppercase"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={isHome ? l.href.replace('/', '') : l.href}
                onClick={() => handleAnchorClick(l.href)}
                className="block py-3 text-sm font-medium text-white/50 hover:text-tribal-accent transition-colors tracking-widest uppercase"
              >
                {l.label}
              </a>
            )
          )}
          <a
            href={isHome ? '#contact' : '/#contact'}
            onClick={() => setOpen(false)}
            className="block mt-4 text-center py-3 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm"
          >
            Nous Contacter
          </a>
        </div>
      </div>
    </nav>
  )
}
