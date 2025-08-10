'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/products/product-card'
import { Plus, Package, ShoppingCart, TrendingUp, Sparkles, Loader2, Palette, FolderPlus, ListOrdered, X } from 'lucide-react'
import { enhanceProductDescription } from '@/lib/gemini'
import type { Product, Category, Order } from '@/types'

// Using shared types from @/types

export default function SellerDashboard() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [enhancingDescription, setEnhancingDescription] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: [''],
    colors: [''],
    sizes: ['']
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || !userData || userData.role !== 'seller') {
        router.push('/auth/login')
        return
      }

      // Load seller's products
      const productsRef = ref(database, 'products')
      const unsubscribeProducts = onValue(productsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const sellerProducts = Object.entries(data)
            .filter(([_, product]: [string, any]) => product.sellerId === user.uid)
            .map(([id, product]: [string, any]) => ({ id, ...product }))
            .sort((a, b) => b.createdAt - a.createdAt)
          setProducts(sellerProducts)
        }
      })

      // Load orders for seller's products
      const ordersRef = ref(database, 'orders')
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const allOrders = Object.entries(data).map(([id, order]: [string, any]) => ({ id, ...order }))
          // Filter orders that contain items belonging to this seller.
          // Prefer filtering by item.sellerId for new orders; fallback to productId matching for legacy orders.
          const sellerOrders = allOrders
            .filter((order: Order) =>
              Array.isArray(order.products) &&
              order.products.some((p: any) =>
                (p?.sellerId && p.sellerId === user.uid) ||
                products.some(product => product.id === p.productId)
              )
            )
            .sort((a, b) => b.createdAt - a.createdAt)
          setOrders(sellerOrders)
        }
      })

      // Load categories
      const categoriesRef = ref(database, 'categories')
      const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const categoriesList = Object.entries(data).map(([id, category]: [string, any]) => ({ id, ...category }))
          setCategories(categoriesList)
        }
      })

      return () => {
        unsubscribeProducts()
        unsubscribeOrders()
        unsubscribeCategories()
      }
    }
  }, [user, userData, loading, initialized, router, products])

  const handleEnhanceDescription = async () => {
    if (!productForm.name || !productForm.description || !productForm.category) {
      alert('Please fill in product name, description, and category first')
      return
    }

    setEnhancingDescription(true)
    try {
      const enhancedDescription = await enhanceProductDescription(
        productForm.description,
        productForm.name,
        productForm.category
      )
      setProductForm(prev => ({ ...prev, description: enhancedDescription }))
    } catch (error) {
      console.error('Error enhancing description:', error)
      alert(error instanceof Error ? error.message : 'Failed to enhance description. Please try again.')
    } finally {
      setEnhancingDescription(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const productsRef = ref(database, 'products')
      const newProductRef = push(productsRef)
      
      await set(newProductRef, {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        sellerId: user.uid,
        sellerName: userData?.name || 'Seller',
        images: productForm.images.filter(img => img.trim() !== ''),
        colors: productForm.colors.filter(color => color.trim() !== ''),
        sizes: productForm.sizes.filter(size => size.trim() !== ''),
        createdAt: Date.now()
      })

      resetProductForm()
      setShowAddProduct(false)
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const categoriesRef = ref(database, 'categories')
      const newCategoryRef = push(categoriesRef)
      
      await set(newCategoryRef, {
        name: categoryForm.name,
        description: categoryForm.description,
        createdBy: user.uid,
        createdAt: Date.now()
      })

      setCategoryForm({ name: '', description: '' })
      setShowAddCategory(false)
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      images: [''],
      colors: [''],
      sizes: ['']
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      images: product.images.length > 0 ? product.images : [''],
      colors: product.colors && product.colors.length > 0 ? product.colors : [''],
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['']
    })
    setShowAddProduct(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      const productRef = ref(database, `products/${editingProduct.id}`)
      await set(productRef, {
        ...editingProduct,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        images: productForm.images.filter(img => img.trim() !== ''),
        colors: productForm.colors.filter(color => color.trim() !== ''),
        sizes: productForm.sizes.filter(size => size.trim() !== ''),
        updatedAt: Date.now()
      })

      setEditingProduct(null)
      resetProductForm()
      setShowAddProduct(false)
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const productRef = ref(database, `products/${productId}`)
      await remove(productRef)
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const addArrayField = (field: 'images' | 'colors' | 'sizes') => {
    setProductForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayField = (field: 'images' | 'colors' | 'sizes', index: number) => {
    setProductForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateArrayField = (field: 'images' | 'colors' | 'sizes', index: number, value: string) => {
    setProductForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = ref(database, `orders/${orderId}`)
      const orderToUpdate = orders.find(o => o.id === orderId)
      if (orderToUpdate) {
        await set(orderRef, { ...orderToUpdate, status, updatedAt: Date.now() })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user || !userData || userData.role !== 'seller') {
    return null
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const lowStockProducts = products.filter(product => product.stock < 10).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userData.name}! Manage your store efficiently.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              {lowStockProducts > 0 && (
                <p className="text-xs text-red-600">{lowStockProducts} low stock</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">{pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Available categories</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Products</h2>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingProduct ? 'Update product details' : 'Add a new product to your store'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                      <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                              id="name"
                              value={productForm.name}
                              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter product name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                              value={productForm.category} 
                              onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.name.toLowerCase()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description" className="flex items-center justify-between">
                            <span>Description *</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleEnhanceDescription}
                              disabled={enhancingDescription}
                              className="ml-2"
                            >
                              {enhancingDescription ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-1" />
                              )}
                              {enhancingDescription ? 'Enhancing...' : 'Enhance with AI'}
                            </Button>
                          </Label>
                          <Textarea
                            id="description"
                            value={productForm.description}
                            onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            placeholder="Enter product description..."
                            required
                          />
                          {enhancingDescription && (
                            <Alert className="mt-2">
                              <Sparkles className="h-4 w-4" />
                              <AlertDescription>
                                AI is enhancing your product description...
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price">Price (₹) *</Label>
                            <Input
                              id="price"
                              type="number"
                              value={productForm.price}
                              onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="stock">Stock Quantity *</Label>
                            <Input
                              id="stock"
                              type="number"
                              value={productForm.stock}
                              onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                              placeholder="0"
                              min="0"
                              required
                            />
                          </div>
                        </div>

                        {/* Images */}
                        <div>
                          <Label className="flex items-center justify-between">
                            <span>Product Images</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addArrayField('images')}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Image
                            </Button>
                          </Label>
                          <div className="space-y-2">
                            {productForm.images.map((image, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={image}
                                  onChange={(e) => updateArrayField('images', index, e.target.value)}
                                  placeholder="https://example.com/image.jpg"
                                  className="flex-1"
                                />
                                {productForm.images.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeArrayField('images', index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Colors */}
                        <div>
                          <Label className="flex items-center justify-between">
                            <span>Available Colors</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addArrayField('colors')}
                            >
                              <Palette className="h-4 w-4 mr-1" />
                              Add Color
                            </Button>
                          </Label>
                          <div className="space-y-2">
                            {productForm.colors.map((color, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={color}
                                  onChange={(e) => updateArrayField('colors', index, e.target.value)}
                                  placeholder="e.g., Red, Blue, White"
                                  className="flex-1"
                                />
                                {productForm.colors.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeArrayField('colors', index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sizes */}
                        <div>
                          <Label className="flex items-center justify-between">
                            <span>Available Sizes</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addArrayField('sizes')}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Size
                            </Button>
                          </Label>
                          <div className="space-y-2">
                            {productForm.sizes.map((size, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={size}
                                  onChange={(e) => updateArrayField('sizes', index, e.target.value)}
                                  placeholder="e.g., Small, Medium, Large, 2x2 feet"
                                  className="flex-1"
                                />
                                {productForm.sizes.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeArrayField('sizes', index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                            {editingProduct ? 'Update Product' : 'Add Product'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setShowAddProduct(false)
                              setEditingProduct(null)
                              resetProductForm()
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showSellerActions
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No products yet</p>
                <p className="text-gray-400">Add your first product to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListOrdered className="h-5 w-5 mr-2" />
                  Order Management
                </CardTitle>
                <CardDescription>Manage orders for your products</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{order.totalAmount.toLocaleString()}</p>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {order.products.map((product, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>
                                {product.name} × {product.quantity}
                                {product.color && <span className="text-gray-500"> ({product.color})</span>}
                                {product.size && <span className="text-gray-500"> - {product.size}</span>}
                              </span>
                              <span>₹{(product.price * product.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <div className="text-sm text-gray-600">
                              <p>📍 {order.address}</p>
                              <p>📞 {order.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Product Categories</h2>
                  <p className="text-sm text-gray-500">Manage your product categories for better organization</p>
                </div>
                <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>
                        Create a new product category for better organization
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Category Name *</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Electrical Items"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryDescription">Description</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of this category"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          Add Category
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAddCategory(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Map(categories.map(cat => [cat.id, cat])).values()).map((category) => (
                  <Card key={`${category.id}-${category.name}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <div className="mt-3">
                        <Badge variant="secondary">
                          {products.filter(p => p.category === category.name.toLowerCase()).length} products
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-bold">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value</span>
                      <span className="font-bold">
                        ₹{orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders</span>
                      <span className="font-bold">{orders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Orders</span>
                      <span className="font-bold text-yellow-600">{pendingOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Products</span>
                      <span className="font-bold">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Stock</span>
                      <span className="font-bold text-green-600">
                        {products.filter(p => p.stock > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Out of Stock</span>
                      <span className="font-bold text-red-600">
                        {products.filter(p => p.stock === 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock ({'<'} 10)</span>
                      <span className="font-bold text-yellow-600">{lowStockProducts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
