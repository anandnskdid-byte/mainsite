'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Calendar, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'

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
  phone: string
}

export default function CustomerOrdersPage() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || !userData || userData.role !== 'customer') {
        router.push('/auth/login')
        return
      }

      const ordersRef = ref(database, 'orders')
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const customerOrders = Object.entries(data)
            .filter(([_, order]: [string, any]) => order.customerId === user.uid)
            .map(([id, order]: [string, any]) => ({ id, ...order }))
            .sort((a, b) => b.createdAt - a.createdAt)
          setOrders(customerOrders)
        }
      })

      return () => unsubscribe()
    }
  }, [user, userData, loading, initialized, router])

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/customer/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <Link href="/">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Order #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Products */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Items Ordered:</h4>
                    <div className="space-y-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                          </div>
                          <p className="font-medium">₹{(product.price * product.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Delivery Address
                      </h4>
                      <p className="text-sm text-gray-600">{order.address}</p>
                      <p className="text-sm text-gray-600">Phone: {order.phone}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Payment Details
                      </h4>
                      <p className="text-sm text-gray-600">Method: {order.paymentMethod}</p>
                      <p className="text-lg font-bold text-green-600">Total: ₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Order Status Timeline */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-3">Order Status</h4>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-600' : 'bg-gray-400'} mr-2`}></div>
                        <span className="text-sm">Confirmed</span>
                      </div>
                      <div className={`flex items-center ${order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-600' : 'bg-gray-400'} mr-2`}></div>
                        <span className="text-sm">Shipped</span>
                      </div>
                      <div className={`flex items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full ${order.status === 'delivered' ? 'bg-green-600' : 'bg-gray-400'} mr-2`}></div>
                        <span className="text-sm">Delivered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
