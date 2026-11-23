export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'served' | 'cancelled';

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';

export type UserRole = 'admin' | 'chef' | 'waiter' | 'customer';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean; // CRITICAL: Real-time availability
  isVeg: boolean;
  isSpicy?: boolean;
  isChefSpecial?: boolean;
  preparationTimeMins?: number;
  calories?: number;
}

export interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  section: string;
  isOccupied: boolean;
  qrCodeToken: string;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  specialNotes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  foodItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  specialNotes?: string;
  imageUrl?: string;
  isVeg?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., ARD-2026-1042
  tableNumber: string;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  subtotal: number;
  taxAmount: number; // 5% GST
  totalAmount: number;
  paymentStatus: PaymentStatus;
  acknowledgedByAdmin: boolean;
  acknowledgedByKitchen: boolean;
  couponCode?: string; // Generated unique verification code
  isCouponRedeemed?: boolean;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  couponCode: string; // e.g. ARD-9482
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  totalAmount: number;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedBy?: string;
  createdAt: string;
}

export interface RestaurantSettings {
  id: string;
  cafeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  openingHours: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  upiId: string;
  bannerText: string;
  isOpen: boolean;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: string;
  gatewayProvider: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}
