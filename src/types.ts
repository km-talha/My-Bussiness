export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  brandName: string;
  category: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  buyingPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  address: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  isFreeDelivery: boolean;
  courierName?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpending: number;
  loyaltyPoints: number;
  lastOrderDate?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  orderId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  suppliedProducts: string[];
  duePayments: number;
  lastPurchaseDate?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'owner';
  createdAt: string;
}
