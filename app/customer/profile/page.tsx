'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, set, push, remove } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, MapPin, ShoppingBag, Heart, MessageSquare, Plus, Edit, Trash2, Package, Calendar, Phone, Mail, Home } from 'lucide-react'

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

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  createdAt: number
}

export default function CustomerProfilePage() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [profile, setProfile] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    email: userData?.email || ''
  })
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false
  })
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: ''
  })
  const [updateSuccess, setUpdateSuccess] = useState(false)

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

      // Load customer addresses
      const addressesRef = ref(database, `customers/${user.uid}/addresses`)
      const unsubscribeAddresses = onValue(addressesRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const addressList = Object.entries(data).map(([id, address]: [string, any]) => ({ id, ...address }))
          setAddresses(addressList)
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
        unsubscribeAddresses()
        unsubscribeTickets()
      }
    }
  }, [user, userData, loading, initialized, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const userRef = ref(database, `users/${user.uid}`)
      await set(userRef, {
        ...userData,
        name: profile.name,
        phone: profile.phone
      })
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const addressesRef = ref(database, `customers/${user.uid}/addresses`)
      const newAddressRef = push(addressesRef)
      
      await set(newAddressRef, {
        ...addressForm,
        createdAt: Date.now()
      })

      setAddressForm({
        name: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        isDefault: false
      })
      setShowAddAddress(false)
    } catch (error) {
      console.error('Error adding address:', error)
    }
  }

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingAddress) return

    try {
      const addressRef = ref(database, `customers/${user.uid}/addresses/${editingAddress.id}`)
      await set(addressRef, {
        ...editingAddress,
        ...addressForm,
        updatedAt: Date.now()
      })

      setEditingAddress(null)
      setAddressForm({
        name: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        isDefault: false
      })
      setShowAddAddress(false)
    } catch (error) {
      console.error('Error updating address:', error)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !confirm('Are you sure you want to delete this address?')) return

    try {
      const addressRef = ref(database, `customers/${user.uid}/addresses/${addressId}`)
      await remove(addressRef)
    } catch (error) {
      console.error('Error deleting address:', error)
    }
  }

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

  const handleCancelTicket = async (ticketId: string) => {
    if (!user || !confirm('Are you sure you want to cancel this ticket?')) return

    try {
      const ticketRef = ref(database, `crm/tickets/${ticketId}`)
      const ticketToUpdate = tickets.find(t => t.id === ticketId)
      if (ticketToUpdate) {
        await set(ticketRef, { ...ticketToUpdate, status: 'cancelled' })
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error)
    }
  }

  const editAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
      isDefault: address.isDefault
    })
    setShowAddAddress(true)
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
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Saved Addresses</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{addresses.length}</div>
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                {updateSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      Profile updated successfully!
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Order History
                </CardTitle>
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
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-1 mb-3">
                          {order.products.map((product, index) => (
                            <p key={index} className="text-sm">
                              {product.name} × {product.quantity}
                            </p>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    {orders.length > 5 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => router.push('/customer/orders')}>
                          View All Orders
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Saved Addresses
                    </CardTitle>
                    <CardDescription>Manage your delivery addresses</CardDescription>
                  </div>
                  <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAddress ? 'Update your address details' : 'Add a new delivery address'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress} className="space-y-4">
                        <div>
                          <Label htmlFor="addressName">Address Name</Label>
                          <Input
                            id="addressName"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Home, Office, etc."
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Textarea
                            id="street"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                            placeholder="Enter your full address"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              value={addressForm.pincode}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="addressPhone">Phone</Label>
                            <Input
                              id="addressPhone"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          {editingAddress ? 'Update Address' : 'Add Address'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No saved addresses</p>
                    <p className="text-gray-400 text-sm">Add an address for faster checkout</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium flex items-center">
                              <Home className="h-4 w-4 mr-1" />
                              {address.name}
                            </p>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => editAddress(address)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{address.street}</p>
                        <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {address.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Support Tickets
                    </CardTitle>
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
                            placeholder="Brief description of your issue"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={ticketForm.description}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide detailed information about your issue"
                            rows={4}
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
                    <p className="text-gray-400 text-sm">Create a ticket if you need help</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </Badge>
                            {ticket.status === 'open' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCancelTicket(ticket.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{ticket.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive order updates via email</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Receive order updates via SMS</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                    <div>
                      <p className="font-medium text-red-600">Delete Account</p>
                      <p className="text-sm text-gray-600">Permanently delete your account</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
