import { useInView } from '@/hooks/useInView'
import type { ReactNode } from 'react'

/* ── Data ─────────────────────────────────────────────── */

const tribalPrint = {
  name: 'Tribal Print',
  slogan: 'Imprimez vos souvenirs, sublimez vos moments',
  desc: "Notre branche principale. Impression professionnelle de photos, tableaux canvas, mugs, t-shirts et objets personnalises. Qualite premium, livraison rapide partout en Cote d'Ivoire.",
  icon: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12z" />
    </svg>
  ),
  accent: '#14B8A6',
  url: 'https://tribalprint.ci',
}

const subBrands = [
  {
    name: 'Jericho Print',
    slogan: 'Affiches & Tableaux bibliques modernes',
    desc: "Decoration chretienne personnalisee. Affiches, posters et tableaux inspires par la Bible.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    accent: '#92612E',
    tag: 'Chretien',
    url: 'https://jerichoprint.ci',
  },
  {
    name: 'Muslim Print',
    slogan: 'Art Islamique & Decoration Murale Elegante',
    desc: "Tableaux islamiques, calligraphies arabes et decorations murales modernes.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    ),
    accent: '#D4AF37',
    tag: 'Islamique',
    url: 'https://muslimprint.ci',
  },
]

const tribalVerra = {
  name: 'Tribal Verra',
  slogan: 'Miroirs design & menuiserie aluminium',
  desc: "Miroirs LED retroeclaires, miroirs avec cadre aluminium et velours. Design moderne, qualite premium, livraison a Abidjan.",
  icon: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  accent: '#14B8A6',
  url: 'https://tribalverra.ci',
}

const otherBranches = [
  {
    name: 'Tribal Agency Africa',
    slogan: 'Agence digitale pour votre presence en ligne',
    desc: "Agence de communication digitale. Branding, creation de sites web sur mesure en React + TypeScript, strategie publicitaire et identite visuelle.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    accent: '#8B5CF6',
    tag: 'Agence',
    url: 'https://tribalagency.africa',
  },
  {
    name: 'Kaui',
    slogan: 'Gestion de livraisons SaaS',
    desc: "Plateforme SaaS de gestion de livraisons. Suivi de commandes, affectation de coursiers, paiements et logistique automatisee.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    accent: '#3B82F6',
    tag: 'SaaS',
    url: 'https://kaui.app',
  },
]

/* ── Shared card renderer ─────────────────────────────── */

function BranchCard({
  name, slogan, desc, icon, accent, url, tag, delay, className = '',
}: {
  name: string
  slogan: string
  desc: string
  icon: ReactNode
  accent: string
  url: string | null
  tag?: string
  delay: number
  className?: string
}) {
  const { ref, isInView } = useInView(0.1)
  const Wrapper = url ? 'a' : 'div'
  const linkProps = url
    ? { href: url, target: '_blank' as const, rel: 'noopener noreferrer', 'aria-label': `Visiter ${name} — ${slogan}` }
    : {}

  return (
    <Wrapper
      ref={ref as never}
      {...linkProps}
      className={`group relative glass glass-hover rounded-2xl overflow-hidden block ${
        url ? 'cursor-pointer' : 'cursor-default'
      } ${isInView ? 'animate-scale-up' : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(500px circle at 50% 0%, ${accent}0D, transparent 70%)` }}
      />

      {/* Tag */}
      {tag && (
        <span
          className="relative inline-block text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-lg mb-5"
          style={{ color: accent, backgroundColor: `${accent}12` }}
        >
          {tag}
        </span>
      )}

      {/* Icon */}
      <div
        className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
        style={{ backgroundColor: `${accent}10`, color: accent }}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="relative font-display font-bold text-[17px] mb-1 transition-colors duration-300 group-hover:text-white">
        {name}
      </h3>
      <p className="relative text-[11px] font-medium mb-3 italic" style={{ color: `${accent}90` }}>
        {slogan}
      </p>
      <p className="relative text-[13px] text-white/35 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
        {desc}
      </p>

      {/* Link */}
      <div
        className="relative mt-5 flex items-center gap-2 text-[11px] font-semibold tracking-wide opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400"
        style={{ color: accent }}
      >
        {url ? (
          <>
            Visiter le site
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </>
        ) : (
          <span className="text-white/20">Bientot disponible</span>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }}
      />
    </Wrapper>
  )
}

/* ── Section ──────────────────────────────────────────── */

