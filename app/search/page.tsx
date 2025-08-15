'use client'

import { useState, useEffect, Suspense } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import type { Product, Category } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/products/product-card'
import { Search, Filter, Package, ShoppingBag, ArrowLeft, Grid, List, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const SearchContent = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('relevance')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || ''
    const categoryFromUrl = searchParams.get('category') || 'all'
    setSearchTerm(queryFromUrl)
    setSelectedCategory(categoryFromUrl)
  }, [searchParams])

  useEffect(() => {
    console.log('Setting up Firebase listeners for search page...')
    try {
      // Load products
      const productsRef = ref(database, 'products')
      const unsubscribeProducts = onValue(productsRef, (snapshot) => {
        try {
          const data = snapshot.val()
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
              .filter(product => product.name && product.category)
              .sort((a, b) => b.createdAt - a.createdAt)
            
            setProducts(productList)
          }
        } catch (err) {
          console.error('Error processing products:', err)
        }
      })

      // Load categories
      const categoriesRef = ref(database, 'categories')
      const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            const categoryList = Object.entries(data).map(([id, category]: [string, any]) => ({
              id,
              ...category,
              name: category?.name || '',
              description: category?.description || '',
              imageUrl: category?.imageUrl || ''
            }))
            setCategories(categoryList)
          }
        } catch (err) {
          console.error('Error processing categories:', err)
        } finally {
          setLoading(false)
        }
      })

      return () => {
        unsubscribeProducts()
        unsubscribeCategories()
      }
    } catch (err) {
      console.error('Error setting up Firebase listeners:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      let filtered = [...products]

      // Filter by search term (primary filter for search page)
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

      // Filter by category
      if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(product => {
          const productCategory = product?.category || ''
          const selectedCat = selectedCategory || ''
          return productCategory.toLowerCase() === selectedCat.toLowerCase()
        })
      }

      // Filter by price range
      if (priceRange !== 'all') {
        filtered = filtered.filter(product => {
          const price = product.price || 0
          switch (priceRange) {
            case 'under-500':
              return price < 500
            case '500-1000':
              return price >= 500 && price <= 1000
            case '1000-2000':
              return price >= 1000 && price <= 2000
            case 'above-2000':
              return price > 2000
            default:
              return true
          }
        })
      }

      // Sort products
      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
          break
        case 'price-high':
          filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
          break
        case 'name':
          filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          break
        case 'newest':
          filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          break
        case 'relevance':
        default:
          // For relevance, prioritize exact matches in name, then partial matches
          if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim()
            filtered.sort((a, b) => {
              const aName = (a.name || '').toLowerCase()
              const bName = (b.name || '').toLowerCase()
              
              // Exact matches first
              const aExact = aName === searchLower ? 1 : 0
              const bExact = bName === searchLower ? 1 : 0
              if (aExact !== bExact) return bExact - aExact
              
              // Then name starts with search term
              const aStarts = aName.startsWith(searchLower) ? 1 : 0
              const bStarts = bName.startsWith(searchLower) ? 1 : 0
              if (aStarts !== bStarts) return bStarts - aStarts
              
              // Finally by creation date
              return (b.createdAt || 0) - (a.createdAt || 0)
            })
          }
          break
      }

      setFilteredProducts(filtered)
    } catch (err) {
      console.error('Error filtering products:', err)
      setFilteredProducts(products)
    }
  }, [products, searchTerm, selectedCategory, sortBy, priceRange])

  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    const params = new URLSearchParams()
    if (newSearchTerm.trim()) {
      params.set('q', newSearchTerm.trim())
    }
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory)
    }
    router.replace(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setPriceRange('all')
    setSortBy('relevance')
    router.replace('/search')
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Search Results
              </h1>
              <p className="text-gray-600 mt-1">
                {searchTerm ? (
                  <>
                    {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
                    {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                  </>
                ) : (
                  `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchTerm)
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchTerm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Clear All
                </Button>
              </div>
              
              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                    <Badge variant="secondary" className="ml-auto">
                      {products.length}
                    </Badge>
                  </Button>
                  {categories.map((category) => {
                    const categoryProducts = products.filter(p => 
                      p.category.toLowerCase() === category.name.toLowerCase()
                    )
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.name ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        {category.name}
                        <Badge variant="secondary" className="ml-auto">
                          {categoryProducts.length}
                        </Badge>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'under-500', label: 'Under ₹500' },
                    { value: '500-1000', label: '₹500 - ₹1,000' },
                    { value: '1000-2000', label: '₹1,000 - ₹2,000' },
                    { value: 'above-2000', label: 'Above ₹2,000' }
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={priceRange === range.value ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setPriceRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'relevance', label: 'Most Relevant' },
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'name', label: 'Name A-Z' }
                  ].map((sort) => (
                    <Button
                      key={sort.value}
                      variant={sortBy === sort.value ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSortBy(sort.value)}
                    >
                      {sort.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            {!searchTerm && selectedCategory === 'all' ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
                <p className="text-gray-600 mb-4">
                  Enter a search term to find products
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? `No results found for "${searchTerm}"` : 'No products match your filters'}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Try:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Checking your spelling</li>
                    <li>• Using different keywords</li>
                    <li>• Removing some filters</li>
                  </ul>
                </div>
                <Button onClick={clearFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    compact={viewMode === 'grid'} 
                    square={viewMode === 'grid'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SearchPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

export default SearchPage
