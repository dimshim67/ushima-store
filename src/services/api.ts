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
    const res = await fetch(`/api/data?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store',
      },
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return res.json();
  },

  async saveProduct(product: Product): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`/api/products?_t=${Date.now()}`, {
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
    const res = await fetch(`/api/products/${id}?_t=${Date.now()}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete product: ${res.status}`);
    }
    return res.json();
  },

  async clearAllProducts(): Promise<{ success: boolean; count: number }> {
    const res = await fetch(`/api/products/clear-all?_t=${Date.now()}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to clear products: ${res.status}`);
    }
    return res.json();
  },

  async restoreDefaultProducts(): Promise<{ success: boolean; products: Product[] }> {
    const res = await fetch(`/api/products/restore-defaults?_t=${Date.now()}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to restore default products: ${res.status}`);
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

  async pushToSupabase(): Promise<{ success: boolean; message: string; productsPushed?: number }> {
    const res = await fetch('/api/supabase/push-to-cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async pullFromSupabase(): Promise<{ success: boolean; message: string; products?: any[]; settings?: any }> {
    const res = await fetch('/api/supabase/pull-from-cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  async adminLogin(credentials: { email?: string; password?: string; pin?: string }): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    user?: { id?: string; email: string };
    token?: string;
    mode?: 'supabase' | 'local' | 'pin';
  }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async getAdmins(): Promise<{ success: boolean; admins: string[]; ownerEmail: string }> {
    const res = await fetch('/api/admin/admins');
    return res.json();
  },

  async addAdmin(email: string): Promise<{ success: boolean; admins: string[]; error?: string }> {
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async removeAdmin(email: string): Promise<{ success: boolean; admins: string[]; error?: string }> {
    const res = await fetch(`/api/admin/admins/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
