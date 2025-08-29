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
import { PremiumHero } from '@/components/hero/premium-hero'
import { Search, Filter, Package, ShoppingBag, Users, Star, ArrowRight, Truck, ShieldCheck, Award, Clock, HeartHandshake, Zap, CheckCircle, Phone } from 'lucide-react'
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
      
      {/* Premium Hero Section */}
      <PremiumHero />

      <div className="space-y-8">
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

        {/* Enhanced Why Choose Us Section with Wall Banner - Mobile Optimized */}
        {products.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-orange-100">
            {/* Wall Panels Banner */}
            <div className="mb-6 md:mb-8 group cursor-pointer overflow-hidden rounded-lg md:rounded-xl">
              <img
                src="/wall.png"
                alt="Great Range of Wall Panels - Shree Karni Home Solutions"
                className="w-full h-auto rounded-lg md:rounded-xl shadow-lg transition-all duration-700 ease-in-out transform group-hover:scale-105 group-hover:shadow-2xl filter grayscale group-hover:grayscale-0"
              />
            </div>
            
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                Why Choose <span className="text-orange-600">Shri Karni</span>?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Your trusted partner for premium construction materials
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Quality Products */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Award className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Premium Quality</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Finest materials from certified manufacturers
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-orange-600">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">ISO Certified</span>
                </div>
              </div>

              {/* Expert Support */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <HeartHandshake className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Expert Guidance</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Personalized consultation & support
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-blue-600">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">24/7 Support</span>
                </div>
              </div>

              {/* Best Prices */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Star className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Best Prices</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Competitive pricing & flexible payments
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-green-600">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">Best Price</span>
                </div>
              </div>

              {/* Fast Delivery */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Truck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Fast Delivery</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Quick delivery with real-time tracking
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-purple-600">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">Same Day</span>
                </div>
              </div>

              {/* Trusted Brand */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Trusted Brand</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Over a decade of excellence
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-indigo-600">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">10K+ Customers</span>
                </div>
              </div>

              {/* Innovation */}
              <div className="group text-center p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2">Innovation</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">
                  Latest tech & eco-friendly solutions
                </p>
                <div className="flex items-center justify-center mt-2 sm:mt-3 text-yellow-600">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">Eco-Friendly</span>
                </div>
              </div>
            </div>

            {/* Call to Action - Mobile Optimized */}
            <div className="text-center bg-white rounded-lg md:rounded-xl p-4 sm:p-6 md:p-8 shadow-md border border-orange-200">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-4">
                Ready to Start Your Project?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 md:mb-6 max-w-xl mx-auto px-2">
                Join thousands of satisfied customers who trust Shri Karni
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="default"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base"
                >
                  Contact Expert
                  <Phone className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Wall Panels Products Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              Our <span className="text-orange-600">Wall Panels</span> Collection
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Transform your spaces with our premium wall panel solutions
            </p>
          </div>

          {(() => {
            const wallPanelProducts = products.filter(
              (p) => (p.category || '').toLowerCase().includes('wall') || 
                     (p.name || '').toLowerCase().includes('wall panel') ||
                     (p.description || '').toLowerCase().includes('wall panel')
            )
            
            if (wallPanelProducts.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Wall Panels Coming Soon</h3>
                  <p className="text-gray-600">We're adding new wall panel products to our collection</p>
                </div>
              )
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {wallPanelProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} compact square />
                ))}
              </div>
            )
          })()}

          {(() => {
            const wallPanelProducts = products.filter(
              (p) => (p.category || '').toLowerCase().includes('wall') || 
                     (p.name || '').toLowerCase().includes('wall panel') ||
                     (p.description || '').toLowerCase().includes('wall panel')
            )
            
            if (wallPanelProducts.length > 12) {
              return (
                <div className="text-center mt-6">
                  <Link href="/categories?category=wall panels">
                    <Button 
                      size="lg" 
                      className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      View All Wall Panels
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>
    </div>
  )
}

// Export the main page component
export default HomePage
