'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { loginUser } from '@/lib/auth'
import { ShoppingCart, User, Lock, Mail, Home, ArrowLeft } from 'lucide-react'

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { userData } = await loginUser(email, password)
      
      if (!userData) {
        throw new Error('User data not found')
      }

      if (userData.role !== 'customer') {
        throw new Error('This login is for customers only')
      }
      
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Shri Karni Home Solutions</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Customer Login</CardTitle>
              <CardDescription className="text-orange-100">
                Access your shopping account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center text-gray-700">
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In to Shop'}
                </Button>
              </form>
              
              {/* Registration Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  New customer?{' '}
                  <Link href="/auth/register" className="text-orange-600 hover:text-orange-700 font-medium">
                    Create your account
                  </Link>
                </p>
              </div>

              {/* Features */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Why shop with us?</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>Quality construction materials</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>Fast delivery across Rajasthan</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>Best prices guaranteed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>24/7 customer support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Are you a seller?{' '}
              <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Seller Login
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
