import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'Accueil', href: '/#accueil' },
  { label: 'Vision', href: '/#vision' },
  { label: 'Marques', href: '/#marques' },
  { label: 'Produits', href: '/produits', route: true },
  { label: 'Contact', href: '/#contact' },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04]" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="group">
            <img
              src="/logotypo.png"
              alt="Tribal Enterprise — Retour a l'accueil"
              width={150}
              height={24}
              className="h-6 object-contain transition-opacity duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Nav */}
          <nav aria-label="Navigation du pied de page" className="flex items-center gap-6 md:gap-8">
            {footerLinks.map((l) =>
              l.route ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className="text-[11px] text-white/25 hover:text-tribal-accent transition-colors duration-300 tracking-[0.15em] uppercase font-medium"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[11px] text-white/25 hover:text-tribal-accent transition-colors duration-300 tracking-[0.15em] uppercase font-medium"
                >
                  {l.label}
                </a>
              )
            )}
          </nav>

          {/* Copyright */}
          <p className="text-[11px] text-white/15 tracking-wider">
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://tribal.enterprises/"
              className="text-white/25 hover:text-tribal-accent transition-colors duration-300"
            >
              Tribal Enterprise SARL
            </a>
            . Tous droits reserves.
          </p>
        </div>
      </div>
    </footer>
  )
}
