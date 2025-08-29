'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, CheckCircle, Mail, Lock, User, Smartphone, Shield, Settings } from 'lucide-react'
import { loginUser } from '@/lib/auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { userData } = await loginUser(email, password)
      
      if (!userData) {
        throw new Error('User data not found')
      }
      
      setSuccess(true)
      
      setTimeout(() => {
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
      }, 1000)
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8 p-8">
          <div className="relative">
            {/* Main Phone Illustration */}
            <div className="relative w-80 h-96 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="absolute top-4 left-4 right-4 h-16 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute top-24 left-4 right-4 space-y-3">
                <div className="h-3 bg-white/30 rounded-full"></div>
                <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
              </div>
              <div className="absolute bottom-20 left-4 right-4 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold">Login</span>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <div className="absolute top-1/2 -right-8 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-300">
              <Settings className="w-7 h-7 text-white" />
            </div>

            {/* Character */}
            <div className="absolute -left-16 bottom-0 w-24 h-32 bg-gradient-to-b from-purple-600 to-purple-800 rounded-t-full">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-300 rounded-full"></div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-purple-500 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to
              </h1>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Shrikarni Home Solutions
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="example@gmail.com"
                    required
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-orange-500 hover:text-orange-600 transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Login successful! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </div>
                ) : success ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Success!
                  </div>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a 
                  href="/auth/register" 
                  className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
                >
                  Register
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
