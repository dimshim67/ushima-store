import { Product, BrandSettings, Order } from '../types';

export interface StoreDataResponse {
  success: boolean;
  products: Product[];
  settings: BrandSettings;
  orders: Order[];
  supabaseConfig?: {
    url?: string;
    anonKey?: string;
    enabled?: boolean;
  };
  lastUpdated?: string;
}

export const api = {
  async getStoreData(): Promise<StoreDataResponse> {
    const res = await fetch('/api/data');
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  },

  async saveProduct(product: Product): Promise<{ success: boolean; product: Product }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      throw new Error(`Failed to save product: ${res.status}`);
    }
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete product: ${res.status}`);
    }
    return res.json();
  },

  async saveSettings(settings: BrandSettings): Promise<{ success: boolean; settings: BrandSettings }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      throw new Error(`Failed to save settings: ${res.status}`);
    }
    return res.json();
  },

  async placeOrder(order: Order): Promise<{ success: boolean; order: Order }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      throw new Error(`Failed to place order: ${res.status}`);
    }
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<{ success: boolean }> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update order status: ${res.status}`);
    }
    return res.json();
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to reset data: ${res.status}`);
    }
    return res.json();
  },

  async testSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
    const res = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anonKey }),
    });
    return res.json();
  },

  async saveSupabaseConfig(config: { url: string; anonKey: string; enabled: boolean }): Promise<{ success: boolean }> {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async applyBotBranding(payload: {
    botToken: string;
    webAppUrl: string;
    botName?: string;
    botDescription?: string;
    shortDescription?: string;
  }) {
    const res = await fetch('/api/telegram/apply-bot-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
