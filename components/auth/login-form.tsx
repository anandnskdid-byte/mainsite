'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Mail } from 'lucide-react'
import { loginUser } from '@/lib/auth'

export function LoginForm() {
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
      
      // Redirect based on role
      switch (userData.role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'seller':
          router.push('/seller/dashboard')
          break
        case 'customer':
          router.push('/')
          break
        default:
          router.push('/')
      }
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setEmail('admin@shrikarni.com')
    setPassword('adminP@ssw0rd3146')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg border-0">
        <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-orange-100">
            Sign in to your Shri Karni account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
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
              <Label htmlFor="password" className="flex items-center">
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          {/* Admin Credentials */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-orange-800">Admin Access</p>
              <Badge className="bg-orange-500 hover:bg-orange-600">Admin</Badge>
            </div>
            <div className="space-y-1 text-xs text-orange-700">
              <p><strong>Email:</strong> admin@shrikarni.com</p>
              <p><strong>Password:</strong> adminP@ssw0rd3146</p>
            </div>
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={fillAdminCredentials}
              className="mt-2 w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Use Admin Credentials
            </Button>
          </div>

          {/* Customer Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/auth/register" className="text-orange-600 hover:text-orange-700 font-medium">
                Register here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
