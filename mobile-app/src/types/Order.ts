export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  salesAgentId: string;
  salesAgent: User;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  location?: Location;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  customerType: string;
  creditLimit?: number;
  outstandingBalance?: number;
  isActive: boolean;
  location?: Location;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  brand?: string;
  unitPrice: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  isActive: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

import { User } from './User';