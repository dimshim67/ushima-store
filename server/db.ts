import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  products: any[];
  settings: any;
  orders: any[];
  supabaseConfig?: {
    url?: string;
    anonKey?: string;
    enabled?: boolean;
  };
  lastUpdated: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

let cachedSupabaseClient: SupabaseClient | null = null;
let lastSupabaseConfig = '';

export function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

export function getActiveSupabaseClient(): SupabaseClient | null {
  const db = readDatabase();
  const rawUrl = db?.supabaseConfig?.enabled && db.supabaseConfig.url ? db.supabaseConfig.url : process.env.SUPABASE_URL;
  const cfgKey = db?.supabaseConfig?.enabled && db.supabaseConfig.anonKey ? db.supabaseConfig.anonKey : (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!rawUrl || !cfgKey) {
    return null;
  }

  const cfgUrl = cleanSupabaseUrl(rawUrl);
  const hash = `${cfgUrl}:${cfgKey}`;
  if (!cachedSupabaseClient || lastSupabaseConfig !== hash) {
    try {
      cachedSupabaseClient = createClient(cfgUrl, cfgKey, {
        auth: { persistSession: false },
      });
      lastSupabaseConfig = hash;
    } catch (err) {
      console.error('Failed to init Supabase client:', err);
      return null;
    }
  }
  return cachedSupabaseClient;
}

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  if (url && key) {
    try {
      return createClient(cleanSupabaseUrl(url), key, { auth: { persistSession: false } });
    } catch (e) {
      return null;
    }
  }
  return getActiveSupabaseClient();
}

// Convert between Product format and Supabase row
export function toSupabaseProduct(p: any) {
  return {
    id: p.id,
    title: p.title || '',
    subtitle: p.subtitle || null,
    price: Number(p.price) || 0,
    original_price: p.originalPrice ? Number(p.originalPrice) : null,
    category: p.category || 'all',
    images: Array.isArray(p.images) ? p.images : [],
    description: p.description || '',
    composition: p.composition || null,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    in_stock: p.inStock !== false,
    is_featured: Boolean(p.isFeatured),
    created_at: p.createdAt || Date.now(),
  };
}

export function fromSupabaseProduct(row: any) {
  return {
    id: String(row.id),
    title: row.title || '',
    subtitle: row.subtitle || undefined,
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    category: row.category || 'all',
    images: Array.isArray(row.images) ? row.images : [],
    description: row.description || '',
    composition: row.composition || undefined,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    inStock: row.in_stock !== false,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at ? Number(row.created_at) : Date.now(),
  };
}

// Read products with Supabase priority
export async function getProductsWithSupabase(localDb: DatabaseSchema): Promise<any[]> {
  const sb = getActiveSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('ushima_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Return mapped products from Supabase
        return data.map(fromSupabaseProduct);
      }
      if (error) {
        console.warn('Supabase fetch error, using local cache:', error.message);
      }
    } catch (err) {
      console.warn('Supabase products query failed, using local cache:', err);
    }
  }
  return localDb.products || [];
}

// Save single product to Supabase if connected
export async function saveProductToSupabase(product: any): Promise<boolean> {
  const sb = getActiveSupabaseClient();
  if (!sb) return false;
  try {
    const row = toSupabaseProduct(product);
    const { error } = await sb.from('ushima_products').upsert(row);
    if (error) {
      console.error('Error upserting product in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving product in Supabase:', err);
    return false;
  }
}

// Delete product from Supabase if connected
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  const sb = getActiveSupabaseClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from('ushima_products').delete().eq('id', productId);
    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting product from Supabase:', err);
    return false;
  }
}

// Clear all products in Supabase
export async function clearAllProductsInSupabase(): Promise<boolean> {
  const sb = getActiveSupabaseClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from('ushima_products').delete().neq('id', '___non_existent___');
    if (error) {
      console.error('Error clearing products in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error clearing products in Supabase:', err);
    return false;
  }
}

// Read settings with Supabase priority
export async function getSettingsWithSupabase(localDb: DatabaseSchema): Promise<any> {
  const sb = getActiveSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('ushima_settings')
        .select('data')
        .eq('id', 'brand_settings')
        .maybeSingle();

      if (!error && data && data.data) {
        return data.data;
      }
    } catch (err) {
      console.warn('Supabase settings query failed, using local cache:', err);
    }
  }
  return localDb.settings;
}

// Save settings to Supabase
export async function saveSettingsToSupabase(settings: any): Promise<boolean> {
  const sb = getActiveSupabaseClient();
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('ushima_settings')
      .upsert({ id: 'brand_settings', data: settings });
    if (error) {
      console.error('Error saving settings to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving settings to Supabase:', err);
    return false;
  }
}

// Save order to Supabase
export async function saveOrderToSupabase(order: any): Promise<boolean> {
  const sb = getActiveSupabaseClient();
  if (!sb) return false;
  try {
    const row = {
      id: order.id,
      items: order.items,
      total_amount: order.total,
      status: order.status,
      customer_info: order.customer,
      created_at: order.createdAt || new Date().toISOString(),
    };
    const { error } = await sb.from('ushima_orders').upsert(row);
    if (error) {
      console.error('Error saving order to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving order to Supabase:', err);
    return false;
  }
}

// Read database from file
export function readDatabase(): DatabaseSchema | null {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local db file:', err);
  }
  return null;
}

// Write database to file
export function writeDatabase(data: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local db file:', err);
    return false;
  }
}

// Test Supabase connection
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  try {
    const cleanUrl = cleanSupabaseUrl(url);
    const client = createClient(cleanUrl, key, { auth: { persistSession: false } });
    // Try to query or check schema
    const { data, error } = await client.from('ushima_products').select('count', { count: 'exact', head: true });
    
    if (error) {
      // Check if table doesn't exist (relation does not exist or schema cache)
      if (
        error.code === '42P01' ||
        error.message.includes('relation') ||
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        return {
          success: true,
          message: 'Подключение к Supabase успешно! База подключена. Осталось создать таблицы: скопируйте SQL-скрипт ниже и запустите его в Supabase SQL Editor.',
          tablesFound: [],
        };
      }
      return { success: false, message: `Ошибка Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Подключение к Supabase активно! Таблица ushima_products создана и готова к работе.',
      tablesFound: ['ushima_products'],
    };
  } catch (err: any) {
    return { success: false, message: `Сетевая ошибка: ${err.message || String(err)}` };
  }
}
