import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useInView } from '@/hooks/useInView'

const products = [
  {
    id: 'whatsapp-manager',
    name: 'WhatsApp Manager',
    tagline: 'Multi-compte WhatsApp pour entreprises',
    description:
      "Gerez tous vos comptes WhatsApp dans une seule application. Reponses automatiques, IA integree, notifications en temps reel. Concu pour les professionnels qui gerent plusieurs marques.",
    accent: '#25D366',
    platforms: ['macOS ARM', 'macOS Intel', 'Windows'],
    status: 'Disponible',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
]

function ProductCard({
  product,
  delay,
}: {
  product: (typeof products)[0]
  delay: number
}) {
  const { ref, isInView } = useInView(0.1)

  return (
    <Link
      ref={ref as never}
      to={`/produits/${product.id}`}
      className={`group relative glass glass-hover rounded-3xl p-8 md:p-10 overflow-hidden block cursor-pointer ${
        isInView ? 'animate-scale-up' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at 30% 50%, ${product.accent}0D, transparent 60%)`,
        }}
      />
      {/* Accent top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${product.accent}50, transparent)`,
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        {/* Icon */}
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundColor: `${product.accent}12`, color: product.accent }}
        >
          {product.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-lg"
              style={{ color: product.accent, backgroundColor: `${product.accent}12` }}
            >
              {product.status}
            </span>
          </div>
          <h3 className="font-display font-bold text-xl md:text-2xl mb-1 group-hover:text-white transition-colors">
            {product.name}
          </h3>
          <p
            className="text-[12px] font-medium italic mb-3"
            style={{ color: `${product.accent}90` }}
          >
            {product.tagline}
          </p>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-2xl group-hover:text-white/60 transition-colors">
            {product.description}
          </p>
          {/* Platforms */}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.platforms.map((p) => (
              <span
                key={p}
                className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* CTA arrow */}
        <div
          className="shrink-0 flex items-center gap-2 text-[12px] font-semibold opacity-60 group-hover:opacity-100 transition-all"
          style={{ color: product.accent }}
        >
          Decouvrir
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${product.accent}40, transparent)`,
        }}
      />
    </Link>
  )
}

export function ProductsPage() {
  const { ref, isInView } = useInView(0.05)

  return (
    <div className="grain">
      <Navbar />
      <main>
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 kente-lines">
          <div className="divider-glow" />

          <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
            {/* Header */}
            <div className="text-center mb-16 md:mb-20">
              <span
                className={`inline-block text-tribal-accent text-[11px] font-semibold tracking-[0.3em] uppercase mb-5 ${
                  isInView ? 'animate-fade-up' : 'opacity-0'
                }`}
              >
                Nos Produits
              </span>
              <h1
                className={`text-3xl md:text-4xl lg:text-[3.2rem] font-display font-bold leading-[1.1] mb-6 ${
                  isInView ? 'animate-fade-up [animation-delay:100ms]' : 'opacity-0'
                }`}
              >
                Logiciels conçus
                <br />
                <span className="text-tribal-accent">pour performer.</span>
              </h1>
              <p
                className={`text-white/40 text-[15px] md:text-base max-w-lg mx-auto leading-relaxed ${
                  isInView ? 'animate-fade-up [animation-delay:200ms]' : 'opacity-0'
                }`}
              >
                Des outils professionnels developpes par Tribal Enterprise
                pour repondre aux besoins reels des entreprises africaines.
              </p>
            </div>

            {/* Products list */}
            <div className="space-y-5">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} delay={300 + i * 100} />
              ))}
            </div>

            {/* Coming soon teaser */}
            <div
              className={`mt-16 text-center ${
                isInView ? 'animate-fade-up [animation-delay:600ms]' : 'opacity-0'
              }`}
            >
              <p className="text-white/20 text-[13px] font-medium tracking-wide">
                D'autres produits arrivent bientot...
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
