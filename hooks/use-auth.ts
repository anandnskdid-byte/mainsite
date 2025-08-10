'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserData, UserData } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  initialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  initialized: false
})

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user)
        
        if (user) {
          const data = await getUserData(user.uid)
          setUserData(data)
        } else {
          setUserData(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUserData(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => unsubscribe()
  }, [])

  return { user, userData, loading, initialized }
}
