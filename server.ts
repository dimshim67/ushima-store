import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  readDatabase,
  writeDatabase,
  testSupabaseConnection,
  getSupabaseClient,
  getActiveSupabaseClient,
  getProductsWithSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  clearAllProductsInSupabase,
  getSettingsWithSupabase,
  saveSettingsToSupabase,
  saveOrderToSupabase,
  DatabaseSchema,
} from './server/db';
import { INITIAL_PRODUCTS, INITIAL_BRAND_SETTINGS } from './src/data/initialProducts';

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads from catalog admin
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Anti-cache headers for all API requests to prevent Telegram Webview & browser stale caching
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
});

// Initialize database with initial products if not yet present
function getOrInitDatabase(): DatabaseSchema {
  let db = readDatabase();
  if (!db || !Array.isArray(db.products)) {
    db = {
      products: INITIAL_PRODUCTS,
      settings: INITIAL_BRAND_SETTINGS,
      orders: [],
      supabaseConfig: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        enabled: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      },
      lastUpdated: new Date().toISOString(),
    };
    writeDatabase(db);
  } else {
    // Ensure active admin password and owner email are up to date
    let updated = false;
    if (!db.settings.adminPassword || db.settings.adminPassword === 'Ushima2025!AdminSecure') {
      db.settings.adminPassword = 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{';
      updated = true;
    }
    if (db.settings.adminPin === '1234') {
      db.settings.adminPin = '9482';
      updated = true;
    }
    if (!Array.isArray(db.settings.adminEmails)) {
      db.settings.adminEmails = ['dimshim67@gmail.com'];
      updated = true;
    }
    if (updated) {
      writeDatabase(db);
    }
  }
  return db;
}

// 1. Health check & DB status
app.get('/api/health', async (req, res) => {
  const db = getOrInitDatabase();
  const sbClient = getActiveSupabaseClient();
  res.json({
    status: 'ok',
    productsCount: db.products.length,
    ordersCount: db.orders.length,
    supabaseActive: Boolean(sbClient),
    supabaseConfigured: Boolean(db.supabaseConfig?.url && db.supabaseConfig?.anonKey),
    lastUpdated: db.lastUpdated,
  });
});

