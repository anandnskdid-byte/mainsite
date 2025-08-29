'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowRight, ShoppingBag, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Link from 'next/link'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  buttonLink: string
  imageUrl: string
  sliderType: string
  layoutType: string
  autoplay: number
  animationSpeed: number
  showNavigation: boolean
  showDots: boolean
  active: boolean
  order: number
}

export function PremiumHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)

  // Load slides from Firebase
  useEffect(() => {
    const slidesRef = ref(database, 'heroSlides')
    const unsubscribe = onValue(slidesRef, (snapshot) => {
      try {
        const data = snapshot.val()
        if (data) {
          const slidesList = Object.entries(data)
            .map(([id, slide]: [string, any]) => ({
              id,
              title: slide.title || '',
              subtitle: slide.subtitle || '',
              description: slide.description || '',
              buttonText: slide.buttonText || 'Shop Now',
              buttonLink: slide.buttonLink || '/products',
              imageUrl: slide.imageUrl || '/banner.png',
              sliderType: slide.sliderType || 'slide',
              layoutType: slide.layoutType || 'fullscreen',
              autoplay: slide.autoplay || 6,
              animationSpeed: slide.animationSpeed || 800,
              showNavigation: slide.showNavigation !== false,
              showDots: slide.showDots !== false,
              active: slide.active || false,
              order: slide.order || 0
            }))
            .filter(slide => slide.active) // Only show active slides
            .sort((a, b) => a.order - b.order) // Sort by order
          
          setHeroSlides(slidesList)
        } else {
          setHeroSlides([])
        }
      } catch (error) {
        console.error('Error loading hero slides:', error)
        setHeroSlides([])
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAutoPlaying || heroSlides.length === 0) return

    // Use autoplay setting from current slide
    const currentSlideData = heroSlides[currentSlide]
    const autoplayDuration = currentSlideData?.autoplay || 6
    
    if (autoplayDuration === 0) return // Autoplay disabled

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, autoplayDuration * 1000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, heroSlides.length, currentSlide, heroSlides])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  // Show default content if no slides
  if (heroSlides.length === 0) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="block text-gray-800">Shri Karni</span>
              <span className="block text-orange-600">Ecommerce</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl leading-relaxed text-gray-600 mb-8">
              Your trusted partner for premium construction materials and home solutions
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-semibold">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentSlideData = heroSlides[currentSlide]
  
  // Get slider settings from current slide
  const sliderType = currentSlideData?.sliderType || 'slide'
  const layoutType = currentSlideData?.layoutType || 'fullscreen'
  const animationSpeed = currentSlideData?.animationSpeed || 800
  const showNavigation = currentSlideData?.showNavigation !== false
  const showDots = currentSlideData?.showDots !== false

  // Dynamic classes based on slider type
  const getSliderClasses = () => {
    const baseClasses = "relative w-full overflow-hidden"
    // Force fullscreen for WOW slider type
    if (sliderType === 'wow') {
      return `${baseClasses} min-h-screen`
    }
    const heightClasses = layoutType === 'banner' ? 'h-96' : layoutType === 'minimal' ? 'h-80' : 'min-h-screen'
    return `${baseClasses} ${heightClasses}`
  }

  const getSlideTransition = (slideIndex: number) => {
    const isActive = slideIndex === currentSlide
    const baseClasses = "absolute inset-0 smooth-slide-transition"
    
    switch (sliderType) {
      case 'fade':
        return `${baseClasses} transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 fade-enter' : 'opacity-0'}`
      case 'zoom':
        return `${baseClasses} transition-all duration-800 ease-in-out ${isActive ? 'opacity-100 scale-100 zoom-enter' : 'opacity-0 scale-110'}`
      case 'flip':
        return `${baseClasses} transition-all duration-800 ease-in-out transform-gpu ${isActive ? 'opacity-100' : 'opacity-0'} ${isActive ? '' : 'rotateY-180'}`
      case 'cube':
        return `${baseClasses} transition-all duration-800 ease-in-out transform-gpu ${isActive ? 'opacity-100' : 'opacity-0'} ${isActive ? '' : 'rotateX-90'}`
      case 'cover':
        return `${baseClasses} transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`
      case 'wow':
        return `${baseClasses} transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) transform-gpu ${isActive ? 'opacity-100 translate-x-0 scale-100 wow-enter' : slideIndex < currentSlide ? 'opacity-0 -translate-x-full scale-95' : 'opacity-0 translate-x-full scale-95'}`
      default: // slide
        return `${baseClasses} transition-transform duration-800 cubic-bezier(0.25, 0.46, 0.45, 0.94) transform-gpu ${isActive ? 'translate-x-0 slide-enter' : slideIndex < currentSlide ? '-translate-x-full' : 'translate-x-full'}`
    }
  }

  return (
    <div 
      className={getSliderClasses()}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100">
        {/* Subtle abstract pattern with very low opacity */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-32 w-48 h-48 bg-orange-300 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 left-40 w-32 h-32 bg-orange-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-orange-200 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={getSlideTransition(index)}
        >
          {/* Main Content */}
          <div className={`relative z-10 flex items-center ${sliderType === 'wow' ? 'min-h-screen' : layoutType === 'banner' ? 'h-96' : layoutType === 'minimal' ? 'h-80' : 'min-h-screen'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Left Content */}
                <div className="text-center lg:text-left space-y-8">
                  {/* Typography */}
                  <div className="space-y-6 animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                      <span className="block text-gray-800">{slide.title}</span>
                      <span className="block text-orange-600">
                        {slide.subtitle}
                      </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl max-w-2xl leading-relaxed text-gray-600">
                      {slide.description}
                    </p>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link href={slide.buttonLink}>
                      <Button 
                        size="lg" 
                        className="group px-10 py-6 text-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-bold"
                      >
                        {slide.buttonText}
                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Link href="/categories">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="group px-10 py-6 text-xl border-2 border-white bg-transparent text-gray-800 hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold"
                      >
                        Explore Categories
                        <ShoppingBag className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right Side Visual */}
                <div className="relative hidden lg:block">
                  <div className="relative">
                    {/* Enhanced product showcase */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
                      <div className="aspect-square relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-100">
                        {/* Decorative background pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 left-4 w-16 h-16 bg-orange-300 rounded-full blur-xl"></div>
                          <div className="absolute bottom-6 right-6 w-12 h-12 bg-orange-400 rounded-full blur-lg"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-200 rounded-full blur-2xl"></div>
                        </div>
                        
                        {/* Product image with better positioning */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
                          <img
                            src={slide.imageUrl}
                            alt="Featured Product"
                            className="max-w-full max-h-full object-contain drop-shadow-lg"
                            style={{
                              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
                            }}
                          />
                        </div>
                        
                        {/* Subtle overlay for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                      </div>
                      
                      {/* Product badge/label */}
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          <Star className="w-4 h-4 mr-2" />
                          Premium Quality
                        </div>
                      </div>
                    </div>

                    {/* Subtle floating elements */}
                    <div className="absolute -top-4 -left-4 w-20 h-20 bg-orange-200/30 rounded-full blur-sm"></div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-300/30 rounded-full blur-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Stats Section - Clean horizontal bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-white/90 backdrop-blur-sm border-t border-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">1000+</div>
                <div className="text-sm md:text-base text-gray-500 mt-1">Products</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">5000+</div>
                <div className="text-sm md:text-base text-gray-500 mt-1">Customers</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">4.8★</div>
                <div className="text-sm md:text-base text-gray-500 mt-1">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows - conditionally shown */}
      {showNavigation && heroSlides.length > 1 && (
        <>
          <button
            onClick={() => goToSlide(currentSlide === 0 ? heroSlides.length - 1 : currentSlide - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => goToSlide((currentSlide + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Indicators - conditionally shown */}
      {showDots && heroSlides.length > 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex space-x-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-orange-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes smooth-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes smooth-slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        
        @keyframes smooth-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes zoom-in {
          from {
            transform: scale(1.1);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes wow-slide {
          0% {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .smooth-slide-transition {
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .slide-enter {
          animation: smooth-slide-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .fade-enter {
          animation: smooth-fade 0.6s ease-in-out;
        }
        
        .zoom-enter {
          animation: zoom-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .wow-enter {
          animation: wow-slide 1s cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>
    </div>
  )
}
