'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingCart, User, LogOut, Home, Package, Users, MessageSquare, Menu, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { logoutUser } from '@/lib/auth'
import { useCart } from '@/contexts/cart-context'
import { useState, useEffect, useRef } from 'react'
import type { Category, Product } from '@/types'
import { database } from '@/lib/firebase'
import { ref, onValue, get } from 'firebase/database'

export function Navbar() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const { state } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const catScrollRef = useRef<HTMLDivElement>(null)
  const [activeCat, setActiveCat] = useState<Category | null>(null)
  const [loadingCat, setLoadingCat] = useState<string | null>(null)
  const [catProducts, setCatProducts] = useState<Record<string, Product[]>>({})
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollCats = (dx: number) => {
    const el = catScrollRef.current
    if (el) el.scrollBy({ left: dx, behavior: 'smooth' })
  }

  const fetchProductsForCategory = async (catName: string) => {
    if (catProducts[catName]) return
    try {
      setLoadingCat(catName)
      const snapshot = await get(ref(database, 'products'))
      const data = snapshot.val()
      let list: Product[] = []
      if (data) {
        list = (Object.entries(data)
          .map(([id, p]: [string, any]) => ({ id, ...(p as any) }))
          .filter((p: any) => p?.name && p?.category === catName)
          .sort((a: any, b: any) => (b?.createdAt || 0) - (a?.createdAt || 0))
          .slice(0, 8)) as Product[]
      }
      setCatProducts(prev => ({ ...prev, [catName]: list }))
    } catch (e) {
      console.error('Navbar products load failed:', e)
      setCatProducts(prev => ({ ...prev, [catName]: [] }))
    } finally {
      setLoadingCat(prev => (prev === catName ? null : prev))
    }
  }

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setActiveCat(null), 400)
  }

  const openCat = (cat: Category) => {
    cancelClose()
    setActiveCat(cat)
    fetchProductsForCategory(cat.name)
  }

  useEffect(() => {
    try {
      const categoriesRef = ref(database, 'categories')
      const unsubscribe = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const list = Object.entries(data).map(([id, c]: [string, any]) => ({
            id,
            name: c?.name || '',
            description: c?.description || '',
            imageUrl: c?.imageUrl || ''
          })).filter(c => c.name)
          setCategories(list)
        } else {
          setCategories([])
        }
      })
      return () => unsubscribe()
    } catch (e) {
      console.error('Navbar categories load failed:', e)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/?search=${encodeURIComponent(q)}` : '/')
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50 rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16 rounded-r-2xl ring-1 ring-gray-200 px-3">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Shri Karni Home Solutions
              </span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">
                Shri Karni
              </span>
            </Link>
          </div>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Products, Brands and More"
                  className="h-11 pl-9 bg-gray-50 rounded-full"
                />
              </div>
            </form>
          </div>

          {/* Right actions (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {loading ? (
              <div className="animate-pulse flex space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ) : user && userData ? (
              <>
                <Link href={userData.role === 'customer' ? '/customer/profile' : userData.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard'}>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {userData.name}
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart
                    {state.itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-500">
                        {state.itemCount > 99 ? '99+' : state.itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href={userData.role === 'seller' ? '/seller/dashboard' : userData.role === 'admin' ? '/admin/dashboard' : '/auth/register'}>
                  <Button variant="ghost" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    {userData.role === 'seller' || userData.role === 'admin' ? 'Dashboard' : 'Become a Seller'}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart
                    {state.itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-500">
                        {state.itemCount > 99 ? '99+' : state.itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="ghost" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Become a Seller
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="md:hidden ml-auto flex items-center space-x-2">
            {user && userData?.role === 'customer' && (
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {state.itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500">
                      {state.itemCount > 9 ? '9+' : state.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories strip (desktop) */}
        {categories.length > 0 && (
          <div className="hidden md:block relative">
            <div className="relative" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
              {/* Scroll buttons */}
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollCats(-300)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow ring-1 ring-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div ref={catScrollRef} className="overflow-x-auto px-10">
                <div className="flex gap-2 py-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="inline-block">
                      <Link href={`/?category=${encodeURIComponent(cat.name)}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full whitespace-nowrap"
                          onMouseEnter={() => openCat(cat)}
                          >
                           {cat.name}
                          </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollCats(300)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow ring-1 ring-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Category dropdown */}
              {activeCat && (
                <div className="absolute left-0 right-0 top-full z-40 pt-2" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                  <div className="bg-white border rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-4">
                      {activeCat.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activeCat.imageUrl}
                          alt={activeCat.name}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{activeCat.name}</div>
                        {activeCat.description && (
                          <div className="text-sm text-gray-600 line-clamp-2">{activeCat.description}</div>
                        )}
                        <Link
                          href={`/?category=${encodeURIComponent(activeCat.name)}`}
                          className="inline-block mt-2 text-sm text-orange-600 hover:underline"
                        >
                          Explore {activeCat.name}
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4">
                      {loadingCat === activeCat.name ? (
                        <div className="grid grid-cols-4 gap-4">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="h-14 w-14 bg-gray-100 rounded-md animate-pulse" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : catProducts[activeCat.name]?.length ? (
                        <div className="grid grid-cols-4 gap-4">
                          {catProducts[activeCat.name]!.map((p) => (
                            <Link key={p.id} href={`/products/${p.id}`} className="group flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={(p as any).imageUrl || (p as any).images?.[0] || '/placeholder.png'}
                                alt={p.name}
                                className="h-14 w-14 object-cover rounded-md border"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate group-hover:underline">{p.name}</div>
                                {typeof (p as any).price === 'number' && (
                                  <div className="text-xs text-gray-600">₹{((p as any).price as number).toLocaleString('en-IN')}</div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No products found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search (mobile) */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Products, Brands and More"
                className="h-11 pl-9 bg-gray-50 rounded-full"
              />
            </div>
          </form>
        </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {user && userData ? (
                  <>
                    <div className="px-3 py-2">
                      <span className="text-sm text-gray-600">
                        {userData.name} ({userData.role})
                      </span>
                    </div>

                    {userData.role === 'admin' && (
                      <Link href="/admin/dashboard">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Users className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}

                    {userData.role === 'seller' && (
                      <Link href="/seller/dashboard">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Package className="h-4 w-4 mr-2" />
                          Seller Dashboard
                        </Button>
                      </Link>
                    )}

                    {userData.role === 'customer' && (
                      <Link href="/customer/profile">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </Button>
                      </Link>
                    )}

                    <Link href="/crm/dashboard">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Support
                      </Button>
                    </Link>

                    <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/customer/login">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Customer Login
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Seller/Admin Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                        Register
                      </Button>
                    </Link>
                  </>
                )}

                {/* Quick categories (mobile) */}
                {categories.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="text-xs text-gray-500 uppercase mb-2">Categories</div>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.slice(0, 8).map(cat => (
                        <Link key={cat.id} href={`/?category=${encodeURIComponent(cat.name)}`}>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            {cat.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </nav>
  )
}
