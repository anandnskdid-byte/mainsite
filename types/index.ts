export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  sellerId: string
  sellerName: string
  imageUrl: string
  images: string[]
  colors?: string[]
  sizes?: string[]
  createdAt: number
}

export interface Category {
  id: string
  name: string
  description: string
  imageUrl?: string
}

export interface Order {
  id: string
  customerName: string
  products: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    color?: string
    size?: string
  }>
  totalAmount: number
  status: string
  createdAt: number
  address: string
  phone: string
}
