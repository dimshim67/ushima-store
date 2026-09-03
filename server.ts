import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { readDatabase, writeDatabase, testSupabaseConnection, getSupabaseClient, DatabaseSchema } from './server/db';
import { INITIAL_PRODUCTS, INITIAL_BRAND_SETTINGS } from './src/data/initialProducts';

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads from catalog admin
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  }
  return db;
}

// 1. Health check & DB status
app.get('/api/health', (req, res) => {
  const db = getOrInitDatabase();
  res.json({
    status: 'ok',
    productsCount: db.products.length,
    ordersCount: db.orders.length,
    supabaseConfigured: Boolean(db.supabaseConfig?.url && db.supabaseConfig?.anonKey),
    lastUpdated: db.lastUpdated,
  });
});

// 2. Get full store data (products, settings, orders)
app.get('/api/data', (req, res) => {
  try {
    const db = getOrInitDatabase();
    res.json({
      success: true,
      products: db.products,
      settings: db.settings,
      orders: db.orders,
      supabaseConfig: db.supabaseConfig || {},
      lastUpdated: db.lastUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Products Endpoints
app.get('/api/products', (req, res) => {
  const db = getOrInitDatabase();
  res.json({ success: true, products: db.products });
});

app.post('/api/products', (req, res) => {
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
    res.json({ success: true, product, count: db.products.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getOrInitDatabase();
    db.products = db.products.filter((p) => p.id !== id);
    writeDatabase(db);
    res.json({ success: true, count: db.products.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Settings Endpoints
app.get('/api/settings', (req, res) => {
  const db = getOrInitDatabase();
  res.json({ success: true, settings: db.settings });
});

app.post('/api/settings', (req, res) => {
  try {
    const newSettings = req.body;
    const db = getOrInitDatabase();
    db.settings = { ...db.settings, ...newSettings };
    writeDatabase(db);
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

app.post('/api/orders', (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.id) {
      res.status(400).json({ success: false, error: 'Valid order object required' });
      return;
    }
    const db = getOrInitDatabase();
    db.orders = [order, ...db.orders];
    writeDatabase(db);
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
            text: 'Каталог УШИМА 🛍️',
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
