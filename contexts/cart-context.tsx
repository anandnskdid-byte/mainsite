'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId: string
  sellerName: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        )
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        }
      }
      
      const newItems = [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }]
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.productId !== action.payload)
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
      
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 }
    
    case 'LOAD_CART': {
      const items = action.payload
      return {
        items,
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }
    
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 })
  const { user, initialized } = useAuth()

  // Load cart from localStorage on mount
  useEffect(() => {
    if (initialized) {
      const cartKey = user ? `cart_${user.uid}` : 'guest_cart'
      const savedCart = localStorage.getItem(cartKey)
      if (savedCart) {
        try {
          const raw = JSON.parse(savedCart) as any[]
          const normalized = Array.isArray(raw)
            ? raw
                .map((it) => ({
                  productId: it?.productId ?? it?.id ?? '',
                  name: it?.name ?? 'Unknown Product',
                  price: typeof it?.price === 'number' ? it.price : (parseFloat(it?.price) || 0),
                  quantity: typeof it?.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
                  image: it?.image ?? it?.imageUrl ?? '',
                  sellerId: it?.sellerId ?? '',
                  sellerName: it?.sellerName ?? 'Unknown Seller',
                }))
                .filter((it) => !!it.productId)
            : []
          dispatch({ type: 'LOAD_CART', payload: normalized })
          // Persist normalized shape back
          localStorage.setItem(cartKey, JSON.stringify(normalized))
        } catch (error) {
          console.error('Error loading cart:', error)
        }
      }
    }
  }, [user, initialized])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      const cartKey = user ? `cart_${user.uid}` : 'guest_cart'
      localStorage.setItem(cartKey, JSON.stringify(state.items))
    }
  }, [state.items, user, initialized])

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity } })
  }

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{
      state,
      dispatch,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
