'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Droplets, Palette, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const SakarniStainerCard = () => {
  return (
    <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white via-orange-50/30 to-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:min-h-[420px]">
          {/* Image Section - Left (clean, mobile-first) */}
          <div className="md:w-1/2 relative bg-white overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(60% 60% at 50% 40%, rgba(251,146,60,0.15), transparent 70%)'
              }}
            />

            <div className="relative z-10 flex items-center justify-center p-6 sm:p-8 md:p-10">
              <img
                src="/Gemini_Generated_Image_d3lqy4d3lqy4d3lq.png"
                alt="Sakarni Universal Stainer"
                className="w-full max-w-xs sm:max-w-sm md:max-w-md h-auto object-contain"
              />
            </div>

            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-orange-600 text-white shadow">Premium</Badge>
            </div>
          </div>

          {/* Content Section - Right (simple, readable) */}
          <div className="md:w-1/2 p-6 sm:p-8 md:p-10 bg-white">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sakarni Universal Stainer</h2>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Premium quality color additive enriched with <span className="text-orange-600 font-semibold">High Active Pigments</span>. Even a few drops can create vibrant, long-lasting shades that bring walls and surfaces to life.
              </p>
            </div>

            {/* Features - 2 columns on larger mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="group rounded-lg border border-gray-200 bg-white/80 p-3 sm:p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-100">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Super Vibrant Colors</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Rich, bold shades that pop</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border border-gray-200 bg-white/80 p-3 sm:p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <Droplets className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">High Mixability</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Blends seamlessly with most paints</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border border-gray-200 bg-white/80 p-3 sm:p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                    <Palette className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Versatile Application</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Works with emulsion, distemper, enamel</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border border-gray-200 bg-white/80 p-3 sm:p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Everlasting Shine</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Smooth, durable, long‑lasting finish</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 sm:p-4 mb-6">
              <p className="text-center font-semibold text-orange-700 text-sm sm:text-base">
                “A Drop of Magic, A Burst of Color”
              </p>
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Available Pack Sizes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">50 ml</Badge>
                <Badge variant="outline" className="bg-white">100 ml</Badge>
                <Badge variant="outline" className="bg-white">200 ml</Badge>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Brand</p>
              <p className="text-orange-600 font-bold">Shri Karni Home Solutions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/categories?category=stainers" className="flex-1">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg">
                  Shop Stainers
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button variant="outline" className="w-full border-2 border-orange-600 text-orange-700 hover:bg-orange-50 font-semibold py-3 rounded-lg">
                  Get Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
