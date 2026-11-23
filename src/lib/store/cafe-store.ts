'use client';

import { 
  Category, 
  FoodItem, 
  Order, 
  OrderStatus, 
  RestaurantSettings, 
  TableItem, 
  Coupon 
} from '@/types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_FOOD_ITEMS, 
  INITIAL_SETTINGS, 
  INITIAL_TABLES 
} from '../data/seed-menu';
import { hashPin, verifyPin } from '../security/auth';

const STORAGE_KEYS = {
  SETTINGS: 'aradhana_settings_v2',
  CATEGORIES: 'aradhana_categories_v2',
  FOOD_ITEMS: 'aradhana_food_items_v2',
  TABLES: 'aradhana_tables_v2',
  ORDERS: 'aradhana_orders_v2',
  COUPONS: 'aradhana_coupons_v2',
  ACTIVE_TABLE: 'aradhana_active_table_v2',
  KITCHEN_PIN_HASH: 'aradhana_kitchen_pin_hash_v2',
};

// BroadcastChannel for cross-tab instantaneous real-time sync
export type EventType = 
  | 'NEW_PAID_ORDER' 
  | 'ORDER_STATUS_CHANGED' 
  | 'ORDER_ACKNOWLEDGED' 
  | 'MENU_UPDATED' 
  | 'AVAILABILITY_CHANGED'
  | 'COUPON_REDEEMED'
  | 'KITCHEN_PIN_CHANGED';

