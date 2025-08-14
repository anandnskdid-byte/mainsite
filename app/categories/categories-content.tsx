'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import type { Product, Category } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/products/product-card'
import { Search, Filter, Package, ShoppingBag, ArrowLeft, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function CategoriesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    console.log('Setting up Firebase listeners for categories page...')
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
    let result = [...products]

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      )
    }

    // Filter by price range
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      result = result.filter(product => {
        const price = product.price
        return price >= min && (isNaN(max) || price <= max)
      })
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
    }

    setFilteredProducts(result)
  }, [products, selectedCategory, searchTerm, sortBy, priceRange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is handled by the useEffect above
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading categories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold">
            {selectedCategory === 'all' 
              ? 'All Products' 
              : categories.find(cat => cat.id === selectedCategory)?.name || 'Products'}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} products found
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex-1 md:max-w-xs">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Price Range</h3>
                <div className="space-y-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Under ₹500', value: '0-500' },
                    { label: '₹500 - ₹1000', value: '500-1000' },
                    { label: '₹1000 - ₹2000', value: '1000-2000' },
                    { label: 'Over ₹2000', value: '2000-100000' },
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

              <div>
                <h3 className="font-medium mb-2">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Newest', value: 'newest' },
                    { label: 'Price: Low to High', value: 'price-low' },
                    { label: 'Price: High to Low', value: 'price-high' },
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
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        <div className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-gray-500 mt-2">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button className="mt-4" onClick={() => {
                setSelectedCategory('all')
                setSearchTerm('')
                setPriceRange('all')
              }}>
                Clear all filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={product.imageUrl || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{product.name}</h3>
                      <p className="text-gray-600 mt-1">{product.sellerName}</p>
                      <p className="text-lg font-bold mt-2">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <Button size="sm">Add to Cart</Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
