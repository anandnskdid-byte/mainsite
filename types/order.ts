export interface ProductItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  products: ProductItem[];
  totalAmount: number;
  status: string;
  createdAt: number;
  address: string;
  paymentMethod: string;
  phone: string;
  customerName: string;
  customerId?: string; // Added this as it's used in the order details page
}
