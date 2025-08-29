'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowRight, Package, ShoppingBag, Star, Truck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface HeroSlide {
  id: number
  title: string
  subtitle: string
  description: string
  buttonText: string
  buttonLink: string
  backgroundImage?: string
  backgroundColor: string
  textColor: string
  accentColor: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Shri Karni",
    subtitle: "Home Solutions",
    description: "Transform your home with our premium collection of furniture, decor, and essentials. Quality products at unbeatable prices.",
    buttonText: "Shop Now",
    buttonLink: "/products",
    backgroundColor: "from-orange-500 via-orange-600 to-red-600",
    textColor: "text-white",
    accentColor: "text-orange-200"
  },
  {
    id: 2,
    title: "Premium",
    subtitle: "Furniture Collection",
    description: "Discover handcrafted furniture pieces that blend style with functionality. Create spaces that reflect your personality.",
    buttonText: "Explore Furniture",
    buttonLink: "/categories?category=Furniture",
    backgroundColor: "from-blue-600 via-purple-600 to-indigo-700",
    textColor: "text-white",
    accentColor: "text-blue-200"
  },
  {
    id: 3,
    title: "Home Decor",
    subtitle: "& Essentials",
    description: "Complete your home with our curated selection of decor items, lighting, and everyday essentials.",
    buttonText: "Shop Decor",
    buttonLink: "/categories?category=Decor",
    backgroundColor: "from-green-500 via-teal-600 to-cyan-600",
    textColor: "text-white",
    accentColor: "text-green-200"
  },
  {
    id: 4,
    title: "Special Offers",
    subtitle: "Up to 50% Off",
    description: "Don't miss out on our biggest sale of the year. Limited time offers on selected items across all categories.",
    buttonText: "View Offers",
    buttonLink: "/offers",
    backgroundColor: "from-pink-500 via-rose-600 to-red-600",
    textColor: "text-white",
    accentColor: "text-pink-200"
  }
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const currentSlideData = heroSlides[currentSlide]

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Slides */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`w-full h-full bg-gradient-to-br ${slide.backgroundColor}`}>
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-float"></div>
                <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full animate-float-delayed"></div>
                <div className="absolute bottom-32 left-40 w-20 h-20 bg-white rounded-full animate-bounce"></div>
                <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-10 w-16 h-16 bg-white rounded-full animate-float"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Slide Indicator Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                🏆 Slide {currentSlide + 1} of {heroSlides.length}
              </div>

              {/* Main Content */}
              <div 
                key={currentSlide} 
                className="space-y-6 animate-fade-in-up"
              >
                <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-tight ${currentSlideData.textColor}`}>
                  <span className="block">{currentSlideData.title}</span>
                  <span className={`block ${currentSlideData.accentColor}`}>
                    {currentSlideData.subtitle}
                  </span>
                </h1>
                
                <p className={`text-xl md:text-2xl max-w-2xl leading-relaxed ${currentSlideData.accentColor}`}>
                  {currentSlideData.description}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={currentSlideData.buttonLink}>
                  <Button 
                    size="lg" 
                    className="group px-10 py-6 text-xl bg-white text-gray-900 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 rounded-full font-semibold"
                  >
                    {currentSlideData.buttonText}
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="group px-10 py-6 text-xl border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 rounded-full font-semibold shadow-lg hover:shadow-2xl backdrop-blur-sm"
                  >
                    Browse All
                    <Package className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-8">
                <div className="flex items-center gap-3 text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                  <Truck className="h-6 w-6" />
                  <span className="font-medium">Free Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="font-medium">Quality Assured</span>
                </div>
                <div className="flex items-center gap-3 text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                  <Star className="h-6 w-6" />
                  <span className="font-medium">5000+ Customers</span>
                </div>
              </div>
            </div>

            {/* Right Content - Visual Elements */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Visual Card */}
                <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/30">
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="text-white">
                        <div className="text-3xl font-bold">1000+</div>
                        <div className="text-sm opacity-80">Products</div>
                      </div>
                      <div className="text-white">
                        <div className="text-3xl font-bold">5000+</div>
                        <div className="text-sm opacity-80">Customers</div>
                      </div>
                      <div className="text-white">
                        <div className="text-3xl font-bold">4.8★</div>
                        <div className="text-sm opacity-80">Rating</div>
                      </div>
                    </div>

                    {/* Feature Icons */}
                    <div className="flex justify-center space-x-8">
                      <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-white" />
                      </div>
                      <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/30 rounded-full animate-float"></div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/30 rounded-full animate-bounce"></div>
                <div className="absolute top-1/2 -right-8 w-12 h-12 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center">
        <Button
          variant="ghost"
          size="lg"
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-4 flex items-center">
        <Button
          variant="ghost"
          size="lg"
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%` 
          }}
        />
      </div>
    </div>
  )
}
