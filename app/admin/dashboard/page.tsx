'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, set, remove } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Package, ShoppingCart, MessageSquare, TrendingUp, DollarSign, UserCheck, UserX, Eye, Edit, Trash2, Plus } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  shopName?: string
  approved?: boolean
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  sellerId: string
  sellerName?: string
}

interface Order {
  id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: number
  products: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface Ticket {
  id: string
  createdBy: string
  customerName: string
  subject: string
  description: string
  status: string
  createdAt: number
  assignedTo?: string
}

export default function AdminDashboard() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalTickets: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    pendingSellers: 0
  })

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || !userData || userData.role !== 'admin') {
        router.push('/auth/login')
        return
      }

      // Load all data
      const usersRef = ref(database, 'users')
      const productsRef = ref(database, 'products')
      const ordersRef = ref(database, 'orders')
      const ticketsRef = ref(database, 'crm/tickets')

      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const usersList = Object.entries(data).map(([id, user]: [string, any]) => ({ id, ...user }))
          setUsers(usersList)
          
          const pendingSellers = usersList.filter(u => u.role === 'seller' && !u.approved).length
          setStats(prev => ({ 
            ...prev, 
            totalUsers: usersList.length,
            pendingSellers
          }))
        }
      })

      const unsubscribeProducts = onValue(productsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const productsList = Object.entries(data).map(([id, product]: [string, any]) => ({ id, ...product }))
          setProducts(productsList)
          setStats(prev => ({ ...prev, totalProducts: productsList.length }))
        }
      })

      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const ordersList = Object.entries(data).map(([id, order]: [string, any]) => ({ id, ...order }))
          setOrders(ordersList)
          
          const totalRevenue = ordersList.reduce((sum, order) => sum + order.totalAmount, 0)
          const pendingOrders = ordersList.filter(order => order.status === 'pending').length
          
          setStats(prev => ({ 
            ...prev, 
            totalOrders: ordersList.length,
            totalRevenue,
            pendingOrders
          }))
        }
      })

      const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const ticketsList = Object.entries(data).map(([id, ticket]: [string, any]) => ({ id, ...ticket }))
          setTickets(ticketsList)
          setStats(prev => ({ ...prev, totalTickets: ticketsList.length }))
        }
      })

      return () => {
        unsubscribeUsers()
        unsubscribeProducts()
        unsubscribeOrders()
        unsubscribeTickets()
      }
    }
  }, [user, userData, loading, initialized, router])

  const handleApproveUser = async (userId: string, approved: boolean) => {
    try {
      const userRef = ref(database, `users/${userId}`)
      const userToUpdate = users.find(u => u.id === userId)
      if (userToUpdate) {
        await set(userRef, { ...userToUpdate, approved })
      }
    } catch (error) {
      console.error('Error updating user approval:', error)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = ref(database, `orders/${orderId}`)
      const orderToUpdate = orders.find(o => o.id === orderId)
      if (orderToUpdate) {
        await set(orderRef, { ...orderToUpdate, status })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const ticketRef = ref(database, `crm/tickets/${ticketId}`)
      const ticketToUpdate = tickets.find(t => t.id === ticketId)
      if (ticketToUpdate) {
        await set(ticketRef, { ...ticketToUpdate, status })
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
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

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user || !userData || userData.role !== 'admin') {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'open': return 'bg-red-100 text-red-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your e-commerce platform</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="tickets">Support</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary">{stats.pendingSellers} pending sellers</Badge>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Listed products</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary">{stats.pendingOrders} pending</Badge>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total sales</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">#{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{order.totalAmount.toLocaleString()}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-gray-600">{ticket.customerName}</p>
                        </div>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage customers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          {user.role === 'seller' && user.shopName && (
                            <Badge variant="secondary">{user.shopName}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.role === 'seller' && (
                          <>
                            {user.approved ? (
                              <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                            <Button
                              size="sm"
                              variant={user.approved ? "destructive" : "default"}
                              onClick={() => handleApproveUser(user.id, !user.approved)}
                            >
                              {user.approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage all products across sellers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">₹{product.price} • Stock: {product.stock}</p>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Manage all orders across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
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
                          <p key={index} className="text-sm">
                            {product.name} × {product.quantity} = ₹{(product.price * product.quantity).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Ticket Management</CardTitle>
                <CardDescription>Manage customer support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-gray-600">{ticket.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-gray-700">{ticket.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-bold">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value</span>
                      <span className="font-bold">
                        ₹{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders</span>
                      <span className="font-bold">{stats.totalOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Customers</span>
                      <span className="font-bold">{users.filter(u => u.role === 'customer').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sellers</span>
                      <span className="font-bold">{users.filter(u => u.role === 'seller').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Products</span>
                      <span className="font-bold">{products.filter(p => p.stock > 0).length}</span>
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
