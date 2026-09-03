/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, BrandSettings, ViewMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_BRAND_SETTINGS } from './data/initialProducts';
import { Header } from './components/Header';
import { ClientCatalog } from './components/ClientCatalog';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/AdminPanel';
import { EditProductModal } from './components/EditProductModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { TelegramSetupModal } from './components/TelegramSetupModal';
import { SiteContentModal } from './components/SiteContentModal';
import { initTelegramEnvironment, getTelegramWebApp, triggerHaptic } from './utils/telegram';
import { api } from './services/api';

const STORAGE_KEYS = {
  PRODUCTS: 'ushima_products_v2',
  SETTINGS: 'ushima_settings_v2',
  ORDERS: 'ushima_orders_v2',
  CART: 'ushima_cart_v2',
};

export default function App() {
  // 1. Core State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [settings, setSettings] = useState<BrandSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_BRAND_SETTINGS;
    } catch {
      return INITIAL_BRAND_SETTINGS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. View and Modal states
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTelegramSetupOpen, setIsTelegramSetupOpen] = useState(false);
  const [isSiteContentOpen, setIsSiteContentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url?: string; anonKey?: string; enabled?: boolean }>();
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Sync state with server database
  const fetchDbData = async () => {
    try {
      setIsDbLoading(true);
      const data = await api.getStoreData();
      if (data.success) {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.orders) {
          setOrders(data.orders);
        }
        if (data.supabaseConfig) {
          setSupabaseConfig(data.supabaseConfig);
        }
      }
    } catch (err) {
      console.warn('Using local fallback state:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Initialize Telegram environment
  useEffect(() => {
    initTelegramEnvironment();

    // Check if ?admin=true is present in URL to open admin directly
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
        setViewMode('admin');
      }
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Synchronize Telegram MainButton with Cart
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg?.MainButton) return;

    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    if (cart.length > 0 && !isCartOpen && viewMode === 'client') {
      tg.MainButton.setText(`Корзина (${cart.length}) • ${cartTotal.toLocaleString('ru-RU')} ${settings.currency}`);
      tg.MainButton.show();
      const onMainButtonClick = () => {
        triggerHaptic('medium');
        setIsCartOpen(true);
      };
      tg.MainButton.onClick(onMainButtonClick);
      return () => {
        tg.MainButton.offClick(onMainButtonClick);
        tg.MainButton.hide();
      };
    } else {
      tg.MainButton.hide();
    }
  }, [cart, isCartOpen, viewMode, settings.currency]);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, selectedSize: size, quantity }];
    });
    showToast(`Добавлено: ${product.title} (${size})`);
  };

  const handleUpdateCartQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedSize === size))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    api.placeOrder(order).catch((err) => console.error('Error syncing order to DB:', err));
    showToast(`Заказ #${order.id} оформлен`);
  };

  // Admin Product Operations
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...prev];
    });
    api.saveProduct(product).catch((err) => console.error('Error syncing product to DB:', err));
    showToast(`Товар "${product.title}" сохранен в БД`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    api.deleteProduct(productId).catch((err) => console.error('Error deleting product from DB:', err));
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
    }
    if (editingProduct && editingProduct.id === productId) {
      setEditingProduct(null);
      setIsEditModalOpen(false);
    }
    showToast('Товар успешно удален из базы данных');
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      title: `${product.title} (Копия)`,
      createdAt: Date.now(),
    };
    setProducts((prev) => [duplicated, ...prev]);
    api.saveProduct(duplicated).catch((err) => console.error('Error duplicating product in DB:', err));
    showToast(`Создана копия "${product.title}"`);
  };

  const handleToggleStock = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p));
      const target = updated.find((p) => p.id === productId);
      if (target) {
        api.saveProduct(target).catch((err) => console.error('Error updating stock in DB:', err));
      }
      return updated;
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    api.updateOrderStatus(orderId, status).catch((err) => console.error('Error updating status in DB:', err));
    showToast(`Статус заказа #${orderId} обновлен`);
  };

  const handleUpdateSettings = (newSettings: BrandSettings) => {
    setSettings(newSettings);
    api.saveSettings(newSettings).catch((err) => console.error('Error updating settings in DB:', err));
    showToast('Настройки бренда сохранены в БД');
  };

  const handleExportData = () => {
    const data = {
      brand: settings,
      products,
      orders,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argent-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (data.products && Array.isArray(data.products)) {
      setProducts(data.products);
    }
    if (data.brand) {
      setSettings(data.brand);
    }
    if (data.orders && Array.isArray(data.orders)) {
      setOrders(data.orders);
    }
    showToast('Данные успешно загружены');
  };

  const handleResetDefaults = async () => {
    try {
      await api.resetData();
      await fetchDbData();
      setCart([]);
      showToast('База данных сброшена к исходному каталогу');
    } catch {
      setProducts(INITIAL_PRODUCTS);
      setSettings(INITIAL_BRAND_SETTINGS);
      setOrders([]);
      setCart([]);
      showToast('Каталог сброшен локально');
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#d6d9dc] flex flex-col selection:bg-[#3f444d] selection:text-white">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold shadow-[0_10px_30px_rgba(255,255,255,0.2)] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Global Header */}
      <Header
        settings={settings}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'admin' ? 'client' : 'admin')}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onOpenTelegramSetup={() => setIsTelegramSetupOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {viewMode === 'client' ? (
          <ClientCatalog
            products={products}
            settings={settings}
            viewMode={viewMode}
            onOpenTelegramSetup={() => setIsTelegramSetupOpen(true)}
            onOpenSiteContentModal={() => setIsSiteContentOpen(true)}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onQuickAddToCart={(p, size) => handleAddToCart(p, size, 1)}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleStock={handleToggleStock}
          />
        ) : (
          <AdminPanel
            products={products}
            orders={orders}
            settings={settings}
            supabaseConfig={supabaseConfig}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onDuplicateProduct={handleDuplicateProduct}
            onToggleStock={handleToggleStock}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetDefaults={handleResetDefaults}
            onRefreshFromDatabase={fetchDbData}
            showToast={showToast}
            onSwitchToClient={() => {
              triggerHaptic('light');
              setViewMode('client');
            }}
            onOpenTelegramSetup={() => setIsTelegramSetupOpen(true)}
          />
        )}
      </main>

      {/* Product Detail Modal (for customers or owner inspecting details) */}
      <ProductModal
        product={selectedProduct}
        currency={settings.currency}
        botUsername={settings.botUsername}
        viewMode={viewMode}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onDirectOrder={(p, size) => {
          handleAddToCart(p, size, 1);
          setSelectedProduct(null);
          setIsCartOpen(true);
        }}
        onEdit={(p) => {
          setSelectedProduct(null);
          handleOpenEditProduct(p);
        }}
        onDelete={handleDeleteProduct}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currency={settings.currency}
        botUsername={settings.botUsername}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Admin Edit / Add Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        product={editingProduct}
        currency={settings.currency}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Site Content & Description Editor Modal */}
      <SiteContentModal
        isOpen={isSiteContentOpen}
        settings={settings}
        onClose={() => setIsSiteContentOpen(false)}
        onSave={(updated) => {
          handleUpdateSettings(updated);
          showToast('Описание и тексты сайта сохранены');
        }}
      />

      {/* Admin Authentication PIN Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        adminPin={settings.adminPin}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => setViewMode('admin')}
      />

      {/* Telegram Launch & Bot Setup Modal Guide */}
      <TelegramSetupModal
        isOpen={isTelegramSetupOpen}
        settings={settings}
        onClose={() => setIsTelegramSetupOpen(false)}
      />
    </div>
  );
}
