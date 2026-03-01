import { useInView } from '@/hooks/useInView'

const channels = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    title: 'Email',
    detail: 'contact.tribalgroup@gmail.com',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    title: 'Localisation',
    detail: 'Abidjan, Cote d\'Ivoire',
  },
]

export function Contact() {
  const { ref, isInView } = useInView(0.15)

  return (
    <section id="contact" aria-label="Contactez Tribal Enterprise" className="relative py-24 md:py-36 mesh-gradient">
      <div ref={ref} className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <span
          className={`inline-block text-tribal-accent text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
            isInView ? 'animate-fade-up' : 'opacity-0'
          }`}
        >
          Contact
        </span>
        <h2
          className={`text-3xl md:text-4xl lg:text-[3.2rem] font-display font-bold leading-[1.1] mb-6 ${
            isInView ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
          }`}
        >
          Pret a construire
          <br />
          <span className="text-tribal-accent">quelque chose de grand ?</span>
        </h2>
        <p
          className={`text-white/40 text-[15px] md:text-base max-w-md mx-auto leading-relaxed mb-14 ${
            isInView ? 'animate-fade-up [animation-delay:200ms]' : 'opacity-0'
          }`}
        >
          Impression, branding, developpement web, IA ou SaaS — notre equipe
          est prete a vous accompagner dans votre projet.
        </p>

        {/* Channel cards */}
        <div
          className={`grid sm:grid-cols-2 gap-4 max-w-md mx-auto mb-14 ${
            isInView ? 'animate-fade-up [animation-delay:300ms]' : 'opacity-0'
          }`}
        >
          {channels.map((c) => (
            <div
              key={c.title}
              className="glass glass-hover rounded-2xl p-6 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-tribal-accent/10 flex items-center justify-center text-tribal-accent mx-auto mb-3">
                {c.icon}
              </div>
              <h4 className="font-semibold text-sm mb-1">{c.title}</h4>
              <p className="text-[11px] text-white/35">{c.detail}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`${
            isInView ? 'animate-fade-up [animation-delay:400ms]' : 'opacity-0'
          }`}
        >
          <a
            href="mailto:contact.tribalgroup@gmail.com"
            aria-label="Envoyer un email a Tribal Enterprise pour demarrer un projet"
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-tribal-accent text-tribal-black font-bold text-sm rounded-2xl tracking-wide overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(20,184,166,0.2)]"
          >
            <span className="relative z-10">Demarrer un projet</span>
            <svg
              className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <div className="absolute inset-0 bg-tribal-accent-light translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </a>
        </div>
      </div>
    </section>
  )
}
