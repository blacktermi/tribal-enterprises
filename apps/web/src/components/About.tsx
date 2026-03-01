import { useInView } from '@/hooks/useInView'

export function About() {
  const { ref, isInView } = useInView(0.15)

  const anim = (delay: number) =>
    `${isInView ? 'animate-fade-up' : 'opacity-0'} [animation-delay:${delay}ms]`

  return (
    <section id="vision" className="relative py-24 md:py-36 mesh-gradient">
      <div className="divider-glow" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          {/* Left */}
          <div>
            <span className={`inline-block text-tribal-accent text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${anim(0)}`}>
              Notre Vision
            </span>
            <h2 className={`text-3xl md:text-4xl lg:text-[3.2rem] font-display font-bold leading-[1.1] mb-7 ${anim(100)}`}>
              Un ecosysteme{' '}
              <span className="text-tribal-accent">multi-marques</span>,
              <br />
              une ambition panafricaine.
            </h2>
            <div className={`space-y-5 text-white/45 text-[15px] md:text-base leading-relaxed ${anim(200)}`}>
              <p>
                <strong className="text-white/80 font-medium">Tribal Enterprise SARL</strong> est
                un groupe d'entreprises base a Abidjan, ne de la conviction que l'Afrique merite
                des solutions business a la hauteur de ses ambitions.
              </p>
              <p>
                De l'<strong className="text-white/80 font-medium">impression professionnelle</strong> a la{' '}
                <strong className="text-white/80 font-medium">strategie digitale</strong>, en passant
                par la <strong className="text-white/80 font-medium">generation d'images par IA</strong> et
                le <strong className="text-white/80 font-medium">developpement SaaS</strong>, nous
                couvrons l'ensemble de la chaine de valeur.
              </p>
              <p>
                Toutes nos operations sont centralisees via{' '}
                <strong className="text-tribal-accent font-medium">Tribal Ops</strong>, notre
                plateforme interne propulsee par l'intelligence artificielle.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            {/* Founders */}
            <div className={`grid grid-cols-2 gap-4 ${anim(300)}`}>
              <div className="glass glass-hover rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-tribal-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-tribal-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-sm mb-1">Joseph Kakou</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">
                  Tech Lead, Design
                  <br />& Architecture IA
                </p>
              </div>
              <div className="glass glass-hover rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-tribal-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-tribal-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-sm mb-1">Souka</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">
                  Production Audiovisuelle,
                  <br />Stocks & Logistique
                </p>
              </div>
            </div>

            {/* Info card */}
            <div className={`glass glass-hover rounded-2xl p-6 space-y-5 ${anim(400)}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tribal-accent/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-tribal-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Siege Social</h4>
                  <p className="text-[11px] text-white/35">Abidjan, Cote d'Ivoire</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tribal-accent/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-tribal-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Propulse par l'IA</h4>
                  <p className="text-[11px] text-white/35">Tribal Ops — Gestion centralisee intelligente</p>
                </div>
              </div>
            </div>

            {/* Structure highlight */}
            <div className={`relative rounded-2xl p-6 overflow-hidden ${anim(500)}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-tribal-accent/[0.08] via-tribal-accent/[0.03] to-transparent" />
              <div className="absolute inset-0 border border-tribal-accent/15 rounded-2xl" />
              <div className="relative">
                <h4 className="font-display font-bold text-xs text-tribal-accent tracking-wider uppercase mb-2">
                  Tribal Enterprise SARL
                </h4>
                <p className="text-[12px] text-white/40 leading-relaxed">
                  Structure officiellement enregistree. Partenariat 50/50
                  combinant expertise technique de pointe et gestion
                  operationnelle rigoureuse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