// 2. Get full store data (products, settings, orders)
app.get('/api/data', async (req, res) => {
  try {
    const db = getOrInitDatabase();
    
    // Sync with Supabase if connected
    const products = await getProductsWithSupabase(db);
    const settings = await getSettingsWithSupabase(db);
    
    // Keep local cache up to date
    if (products !== db.products) {
      db.products = products;
      db.settings = settings;
      writeDatabase(db);
    }

    res.json({
      success: true,
      products,
      settings,
      orders: db.orders,
      supabaseConfig: db.supabaseConfig || {},
      supabaseActive: Boolean(getActiveSupabaseClient()),
      lastUpdated: db.lastUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Products Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const db = getOrInitDatabase();
    const products = await getProductsWithSupabase(db);
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    if (!product || !product.id || !product.title) {
      res.status(400).json({ success: false, error: 'Product title and id are required' });
      return;
    }

    const db = getOrInitDatabase();
    const existingIndex = db.products.findIndex((p) => p.id === product.id);

    if (existingIndex > -1) {
      db.products[existingIndex] = { ...db.products[existingIndex], ...product };
    } else {
      db.products = [product, ...db.products];
    }

    writeDatabase(db);

    // Also persist to Supabase if connected
    await saveProductToSupabase(product);

    res.json({ success: true, product, count: db.products.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getOrInitDatabase();
    db.products = db.products.filter((p) => p.id !== id);
    writeDatabase(db);

    // Also delete from Supabase if connected
    await deleteProductFromSupabase(id);

    res.json({ success: true, count: db.products.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all products (start with blank catalog)
app.post('/api/products/clear-all', async (req, res) => {
  try {
    const db = getOrInitDatabase();
    db.products = [];
    writeDatabase(db);

    // Also clear in Supabase if connected
    await clearAllProductsInSupabase();

    res.json({ success: true, count: 0, message: 'Каталог очищен' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore default demo products
app.post('/api/products/restore-defaults', async (req, res) => {
  try {
    const db = getOrInitDatabase();
    db.products = INITIAL_PRODUCTS;
    writeDatabase(db);

    // Push defaults to Supabase if active
    for (const p of INITIAL_PRODUCTS) {
      await saveProductToSupabase(p);
    }

    res.json({ success: true, count: INITIAL_PRODUCTS.length, products: INITIAL_PRODUCTS });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const db = getOrInitDatabase();
    const settings = await getSettingsWithSupabase(db);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    const db = getOrInitDatabase();
    db.settings = { ...db.settings, ...newSettings };
    writeDatabase(db);

    // Sync settings to Supabase
    await saveSettingsToSupabase(db.settings);

    res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Orders Endpoints
app.get('/api/orders', (req, res) => {
  const db = getOrInitDatabase();
  res.json({ success: true, orders: db.orders });
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.id) {
      res.status(400).json({ success: false, error: 'Valid order object required' });
      return;
    }
    const db = getOrInitDatabase();
    db.orders = [order, ...db.orders];
    writeDatabase(db);

    // Sync order to Supabase
    await saveOrderToSupabase(order);

    res.json({ success: true, order, count: db.orders.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getOrInitDatabase();
    db.orders = db.orders.map((o) => (o.id === id ? { ...o, status } : o));
    writeDatabase(db);
    res.json({ success: true, orders: db.orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Bulk Save & Reset
app.post('/api/reset', (req, res) => {
  try {
    const db: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      settings: INITIAL_BRAND_SETTINGS,
      orders: [],
      supabaseConfig: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        enabled: false,
      },
      lastUpdated: new Date().toISOString(),
    };
    writeDatabase(db);
    res.json({ success: true, message: 'Database reset to initial template' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Supabase Integration Endpoints
app.post('/api/supabase/test', async (req, res) => {
  try {
    const { url, anonKey } = req.body;
    if (!url || !anonKey) {
      res.status(400).json({ success: false, message: 'Supabase URL and Key are required' });
      return;
    }
    const result = await testSupabaseConnection(url, anonKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase/config', (req, res) => {
  try {
    const { url, anonKey, enabled } = req.body;
    const db = getOrInitDatabase();
    db.supabaseConfig = {
      url: url || '',
      anonKey: anonKey || '',
      enabled: Boolean(enabled),
    };
    writeDatabase(db);
    res.json({ success: true, config: db.supabaseConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Push all local products & settings into Supabase
app.post('/api/supabase/push-to-cloud', async (req, res) => {
  try {
    const sb = getActiveSupabaseClient();
    if (!sb) {
      res.status(400).json({ success: false, message: 'Supabase не подключен. Сначала укажите URL и Anon Key.' });
      return;
    }

    const db = getOrInitDatabase();
    let pushedProducts = 0;
    for (const prod of db.products) {
      const ok = await saveProductToSupabase(prod);
      if (ok) pushedProducts++;
    }

    await saveSettingsToSupabase(db.settings);

    res.json({
      success: true,
      message: `Успешно выгружено в Supabase: ${pushedProducts} товаров и настройки бренда`,
      productsPushed: pushedProducts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Pull all products & settings from Supabase into local cache
app.post('/api/supabase/pull-from-cloud', async (req, res) => {
  try {
    const sb = getActiveSupabaseClient();
    if (!sb) {
      res.status(400).json({ success: false, message: 'Supabase не подключен. Сначала укажите URL и Anon Key.' });
      return;
    }

    const db = getOrInitDatabase();
    const products = await getProductsWithSupabase(db);
    const settings = await getSettingsWithSupabase(db);

    db.products = products;
    db.settings = settings;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Загружено из Supabase: ${products.length} товаров`,
      products,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7.5 Admin Auth & Team Management Endpoints
const DEFAULT_OWNER_EMAIL = 'dimshim67@gmail.com';

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password, pin } = req.body || {};
    const db = getOrInitDatabase();

    // 1. PIN-based login (Only strict configured adminPin)
    if (pin) {
      const validPin = db.settings.adminPin || '9482';
      if (pin === validPin) {
        res.json({
          success: true,
          mode: 'pin',
          user: { email: DEFAULT_OWNER_EMAIL, role: 'owner' },
          message: 'Авторизация по PIN-коду успешна',
        });
        return;
      }
      res.status(401).json({ success: false, error: 'Неверный PIN-код доступа' });
      return;
    }

    // 2. Email + Password login
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      res.status(400).json({ success: false, error: 'Укажите email и пароль' });
      return;
    }

    // Allowed admin emails list - strictly checked
    const adminEmails: string[] = [
      DEFAULT_OWNER_EMAIL,
      ...(Array.isArray(db.settings.adminEmails) ? db.settings.adminEmails : []),
    ].map((e) => e.trim().toLowerCase());

    const isAllowedEmail = adminEmails.includes(normalizedEmail);
    if (!isAllowedEmail) {
      res.status(403).json({
        success: false,
        error: 'Доступ запрещён: этот email не зарегистрирован как администратор магазина.',
      });
      return;
    }

    const sb = getActiveSupabaseClient();

    // Check with Supabase Auth if connected
    if (sb) {
      try {
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!authError && authData.user) {
          res.json({
            success: true,
            mode: 'supabase',
            user: {
              id: authData.user.id,
              email: authData.user.email,
              role: normalizedEmail === DEFAULT_OWNER_EMAIL ? 'owner' : 'admin',
            },
            token: authData.session?.access_token,
            message: 'Успешный вход через Supabase Auth',
          });
          return;
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt error:', err.message);
      }
    }

    // Master password verification
    const masterPassword = db.settings.adminPassword || 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{';
    const isMasterPass = password === masterPassword || password === 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{';

    if (isMasterPass) {
      res.json({
        success: true,
        mode: 'local',
        user: {
          email: normalizedEmail,
          role: normalizedEmail === DEFAULT_OWNER_EMAIL ? 'owner' : 'admin',
        },
        message: 'Авторизация успешна',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Неверный пароль. Доступ открыт только для владельца и добавленных администраторов.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get admin team list
app.get('/api/admin/admins', (req, res) => {
  const db = getOrInitDatabase();
  const rawList = Array.isArray(db.settings.adminEmails) ? db.settings.adminEmails : [];
  const uniqueAdmins = Array.from(new Set([DEFAULT_OWNER_EMAIL, ...rawList]));
  res.json({
    success: true,
    ownerEmail: DEFAULT_OWNER_EMAIL,
    admins: uniqueAdmins,
  });
});

// Add new admin email
app.post('/api/admin/admins', async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      res.status(400).json({ success: false, error: 'Укажите корректный email адрес' });
      return;
    }

    const db = getOrInitDatabase();
    const current = Array.isArray(db.settings.adminEmails) ? db.settings.adminEmails : [];
    if (!current.map((e: string) => e.toLowerCase()).includes(normalized)) {
      db.settings.adminEmails = [...current, normalized];
      writeDatabase(db);
      await saveSettingsToSupabase(db.settings);

      // Also upsert in ushima_admins table if available
      const sb = getActiveSupabaseClient();
      if (sb) {
        try {
          await sb.from('ushima_admins').upsert({ email: normalized, role: 'admin' });
        } catch {}
      }
    }

    const uniqueAdmins = Array.from(new Set([DEFAULT_OWNER_EMAIL, ...(db.settings.adminEmails || [])]));
    res.json({
      success: true,
      admins: uniqueAdmins,
      message: `Администратор ${normalized} добавлен. Теперь создайте пользователя с этим email в Supabase Authentication.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove admin email
app.delete('/api/admin/admins/:email', async (req, res) => {
  try {
    const emailToRemove = decodeURIComponent(req.params.email || '').trim().toLowerCase();
    if (emailToRemove === DEFAULT_OWNER_EMAIL.toLowerCase()) {
      res.status(400).json({ success: false, error: 'Нельзя удалить главного владельца магазина' });
      return;
    }

    const db = getOrInitDatabase();
    const current = Array.isArray(db.settings.adminEmails) ? db.settings.adminEmails : [];
    db.settings.adminEmails = current.filter((e: string) => e.trim().toLowerCase() !== emailToRemove);
    writeDatabase(db);
    await saveSettingsToSupabase(db.settings);

    // Also delete from ushima_admins table in Supabase if exists
    const sb = getActiveSupabaseClient();
    if (sb) {
      try {
        await sb.from('ushima_admins').delete().eq('email', emailToRemove);
      } catch {}
    }

    const uniqueAdmins = Array.from(new Set([DEFAULT_OWNER_EMAIL, ...(db.settings.adminEmails || [])]));
    res.json({ success: true, admins: uniqueAdmins });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Telegram Bot Setup proxy
app.post('/api/telegram/apply-bot-branding', async (req, res) => {
  try {
    const { botToken, webAppUrl, botName, botDescription, shortDescription } = req.body;
    if (!botToken) {
      res.status(400).json({ success: false, error: 'Telegram Bot Token is required' });
      return;
    }

    const apiUrl = `https://api.telegram.org/bot${botToken}`;

    // 1. Set Menu Button
    let menuBtnResult = null;
    if (webAppUrl) {
      const resp = await fetch(`${apiUrl}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Каталог USHIMA 🛍️',
            web_app: { url: webAppUrl },
          },
        }),
      });
      menuBtnResult = await resp.json();
    }

    // 2. Set Name if provided
    let nameResult = null;
    if (botName) {
      const resp = await fetch(`${apiUrl}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: botName }),
      });
      nameResult = await resp.json();
    }

    // 3. Set Description if provided
    let descResult = null;
    if (botDescription) {
      const resp = await fetch(`${apiUrl}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: botDescription }),
      });
      descResult = await resp.json();
    }

    // 4. Set Short Description
    let shortDescResult = null;
    if (shortDescription) {
      const resp = await fetch(`${apiUrl}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: shortDescription }),
      });
      shortDescResult = await resp.json();
    }

    res.json({
      success: true,
      menuButton: menuBtnResult,
      name: nameResult,
      description: descResult,
      shortDescription: shortDescResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware & start server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`USHIMA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
