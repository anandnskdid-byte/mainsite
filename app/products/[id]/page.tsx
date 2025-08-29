'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { get, ref } from 'firebase/database'
import { database } from '@/lib/firebase'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, ChevronLeft, Package, User, Palette, Ruler } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/contexts/cart-context'

// Minimal Markdown -> HTML (safe subset) for description
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineFormat(str: string) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let inList = false
  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h3>${inlineFormat(escapeHtml(line.slice(4)))}</h3>`) 
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2>${inlineFormat(escapeHtml(line.slice(3)))}</h2>`) 
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h1>${inlineFormat(escapeHtml(line.slice(2)))}</h1>`) 
      continue
    }
    if (/^[*-]\s+/.test(line)) {
      if (!inList) { out.push('<ul class="list-disc pl-5">'); inList = true }
      out.push(`<li>${inlineFormat(escapeHtml(line.replace(/^[*-]\s+/, '')))}</li>`) 
      continue
    }
    if (line === '') { if (inList) { out.push('</ul>'); inList = false } continue }
    if (inList) { out.push('</ul>'); inList = false }
    out.push(`<p>${inlineFormat(escapeHtml(line))}</p>`)
  }
  if (inList) out.push('</ul>')
  return out.join('')
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = (params?.id as string) || ''
  const router = useRouter()

  const { user, userData } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeImage, setActiveImage] = useState(0)
  const images = useMemo(() => {
    if (!product) return [] as string[]
    const list = (product.images && product.images.length > 0)
      ? product.images
      : (product.imageUrl ? [product.imageUrl] : [])
    return list
  }, [product])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const snap = await get(ref(database, `products/${id}`))
        if (!mounted) return
        const data = snap.val()
        if (!data) {
          setProduct(null)
        } else {
          // Ensure id is present
          setProduct({ id, ...data })
        }
      } catch (e: any) {
        console.error('Failed to load product', e)
        setError('Failed to load product')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return
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
    try {
      addToCart(
        {
          productId: product?.id || '',
          name: product?.name || 'Unknown Product',
          price: product?.price || 0,
          image: images[activeImage] || product?.imageUrl || '',
          sellerId: product?.sellerId || '',
          sellerName: product?.sellerName || 'Unknown Seller',
        },
        1
      )
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add item to cart')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6"><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-100 animate-pulse rounded" />
            <div className="h-24 w-full bg-gray-100 animate-pulse rounded" />
            <div className="h-10 w-40 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6"><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>
        <h1 className="text-2xl font-semibold mb-2">Product not found</h1>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist.</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    )
  }

  const productName = product?.name || 'Unknown Product'
  const productDescription = product?.description || 'No description available'
  const productPrice = product?.price || 0
  const productCategory = product?.category || 'Uncategorized'
  const productSellerName = product?.sellerName || 'Unknown Seller'
  const productStock = product?.stock || 0
  const productColors = product?.colors || []
  const productSizes = product?.sizes || []

  // Check if this is a wall panels product for luxury styling
  const isWallPanelProduct = productCategory?.toLowerCase().includes('wall panel')

  return (
    <div className={`min-h-screen ${isWallPanelProduct ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className={`mb-4 sm:mb-6 ${isWallPanelProduct ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10' : ''}`}
        >
          <ChevronLeft className="h-4 w-4 mr-1"/>Back
        </Button>

        {isWallPanelProduct && (
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-400"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent tracking-wide">
                PREMIUM COLLECTION
              </h1>
              <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm font-medium tracking-wider uppercase">Professional Wall Panel Solutions</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Media */}
          <div className="space-y-4 sm:space-y-6">
            <Card className={`overflow-hidden ${isWallPanelProduct ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 shadow-2xl' : ''}`}>
              <CardContent className="p-0">
                <div className={`relative ${isWallPanelProduct ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-white'}`}>
                  {isWallPanelProduct && (
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-2 sm:px-4 py-1 sm:py-1.5 rounded-md shadow-lg border border-amber-400/30">
                        PREMIUM
                      </div>
                    </div>
                  )}
                  {images.length > 0 ? (
                    <img
                      src={images[activeImage] || '/placeholder.svg'}
                      alt={productName}
                      className={`w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-contain transition-all duration-700 ${isWallPanelProduct ? 'hover:scale-105 filter hover:brightness-110 p-2 sm:p-4' : ''}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-64 sm:h-80 md:h-96 lg:h-[500px] ${isWallPanelProduct ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gray-100'} flex items-center justify-center ${images.length > 0 ? 'hidden' : ''}`}>
                    <Package className={`h-12 sm:h-16 w-12 sm:w-16 ${isWallPanelProduct ? 'text-amber-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.slice(0, 6).map((img, idx) => (
                  <button
                    key={idx}
                    aria-label={`Preview ${idx + 1}`}
                    onMouseEnter={() => setActiveImage(idx)}
                    onClick={() => setActiveImage(idx)}
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                      idx === activeImage 
                        ? (isWallPanelProduct ? 'border-amber-500 shadow-md shadow-amber-500/30' : 'border-orange-500') 
                        : (isWallPanelProduct ? 'border-slate-600 hover:border-amber-400/70' : 'border-gray-300')
                    }`}
                  >
                    <img src={img} alt={`${productName} ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className={`space-y-4 sm:space-y-6 ${isWallPanelProduct ? 'text-white' : ''}`}>
            <div className="space-y-3 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isWallPanelProduct ? 'bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                  {productName}
                </h1>
                <Badge className={`${isWallPanelProduct ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium' : 'bg-orange-500'} hover:bg-orange-500 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 self-start`}>
                  {productCategory}
                </Badge>
              </div>

              <div className={`text-sm sm:text-base leading-relaxed ${isWallPanelProduct ? 'text-slate-300' : 'text-gray-700'} [&_h1]:text-lg sm:[&_h1]:text-xl [&_h2]:text-base sm:[&_h2]:text-lg [&_h3]:text-sm sm:[&_h3]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 sm:[&_ul]:pl-5 [&_p]:mb-2 sm:[&_p]:mb-3`}>
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(productDescription) }} />
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-xl ${isWallPanelProduct ? 'bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm' : 'bg-gray-50 border'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
                <div className={`text-2xl sm:text-3xl font-bold ${isWallPanelProduct ? 'text-amber-400' : 'text-orange-600'}`}>
                  ₹{productPrice.toLocaleString()}
                </div>
                <div className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium self-start sm:self-auto ${isWallPanelProduct ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50' : 'bg-gray-200 text-gray-600'}`}>
                  Stock: {productStock}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {productColors.length > 0 && (
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                    <Palette className={`h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 ${isWallPanelProduct ? 'text-amber-400' : 'text-gray-400'}`} />
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {productColors.map((c, i) => (
                        <Badge key={i} variant="outline" className={`text-xs ${isWallPanelProduct ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' : ''}`}>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {productSizes.length > 0 && (
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                    <Ruler className={`h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 ${isWallPanelProduct ? 'text-amber-400' : 'text-gray-400'}`} />
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {productSizes.map((s, i) => (
                        <Badge key={i} variant="outline" className={`text-xs ${isWallPanelProduct ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' : ''}`}>
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${isWallPanelProduct ? 'text-slate-400' : 'text-gray-600'}`}>
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Seller: {productSellerName}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={productStock <= 0}
                className={`w-full sm:flex-1 py-3 sm:py-3 font-semibold transition-all duration-300 ${
                  isWallPanelProduct 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {productStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className={`w-full sm:w-auto px-4 sm:px-6 py-3 ${isWallPanelProduct ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500' : ''}`}
              >
                Continue Shopping
              </Button>
            </div>

            {isWallPanelProduct && (
              <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-amber-400 mb-3 sm:mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></div>
                    <span>Premium Quality Materials</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></div>
                    <span>Professional Installation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></div>
                    <span>Durable Construction</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></div>
                    <span>Warranty Included</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
