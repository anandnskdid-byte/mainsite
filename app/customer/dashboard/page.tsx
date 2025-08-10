'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, push, set } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ShoppingBag, User, MessageSquare, Package, Plus, Calendar } from 'lucide-react'

interface Order {
  id: string
  products: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  totalAmount: number
  status: string
  createdAt: number
  address: string
  paymentMethod: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  createdAt: number
  assignedTo?: string
}

export default function CustomerDashboard() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: ''
  })
  const [profile, setProfile] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    address: userData?.address || ''
  })

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || !userData || userData.role !== 'customer') {
        router.push('/auth/login')
        return
      }

      // Load customer orders
      const ordersRef = ref(database, 'orders')
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const customerOrders = Object.entries(data)
            .filter(([_, order]: [string, any]) => order.customerId === user.uid)
            .map(([id, order]: [string, any]) => ({ id, ...order }))
            .sort((a, b) => b.createdAt - a.createdAt)
          setOrders(customerOrders)
        }
      })

      // Load customer tickets
      const ticketsRef = ref(database, 'crm/tickets')
      const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const customerTickets = Object.entries(data)
            .filter(([_, ticket]: [string, any]) => ticket.createdBy === user.uid)
            .map(([id, ticket]: [string, any]) => ({ id, ...ticket }))
            .sort((a, b) => b.createdAt - a.createdAt)
          setTickets(customerTickets)
        }
      })

      return () => {
        unsubscribeOrders()
        unsubscribeTickets()
      }
    }
  }, [user, userData, loading, initialized, router])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const ticketsRef = ref(database, 'crm/tickets')
      const newTicketRef = push(ticketsRef)
      
      await set(newTicketRef, {
        createdBy: user.uid,
        customerName: userData?.name || '',
        subject: ticketForm.subject,
        description: ticketForm.description,
        status: 'open',
        createdAt: Date.now()
      })

      setTicketForm({ subject: '', description: '' })
      setShowCreateTicket(false)
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const userRef = ref(database, `users/${user.uid}`)
      await set(userRef, {
        ...userData,
        name: profile.name,
        phone: profile.phone,
        address: profile.address
      })
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user || !userData || userData.role !== 'customer') {
    return null
  }

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
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Welcome back, {userData.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>Track your orders and view order details</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <Button className="mt-4" onClick={() => router.push('/')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {order.products.map((product, index) => (
                            <p key={index} className="text-sm">
                              {product.name} × {product.quantity}
                            </p>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                          <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={userData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <Button type="submit">Update Profile</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>Get help with your orders and account</CardDescription>
                    </div>
                    <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Support Ticket</DialogTitle>
                          <DialogDescription>
                            Describe your issue and we'll help you resolve it
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={ticketForm.description}
                              onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Create Ticket
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No support tickets yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{ticket.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
