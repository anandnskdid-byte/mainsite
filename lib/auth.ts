import { auth, database } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth'
import { ref, set, get } from 'firebase/database'

export interface UserData {
  role: 'admin' | 'seller' | 'customer'
  name: string
  email: string
  phone?: string
  address?: string
  shopName?: string
  username?: string
}

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Get user role from database
    const userRef = ref(database, `users/${user.uid}`)
    const snapshot = await get(userRef)
    const userData = snapshot.val() as UserData
    
    return { user, userData }
  } catch (error) {
    throw error
  }
}

export const registerUser = async (
  email: string, 
  password: string, 
  userData: Omit<UserData, 'role'> & { role: 'seller' | 'customer' }
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Save user data to database
    await set(ref(database, `users/${user.uid}`), {
      ...userData,
      email: user.email,
      name: userData.name || '',
      phone: userData.phone || '',
      address: userData.address || '',
      shopName: userData.shopName || '',
      username: userData.username || ''
    })
    
    return user
  } catch (error) {
    throw error
  }
}

export const logoutUser = () => signOut(auth)

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    if (!uid) return null
    
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)
    const data = snapshot.val()
    
    if (!data) return null
    
    // Ensure all required fields have fallback values
    return {
      role: data.role || 'customer',
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      shopName: data.shopName || '',
      username: data.username || ''
    }
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}
