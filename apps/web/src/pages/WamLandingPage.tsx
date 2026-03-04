import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useInView } from '@/hooks/useInView'

const ACCENT = '#25D366'
const ACCENT_DIM = '#25D36620'

/* ── Download links (placeholders — update with real URLs) ── */
const downloads = [
  {
    platform: 'macOS Apple Silicon',
    arch: 'ARM64 — M1, M2, M3, M4',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    href: '#',
    primary: true,
  },
  {
    platform: 'macOS Intel',
    arch: 'x64 — Mac Intel (2015-2020)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    href: '#',
    primary: false,
  },
  {
    platform: 'Windows',
    arch: 'x64 — Windows 10/11',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.5l-8-1.25V12.5zM11.5 5.38l9.5-1.63V12h-9.5V5.38zM11.5 12.5H21v7.75l-9.5-1.63V12.5z" />
      </svg>
    ),
    href: '#',
    primary: false,
  },
]

const features = [
  {
    title: 'Multi-comptes WhatsApp',
    desc: 'Gerez 2, 5, 10 comptes WhatsApp dans une seule fenetre. Chaque compte est isole avec sa propre session.',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    title: 'Reponses automatiques',
    desc: "Configurez des regles par mot-cle pour chaque compte. Le delai est humanise pour eviter la detection de bot.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: 'IA integree',
    desc: "Intelligence artificielle pour repondre automatiquement avec approbation. Compatible Gemini, Claude, GPT, DeepSeek.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    title: 'Notifications en temps reel',
    desc: "Alertes macOS/Windows pour chaque message. Badge de non-lus par compte. Mode Ne Pas Deranger.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    title: 'Templates rapides',
    desc: "Enregistrez des messages pre-ecrits et collez-les instantanement avec un raccourci clavier.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    title: 'Appels multi-comptes',
    desc: "Creez des instances WhatsApp Desktop dediees par compte pour passer des appels audio et video.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
]

const pricing = {
  name: 'Pro',
  price: '9 900',
  currency: 'FCFA',
  period: '/mois',
  features: [
    'Comptes WhatsApp illimites',
    'Reponses automatiques par mot-cle',
    'IA integree (Gemini, Claude, GPT)',
    'Notifications temps reel',
    'Templates rapides',
    'Appels multi-comptes',
    'Synchronisation Tribal Ops',
    'Support prioritaire',
  ],
  trial: '7 jours d\'essai gratuit',
}

/* ── Page ── */

export function WamLandingPage() {
  const { ref: heroRef, isInView: heroVisible } = useInView(0.05)
  const { ref: featRef, isInView: featVisible } = useInView(0.05)
  const { ref: dlRef, isInView: dlVisible } = useInView(0.05)
  const { ref: pricingRef, isInView: pricingVisible } = useInView(0.05)

  return (
    <div className="grain">
      <Navbar />
      <main>
        {/* ━━━ HERO ━━━ */}
        <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          {/* Ambient */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[150px] animate-float" style={{ background: `${ACCENT}15` }} />
            <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] animate-float-slow" style={{ background: `${ACCENT}10` }} />
          </div>

          <div ref={heroRef} className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
            {/* Breadcrumb */}
            <div className={`mb-8 ${heroVisible ? 'animate-fade-up' : 'opacity-0'}`}>
              <Link to="/produits" className="text-[11px] text-white/30 hover:text-tribal-accent transition-colors tracking-[0.2em] uppercase font-medium">
                Produits
              </Link>
              <span className="text-white/15 mx-2">/</span>
              <span className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: ACCENT }}>
                WhatsApp Manager
              </span>
            </div>

            {/* Icon */}
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 ${heroVisible ? 'animate-scale-up' : 'opacity-0'}`}
              style={{ backgroundColor: ACCENT_DIM, color: ACCENT }}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>

            {/* Title */}
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.05] mb-6 ${
                heroVisible ? 'animate-fade-up [animation-delay:150ms]' : 'opacity-0'
              }`}
            >
              Tous vos WhatsApp.
              <br />
              <span style={{ color: ACCENT }}>Une seule app.</span>
            </h1>

            <p
              className={`text-white/45 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10 ${
                heroVisible ? 'animate-fade-up [animation-delay:300ms]' : 'opacity-0'
              }`}
            >
              WhatsApp Manager est l'application de bureau qui permet aux professionnels
              de gerer tous leurs comptes WhatsApp dans une seule fenetre, avec reponses
              automatiques et intelligence artificielle.
            </p>

            {/* Download buttons — hero */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${
                heroVisible ? 'animate-fade-up [animation-delay:450ms]' : 'opacity-0'
              }`}
            >
              {downloads.map((dl) => (
                <a
                  key={dl.platform}
                  href={dl.href}
                  className={`group flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-400 ${
                    dl.primary
                      ? 'text-tribal-black hover:shadow-lg hover:shadow-[#25D36640]'
                      : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1] hover:border-white/[0.15]'
                  }`}
                  style={dl.primary ? { backgroundColor: ACCENT } : {}}
                >
                  <span className={dl.primary ? 'text-tribal-black' : 'text-white/60'}>{dl.icon}</span>
                  <span>
                    <span className="block leading-tight">{dl.platform}</span>
                    <span className={`block text-[10px] font-normal ${dl.primary ? 'text-tribal-black/60' : 'text-white/30'}`}>
                      {dl.arch}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            {/* Trial badge */}
            <p
              className={`mt-6 text-[12px] text-white/25 tracking-wide ${
                heroVisible ? 'animate-fade-up [animation-delay:550ms]' : 'opacity-0'
              }`}
            >
              {pricing.trial} — Aucune carte requise
            </p>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ━━━ FEATURES ━━━ */}
        <section className="relative py-24 md:py-36 kente-lines">
          <div ref={featRef} className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <span
                className={`inline-block text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
                  featVisible ? 'animate-fade-up' : 'opacity-0'
                }`}
                style={{ color: ACCENT }}
              >
                Fonctionnalites
              </span>
              <h2
                className={`text-3xl md:text-4xl font-display font-bold leading-[1.1] mb-6 ${
                  featVisible ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
                }`}
              >
                Tout ce dont vous avez
                <br />
                <span style={{ color: ACCENT }}>besoin pour vendre.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => {
                const { ref: cRef, isInView: cVis } = useInView(0.1)
                return (
                  <div
                    key={f.title}
                    ref={cRef as never}
                    className={`group glass glass-hover rounded-2xl p-7 overflow-hidden ${
                      cVis ? 'animate-scale-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundColor: ACCENT_DIM, color: ACCENT }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="font-display font-bold text-[15px] mb-2 group-hover:text-white transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-[13px] text-white/35 leading-relaxed group-hover:text-white/55 transition-colors">
                      {f.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ━━━ PRICING ━━━ */}
        <section className="relative py-24 md:py-32">
          <div ref={pricingRef} className="max-w-lg mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <span
                className={`inline-block text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
                  pricingVisible ? 'animate-fade-up' : 'opacity-0'
                }`}
                style={{ color: ACCENT }}
              >
                Tarif
              </span>
              <h2
                className={`text-3xl md:text-4xl font-display font-bold leading-[1.1] ${
                  pricingVisible ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
                }`}
              >
                Simple et transparent.
              </h2>
            </div>

            <div
              className={`glass rounded-3xl p-8 md:p-10 border overflow-hidden ${
                pricingVisible ? 'animate-scale-up [animation-delay:200ms]' : 'opacity-0'
              }`}
              style={{ borderColor: `${ACCENT}20` }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(600px circle at 50% 0%, ${ACCENT}08, transparent 70%)` }}
              />

              <div className="relative text-center mb-8">
                <span
                  className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-lg mb-4"
                  style={{ color: ACCENT, backgroundColor: ACCENT_DIM }}
                >
                  {pricing.name}
                </span>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl md:text-5xl font-display font-bold">{pricing.price}</span>
                  <span className="text-white/40 text-sm mb-1.5">{pricing.currency}{pricing.period}</span>
                </div>
                <p className="text-white/30 text-[13px] mt-2">{pricing.trial}</p>
              </div>

              <ul className="relative space-y-3 mb-8">
                {pricing.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-white/60">
                    <svg className="w-4 h-4 shrink-0" style={{ color: ACCENT }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#telecharger"
                className="relative block w-full text-center py-4 rounded-2xl font-bold text-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: ACCENT, color: '#050505', boxShadow: `0 0 30px ${ACCENT}30` }}
              >
                Commencer l'essai gratuit
              </a>
            </div>
          </div>
        </section>

        <div className="divider-glow" />

        {/* ━━━ DOWNLOADS ━━━ */}
        <section id="telecharger" className="relative py-24 md:py-32 kente-lines">
          <div ref={dlRef} className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <span
                className={`inline-block text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
                  dlVisible ? 'animate-fade-up' : 'opacity-0'
                }`}
                style={{ color: ACCENT }}
              >
                Telecharger
              </span>
              <h2
                className={`text-3xl md:text-4xl font-display font-bold leading-[1.1] mb-4 ${
                  dlVisible ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
                }`}
              >
                Choisissez votre plateforme.
              </h2>
              <p
                className={`text-white/40 text-[15px] max-w-md mx-auto ${
                  dlVisible ? 'animate-fade-up [animation-delay:200ms]' : 'opacity-0'
                }`}
              >
                Disponible sur macOS (Apple Silicon et Intel) et Windows.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {downloads.map((dl, i) => {
                const { ref: dRef, isInView: dVis } = useInView(0.1)
                return (
                  <a
                    key={dl.platform}
                    ref={dRef as never}
                    href={dl.href}
                    className={`group glass glass-hover rounded-2xl p-7 text-center overflow-hidden block ${
                      dVis ? 'animate-scale-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundColor: ACCENT_DIM, color: ACCENT }}
                    >
                      {dl.icon}
                    </div>
                    <h3 className="font-display font-bold text-base mb-1 group-hover:text-white transition-colors">
                      {dl.platform}
                    </h3>
                    <p className="text-[11px] text-white/30 mb-5">{dl.arch}</p>
                    <span
                      className="inline-flex items-center gap-2 text-[12px] font-semibold transition-all duration-300 group-hover:gap-3"
                      style={{ color: ACCENT }}
                    >
                      Telecharger
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </span>
                  </a>
                )
              })}
            </div>

            {/* System requirements */}
            <div
              className={`mt-12 text-center ${
                dlVisible ? 'animate-fade-up [animation-delay:500ms]' : 'opacity-0'
              }`}
            >
              <p className="text-white/15 text-[11px] tracking-wider">
                macOS 11+ (Big Sur) &nbsp;|&nbsp; Windows 10+ &nbsp;|&nbsp; 4 Go RAM minimum
              </p>
            </div>
          </div>
        </section>

        {/* ━━━ CTA ━━━ */}
        <section className="relative py-20 md:py-28 mesh-gradient">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Pret a gerer vos WhatsApp
              <span style={{ color: ACCENT }}> comme un pro ?</span>
            </h2>
            <p className="text-white/40 text-[15px] mb-8 max-w-md mx-auto">
              Essayez WhatsApp Manager gratuitement pendant 7 jours.
              Aucune carte bancaire requise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={downloads[0].href}
                className="px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: ACCENT, color: '#050505', boxShadow: `0 0 30px ${ACCENT}25` }}
              >
                Telecharger gratuitement
              </a>
              <Link
                to="/produits"
                className="px-8 py-3.5 rounded-2xl font-semibold text-sm bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1] transition-all duration-300"
              >
                Voir tous les produits
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