export interface RealtimeMessage {
  type: EventType;
  payload: any;
  timestamp: number;
}

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('aradhana_cafe_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

export class CafeStore {
  private static instance: CafeStore;
  private listeners: Set<() => void> = new Set();

  private settings: RestaurantSettings = INITIAL_SETTINGS;
  private categories: Category[] = INITIAL_CATEGORIES;
  private foodItems: FoodItem[] = INITIAL_FOOD_ITEMS;
  private tables: TableItem[] = INITIAL_TABLES;
  private orders: Order[] = [];
  private coupons: Coupon[] = [];
  private activeTable: string = ''; // Empty by default; set ONLY by QR scan or during checkout
  private isTableIdentifiedFromQR: boolean = false;
  private kitchenPinHash: string = '';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.setupBroadcastListener();
      this.initDefaultKitchenPin();
      window.addEventListener('storage', () => {
        this.loadFromStorage();
        this.notifyListeners();
      });
    }
  }

  public static getInstance(): CafeStore {
    if (!CafeStore.instance) {
      CafeStore.instance = new CafeStore();
    }
    return CafeStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public broadcast(type: EventType, payload: any) {
    if (typeof window !== 'undefined') {
      const msg: RealtimeMessage = { type, payload, timestamp: Date.now() };
      if (broadcastChannel) {
        broadcastChannel.postMessage(msg);
      }
      // Trigger local custom event
      window.dispatchEvent(new CustomEvent('aradhana_event', { detail: msg }));
    }
  }

  private async initDefaultKitchenPin() {
    if (!this.kitchenPinHash) {
      const defaultPin = process.env.NEXT_PUBLIC_KITCHEN_PIN || '1080';
      this.kitchenPinHash = await hashPin(defaultPin);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.KITCHEN_PIN_HASH, this.kitchenPinHash);
      }
    }
  }

  private setupBroadcastListener() {
    if (typeof window === 'undefined') return;

    const handleMessage = (msg: RealtimeMessage) => {
      if (msg.type === 'NEW_PAID_ORDER' && msg.payload?.id) {
        this.addOrder(msg.payload);
      }
      this.loadFromStorage();
      this.notifyListeners();
      // NOTE: Zero audio calls here. Audio is handled strictly in Admin and Kitchen views!
    };

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => handleMessage(event.data);
    }

    window.addEventListener('aradhana_event', ((e: CustomEvent) => {
      handleMessage(e.detail);
    }) as EventListener);
  }

  private loadFromStorage() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) this.settings = JSON.parse(savedSettings);

      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) this.categories = JSON.parse(savedCategories);

      const savedItems = localStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
      if (savedItems) this.foodItems = JSON.parse(savedItems);

      const savedTables = localStorage.getItem(STORAGE_KEYS.TABLES);
      if (savedTables) this.tables = JSON.parse(savedTables);

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) this.orders = JSON.parse(savedOrders);

      const savedCoupons = localStorage.getItem(STORAGE_KEYS.COUPONS);
      if (savedCoupons) this.coupons = JSON.parse(savedCoupons);

      const savedActiveTable = localStorage.getItem(STORAGE_KEYS.ACTIVE_TABLE);
      if (savedActiveTable) this.activeTable = savedActiveTable;

      const savedPinHash = localStorage.getItem(STORAGE_KEYS.KITCHEN_PIN_HASH);
      if (savedPinHash) this.kitchenPinHash = savedPinHash;
    } catch (e) {
      console.error('Failed to load cafe data from localStorage', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(this.foodItems));
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(this.tables));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(this.coupons));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, this.activeTable);
      if (this.kitchenPinHash) {
        localStorage.setItem(STORAGE_KEYS.KITCHEN_PIN_HASH, this.kitchenPinHash);
      }
    } catch (e) {
      console.error('Failed to save cafe data to localStorage', e);
    }
  }

  // --- GETTERS ---
  public getSettings(): RestaurantSettings {
    return { ...this.settings };
  }

  public getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getFoodItems(): FoodItem[] {
    return [...this.foodItems];
  }

  public getAvailableFoodItems(): FoodItem[] {
    return this.foodItems.filter(item => item.isAvailable);
  }

  /**
   * Ready-to-Serve filter: only items currently available AND quick to serve (<= 5 mins prep)
   */
  public getReadyToServeItems(): FoodItem[] {
    return this.foodItems.filter(item => item.isAvailable && (item.preparationTimeMins || 5) <= 5);
  }

  public getTables(): TableItem[] {
    return [...this.tables];
  }

  public getActiveTable(): string {
    return this.activeTable;
  }

  public getIsTableIdentifiedFromQR(): boolean {
    return this.isTableIdentifiedFromQR;
  }

  public getOrders(): Order[] {
    return [...this.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  // --- TABLE ACTIONS ---
  public setActiveTable(table: string, fromQR: boolean = false) {
    this.activeTable = table;
    this.isTableIdentifiedFromQR = fromQR;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, table);
    this.notifyListeners();
  }

  // --- KITCHEN PIN MANAGEMENT ---
  public async setKitchenPin(newPin: string): Promise<boolean> {
    if (!newPin || newPin.trim().length < 4) return false;
    this.kitchenPinHash = await hashPin(newPin.trim());
    this.saveToStorage();
    this.broadcast('KITCHEN_PIN_CHANGED', { updated: true });
    this.notifyListeners();
    return true;
  }

  public async verifyKitchenPin(enteredPin: string): Promise<boolean> {
    if (!this.kitchenPinHash) {
      await this.initDefaultKitchenPin();
    }
    return verifyPin(enteredPin, this.kitchenPinHash);
  }

  // --- MENU ACTIONS ---
  public toggleFoodAvailability(itemId: string, forcedStatus?: boolean): boolean {
    const item = this.foodItems.find(i => i.id === itemId);
    if (!item) return false;

    item.isAvailable = forcedStatus !== undefined ? forcedStatus : !item.isAvailable;
    this.saveToStorage();
    this.notifyListeners();
    this.broadcast('AVAILABILITY_CHANGED', { itemId, isAvailable: item.isAvailable, name: item.name });
    return item.isAvailable;
  }

  public saveFoodItem(item: Partial<FoodItem> & { name: string; price: number; categoryId: string }): FoodItem {
    const existingIndex = this.foodItems.findIndex(i => i.id === item.id);
    const category = this.categories.find(c => c.id === item.categoryId);
    const categoryName = category ? category.name : 'General';

    if (existingIndex >= 0) {
      this.foodItems[existingIndex] = {
        ...this.foodItems[existingIndex],
        ...item,
        categoryName,
      };
      this.saveToStorage();
      this.notifyListeners();
      this.broadcast('MENU_UPDATED', this.foodItems[existingIndex]);
      return this.foodItems[existingIndex];
    } else {
      const newItem: FoodItem = {
        id: `item-${Date.now()}`,
        name: item.name,
        price: Number(item.price),
        categoryId: item.categoryId,
        categoryName,
        description: item.description || '',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        isSpicy: item.isSpicy || false,
        isChefSpecial: item.isChefSpecial || false,
        preparationTimeMins: item.preparationTimeMins || 5,
        calories: item.calories || 200,
      };
      this.foodItems.unshift(newItem);
      this.saveToStorage();
      this.notifyListeners();
      this.broadcast('MENU_UPDATED', newItem);
      return newItem;
    }
  }

  public deleteFoodItem(itemId: string): boolean {
    const initialLen = this.foodItems.length;
    this.foodItems = this.foodItems.filter(i => i.id !== itemId);
    if (this.foodItems.length !== initialLen) {
      this.saveToStorage();
      this.notifyListeners();
      this.broadcast('MENU_UPDATED', { deletedId: itemId });
      return true;
    }
    return false;
  }

  public addTable(tableNumber: string, capacity: number = 4, section: string = 'Main Dining'): TableItem {
    const newTbl: TableItem = {
      id: `tbl-${Date.now()}`,
      tableNumber,
      capacity,
      section,
      isOccupied: false,
      qrCodeToken: `token-${Date.now()}`,
    };
    this.tables.push(newTbl);
    this.saveToStorage();
    this.notifyListeners();
    return newTbl;
  }

  public deleteTable(id: string): boolean {
    this.tables = this.tables.filter(t => t.id !== id);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // --- ORDER LIFECYCLE ---
  public createPaidOrder(params: {
    tableNumber: string;
    items: {
      foodItemId: string;
      itemName: string;
      unitPrice: number;
      quantity: number;
      specialNotes?: string;
      imageUrl?: string;
      isVeg?: boolean;
    }[];
    customerName?: string;
    customerPhone?: string;
    customerNotes?: string;
    paymentId: string;
  }): Order {
    const orderNum = `ARD-${new Date().getFullYear().toString().slice(-2)}${(Math.floor(1000 + Math.random() * 9000))}`;
    const couponCode = `ARD-${Math.floor(1000 + Math.random() * 9000)}`;

    const subtotal = params.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = Number((subtotal * (this.settings.taxPercentage / 100)).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const orderId = `order-${Date.now()}`;
    const orderItems = params.items.map((it, idx) => ({
      id: `oi-${orderId}-${idx + 1}`,
      orderId,
      foodItemId: it.foodItemId,
      itemName: it.itemName,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      totalPrice: it.unitPrice * it.quantity,
      specialNotes: it.specialNotes,
      imageUrl: it.imageUrl,
      isVeg: it.isVeg,
    }));

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderNum,
      tableNumber: params.tableNumber,
      status: 'paid',
      customerName: params.customerName || 'Café Guest',
      customerPhone: params.customerPhone || '',
      customerNotes: params.customerNotes || '',
      subtotal,
      taxAmount,
      totalAmount,
      paymentStatus: 'successful',
      acknowledgedByAdmin: false,
      acknowledgedByKitchen: false,
      couponCode,
      isCouponRedeemed: false,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      couponCode,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableNumber: newOrder.tableNumber,
      totalAmount: newOrder.totalAmount,
      isRedeemed: false,
      createdAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    this.coupons.unshift(newCoupon);

    this.saveToStorage();
    this.notifyListeners();

    // Broadcast new paid order to Admin & Kitchen
    this.broadcast('NEW_PAID_ORDER', newOrder);

    return newOrder;
  }

  public addOrder(order: Order) {
    if (!order?.id) return;
    const exists = this.orders.some(o => o.id === order.id || o.orderNumber === order.orderNumber);
    if (!exists) {
      this.orders.unshift(order);
      if (order.couponCode) {
        this.coupons.unshift({
          id: `coupon-${order.id}`,
          couponCode: order.couponCode,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          totalAmount: order.totalAmount,
          isRedeemed: order.isCouponRedeemed || false,
          createdAt: order.createdAt,
        });
      }
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public acknowledgeOrder(orderId: string, role: 'admin' | 'kitchen') {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    if (role === 'admin') order.acknowledgedByAdmin = true;
    if (role === 'kitchen') order.acknowledgedByKitchen = true;
    order.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyListeners();
    this.broadcast('ORDER_ACKNOWLEDGED', { orderId, role });
  }

  public updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyListeners();
    this.broadcast('ORDER_STATUS_CHANGED', { orderId, status });
  }

  // --- COUPON VERIFICATION ---
  public verifyCouponCode(code: string): { valid: boolean; coupon?: Coupon; order?: Order; message: string } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find(c => c.couponCode === cleanCode);

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code. No matching order found.' };
    }

    const order = this.orders.find(o => o.id === coupon.orderId);
    if (!order) {
      return { valid: false, message: 'Coupon found, but associated order could not be located.' };
    }

    if (coupon.isRedeemed) {
      return { 
        valid: false, 
        coupon, 
        order, 
        message: `This coupon was ALREADY REDEEMED on ${coupon.redeemedAt ? new Date(coupon.redeemedAt).toLocaleTimeString() : 'earlier'} by ${coupon.redeemedBy || 'Staff'}. Cannot be reused.` 
      };
    }

    return {
      valid: true,
      coupon,
      order,
      message: `Verified! Table ${coupon.tableNumber} - ₹${coupon.totalAmount} (Paid & Authentic)`,
    };
  }

  public redeemCoupon(code: string, redeemedBy: string = 'Admin'): { success: boolean; message: string } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find(c => c.couponCode === cleanCode);

    if (!coupon) {
      return { success: false, message: 'Coupon code not found.' };
    }

    if (coupon.isRedeemed) {
      return { success: false, message: 'Coupon has already been redeemed previously!' };
    }

    coupon.isRedeemed = true;
    coupon.redeemedAt = new Date().toISOString();
    coupon.redeemedBy = redeemedBy;

    const order = this.orders.find(o => o.id === coupon.orderId);
    if (order) {
      order.isCouponRedeemed = true;
      order.updatedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.notifyListeners();
    this.broadcast('COUPON_REDEEMED', { couponCode: cleanCode, redeemedBy });

    return { success: true, message: `Coupon ${cleanCode} successfully redeemed for Table ${coupon.tableNumber}!` };
  }
}

export const getCafeStore = () => CafeStore.getInstance();
