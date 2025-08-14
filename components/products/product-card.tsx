'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/contexts/cart-context'
import { ShoppingCart, Package, User, Palette, Ruler, Heart, Star } from 'lucide-react'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  showSellerActions?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
  compact?: boolean
  square?: boolean
}

export function ProductCard({ product, compact = false, square = false }: ProductCardProps) {
  const { user, userData } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)

  const handleAddToCart = async () => {
    // Check if user is authenticated and is a customer
    if (!user || !userData) {
      router.push('/customer/login')
      return
    }

    if (userData.role !== 'customer') {
      alert('Only customers can add items to cart')
      return
    }

    if ((product?.stock || 0) <= 0) {
      alert('Product is out of stock')
      return
    }

    setIsAdding(true)
    try {
      addToCart(
        {
          productId: product?.id || '',
          name: product?.name || 'Unknown Product',
          price: product?.price || 0,
          image: (product?.images && product.images.length > 0) ? product.images[0] : (product?.imageUrl || ''),
          sellerId: product?.sellerId || '',
          sellerName: product?.sellerName || 'Unknown Seller',
        },
        1
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
    } finally {
      setIsAdding(false)
    }
  }

  // Safe property access with fallbacks
  const productName = product?.name || 'Unknown Product'
  const productDescription = product?.description || 'No description available'
  const productPrice = product?.price || 0
  const productCategory = product?.category || 'Uncategorized'
  const productImageUrl = product?.imageUrl || ''
  const productSellerName = product?.sellerName || 'Unknown Seller'
  const productStock = product?.stock || 0
  const productColors = product?.colors || []
  const productSizes = product?.sizes || []
  const productId = product?.id || ''
  const images = (product?.images && product.images.length > 0)
    ? product.images
    : (productImageUrl ? [productImageUrl] : [])
  const isNew = typeof product?.createdAt === 'number' && (Date.now() - product.createdAt) < (14 * 24 * 60 * 60 * 1000)

  // Optional/extended fields for richer UI (fallback-safe)
  const mrp: number = (product as any)?.mrp || 0
  const hasDiscount = mrp > productPrice && productPrice > 0
  const discountPercent = hasDiscount ? Math.round(((mrp - productPrice) / mrp) * 100) : 0
  const rating: number | null = typeof (product as any)?.rating === 'number' ? (product as any).rating : null
  const reviewsCount: number | null = typeof (product as any)?.reviewsCount === 'number' ? (product as any).reviewsCount : null

  // Wishlist persistence (localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined' && productId) {
      try {
        const arr = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlisted(Array.isArray(arr) && arr.includes(productId))
      } catch {}
    }
  }, [productId])

  const toggleWishlist = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (typeof window === 'undefined' || !productId) return
    try {
      const arr = JSON.parse(localStorage.getItem('wishlist') || '[]')
      let next = Array.isArray(arr) ? arr : []
      if (wishlisted) {
        next = next.filter((id: string) => id !== productId)
      } else {
        if (!next.includes(productId)) next.push(productId)
      }
      localStorage.setItem('wishlist', JSON.stringify(next))
      setWishlisted(!wishlisted)
    } catch {
      // no-op
    }
  }

  // Compact card: image + title only (supports square thumbnail)
  if (compact) {
    if (square) {
      return (
        <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
          <Link href={productId ? `/products/${productId}` : '#'} className="block">
            <div className="relative bg-white">
              <div className="relative w-full" style={{ paddingTop: '100%' }}>
                {images.length > 0 ? (
                  <img
                    src={images[0] || "/placeholder.svg"}
                    alt={productName}
                    className="absolute inset-0 h-full w-full object-contain p-2 rounded-t-lg"
                    onError={(e) => {
                      const target = (e.target as HTMLImageElement)
                      target.style.display = 'none'
                      const next = (target.parentElement?.querySelector('[data-fallback]') as HTMLElement | null)
                      next && next.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div
                  data-fallback
                  className={`absolute inset-0 bg-gray-100 rounded-t-lg flex items-center justify-center ${images.length > 0 ? 'hidden' : ''}`}
                >
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
              </div>
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 text-center">
                {productName}
              </h3>
              <div className="mt-1 text-sm font-semibold text-orange-600 text-center">
                ₹{productPrice.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Link>
        </Card>
      )
    }
    return (
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <Link href={productId ? `/products/${productId}` : '#'} className="block">
          <div className="relative bg-white">
            {images.length > 0 ? (
              <img
                src={images[0] || "/placeholder.svg"}
                alt={productName}
                className="w-full h-44 sm:h-52 object-contain rounded-t-lg p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-full h-44 sm:h-52 bg-gray-100 rounded-t-lg flex items-center justify-center ${images.length > 0 ? 'hidden' : ''}`}>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="font-medium text-sm line-clamp-2 text-center">
              {productName}
            </h3>
            <div className="mt-1 text-sm font-semibold text-orange-600 text-center">
              ₹{productPrice.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <div className="relative group">
        <Link href={productId ? `/products/${productId}` : '#'}>
          {images.length > 0 ? (
            <img
              src={images[activeImage] || "/placeholder.svg"}
              alt={productName}
              className="w-full h-48 object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-[1.03]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}

          {/* Fallback placeholder */}
          <div className={`w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center ${images.length > 0 ? 'hidden' : ''}`}>
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        </Link>

        {productStock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
            <Badge variant="destructive" className="text-white">
              Out of Stock
            </Badge>
          </div>
        )}

        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-600">
            -{discountPercent}%
          </Badge>
        )}

        {isNew && (
          <Badge className={`absolute ${hasDiscount ? 'top-10' : 'top-2'} left-2 bg-green-600 hover:bg-green-600`}>
            New
          </Badge>
        )}

        <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-500">
          {productCategory}
        </Badge>

        {/* Wishlist toggle */}
        <button
          type="button"
          onClick={(e) => toggleWishlist(e)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow hover:bg-white flex items-center justify-center"
        >
          <Heart className={`h-5 w-5 ${wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>
      </div>

      {images.length > 1 && (
        <div className="px-3 py-2 flex gap-2 overflow-x-auto">
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              aria-label={`Preview ${idx + 1}`}
              onMouseEnter={() => setActiveImage(idx)}
              onClick={() => setActiveImage(idx)}
              className={`h-12 w-12 rounded-md overflow-hidden border ${idx === activeImage ? 'border-orange-500' : 'border-transparent'}`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          {images.length > 5 && (
            <div className="h-12 w-12 rounded-md border flex items-center justify-center text-xs text-gray-500">
              +{images.length - 5}
            </div>
          )}
        </div>
      )}

      <CardContent className="flex-1 p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          <Link href={productId ? `/products/${productId}` : '#'} className="hover:text-orange-600">
            {productName}
          </Link>
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {productDescription}
        </p>

        {/* Rating (if available) */}
        {typeof rating === 'number' && (
          <div className="flex items-center gap-1 mb-3">
            {[0,1,2,3,4].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}{reviewsCount ? ` (${reviewsCount})` : ''}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <User className="h-4 w-4 mr-1" />
          <span>{productSellerName}</span>
        </div>

        {/* Colors and Sizes */}
        <div className="space-y-2 mb-3">
          {productColors.length > 0 && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {productColors.slice(0, 3).map((color, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {color}
                  </Badge>
                ))}
                {productColors.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{productColors.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {productSizes.length > 0 && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1 flex-wrap">
                {productSizes.slice(0, 3).map((size, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {size}
                  </Badge>
                ))}
                {productSizes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{productSizes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">
              ₹{productPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ₹{mrp.toLocaleString('en-IN')}
              </span>
            )}
            {hasDiscount && (
              <Badge className="bg-green-600 hover:bg-green-600 text-white">-{discountPercent}%</Badge>
            )}
          </div>
          <span className="text-sm text-gray-500">Stock: {productStock}</span>
        </div>
        {productStock > 0 && productStock <= 5 && (
          <div className="mt-2 text-xs text-red-600">
            Hurry! Only {productStock} left.
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleAddToCart}
            disabled={productStock <= 0 || isAdding}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300"
          >
            {isAdding ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {productStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(productId ? `/products/${productId}` : '#')}
          >
            View
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
