'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Calendar, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { DownloadInvoiceButton } from '@/components/invoices/DownloadInvoiceButton'
import { Order } from '@/types/order'

export default function OrderDetailsPage() {
  const { user, userData, loading: authLoading, initialized } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (initialized && !authLoading && params.id) {
      if (!user || !userData || userData.role !== 'customer') {
        router.push('/auth/login')
        return
      }

      const orderRef = ref(database, `orders/${params.id}`)
      const unsubscribe = onValue(orderRef, (snapshot) => {
        const data = snapshot.val()
        if (data && data.customerId === user.uid) {
          setOrder({ id: params.id as string, ...data })
        } else {
          setOrder(null)
        }
        setIsLoading(false)
      }, (error) => {
        console.error('Error fetching order:', error)
        setIsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user, userData, authLoading, initialized, router, params.id])

  if (authLoading || !initialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800">Order not found</h2>
        <p className="text-gray-500 mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/customer/orders" className="mt-6">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    )
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

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: Package }
    ]

    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered']
    const currentIndex = statusOrder.indexOf(status)

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex - 1,
      current: index === currentIndex - 1
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/customer/orders">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DownloadInvoiceButton order={order} />
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getStatusSteps(order.status).map((step) => {
                      const Icon = step.icon
                      const isCurrent = step.current
                      const isCompleted = step.completed
                      
                      return (
                        <div key={step.key} className="flex items-center space-x-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            isCompleted || isCurrent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-gray-500">
                              {order.status === 'shipped' ? 'Your order is on the way' : 
                               order.status === 'delivered' ? `Delivered on ${new Date(order.createdAt).toLocaleDateString()}` :
                               'Processing your order'}
                            </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                          <p className="text-sm text-gray-600">Price: ₹{product.price.toLocaleString()}</p>
                        </div>
                        <p className="font-medium">₹{(product.price * product.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t font-semibold text-lg">
                      <span>Total Amount</span>
                      <span>₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.address}</p>
                <p className="text-sm mt-2">Phone: {order.phone}</p>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Payment Method: {order.paymentMethod}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  Total: ₹{order.totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/customer/profile?tab=support">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
                {order.status === 'delivered' && (
                  <Button variant="outline" className="w-full">
                    Rate & Review
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
