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

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const finalUrl = url || process.env.SUPABASE_URL;
  const finalKey = key || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!finalUrl || !finalKey) {
    return null;
  }

  try {
    if (!supabaseClient || url || key) {
      supabaseClient = createClient(finalUrl, finalKey, {
        auth: { persistSession: false },
      });
    }
    return supabaseClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
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
    const client = createClient(url, key, { auth: { persistSession: false } });
    // Try to query or check schema
    const { data, error } = await client.from('ushima_products').select('count', { count: 'exact', head: true });
    
    if (error) {
      // Check if table doesn't exist (relation does not exist)
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Подключение к Supabase успешно, но таблицы еще не созданы. Вы можете создать их нажатием кнопки SQL скрипта.',
          tablesFound: [],
        };
      }
      return { success: false, message: `Ошибка Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Подключение к Supabase активно! Таблицы доступны.',
      tablesFound: ['ushima_products'],
    };
  } catch (err: any) {
    return { success: false, message: `Сетевая ошибка: ${err.message || String(err)}` };
  }
}
