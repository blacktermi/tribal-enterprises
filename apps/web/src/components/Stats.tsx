import { useInView } from '@/hooks/useInView'
import { useCountUp } from '@/hooks/useCountUp'

function Stat({
  value,
  suffix,
  label,
  delay,
}: {
  value: number
  suffix?: string
  label: string
  delay: number
}) {
  const { ref, isInView } = useInView(0.5)
  const count = useCountUp(value, 2200, isInView)

  return (
    <div
      ref={ref}
      className={`text-center ${isInView ? 'animate-fade-up' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold bg-gradient-to-b from-tribal-accent to-tribal-accent-dark bg-clip-text text-transparent mb-2">
        {count}
        {suffix}
      </div>
      <div className="text-[12px] md:text-[13px] text-white/30 tracking-wider uppercase font-medium">
        {label}
      </div>
    </div>
  )
}

export function Stats() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="divider-glow" />
      <div className="absolute inset-0 bg-gradient-to-b from-tribal-accent/[0.015] via-transparent to-tribal-accent/[0.015]" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16">
          <Stat value={6} label="Marques actives" delay={0} />
          <Stat value={3} label="Branches" delay={100} />
          <Stat value={100} suffix="%" label="Souverainete tech" delay={200} />
          <Stat value={1} label="Ecosysteme unifie" delay={300} />
        </div>
      </div>

      <div className="divider-glow mt-20 md:mt-28" />
    </section>
  )
}
