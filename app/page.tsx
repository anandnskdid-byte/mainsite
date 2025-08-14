'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import type { Product, Category } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/products/product-card'
import { Search, Filter, Package, ShoppingBag, Users, Star, ArrowRight, Truck, ShieldCheck } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

// Using shared types from @/types

// Internal helper to read query params inside Suspense
const CategoryQueryReader = ({ onCategory }: { onCategory: (c: string) => void }) => {
  const sp = useSearchParams()
  useEffect(() => {
    try {
      const cat = (sp.get('category') || '').trim()
      if (cat) onCategory(cat)
    } catch (e) {
      console.error('Error reading category query:', e)
    }
  }, [sp, onCategory])
  return null
}

// Main page component wrapped with dynamic import and no SSR
const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  

  // Randomly group products: 4 cards x 4 products each (up to 16 total)
  const randomGroups = useMemo(() => {
    try {
      if (!products || products.length === 0) return [] as Product[][]
      const arr = [...products]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      const selected = arr.slice(0, Math.min(16, arr.length))
      const groups: Product[][] = []
      const groupCount = Math.min(4, Math.ceil(selected.length / 4))
      for (let i = 0; i < groupCount; i++) {
        groups.push(selected.slice(i * 4, i * 4 + 4))
      }
      return groups
    } catch (e) {
      console.error('Error creating random groups:', e)
      return [] as Product[][]
    }
  }, [products])

  useEffect(() => {
    console.log('Setting up Firebase listeners...')
    try {
      // Load products
      const productsRef = ref(database, 'products')
      console.log('Listening to products at path:', productsRef.toString())
      const unsubscribeProducts = onValue(productsRef, (snapshot) => {
        try {
          console.log('Products data received:', snapshot.exists() ? 'data exists' : 'no data')
          const data = snapshot.val()
          console.log('Products data:', data)
          if (data) {
            const productList = Object.entries(data)
              .map(([id, product]: [string, any]) => ({
                id,
                ...product,
                name: product?.name || '',
                description: product?.description || '',
                category: product?.category || '',
                price: product?.price || 0,
                stock: product?.stock || 0,
                imageUrl: product?.imageUrl || '',
                sellerId: product?.sellerId || '',
                sellerName: product?.sellerName || '',
                colors: product?.colors || [],
                sizes: product?.sizes || [],
                createdAt: product?.createdAt || Date.now()
              }))
              .filter(product => product.name && product.category) // Filter out invalid products
              .sort((a, b) => b.createdAt - a.createdAt)
            
            setProducts(productList)
            setFilteredProducts(productList)
          } else {
            setProducts([])
            setFilteredProducts([])
          }
        } catch (err) {
          console.error('Error processing products:', err)
          setError('Failed to load products')
        }
      }, (error) => {
        console.error('Firebase products error:', error)
        setError('Failed to connect to database')
      })

      // Load categories
      const categoriesRef = ref(database, 'categories')
      const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            const categoryList = Object.entries(data)
              .map(([id, category]: [string, any]) => ({
                id,
                name: category?.name || '',
                description: category?.description || '',
                imageUrl: category?.imageUrl || ''
              }))
              .filter(category => category.name) // Filter out invalid categories
            
            setCategories(categoryList)
          } else {
            setCategories([])
          }
        } catch (err) {
          console.error('Error processing categories:', err)
        } finally {
          setLoading(false)
        }
      }, (error) => {
        console.error('Firebase categories error:', error)
        setLoading(false)
      })

      return () => {
        unsubscribeProducts()
        unsubscribeCategories()
      }
    } catch (err) {
      console.error('Error setting up Firebase listeners:', err)
      setError('Failed to initialize app')
      setLoading(false)
    }
  }, [])
 

  useEffect(() => {
    try {
      let filtered = [...products]

      // Filter by category
      if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(product => {
          const productCategory = product?.category || ''
          const selectedCat = selectedCategory || ''
          return productCategory.toLowerCase() === selectedCat.toLowerCase()
        })
      }

      // Filter by search term
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim()
        filtered = filtered.filter(product => {
          const name = (product?.name || '').toLowerCase()
          const description = (product?.description || '').toLowerCase()
          const category = (product?.category || '').toLowerCase()
          const sellerName = (product?.sellerName || '').toLowerCase()
          
          return name.includes(searchLower) || 
                 description.includes(searchLower) || 
                 category.includes(searchLower) ||
                 sellerName.includes(searchLower)
        })
      }

      setFilteredProducts(filtered)
    } catch (err) {
      console.error('Error filtering products:', err)
      setFilteredProducts(products)
    }
  }, [products, searchTerm, selectedCategory])

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <CategoryQueryReader onCategory={(c) => setSelectedCategory(c)} />
      </Suspense>
      <div className="space-y-8">
        {/* Ultra Enhanced Hero Section */}
        <div className="relative w-full overflow-hidden">
          {/* Background with animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 animate-gradient-x"></div>
          
          {/* Floating particles animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-4 h-4 bg-orange-300 rounded-full opacity-60 animate-float"></div>
            <div className="absolute top-40 right-20 w-6 h-6 bg-blue-300 rounded-full opacity-40 animate-float-delayed"></div>
            <div className="absolute bottom-32 left-20 w-3 h-3 bg-yellow-300 rounded-full opacity-50 animate-bounce"></div>
            <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-pink-300 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-4 h-4 bg-green-300 rounded-full opacity-40 animate-float"></div>
          </div>

          <div className="relative min-h-[600px] md:min-h-[700px] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
                  {/* Badge */}
                  <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium animate-bounce-subtle">
                    🏆 #1 Home Solutions Provider
                  </div>

                  <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                      <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 bg-clip-text text-transparent animate-gradient-text">
                        Shri Karni
                      </span>
                      <br />
                      <span className="text-gray-800">Home Solutions</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
                      Transform your home with our premium collection of furniture, decor, and essentials. 
                      <span className="text-orange-600 font-semibold">Quality products at unbeatable prices.</span>
                    </p>
                  </div>
                  
                  {/* Enhanced CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button 
                      size="lg" 
                      className="group px-10 py-5 text-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 rounded-full font-semibold"
                    >
                      Shop Now 
                      <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                    <Link href="/categories">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="group px-10 py-5 text-xl border-3 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 rounded-full font-semibold shadow-lg hover:shadow-2xl"
                      >
                        Explore Categories
                        <Package className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>

                  {/* Enhanced Trust Indicators */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-8">
                    <div className="flex items-center gap-3 text-base text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="font-medium">Free Delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <div className="p-2 bg-green-100 rounded-full">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="font-medium">Quality Assured</span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="font-medium">5000+ Happy Customers</span>
                    </div>
                  </div>

                  {/* Customer Reviews Preview */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100 animate-fade-in-up-delayed">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">4.9/5 from 2,847 reviews</span>
                    </div>
                    <p className="text-gray-700 italic">
                      "Amazing quality and fast delivery! My home looks completely transformed."
                    </p>
                    <p className="text-sm text-gray-500 mt-2">- Priya S., Mumbai</p>
                  </div>
                </div>

                {/* Right Content - Hero Image/Carousel */}
                <div className="relative">
                  <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <Carousel className="w-full">
                      <CarouselContent>
                        <CarouselItem>
                          <div className="relative w-full h-80 md:h-96 lg:h-[450px]">
                            <img
                              src="/banner.png"
                              alt="Shri Karni Home Solutions - Premium Furniture"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        </CarouselItem>
                        {/* Add more carousel items if you have more images */}
                        <CarouselItem>
                          <div className="relative w-full h-80 md:h-96 lg:h-[450px] bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <Package className="h-16 w-16 text-orange-600 mx-auto" />
                              <h3 className="text-2xl font-bold text-gray-900">Premium Quality</h3>
                              <p className="text-gray-600 max-w-sm">Handpicked products for your perfect home</p>
                            </div>
                          </div>
                        </CarouselItem>
                        <CarouselItem>
                          <div className="relative w-full h-80 md:h-96 lg:h-[450px] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <ShoppingBag className="h-16 w-16 text-blue-600 mx-auto" />
                              <h3 className="text-2xl font-bold text-gray-900">Easy Shopping</h3>
                              <p className="text-gray-600 max-w-sm">Browse, select, and get delivered to your doorstep</p>
                            </div>
                          </div>
                        </CarouselItem>
                      </CarouselContent>
                      <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white" />
                      <CarouselNext className="right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white" />
                    </Carousel>
                  </div>
                  
                  {/* Floating Stats */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm">
                    <div className="bg-white rounded-xl shadow-lg p-4 mx-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">1000+</div>
                          <div className="text-xs text-gray-600">Products</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">5000+</div>
                          <div className="text-xs text-gray-600">Customers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">4.8★</div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-200 rounded-full opacity-50 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-5 w-8 h-8 bg-yellow-200 rounded-full opacity-30 animate-bounce delay-500"></div>
        </div>

        {/* Search Bar moved below cards */}
      </div>

      {/* Random Products Grid */}
      <div className="relative mt-6 md:mt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {randomGroups.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {randomGroups.slice(0, 4).map((group, idx) => (
                <Card key={idx} className="overflow-hidden shadow-2xl border-0">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {group.map((p, i) => {
                        const img = (Array.isArray((p as any).images) && (p as any).images.length > 0)
                          ? (p as any).images[0]
                          : (p.imageUrl || '/placeholder.svg')
                        const id = p?.id || ''
                        return (
                          <Link key={`${id}-${i}`} href={id ? `/products/${id}` : '#'} className="block">
                            <div className="relative w-full" style={{ paddingTop: '100%' }}>
                              <img
                                src={img}
                                alt={p?.name || 'Product'}
                                className="absolute inset-1 md:inset-2 object-contain bg-white rounded"
                              />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar (relocated below cards) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-xl p-1 flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`
                }
              }}
              className="pl-10 pr-4 py-5 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button 
            size="lg" 
            className="px-6 py-5 text-base bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => {
              if (searchTerm.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`
              } else {
                clearFilters()
              }
            }}
          >
            {searchTerm.trim() ? 'Search' : 'Clear'}
          </Button>
        </div>

        {/* Quick category pills */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            onClick={() => handleCategorySelect('all')}
            className={`h-8 px-3 rounded-full ${selectedCategory === 'all' ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white'}`}
          >
            All
          </Button>
          {categories.slice(0, 6).map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              onClick={() => handleCategorySelect(cat.name)}
              className={`h-8 px-3 rounded-full ${selectedCategory === cat.name ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white'}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

        {/* Stats Section (moved below cards) */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg mx-auto mb-2 md:mb-4">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900">{products.length}+</h3>
                <p className="text-xs md:text-sm text-gray-600">Quality Products</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg mx-auto mb-2 md:mb-4">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900">50+</h3>
                <p className="text-xs md:text-sm text-gray-600">Trusted Sellers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg mx-auto mb-2 md:mb-4">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900">4.8</h3>
                <p className="text-xs md:text-sm text-gray-600">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div id="categories" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
            <div className="relative">
              <Carousel
                opts={{ align: 'start', dragFree: true, slidesToScroll: 1 }}
                className="w-full"
              >
                <CarouselContent>
                  <CarouselItem className="basis-1/3 sm:basis-1/4 md:basis-1/6 lg:basis-1/8">
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCategory === 'all' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                      }`}
                      onClick={() => handleCategorySelect('all')}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-1.5 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-600" />
                        </div>
                        <p className="font-medium text-xs truncate">All Products</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                  {categories.map((category) => (
                    <CarouselItem
                      key={category.id}
                      className="basis-1/3 sm:basis-1/4 md:basis-1/6 lg:basis-1/8"
                    >
                      <Link href={`/categories?category=${encodeURIComponent(category.name)}`}>
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedCategory === category.name ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                          }`}
                        >
                          <CardContent className="p-3 text-center">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl || "/placeholder.svg"}
                                alt={category.name}
                                className="w-16 h-16 object-contain rounded-lg mx-auto mb-1.5"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-1.5 flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-600" />
                              </div>
                            )}
                            <p className="font-medium text-xs truncate">{category.name}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2" />
                <CarouselNext className="right-0 top-1/2 -translate-y-1/2" />
              </Carousel>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'all' ? 'Products by Category' : `${selectedCategory} Products`}
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
            
            {(searchTerm || selectedCategory !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {selectedCategory === 'all' && !searchTerm ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => {
                const catProducts = products.filter(
                  (p) => (p.category || '').trim().toLowerCase() === (cat.name || '').trim().toLowerCase()
                )
                if (catProducts.length === 0) return null
                return (
                  <Card key={cat.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-8 h-8 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                        <h3 className="text-base font-semibold text-gray-900">{cat.name}</h3>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleCategorySelect(cat.name)}>
                        View all <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        {catProducts.slice(0, 4).map((product) => (
                          <ProductCard key={product.id} product={product} compact square />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No products available at the moment'
                }
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} compact square />
              ))}
            </div>
          )}
        </div>

        {/* Featured Section */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600 text-sm">
                  We source only the best materials from trusted manufacturers
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Expert Support</h3>
                <p className="text-gray-600 text-sm">
                  Our team of experts is here to help you with your projects
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Best Prices</h3>
                <p className="text-gray-600 text-sm">
                  Competitive pricing with no compromise on quality
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

// Export the main page component
export default HomePage
