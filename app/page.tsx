'use client'

import { useState, useEffect, Suspense } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import type { Product, Category } from '@/types'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/products/product-card'
import { Search, Filter, Package, ShoppingBag, Users, Star, ArrowRight, Truck, ShieldCheck } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

// Using shared types from @/types

// Client-side only component to prevent hydration issues
const HomePageContent = () => {
  useEffect(() => {
    console.log('HomePage mounted on client side')
  }, [])
  
  return <HomePage />
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
  const searchParams = useSearchParams()

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

  // Respect category query param from URL (e.g., /?category=Cement)
  useEffect(() => {
    try {
      const cat = (searchParams.get('category') || '').trim()
      if (cat) {
        setSelectedCategory(cat)
      }
    } catch (e) {
      console.error('Error reading category query:', e)
    }
  }, [searchParams])

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
      {/* Hero Section */}
      <div className="relative overflow-hidden text-white">
        {/* Gradient background + soft shapes */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 items-center gap-10">
            {/* Left: Copy + Search + CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 text-sm mb-4">
                <ShieldCheck className="h-4 w-4" />
                100% Genuine Materials
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Shri Karni <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-white">Home Solutions</span>
              </h1>
              <p className="text-lg md:text-xl mt-4 md:mt-6 opacity-90 max-w-xl">
                Your one‑stop destination for premium home & construction materials at the best prices.
              </p>

              {/* Search */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 max-w-xl">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white text-gray-900 border-0 focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <Button 
                  onClick={clearFilters}
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Quick category pills */}
              {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCategorySelect('all')}
                    className={`h-8 px-3 rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 ${selectedCategory === 'all' ? 'ring-2 ring-white/60' : ''}`}
                  >
                    All
                  </Button>
                  {categories.slice(0, 6).map((cat) => (
                    <Button
                      key={cat.id}
                      variant="outline"
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`h-8 px-3 rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 ${selectedCategory === cat.name ? 'ring-2 ring-white/60' : ''}`}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* CTAs + trust */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="bg-white text-orange-600 hover:bg-gray-100">
                  Shop Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button className="bg-transparent border border-white/40 text-white hover:bg-white/10">
                  Explore Categories
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Fast Delivery
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Trusted Sellers
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Secure Purchase
                </div>
              </div>
            </div>

            {/* Right: Visuals */}
            <div className="relative h-72 md:h-96">
              <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div
                  className="absolute inset-0 bg-center bg-cover scale-110"
                  style={{ 
                    backgroundImage: 'url("https://i.pinimg.com/736x/15/52/4a/15524a638c9f495ccec2dbb84fc3e97b.jpg")',
                    backgroundPosition: 'center 45%'
                  }}
                />
                {/* Frosted glass overlay + neutral scrim */}
                <div className="absolute inset-0 bg-white/8 backdrop-blur-sm backdrop-saturate-125" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent" />
              </div>

              {/* Floating cards */}
              <div className="absolute top-6 right-6 bg-white text-gray-900 rounded-xl shadow-xl p-4 w-40">
                <div className="flex items-center justify-between">
                  <Star className="h-5 w-5 text-orange-500" />
                  <span className="text-xs text-gray-500">Top Rated</span>
                </div>
                <p className="mt-2 text-sm">Quality you can trust</p>
              </div>

              <div className="absolute bottom-8 left-6 bg-white text-gray-900 rounded-xl shadow-xl p-4 w-48">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <p className="font-semibold">{products.length}+ Products</p>
                </div>
                <p className="mt-1 text-xs text-gray-600">New arrivals every week</p>
              </div>

              <div className="absolute top-24 left-10 bg-white text-gray-900 rounded-xl shadow-xl p-4 w-36">
                <p className="text-xs text-gray-500 mb-1">Popular</p>
                <p className="font-semibold">Cement, Steel, Paints</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedCategory === category.name ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                        }`}
                        onClick={() => handleCategorySelect(category.name)}
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
                {selectedCategory === 'all' ? 'All Products' : selectedCategory}
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

          {filteredProducts.length === 0 ? (
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
                <ProductCard key={product.id} product={product} compact />
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
    </div>
  )
}

// Export the main page component
export default HomePage
