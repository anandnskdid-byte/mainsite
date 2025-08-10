'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/hooks/use-auth'
import { database } from '@/lib/firebase'
import { ref, push, set, onValue } from 'firebase/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, CreditCard, Package, User, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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

export default function CheckoutPage() {
  const { state, clearCart } = useCart()
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [orderLoading, setOrderLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  })

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [useNewAddress, setUseNewAddress] = useState(false)

  // Redirect to login if not authenticated after loading is complete
  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/customer/login')
      return
    }
  }, [user, loading, initialized, router])

  // Redirect to cart if empty
  useEffect(() => {
    if (state.items.length === 0 && !success) {
      router.push('/cart')
      return
    }
  }, [state.items.length, router, success])

  // Load user data and addresses
  useEffect(() => {
    if (user && userData) {
      // Set default address from user data
      setAddress({
        street: userData.address || '',
        city: '',
        state: '',
        pincode: '',
        phone: userData.phone || ''
      })

      // Load saved addresses
      const addressesRef = ref(database, `customers/${user.uid}/addresses`)
      const unsubscribeAddresses = onValue(addressesRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const addressList = Object.entries(data).map(([id, address]: [string, any]) => ({ id, ...address }))
          setSavedAddresses(addressList)
          
          // Auto-select default address
          const defaultAddress = addressList.find(addr => addr.isDefault)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
          } else if (addressList.length > 0) {
            setSelectedAddressId(addressList[0].id)
          }
        }
      })

      return () => {
        unsubscribeAddresses()
      }
    }
  }, [user, userData])

  const handlePlaceOrder = async () => {
    if (!user || state.items.length === 0) return

    setOrderLoading(true)
    setError('')

    try {
      const ordersRef = ref(database, 'orders')
      const newOrderRef = push(ordersRef)
      
      const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
      
      let orderAddress = ''
      let orderPhone = ''
      
      if (selectedAddress) {
        orderAddress = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
        orderPhone = selectedAddress.phone
      } else {
        orderAddress = `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`
        orderPhone = address.phone
      }

      const orderData = {
        customerId: user.uid,
        customerName: userData?.name || '',
        products: state.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sellerId: item.sellerId,
          sellerName: (item as any).sellerName || 'Unknown Seller'
        })),
        totalAmount: state.total,
        status: 'pending',
        paymentMethod: 'COD',
        address: orderAddress,
        phone: orderPhone,
        createdAt: Date.now()
      }

      await set(newOrderRef, orderData)
      clearCart()
      setSuccess(true)
      
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/customer/orders?success=true&orderId=${newOrderRef.key}`)
      }, 2000)
      
    } catch (error) {
      console.error('Error placing order:', error)
      setError('Failed to place order. Please try again.')
    } finally {
      setOrderLoading(false)
    }
  }

  // Show loading while checking authentication
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Login</h2>
            <p className="text-gray-600 mb-4">You need to login to complete your order</p>
            <div className="space-y-2">
              <Link href="/customer/login">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">Login</Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-green-600">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been placed and will be processed soon. You will receive a confirmation shortly.
            </p>
            <div className="space-y-2">
              <Link href="/customer/orders">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  View My Orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty cart message
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cart is Empty</h2>
            <p className="text-gray-600 mb-4">Add some products to proceed with checkout</p>
            <Link href="/">
              <Button className="bg-orange-500 hover:bg-orange-600">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isFormValid = () => {
    if (selectedAddressId) return true
    return address.street && address.city && address.state && address.pincode && address.phone
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/cart">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Delivery Address */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {savedAddresses.length > 0 && !useNewAddress ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Select Delivery Address</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUseNewAddress(true)}
                      >
                        Add New Address
                      </Button>
                    </div>
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{addr.name}</p>
                            <p className="text-sm text-gray-600">{addr.street}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                          </div>
                          <input 
                            type="radio" 
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="text-orange-500 mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show new address form
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUseNewAddress(false)}
                      >
                        Use Saved Address
                      </Button>
                    )}
                    <div>
                      <Label htmlFor="street">Street Address *</Label>
                      <Textarea
                        id="street"
                        value={address.street}
                        onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Enter your full address"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={address.city}
                          onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={address.state}
                          onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={address.pincode}
                          onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={address.phone}
                          onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-orange-50">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {state.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-gray-600">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-medium ml-2">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({state.itemCount} items)</span>
                    <span>₹{state.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{state.total.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading || !isFormValid()}
                >
                  {orderLoading ? 'Placing Order...' : `Place Order - ₹${state.total.toLocaleString()}`}
                </Button>
                <p className="text-xs text-gray-600 text-center">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
