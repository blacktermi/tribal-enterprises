import { useEffect, useState } from 'react'

export function Hero() {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const d = (ms: number) => ready ? { animationDelay: `${ms}ms` } : undefined
  const vis = (ms: number) =>
    `opacity-0 ${ready ? 'animate-fade-up' : ''}`
    + (ms ? ` [animation-delay:${ms}ms]` : '')

  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center overflow-hidden kente-lines"
    >
      {/* Ambient orbs */}
      <div className="absolute top-[15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-tribal-accent/[0.07] blur-[150px] animate-float" />
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-tribal-accent/[0.04] blur-[120px] animate-float-slow" />
      <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] rounded-full bg-violet-500/[0.03] blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

      {/* Geometric elements */}
      <div
        className={`absolute top-24 right-[8%] w-24 h-24 md:w-40 md:h-40 border border-tribal-accent/[0.08] rounded-3xl rotate-[30deg] transition-all duration-[1.5s] ${
          ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: '600ms' }}
      />
      <div
        className={`absolute bottom-28 left-[6%] w-16 h-16 md:w-28 md:h-28 border border-tribal-accent/[0.06] rounded-2xl rotate-[15deg] transition-all duration-[1.5s] ${
          ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: '900ms' }}
      />

      {/* Vertical accent lines */}
      <div className="absolute left-[22%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-tribal-accent/[0.04] to-transparent" />
      <div className="absolute right-[30%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-tribal-accent/[0.04] to-transparent" />

      {/* Center diamond */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rotate-45 border border-tribal-accent/[0.03] rounded-[60px] animate-spin-slow pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Logo */}
        <div className={`${vis(100)}`} style={d(100)}>
          <img
            src="/logo.png"
            alt="Logo Tribal Enterprise — Ecosysteme business multi-marques a Abidjan"
            width={112}
            height={112}
            className="w-20 h-20 md:w-28 md:h-28 mx-auto drop-shadow-[0_0_30px_rgba(20,184,166,0.25)]"
          />
        </div>

        {/* Badge */}
        <div className={`mt-6 ${vis(300)}`} style={d(300)}>
          <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass text-tribal-accent text-[11px] font-semibold tracking-[0.25em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-tribal-accent animate-glow-pulse" />
            Abidjan, Cote d'Ivoire
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-6 md:mt-8">
          <span
            className={`block text-stroke text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] xl:text-[10rem] font-display font-extrabold leading-[0.85] tracking-tight ${vis(400)}`}
            style={d(400)}
          >
            TRIBAL
          </span>
          <span
            className={`block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-tribal-accent mt-3 md:mt-5 tracking-[0.2em] ${vis(600)}`}
            style={d(600)}
          >
            ENTERPRISE
          </span>
        </h1>

        {/* Divider */}
        <div
          className={`divider-glow w-24 mx-auto mt-8 md:mt-10 ${vis(750)}`}
          style={d(750)}
        />

        {/* Subtitle */}
        <p
          className={`mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-white/40 font-light max-w-xl mx-auto leading-relaxed ${vis(900)}`}
          style={d(900)}
        >
          L'ecosysteme business qui transforme{' '}
          <span className="text-white/80 font-normal">chaque idee</span> en
          realite concrete.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 md:mt-12 ${vis(1100)}`}
          style={d(1100)}
        >
          <a
            href="#marques"
            className="group relative px-8 py-3.5 bg-tribal-accent text-tribal-black font-semibold text-sm rounded-xl tracking-wide overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_50px_rgba(20,184,166,0.25)]"
          >
            <span className="relative z-10">Decouvrir nos marques</span>
            <div className="absolute inset-0 bg-tribal-accent-light translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </a>
          <a
            href="#vision"
            className="px-8 py-3.5 text-sm font-medium rounded-xl glass text-white/70 hover:text-white hover:border-tribal-accent/20 transition-all duration-400"
          >
            Notre vision
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${vis(1500)}`}
        style={d(1500)}
      >
        <span className="text-[10px] text-white/20 tracking-[0.3em] uppercase font-medium">
          Scroll
        </span>
        <div className="w-[18px] h-[30px] rounded-full border border-white/15 flex items-start justify-center pt-1.5">
          <div className="w-[3px] h-[6px] rounded-full bg-tribal-accent animate-bounce" />
        </div>
      </div>
    </section>
  )
}
