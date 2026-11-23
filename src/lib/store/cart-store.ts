'use client';

import { CartItem, FoodItem } from '@/types';

const CART_STORAGE_KEY = 'aradhana_cart_v1';

class CartStore {
  private static instance: CartStore;
  private items: CartItem[] = [];
  private listeners: Set<() => void> = new Set();
  private taxPercentage: number = 5.0; // 5% GST

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          this.items = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load cart from storage', e);
      }
    }
  }

  public static getInstance(): CartStore {
    if (!CartStore.instance) {
      CartStore.instance = new CartStore();
    }
    return CartStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      } catch (e) {
        console.error('Failed to save cart to storage', e);
      }
    }
    this.listeners.forEach(fn => fn());
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.foodItem.price * item.quantity, 0);
  }

  public getTaxAmount(): number {
    return Number((this.getSubtotal() * (this.taxPercentage / 100)).toFixed(2));
  }

  public getTotal(): number {
    return Number((this.getSubtotal() + this.getTaxAmount()).toFixed(2));
  }

  public addItem(foodItem: FoodItem, quantity: number = 1, specialNotes?: string) {
    if (!foodItem.isAvailable) {
      alert(`Sorry, "${foodItem.name}" is currently sold out or unavailable.`);
      return;
    }

    const existingIndex = this.items.findIndex(i => i.foodItem.id === foodItem.id);
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
      if (specialNotes) {
        this.items[existingIndex].specialNotes = specialNotes;
      }
    } else {
      this.items.push({
        foodItem,
        quantity,
        specialNotes,
      });
    }
    this.notify();
  }

  public updateQuantity(foodItemId: string, delta: number) {
    const existingIndex = this.items.findIndex(i => i.foodItem.id === foodItemId);
    if (existingIndex >= 0) {
      const newQty = this.items[existingIndex].quantity + delta;
      if (newQty <= 0) {
        this.items.splice(existingIndex, 1);
      } else {
        this.items[existingIndex].quantity = newQty;
      }
      this.notify();
    }
  }

  public updateSpecialNotes(foodItemId: string, notes: string) {
    const item = this.items.find(i => i.foodItem.id === foodItemId);
    if (item) {
      item.specialNotes = notes;
      this.notify();
    }
  }

  public removeItem(foodItemId: string) {
    this.items = this.items.filter(i => i.foodItem.id !== foodItemId);
    this.notify();
  }

  public clearCart() {
    this.items = [];
    this.notify();
  }
}

export const getCartStore = () => CartStore.getInstance();
