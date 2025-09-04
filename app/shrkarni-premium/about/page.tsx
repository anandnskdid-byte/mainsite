import Image from 'next/image'
import { BadgeCheck, Handshake, ShieldCheck, Sparkles, Star } from 'lucide-react'

export const metadata = {
  title: 'About | Shri Karni Home Solutions',
  description:
    'Shri Karni Home Solutions — Trusted store for Tiles, Sanitary, Paints, Hardware and more. Premium quality, fair pricing, and reliable service in your city.',
  openGraph: {
    title: 'About | Shri Karni Home Solutions',
    description:
      'Shri Karni Home Solutions — Trusted store for Tiles, Sanitary, Paints, Hardware and more. Premium quality, fair pricing, and reliable service in your city.',
    images: [{ url: '/owner.jpeg' }]
  }
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-neutral-900 text-neutral-100">
      {/* Hero */}
      <section className="px-4 sm:px-6 md:px-8 py-12 md:py-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              <span className="text-neutral-100">About </span>
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Shri Karni Home Solutions</span>
            </h1>
            <p className="mt-4 text-neutral-300 text-base sm:text-lg max-w-prose">
              Your trusted destination for premium home improvement products — Tiles, Sanitary, Paints, Hardware, and more. We combine quality, affordability, and service to make your spaces beautiful and durable.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="/shrkarni-premium" className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold text-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shadow-lg hover:brightness-110 transition">
                Explore Premium
              </a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 transition">
                Get a Quote
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-yellow-500/20 via-yellow-400/10 to-transparent blur-2xl" aria-hidden />
              <div className="relative rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl">
                <Image
                  src="/owner.jpeg"
                  alt="Founder of Shri Karni Home Solutions"
                  width={720}
                  height={840}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-xl bg-yellow-500 text-black text-xs font-bold px-3 py-1 shadow-lg">
                Founder
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Promise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <ValueCard icon={<BadgeCheck className="h-5 w-5" />} title="Assured Quality" desc="We hand-pick brands and products that pass strict reliability checks." />
            <ValueCard icon={<Handshake className="h-5 w-5" />} title="Honest Pricing" desc="Transparent rates and value-first recommendations for every budget." />
            <ValueCard icon={<ShieldCheck className="h-5 w-5" />} title="Dependable Service" desc="From selection to delivery — smooth, timely and friendly support." />
          </div>
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
          <ol className="relative border-s border-neutral-800 space-y-6">
            <TimelineItem year="2018" title="Founded with a Vision" text="Started with a simple goal — make premium home solutions accessible to everyone." />
            <TimelineItem year="2019" title="Category Expansion" text="Added tiles, sanitary, paints and hardware from trusted brands." />
            <TimelineItem year="2021" title="Premium Curation" text="Launched curated premium lineup for discerning customers." />
            <TimelineItem year="2023" title="Better Experience" text="Streamlined delivery, strong after-sales and expert guidance." />
          </ol>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <StatCard value="6+" label="Years of Trust" />
            <StatCard value="1500+" label="Products" />
            <StatCard value="1200+" label="Happy Customers" />
            <StatCard value="15+" label="Brands" />
          </div>
        </div>
      </section>

      {/* Brands / Partners */}
      <section className="px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Trusted Brands & Partners</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {['Sakarni', 'Asian Paints', 'Kajaria', 'Cera', 'Hettich'].map((name) => (
              <div key={name} className="flex items-center justify-center h-16 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-yellow-500/30 hover:text-yellow-300 transition">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { q: 'Premium products and genuine guidance.', a: 'Rohit S.' },
              { q: 'Timely delivery and fair pricing — recommended!', a: 'Neha G.' },
              { q: 'Great variety and service. Smooth experience.', a: 'Amit K.' }
            ].map((t, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-neutral-200">“{t.q}”</p>
                <p className="mt-2 text-sm text-neutral-400">— {t.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit / CTA */}
      <section className="px-4 sm:px-6 md:px-8 pb-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-amber-400/5 to-transparent p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h3 className="text-xl md:text-2xl font-bold">Visit Our Store</h3>
              <p className="mt-2 text-neutral-300">Shri Karni Home Solutions — Address line here, City, Pincode</p>
              <p className="text-neutral-400 text-sm">Mon–Sun: 10:00 AM – 8:00 PM</p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <a href="tel:+91XXXXXXXXXX" className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold text-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shadow-lg hover:brightness-110 transition">
                Call Now
              </a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 transition">
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function ValueCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-yellow-500/30 transition">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 mb-3">
        {icon}
      </div>
      <p className="font-semibold text-neutral-100">{title}</p>
      <p className="text-sm text-neutral-400 mt-1">{desc}</p>
    </div>
  )
}

function TimelineItem({ year, title, text }: { year: string; title: string; text: string }) {
  return (
    <li className="ms-4">
      <div className="absolute w-2 h-2 bg-yellow-400 rounded-full -start-1 mt-2 border border-yellow-400/70" />
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <p className="text-xs text-yellow-300 font-semibold">{year}</p>
        <p className="mt-1 font-semibold text-neutral-100">{title}</p>
        <p className="text-sm text-neutral-400">{text}</p>
      </div>
    </li>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 text-center">
      <p className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">{value}</p>
      <p className="mt-1 text-sm text-neutral-400">{label}</p>
    </div>
  )
}
