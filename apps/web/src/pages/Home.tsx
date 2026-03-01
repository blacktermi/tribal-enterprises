import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Marquee } from '@/components/Marquee'
import { About } from '@/components/About'
import { Branches } from '@/components/Branches'
import { Stats } from '@/components/Stats'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'

export function Home() {
  return (
    <div className="grain">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Branches />
        <Stats />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
