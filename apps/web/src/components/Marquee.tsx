const brands = [
  'TRIBAL PRINT',
  'JERICHO PRINT',
  'MUSLIM PRINT',
  'TRIBAL VERRA',
  'TRIBAL AGENCY',
  'KAUI',
]

export function Marquee() {
  const doubled = [...brands, ...brands]

  return (
    <div className="relative py-7 overflow-hidden border-y border-white/[0.03]">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-tribal-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-tribal-black to-transparent z-10" />

      <div className="flex animate-marquee">
        {doubled.map((name, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span className="text-xl md:text-2xl font-display font-extrabold text-white/[0.04] whitespace-nowrap px-8 md:px-12 select-none">
              {name}
            </span>
            <span className="text-tribal-accent/15 text-[8px]">&#9670;</span>
          </div>
        ))}
      </div>
    </div>
  )
}
