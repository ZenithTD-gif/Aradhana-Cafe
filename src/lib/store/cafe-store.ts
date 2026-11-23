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
import { soundManager } from '../audio/sound-alerts';

const STORAGE_KEYS = {
  SETTINGS: 'aradhana_settings_v1',
  CATEGORIES: 'aradhana_categories_v1',
  FOOD_ITEMS: 'aradhana_food_items_v1',
  TABLES: 'aradhana_tables_v1',
  ORDERS: 'aradhana_orders_v1',
  COUPONS: 'aradhana_coupons_v1',
  ACTIVE_TABLE: 'aradhana_active_table',
};

// BroadcastChannel for cross-tab instantaneous real-time sync
type EventType = 
  | 'NEW_PAID_ORDER' 
  | 'ORDER_STATUS_CHANGED' 
  | 'ORDER_ACKNOWLEDGED' 
  | 'MENU_UPDATED' 
  | 'AVAILABILITY_CHANGED'
  | 'COUPON_REDEEMED';

interface RealtimeMessage {
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
  private activeTable: string = 'Table 1';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.setupBroadcastListener();
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

  private broadcast(type: EventType, payload: any) {
    if (typeof window !== 'undefined') {
      const msg: RealtimeMessage = { type, payload, timestamp: Date.now() };
      if (broadcastChannel) {
        broadcastChannel.postMessage(msg);
      }
      // Trigger local custom event
      window.dispatchEvent(new CustomEvent('aradhana_event', { detail: msg }));
    }
  }

  private setupBroadcastListener() {
    if (typeof window === 'undefined') return;

    const handleMessage = (msg: RealtimeMessage) => {
      this.loadFromStorage();
      this.notifyListeners();

      if (msg.type === 'NEW_PAID_ORDER') {
        // Trigger continuous ringing sound if audio unlocked
        soundManager.startContinuousRinging();
      } else if (msg.type === 'ORDER_ACKNOWLEDGED') {
        // Stop ringing sound if all unacknowledged orders are cleared
        const hasUnacked = this.orders.some(o => o.status === 'paid' && !o.acknowledgedByAdmin);
        if (!hasUnacked) {
          soundManager.stopContinuousRinging();
        }
      }
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

  /**
   * Returns only items that are marked available (for customer ordering portal)
   */
  public getAvailableFoodItems(): FoodItem[] {
    return this.foodItems.filter(item => item.isAvailable);
  }

  public getTables(): TableItem[] {
    return [...this.tables];
  }

  public getActiveTable(): string {
    return this.activeTable;
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

  // --- ACTIONS ---

  public setActiveTable(table: string) {
    this.activeTable = table;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, table);
    this.notifyListeners();
  }

  public updateSettings(newSettings: Partial<RestaurantSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
  }

  // CRITICAL REQUIREMENT: Real-time Food Availability Toggle
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
        preparationTimeMins: item.preparationTimeMins || 15,
        calories: item.calories || 250,
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

  public saveCategory(category: Partial<Category> & { name: string }): Category {
    const existingIndex = this.categories.findIndex(c => c.id === category.id);
    if (existingIndex >= 0) {
      this.categories[existingIndex] = { ...this.categories[existingIndex], ...category };
      this.saveToStorage();
      this.notifyListeners();
      return this.categories[existingIndex];
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        displayOrder: this.categories.length + 1,
        isActive: true,
      };
      this.categories.push(newCat);
      this.saveToStorage();
      this.notifyListeners();
      return newCat;
    }
  }

  public deleteCategory(categoryId: string): boolean {
    this.categories = this.categories.filter(c => c.id !== categoryId);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // --- TABLE MANAGEMENT ---
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

  // --- ORDER LIFECYCLE & VERIFICATION ---
  /**
   * Creates a confirmed paid order after successful payment verification
   */
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
    
    // Generate unique random coupon code: e.g. ARD-7942
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

    // Create coupon record
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

    // Broadcast new paid order immediately to Admin & Kitchen
    this.broadcast('NEW_PAID_ORDER', newOrder);

    return newOrder;
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

  // --- COUPON VERIFICATION SYSTEM ---
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

    // Update order as well
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
