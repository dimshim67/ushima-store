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
import { AdminLoginPage } from './components/AdminLoginPage';
import { EditProductModal } from './components/EditProductModal';
import { SiteContentModal } from './components/SiteContentModal';
import { initTelegramEnvironment, getTelegramWebApp, triggerHaptic, isInsideTelegram } from './utils/telegram';
import { api } from './services/api';

const STORAGE_KEYS = {
  PRODUCTS: 'ushima_products_v3',
  SETTINGS: 'ushima_settings_v2',
  ORDERS: 'ushima_orders_v2',
  CART: 'ushima_cart_v2',
  ADMIN_AUTH: 'ushima_admin_auth',
};

const checkIsAdminUrl = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    search.get('admin') === 'true' ||
    search.has('admin') ||
    hash === '#admin' ||
    hash.startsWith('#admin') ||
    hash.startsWith('#/admin')
  );
};

export default function App() {
  // 1. Core State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_PRODUCTS;
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

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  // 2. View and Modal states
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (isInsideTelegram()) return 'client';
    return checkIsAdminUrl() ? 'admin' : 'client';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSiteContentOpen, setIsSiteContentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url?: string; anonKey?: string; enabled?: boolean }>();
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Router navigation helper
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      if (path.startsWith('/admin') || path.includes('admin=true')) {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    }
  };

  // Keep URL in sync with viewMode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInsideTelegram()) {
      if (window.location.pathname.startsWith('/admin')) {
        window.history.replaceState({}, '', '/');
      }
      return;
    }

    if (viewMode === 'admin') {
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/');
      }
    }
  }, [viewMode]);

  // Handle browser back/forward buttons and hash navigation
  useEffect(() => {
    const handleUrlChange = () => {
      if (isInsideTelegram()) {
        setViewMode('client');
        return;
      }
      if (checkIsAdminUrl()) {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Sync state with server database
  const fetchDbData = async (showSuccessToast = false) => {
    try {
      setIsDbLoading(true);
      const data = await api.getStoreData();
      if (data.success) {
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
        }
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
        }
        if (data.supabaseConfig) {
          setSupabaseConfig(data.supabaseConfig);
        }
        if (showSuccessToast) {
          showToast('Каталог синхронизирован с сервером');
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

    // Re-fetch when user returns to tab or opens Telegram Mini App
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDbData();
      }
    };
    const handleFocus = () => {
      fetchDbData();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

    // Deduct stock for each purchased item immediately
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const orderItem = order.items.find((item) => item.product.id === p.id);
        if (!orderItem) return p;
        const currentStock = { ...(p.sizeStock || {}) };
        if (currentStock[orderItem.selectedSize] !== undefined) {
          currentStock[orderItem.selectedSize] = Math.max(0, currentStock[orderItem.selectedSize] - orderItem.quantity);
        }
        const totalRemain = Object.values(currentStock).reduce<number>((a, b) => Number(a) + Number(b), 0);
        return {
          ...p,
          sizeStock: currentStock,
          inStock: totalRemain > 0 || Object.keys(currentStock).length === 0,
        };
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });

    api
      .placeOrder(order)
      .then((res: any) => {
        if (res?.products && Array.isArray(res.products)) {
          setProducts(res.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(res.products));
        }
      })
      .catch((err) => console.error('Error syncing order to DB:', err));

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

  const handleSaveProduct = async (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const updated = exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    try {
      await api.saveProduct(product);
      showToast(`Товар "${product.title}" сохранен в БД`);
    } catch (err) {
      console.error('Error syncing product to DB:', err);
      showToast('Ошибка сохранения на сервере');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    try {
      await api.deleteProduct(productId);
      showToast('Товар удален из базы данных');
    } catch (err) {
      console.error('Error deleting product from DB:', err);
      showToast('Ошибка удаления на сервере');
    }
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
    }
    if (editingProduct && editingProduct.id === productId) {
      setEditingProduct(null);
      setIsEditModalOpen(false);
    }
  };

  const handleClearAllProducts = async () => {
    setProducts([]);
    setCart([]);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    try {
      await api.clearAllProducts();
      showToast('Все карточки удалены из каталога и БД');
    } catch (err) {
      console.error('Error clearing products in DB:', err);
      showToast('Ошибка очистки на сервере');
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      const res = await api.restoreDefaultProducts();
      const loaded = res.products || INITIAL_PRODUCTS;
      setProducts(loaded);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(loaded));
      showToast('Демо-товары восстановлены');
    } catch (err) {
      console.error('Error restoring defaults in DB:', err);
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      showToast('Демо-товары восстановлены локально');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      title: `${product.title} (Копия)`,
      createdAt: Date.now(),
    };
    setProducts((prev) => {
      const updated = [duplicated, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    try {
      await api.saveProduct(duplicated);
      showToast(`Создана копия "${product.title}"`);
    } catch (err) {
      console.error('Error duplicating product in DB:', err);
    }
  };

  const handleToggleStock = async (productId: string) => {
    let target: Product | undefined;
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p));
      target = updated.find((p) => p.id === productId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    if (target) {
      try {
        await api.saveProduct(target);
      } catch (err) {
        console.error('Error updating stock in DB:', err);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
    try {
      await api.updateOrderStatus(orderId, status);
      showToast(`Статус заказа #${orderId} обновлен`);
    } catch (err) {
      console.error('Error updating status in DB:', err);
    }
  };

  const handleUpdateSettings = async (newSettings: BrandSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    try {
      await api.saveSettings(newSettings);
      showToast('Настройки и описание сохранены в БД');
    } catch (err) {
      console.error('Error updating settings in DB:', err);
      showToast('Ошибка сохранения настроек на сервере');
    }
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

      {/* When in admin mode and not authenticated, show the full-screen AdminLoginPage */}
      {viewMode === 'admin' && !isAdminAuthenticated ? (
        <AdminLoginPage
          onSuccess={() => {
            setIsAdminAuthenticated(true);
            showToast('Авторизация успешна. Добро пожаловать!');
          }}
          onBackToClient={() => navigateTo('/')}
          expectedPin={settings.adminPin}
        />
      ) : (
        <>
          {/* Global Header */}
          <Header
            settings={settings}
            viewMode={viewMode}
            onToggleViewMode={() => {
              if (viewMode === 'admin') {
                navigateTo('/');
              } else {
                navigateTo('/admin');
              }
            }}
            cartCount={cartCount}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAdminAuth={() => {
              navigateTo('/admin');
            }}
            onRefresh={() => fetchDbData(true)}
            isRefreshing={isDbLoading}
          />

          {/* Main View Router */}
          <main className="flex-1 pb-16">
            {viewMode === 'client' ? (
              <ClientCatalog
                products={products}
                settings={settings}
                viewMode={viewMode}
                onOpenSiteContentModal={() => setIsSiteContentOpen(true)}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onQuickAddToCart={(p, size) => handleAddToCart(p, size, 1)}
                onAddProduct={handleOpenAddProduct}
                onEditProduct={handleOpenEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onToggleStock={handleToggleStock}
                onResetDefaults={handleResetDefaults}
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
                onResetDefaults={handleRestoreDefaults}
                onClearAllProducts={handleClearAllProducts}
                onRefreshFromDatabase={fetchDbData}
                showToast={showToast}
                onSwitchToClient={() => {
                  triggerHaptic('light');
                  navigateTo('/');
                }}
                onLogout={() => {
                  try {
                    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
                  } catch {}
                  setIsAdminAuthenticated(false);
                  showToast('Вы вышли из админ-панели');
                  navigateTo('/');
                }}
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
            categories={settings.categories}
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
        </>
      )}
    </div>
  );
}
