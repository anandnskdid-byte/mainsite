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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6"><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Media */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {images.length > 0 ? (
                <img
                  src={images[activeImage] || '/placeholder.svg'}
                  alt={productName}
                  className="w-full h-96 object-contain bg-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`w-full h-96 bg-gray-100 flex items-center justify-center ${images.length > 0 ? 'hidden' : ''}`}>
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  aria-label={`Preview ${idx + 1}`}
                  onMouseEnter={() => setActiveImage(idx)}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-16 rounded-md overflow-hidden border ${idx === activeImage ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img src={img} alt={`${productName} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl font-semibold">{productName}</h1>
            <Badge className="bg-orange-500 hover:bg-orange-500">{productCategory}</Badge>
          </div>

          <div
            className="text-gray-700 leading-relaxed mb-4 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: mdToHtml(productDescription) }}
          />

          <div className="flex items-center gap-6 mb-4">
            <div className="text-3xl font-bold text-orange-600">₹{productPrice.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Stock: {productStock}</div>
          </div>

          <div className="space-y-3 mb-6">
            {productColors.length > 0 && (
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-400" />
                <div className="flex gap-2 flex-wrap">
                  {productColors.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {productSizes.length > 0 && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-gray-400" />
                <div className="flex gap-2 flex-wrap">
                  {productSizes.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Seller: {productSellerName}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={productStock <= 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {productStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>Continue Shopping</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