export function Branches() {
  const { ref, isInView } = useInView(0.05)

  return (
    <section id="marques" className="relative py-24 md:py-36 kente-lines">
      <div className="divider-glow" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span
            className={`inline-block text-tribal-accent text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
              isInView ? 'animate-fade-up' : 'opacity-0'
            }`}
          >
            Notre Ecosysteme
          </span>
          <h2
            className={`text-3xl md:text-4xl lg:text-[3.2rem] font-display font-bold leading-[1.1] mb-6 ${
              isInView ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
            }`}
          >
            Trois branches,
            <br />
            <span className="text-tribal-accent">une seule ambition.</span>
          </h2>
          <p
            className={`text-white/40 text-[15px] md:text-base max-w-lg mx-auto leading-relaxed ${
              isInView ? 'animate-fade-up [animation-delay:200ms]' : 'opacity-0'
            }`}
          >
            Print, Digital et SaaS — chaque branche de Tribal Enterprise
            repond a un besoin specifique pour construire l'Afrique de demain.
          </p>
        </div>

        {/* ━━━ 1. TRIBAL PRINT — Hero card ━━━ */}
        <div className="mb-5">
          <a
            href={tribalPrint.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visiter Tribal Print — Impression professionnelle"
            className={`group relative glass glass-hover rounded-3xl p-8 md:p-10 overflow-hidden block cursor-pointer ${
              isInView ? 'animate-scale-up [animation-delay:200ms]' : 'opacity-0'
            }`}
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(800px circle at 30% 50%, ${tribalPrint.accent}0D, transparent 60%)` }} />
            {/* Accent border top */}
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tribalPrint.accent}50, transparent)` }} />

            <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              {/* Icon large */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundColor: `${tribalPrint.accent}12`, color: tribalPrint.accent }}
              >
                {tribalPrint.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-lg"
                    style={{ color: tribalPrint.accent, backgroundColor: `${tribalPrint.accent}12` }}
                  >
                    Branche principale
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl mb-1 group-hover:text-white transition-colors">
                  {tribalPrint.name}
                </h3>
                <p className="text-[12px] font-medium italic mb-3" style={{ color: `${tribalPrint.accent}90` }}>
                  {tribalPrint.slogan}
                </p>
                <p className="text-[14px] text-white/40 leading-relaxed max-w-2xl group-hover:text-white/60 transition-colors">
                  {tribalPrint.desc}
                </p>
              </div>

              {/* CTA */}
              <div className="shrink-0 flex items-center gap-2 text-[12px] font-semibold opacity-60 group-hover:opacity-100 transition-all" style={{ color: tribalPrint.accent }}>
                tribalprint.ci
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* ━━━ 2. Sub-brands — derived from Tribal Print ━━━ */}
        <div className="mb-5">
          <p
            className={`text-[11px] text-white/20 tracking-[0.2em] uppercase font-medium mb-4 pl-1 ${
              isInView ? 'animate-fade-up [animation-delay:400ms]' : 'opacity-0'
            }`}
          >
            Marques derivees de Tribal Print
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {subBrands.map((b, i) => (
              <BranchCard
                key={b.name}
                {...b}
                delay={450 + i * 80}
                className="p-6"
              />
            ))}
          </div>
        </div>

        {/* ━━━ 3. TRIBAL VERRA — standalone ━━━ */}
        <div className="mb-5 mt-10">
          <p
            className={`text-[11px] text-white/20 tracking-[0.2em] uppercase font-medium mb-4 pl-1 ${
              isInView ? 'animate-fade-up [animation-delay:600ms]' : 'opacity-0'
            }`}
          >
            Miroirs & Menuiserie
          </p>
          <a
            href={tribalVerra.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visiter Tribal Verra — Miroirs design et menuiserie aluminium"
            className={`group relative glass glass-hover rounded-3xl p-8 md:p-10 overflow-hidden block cursor-pointer ${
              isInView ? 'animate-scale-up [animation-delay:650ms]' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(800px circle at 30% 50%, ${tribalVerra.accent}0D, transparent 60%)` }} />
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tribalVerra.accent}50, transparent)` }} />

            <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundColor: `${tribalVerra.accent}12`, color: tribalVerra.accent }}
              >
                {tribalVerra.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-lg"
                    style={{ color: tribalVerra.accent, backgroundColor: `${tribalVerra.accent}12` }}
                  >
                    Miroirs
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl mb-1 group-hover:text-white transition-colors">
                  {tribalVerra.name}
                </h3>
                <p className="text-[12px] font-medium italic mb-3" style={{ color: `${tribalVerra.accent}90` }}>
                  {tribalVerra.slogan}
                </p>
                <p className="text-[14px] text-white/40 leading-relaxed max-w-2xl group-hover:text-white/60 transition-colors">
                  {tribalVerra.desc}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-[12px] font-semibold opacity-60 group-hover:opacity-100 transition-all" style={{ color: tribalVerra.accent }}>
                tribalverra.ci
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* ━━━ 4. Agency + Kaui ━━━ */}
        <div className="mt-10">
          <p
            className={`text-[11px] text-white/20 tracking-[0.2em] uppercase font-medium mb-4 pl-1 ${
              isInView ? 'animate-fade-up [animation-delay:800ms]' : 'opacity-0'
            }`}
          >
            Digital & SaaS
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {otherBranches.map((b, i) => (
              <BranchCard
                key={b.name}
                {...b}
                delay={850 + i * 100}
                className="p-7"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
