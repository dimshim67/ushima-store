import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Package,
  ShoppingBag,
  Settings,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle,
  Clock,
  Send,
  ExternalLink,
  Eye,
  Database,
  LogOut,
  Users,
  UserPlus,
  Shield,
  Key,
  FolderPlus,
  Tag,
  Search,
  Lock,
  Smartphone,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Product, Order, BrandSettings, CategoryItem } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { BotBrandingGenerator } from './BotBrandingGenerator';
import { DatabaseSettings } from './DatabaseSettings';
import { api } from '../services/api';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  settings: BrandSettings;
  supabaseConfig?: { url?: string; anonKey?: string; enabled?: boolean };
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (product: Product) => void;
  onToggleStock: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateSettings: (newSettings: BrandSettings) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  onResetDefaults: () => void;
  onClearAllProducts?: () => void;
  onSwitchToClient: () => void;
  onOpenTelegramSetup?: () => void;
  onRefreshFromDatabase?: () => Promise<void>;
  showToast?: (msg: string) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  orders,
  settings,
  supabaseConfig,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onToggleStock,
  onUpdateOrderStatus,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetDefaults,
  onClearAllProducts,
  onSwitchToClient,
  onRefreshFromDatabase = async () => {},
  showToast = (_msg: string) => {},
  onLogout,
}) => {
  // 1. PRIMARY WORKSPACES (User requirement: Order monitoring is priority #1, settings grouped behind tab #2)
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'catalog' | 'settings'>('orders');

  // Sub-tabs
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'categories'>('products');
  const [settingsSubTab, setSettingsSubTab] = useState<'brand' | 'security' | 'telegram' | 'database' | 'backup'>('brand');

  // Orders filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'new' | 'confirmed' | 'paid' | 'shipped'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Products filters
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Settings form state (local copy for controlled editing)
  const [localSettings, setLocalSettings] = useState<BrandSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [securitySavedNotice, setSecuritySavedNotice] = useState(false);

  // Categories management state
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatLabel, setEditCatLabel] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Telegram helper state
  const [copiedBotUrl, setCopiedBotUrl] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Team Admin management state
  const [adminList, setAdminList] = useState<string[]>(['dimshim67@gmail.com']);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Database refresh state
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    api.getAdmins()
      .then((res) => {
        if (res.success && Array.isArray(res.admins)) {
          setAdminList(res.admins);
        }
      })
      .catch(() => {});
  }, []);

  const categoriesList: CategoryItem[] =
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : [
          { id: 'cat-1', slug: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
          { id: 'cat-2', slug: 'hoodies', label: 'ХУДИ' },
          { id: 'cat-3', slug: 'tees', label: 'ФУТБОЛКИ' },
          { id: 'cat-4', slug: 'bottoms', label: 'БРЮКИ' },
          { id: 'cat-5', slug: 'accessories', label: 'АКСЕССУАРЫ' },
        ];

  // Orders statistics
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'confirmed').length;
  const paidOrdersCount = orders.filter((o) => o.status === 'paid').length;
  const shippedOrdersCount = orders.filter((o) => o.status === 'shipped').length;
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  // Category handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    const cleanLabel = newCatLabel.trim().toUpperCase();
    const cleanSlug = (newCatSlug.trim() || cleanLabel.toLowerCase().replace(/[^a-z0-9]/gi, '-')).toLowerCase();

    if (categoriesList.some((c) => c.slug === cleanSlug)) {
      alert('Категория с таким идентификатором (slug) уже существует');
      return;
    }
    triggerHaptic('success');
    const updated = [...categoriesList, { id: `cat-${Date.now()}`, slug: cleanSlug, label: cleanLabel }];
    onUpdateSettings({ ...settings, categories: updated });
    setNewCatLabel('');
    setNewCatSlug('');
    showToast(`Категория "${cleanLabel}" создана`);
  };

  const handleUpdateCategory = (catId: string) => {
    if (!editCatLabel.trim()) return;
    triggerHaptic('medium');
    const cleanLabel = editCatLabel.trim().toUpperCase();
    const cleanSlug = (editCatSlug.trim() || cleanLabel.toLowerCase().replace(/[^a-z0-9]/gi, '-')).toLowerCase();
    const updated = categoriesList.map((c) =>
      c.id === catId || c.slug === catId ? { ...c, label: cleanLabel, slug: cleanSlug } : c
    );
    onUpdateSettings({ ...settings, categories: updated });
    setEditingCatId(null);
    showToast(`Категория обновлена`);
  };

  const handleDeleteCategory = (catId: string) => {
    triggerHaptic('heavy');
    const updated = categoriesList.filter((c) => c.id !== catId && c.slug !== catId);
    onUpdateSettings({ ...settings, categories: updated });
    setDeletingCatId(null);
    showToast('Категория удалена');
  };

  // Team Admin handlers
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Укажите корректный email адрес');
      return;
    }
    setIsAddingAdmin(true);
    try {
      const res = await api.addAdmin(cleanEmail);
      if (res.success) {
        setAdminList(res.admins);
        setNewAdminEmail('');
        showToast(`Администратор ${cleanEmail} добавлен!`);
      } else {
        showToast(res.error || 'Ошибка при добавлении');
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (emailToRemove === 'dimshim67@gmail.com') {
      showToast('Нельзя удалить главного владельца');
      return;
    }
    if (!confirm(`Удалить права администратора у ${emailToRemove}?`)) return;
    try {
      const res = await api.removeAdmin(emailToRemove);
      if (res.success) {
        setAdminList(res.admins);
        showToast(`Администратор ${emailToRemove} удален`);
      } else {
        showToast(res.error || 'Ошибка при удалении');
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка связи с сервером');
    }
  };

  // Save general store settings (without credentials)
  const handleSaveBrandSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    onUpdateSettings(localSettings);
    setSavedNotice(true);
    showToast('Настройки магазина сохранены');
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Save security credentials (PIN & Master Password only in this unified section)
  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    onUpdateSettings(localSettings);
    setSecuritySavedNotice(true);
    showToast('PIN-код и параметры доступа обновлены');
    setTimeout(() => setSecuritySavedNotice(false), 3000);
  };

  // Refresh DB action
  const handleTriggerDbRefresh = async () => {
    setIsRefreshingDb(true);
    triggerHaptic('light');
    try {
      await onRefreshFromDatabase();
      showToast('Данные синхронизированы');
    } catch {
      showToast('Ошибка при синхронизации');
    } finally {
      setIsRefreshingDb(false);
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) return false;
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    const matchId = ord.id.toLowerCase().includes(q);
    const matchName = ord.customer?.name?.toLowerCase().includes(q);
    const matchPhone = ord.customer?.phone?.toLowerCase().includes(q);
    const matchTg = ord.customer?.telegramUsername?.toLowerCase().includes(q);
    const matchItem = ord.items?.some((i) => i.product.title.toLowerCase().includes(q));
    return matchId || matchName || matchPhone || matchTg || matchItem;
  });

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchSearch =
      !productSearchQuery.trim() ||
      p.title.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Copy order summary to clipboard for Telegram message to customer
  const handleCopyOrderSummary = (ord: Order) => {
    const itemsText = ord.items
      .map((i) => `• ${i.product.title} (Размер: ${i.selectedSize}) × ${i.quantity} = ${(i.product.price * i.quantity).toLocaleString('ru-RU')} ${ord.currency}`)
      .join('\n');
    const text = `Заказ #${ord.id}\nПокупатель: ${ord.customer.name}\nТелефон: ${ord.customer.phone}\n${ord.customer.telegramUsername ? `Telegram: ${ord.customer.telegramUsername}\n` : ''}Адрес: ${ord.customer.address || 'Самовывоз'}\n\nТовары:\n${itemsText}\n\nИтого: ${ord.total.toLocaleString('ru-RU')} ${ord.currency}\nСтатус: ${ord.status.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedOrderId(ord.id);
    showToast('Детали заказа скопированы для сообщения клиенту');
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* TOP HEADER: Brand mark, KPIs & Quick Action Controls */}
      <header className="p-4 sm:p-5 rounded-2xl bg-[#101217] border border-[#1f242e] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a303c] to-[#12141a] border border-[#3b4455] flex items-center justify-center font-display font-black text-white text-base shadow-inner">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-lg text-white tracking-widest uppercase">
                  {settings.brandName} • ADMIN
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[10px] font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-xs font-mono text-[#788597]">
                Центр управления заказами, складом и интеграциями
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleTriggerDbRefresh}
              disabled={isRefreshingDb}
              title="Синхронизировать базу данных с сервером"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171a22] hover:bg-[#202530] border border-[#2b3342] text-xs font-mono text-[#cbd5e1] hover:text-white transition-all"
            >
              <RefreshCcw className={`w-3.5 h-3.5 text-[#38bdf8] ${isRefreshingDb ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Синхронизировать</span>
            </button>

            <button
              onClick={onSwitchToClient}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c222c] hover:bg-[#252e3c] border border-[#374358] text-xs font-mono text-white transition-all font-semibold"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Открыть витрину</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/30 text-xs font-mono text-rose-300 transition-all"
                title="Завершить сессию администратора"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            )}
          </div>
        </div>

        {/* High-level KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#1c212a] mt-4">
          <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1b2029]">
            <span className="text-[10px] font-mono text-[#64748b] uppercase block">Всего заказов</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-display text-xl font-bold text-white">{orders.length}</span>
              {newOrdersCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {newOrdersCount} новых
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1b2029]">
            <span className="text-[10px] font-mono text-[#64748b] uppercase block">Выручка</span>
            <div className="mt-0.5">
              <span className="font-display text-xl font-bold text-white">
                {totalRevenue.toLocaleString('ru-RU')} {settings.currency}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1b2029]">
            <span className="text-[10px] font-mono text-[#64748b] uppercase block">Моделей в каталоге</span>
            <div className="mt-0.5">
              <span className="font-display text-xl font-bold text-white">{products.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1b2029]">
            <span className="text-[10px] font-mono text-[#64748b] uppercase block">Telegram Бот</span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#38bdf8] font-medium truncate mt-1">
              <Send className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">@{settings.botUsername}</span>
            </div>
          </div>
        </div>
      </header>

      {/* PRIMARY NAVIGATION TABS (Orders First!) */}
      <nav className="flex items-center gap-2 p-1 rounded-2xl bg-[#0e1014] border border-[#1f242e]">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveMainTab('orders');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeMainTab === 'orders'
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              : 'text-[#8b96a7] hover:text-white hover:bg-[#161922]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Мониторинг заказов</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeMainTab === 'orders'
                ? 'bg-black text-white'
                : newOrdersCount > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[#1e232d] text-[#94a3b8]'
            }`}
          >
            {newOrdersCount > 0 ? `${newOrdersCount} новых` : orders.length}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveMainTab('catalog');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeMainTab === 'catalog'
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              : 'text-[#8b96a7] hover:text-white hover:bg-[#161922]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Каталог и склад</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeMainTab === 'catalog' ? 'bg-black text-white' : 'bg-[#1e232d] text-[#94a3b8]'
            }`}
          >
            {products.length}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveMainTab('settings');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeMainTab === 'settings'
              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              : 'text-[#8b96a7] hover:text-white hover:bg-[#161922]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Все настройки</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeMainTab === 'settings' ? 'bg-black text-white' : 'bg-[#1e232d] text-[#94a3b8]'
            }`}
          >
            5
          </span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 1. TAB: ORDERS MONITORING (Priority #1)                                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'orders' && (
        <section className="space-y-4">
          {/* Filter and Search Bar for Orders */}
          <div className="p-4 rounded-2xl bg-[#111317] border border-[#20252e] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Order Status Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all ${
                    orderStatusFilter === 'all'
                      ? 'bg-white text-black'
                      : 'bg-[#171a22] text-[#8b96a7] hover:text-white border border-[#262e3c]'
                  }`}
                >
                  Все ({orders.length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('new')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all ${
                    orderStatusFilter === 'new'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-[#1a1813] text-amber-300/80 hover:text-amber-200 border border-amber-900/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Новые ({newOrdersCount})</span>
                </button>
                <button
                  onClick={() => setOrderStatusFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all ${
                    orderStatusFilter === 'confirmed'
                      ? 'bg-purple-400 text-black font-bold'
                      : 'bg-[#1a1622] text-purple-300/80 hover:text-purple-200 border border-purple-900/30'
                  }`}
                >
                  Подтверждены ({confirmedOrdersCount})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all ${
                    orderStatusFilter === 'paid'
                      ? 'bg-emerald-400 text-black font-bold'
                      : 'bg-[#131d18] text-emerald-300/80 hover:text-emerald-200 border border-emerald-900/30'
                  }`}
                >
                  Оплачены ({paidOrdersCount})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('shipped')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all ${
                    orderStatusFilter === 'shipped'
                      ? 'bg-sky-400 text-black font-bold'
                      : 'bg-[#131b25] text-sky-300/80 hover:text-sky-200 border border-sky-900/30'
                  }`}
                >
                  Отправлены ({shippedOrdersCount})
                </button>
              </div>

              {/* Order Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, телефону, @tg..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none placeholder:text-[#525e70]"
                />
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-[#20252e] bg-[#111317] space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#4c5666] mx-auto" />
              <h3 className="font-display font-semibold text-white text-base">
                {orders.length === 0 ? 'Заказов пока нет' : 'По данному фильтру ничего не найдено'}
              </h3>
              <p className="text-xs font-mono text-[#717e90] max-w-sm mx-auto">
                {orders.length === 0
                  ? 'Когда клиенты оформят заказ на сайте или через Telegram Mini App, они моментально появятся здесь.'
                  : 'Попробуйте изменить статус фильтрации или очистить строку поиска.'}
              </p>
              {orderStatusFilter !== 'all' || orderSearchQuery ? (
                <button
                  onClick={() => {
                    setOrderStatusFilter('all');
                    setOrderSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1a1e27] hover:bg-[#252c39] text-xs font-mono text-white transition-colors"
                >
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const isCopied = copiedOrderId === ord.id;
                const statusColor =
                  ord.status === 'paid'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : ord.status === 'confirmed'
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                    : ord.status === 'shipped'
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-400';

                return (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#111317] border border-[#20252e] space-y-4 shadow-lg hover:border-[#31394a] transition-all"
                  >
                    {/* Order Header: ID, Date, Status Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2028] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm">#{ord.id}</span>
                        <span className="text-xs font-mono text-[#717e90] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ord.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#788596]">Статус:</span>
                        <select
                          value={ord.status}
                          onChange={(e) => {
                            triggerHaptic('medium');
                            onUpdateOrderStatus(ord.id, e.target.value as Order['status']);
                            showToast(`Статус заказа #${ord.id} обновлен`);
                          }}
                          className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${statusColor}`}
                        >
                          <option value="new" className="bg-[#111317] text-amber-400">
                            Новый
                          </option>
                          <option value="confirmed" className="bg-[#111317] text-purple-400">
                            Подтвержден
                          </option>
                          <option value="paid" className="bg-[#111317] text-emerald-400">
                            Оплачен в боте
                          </option>
                          <option value="shipped" className="bg-[#111317] text-sky-400">
                            Отправлен
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Information Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0c0e12] border border-[#1a1e27] text-xs font-mono">
                      <div>
                        <span className="text-[#64748b] block text-[10px] uppercase">Клиент:</span>
                        <strong className="text-white text-sm">{ord.customer.name}</strong>
                      </div>

                      <div>
                        <span className="text-[#64748b] block text-[10px] uppercase">Контакты:</span>
                        <a
                          href={`tel:${ord.customer.phone}`}
                          className="text-[#94a3b8] hover:text-white transition-colors block"
                        >
                          📞 {ord.customer.phone}
                        </a>
                        {ord.customer.telegramUsername && (
                          <a
                            href={`https://t.me/${ord.customer.telegramUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38bdf8] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Send className="w-3 h-3" />
                            <span>@{ord.customer.telegramUsername.replace('@', '')}</span>
                          </a>
                        )}
                      </div>

                      <div>
                        <span className="text-[#64748b] block text-[10px] uppercase">Доставка:</span>
                        <span className="text-[#cbd5e1]">{ord.customer.address || 'Самовывоз / Уточнить'}</span>
                      </div>
                    </div>

                    {/* Items Purchased List */}
                    <div className="p-3.5 rounded-xl bg-[#0c0e12] border border-[#1a1e27] text-xs font-mono space-y-2">
                      <span className="text-[10px] text-[#64748b] uppercase block">Содержимое заказа:</span>
                      <div className="space-y-1.5">
                        {ord.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[#cbd5e1] py-1 border-b border-[#181b23] last:border-none"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                              <span className="font-semibold text-white truncate">{item.product.title}</span>
                              <span className="px-2 py-0.5 rounded bg-[#1e232d] text-[#38bdf8] text-[10px] font-bold">
                                Р-р: {item.selectedSize}
                              </span>
                              <span className="text-[#788597]">× {item.quantity} шт.</span>
                            </div>
                            <span className="font-bold text-white whitespace-nowrap ml-2">
                              {(item.product.price * item.quantity).toLocaleString('ru-RU')} {ord.currency}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="pt-2 flex items-center justify-between border-t border-[#202735] font-bold text-sm">
                        <span className="text-[#94a3b8]">Итого к оплате:</span>
                        <span className="text-white text-base">
                          {ord.total.toLocaleString('ru-RU')} {ord.currency}
                        </span>
                      </div>
                    </div>

                    {/* Quick Order Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {ord.customer.telegramUsername && (
                        <a
                          href={`https://t.me/${ord.customer.telegramUsername.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182333] hover:bg-[#203046] border border-[#2b4468] text-[#38bdf8] font-mono text-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Написать в Telegram</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyOrderSummary(ord)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c222c] hover:bg-[#27303e] border border-[#2f394a] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Скопировано!' : 'Копировать заказ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: CATALOG AND INVENTORY (Products & Categories)                      */}
      {/* ========================================================================= */}
      {activeMainTab === 'catalog' && (
        <section className="space-y-4">
          {/* Sub-tabs: Products vs Categories */}
          <div className="flex items-center justify-between border-b border-[#212630] pb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setCatalogSubTab('products');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  catalogSubTab === 'products'
                    ? 'bg-white text-black'
                    : 'bg-[#121419] text-[#8b96a7] border border-[#222731] hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Товары ({products.length})</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setCatalogSubTab('categories');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  catalogSubTab === 'categories'
                    ? 'bg-white text-black'
                    : 'bg-[#121419] text-[#8b96a7] border border-[#222731] hover:text-white'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Категории ({categoriesList.length})</span>
              </button>
            </div>

            {catalogSubTab === 'products' && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAddProduct();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить модель</span>
              </button>
            )}
          </div>

          {/* Sub-view: PRODUCTS */}
          {catalogSubTab === 'products' && (
            <div className="space-y-4">
              {/* Product search and category filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#111317] border border-[#20252e]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Поиск по названию, артикулу..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#788597]">Категория:</span>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none"
                  >
                    <option value="all">Все категории ({products.length})</option>
                    {categoriesList.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label} ({products.filter((p) => p.category === c.slug).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table/List */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-[#20252e] bg-[#111317] space-y-3">
                  <Package className="w-10 h-10 text-[#4c5666] mx-auto" />
                  <h4 className="font-display font-semibold text-white text-base">Товаров не найдено</h4>
                  <p className="text-xs font-mono text-[#717e90] max-w-sm mx-auto">
                    Добавьте первую модель в каталог или измените параметры фильтра.
                  </p>
                  <button
                    onClick={onAddProduct}
                    className="px-4 py-2 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-wider"
                  >
                    + Добавить модель
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((prod) => {
                    const totalStock = prod.sizeStock
                      ? Object.values(prod.sizeStock).reduce<number>((a, b) => Number(a) + Number(b), 0)
                      : 0;

                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl bg-[#111317] border border-[#20252e] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#31394a] transition-all"
                      >
                        {/* Product visual + info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={prod.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=300'}
                            alt={prod.title}
                            className="w-14 h-16 rounded-xl object-cover border border-[#242a36] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-bold text-white text-sm truncate">{prod.title}</h4>
                              {prod.sku && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e232d] text-[#94a3b8]">
                                  {prod.sku}
                                </span>
                              )}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202c] text-[#38bdf8] border border-[#26374f]">
                                {prod.category.toUpperCase()}
                              </span>
                            </div>

                            {/* Stock by size badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              <span className="text-[10px] font-mono text-[#64748b]">Склад:</span>
                              {prod.sizeStock && Object.keys(prod.sizeStock).length > 0 ? (
                                Object.entries(prod.sizeStock).map(([sz, count]) => (
                                  <span
                                    key={sz}
                                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                      Number(count) > 0
                                        ? 'bg-[#142019] text-emerald-400 border-emerald-900/40'
                                        : 'bg-[#1e1414] text-rose-400 border-rose-900/40 line-through'
                                    }`}
                                  >
                                    {sz}: {count}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-mono text-[#788597]">
                                  {prod.sizes.join(', ')}
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-bold text-white ml-1">
                                (Всего: {totalStock} шт.)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price, Stock status switch & Actions */}
                        <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-[#1c212a] pt-3 md:pt-0">
                          <div className="text-right font-mono">
                            <div className="font-bold text-white text-sm">
                              {prod.price.toLocaleString('ru-RU')} {settings.currency}
                            </div>
                            <span
                              className={`text-[10px] ${
                                prod.inStock ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {prod.inStock ? 'В наличии' : 'Снят с продажи'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                onToggleStock(prod.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                                prod.inStock
                                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/40'
                                  : 'bg-rose-950/20 text-rose-400 border-rose-800/40 hover:bg-rose-950/40'
                              }`}
                              title="Переключить статус наличия"
                            >
                              {prod.inStock ? 'Вкл' : 'Выкл'}
                            </button>

                            <button
                              onClick={() => onDuplicateProduct(prod)}
                              className="p-2 rounded-lg bg-[#161a22] hover:bg-[#202734] border border-[#273244] text-[#cbd5e1] hover:text-white transition-colors"
                              title="Дублировать товар"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditProduct(prod)}
                              className="p-2 rounded-lg bg-[#18202d] hover:bg-[#222e42] border border-[#2b3e58] text-[#38bdf8] transition-colors"
                              title="Редактировать товар"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {deletingProductId === prod.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onDeleteProduct(prod.id);
                                    setDeletingProductId(null);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-mono font-bold hover:bg-rose-500"
                                >
                                  Да
                                </button>
                                <button
                                  onClick={() => setDeletingProductId(null)}
                                  className="px-2 py-1.5 rounded-lg bg-[#1e232d] text-[#94a3b8] text-xs font-mono"
                                >
                                  Нет
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingProductId(prod.id)}
                                className="p-2 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 transition-colors"
                                title="Удалить товар"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-view: CATEGORIES */}
          {catalogSubTab === 'categories' && (
            <div className="space-y-4">
              {/* Category creation form */}
              <form onSubmit={handleAddCategory} className="p-4 sm:p-5 rounded-2xl bg-[#111317] border border-[#20252e] space-y-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#38bdf8]" />
                  <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                    Создать новую категорию
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#788597] uppercase mb-1">
                      Название категории на витрине
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="Например: ПУХОВИКИ или ЖИЛЕТЫ"
                      className="w-full px-3 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#788597] uppercase mb-1">
                      URL slug (на английском)
                    </label>
                    <input
                      type="text"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      placeholder="Например: puffers (или заполнится авто)"
                      className="w-full px-3 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-colors"
                >
                  + Добавить категорию
                </button>
              </form>

              {/* Existing categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoriesList.map((cat) => {
                  const isEditing = editingCatId === cat.id;
                  const catProductsCount = products.filter((p) => p.category === cat.slug).length;
                  const catInStockCount = products.filter((p) => p.category === cat.slug && p.inStock).length;

                  return (
                    <div
                      key={cat.id || cat.slug}
                      className="p-4 rounded-2xl bg-[#111317] border border-[#20252e] space-y-2.5 hover:border-[#31394a] transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editCatLabel}
                            onChange={(e) => setEditCatLabel(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161922] border border-[#273244] text-white text-xs font-mono"
                          />
                          <input
                            type="text"
                            value={editCatSlug}
                            onChange={(e) => setEditCatSlug(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161922] border border-[#273244] text-white text-xs font-mono"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id || cat.slug)}
                              className="px-3 py-1 rounded bg-white text-black text-xs font-mono font-bold"
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="px-3 py-1 rounded bg-[#1e232d] text-[#94a3b8] text-xs font-mono"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-[#38bdf8]" />
                              <span className="font-bold text-white text-sm font-mono">{cat.label}</span>
                            </div>
                            <div className="text-[11px] font-mono text-[#64748b] mt-0.5">
                              slug: <span className="text-[#38bdf8]">{cat.slug}</span> • Товаров: {catProductsCount} (в наличии: {catInStockCount})
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id || cat.slug);
                                setEditCatLabel(cat.label);
                                setEditCatSlug(cat.slug);
                              }}
                              className="p-1.5 rounded-lg bg-[#161922] hover:bg-[#202634] text-[#cbd5e1] border border-[#263142]"
                              title="Редактировать категорию"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {deletingCatId === (cat.id || cat.slug) ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id || cat.slug)}
                                  className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-mono font-bold"
                                >
                                  Да
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingCatId(null)}
                                  className="px-2 py-1 rounded bg-[#1e232d] text-[#94a3b8] text-[10px] font-mono"
                                >
                                  Нет
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingCatId(cat.id || cat.slug)}
                                className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30"
                                title="Удалить категорию"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: SETTINGS & INTEGRATIONS (Clean Button Navigation, No Sliders!)     */}
      {/* ========================================================================= */}
      {activeMainTab === 'settings' && (
        <section className="space-y-4">
          {/* Sub-Navigation Buttons (Clean Static Grid/Row) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-[#111317] border border-[#20252e]">
            <button
              onClick={() => {
                triggerHaptic('light');
                setSettingsSubTab('brand');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all ${
                settingsSubTab === 'brand'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-[#8b96a7] hover:text-white hover:bg-[#161a22]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Магазин</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setSettingsSubTab('security');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all ${
                settingsSubTab === 'security'
                  ? 'bg-purple-500 text-white font-bold shadow-md'
                  : 'text-[#8b96a7] hover:text-white hover:bg-[#161a22]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Доступ и PIN</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setSettingsSubTab('telegram');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all ${
                settingsSubTab === 'telegram'
                  ? 'bg-[#38bdf8] text-black font-bold shadow-md'
                  : 'text-[#8b96a7] hover:text-white hover:bg-[#161a22]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram-бот</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setSettingsSubTab('database');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all ${
                settingsSubTab === 'database'
                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                  : 'text-[#8b96a7] hover:text-white hover:bg-[#161a22]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>База данных</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setSettingsSubTab('backup');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all col-span-2 sm:col-span-1 ${
                settingsSubTab === 'backup'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-[#8b96a7] hover:text-white hover:bg-[#161a22]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Резерв & Сброс</span>
            </button>
          </div>

          {/* 3.1 SUB-TAB: BRAND & STORE DETAILS */}
          {settingsSubTab === 'brand' && (
            <form
              onSubmit={handleSaveBrandSettings}
              className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#1c212a] pb-3">
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Настройки бренда и витрины
                  </h3>
                  <p className="text-xs font-mono text-[#788597]">
                    Параметры отображения каталога, валюты и контактов
                  </p>
                </div>
                {savedNotice && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" /> Сохранено!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Название бренда
                  </label>
                  <input
                    type="text"
                    required
                    value={localSettings.brandName}
                    onChange={(e) => setLocalSettings({ ...localSettings, brandName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Символ валюты
                  </label>
                  <input
                    type="text"
                    required
                    value={localSettings.currency}
                    onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                    placeholder="₽, $, €"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Контакт менеджера в Telegram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] font-mono text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={localSettings.contactTelegram}
                      onChange={(e) => setLocalSettings({ ...localSettings, contactTelegram: e.target.value.replace('@', '') })}
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Слоган бренда (Tagline)
                </label>
                <input
                  type="text"
                  value={localSettings.brandTagline}
                  onChange={(e) => setLocalSettings({ ...localSettings, brandTagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Главный заголовок витрины (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroTitle || 'U S H I M A. ///'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Бейдж в шапке (Hero Badge)
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroBadge || 'USHIMA ARCHIVE // METALLIC ATELIER'}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroBadge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Описание философии магазина
                </label>
                <textarea
                  rows={2}
                  value={localSettings.heroDescription || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroDescription: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-sm font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Сохранить настройки бренда
                </button>
              </div>
            </form>
          )}

          {/* 3.2 SUB-TAB: SECURITY & PIN-CODE (THE SINGLE DEFINITIVE PLACE FOR CREDENTIALS) */}
          {settingsSubTab === 'security' && (
            <div className="space-y-5">
              {/* Credentials Card */}
              <form
                onSubmit={handleSaveSecuritySettings}
                className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#1c212a] pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display font-bold text-white text-base">
                      Единый центр безопасности и паролей
                    </h3>
                  </div>
                  {securitySavedNotice && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" /> Доступ сохранен!
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-[#788597] leading-relaxed">
                  Здесь настраиваются ключи авторизации для входа в панель администратора. Изменения сохраняются и действуют сразу.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                      Секретный PIN-код администратора
                    </label>
                    <input
                      type="text"
                      required
                      value={localSettings.adminPin}
                      onChange={(e) => setLocalSettings({ ...localSettings, adminPin: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#273244] text-[#38bdf8] font-mono text-base font-bold focus:border-[#38bdf8] focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-[#64748b] mt-1 block">
                      Быстрый код для разблокировки панели (по умолчанию: 9482)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                      Мастер-пароль администратора
                    </label>
                    <input
                      type="text"
                      value={localSettings.adminPassword || 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{'}
                      onChange={(e) => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#273244] text-amber-400 font-mono text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-[#64748b] mt-1 block">
                      Для защищенного аварийного входа
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-purple-600 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    Сохранить ключи доступа
                  </button>
                </div>
              </form>

              {/* Team Admin List */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1c212a] pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h4 className="font-display font-bold text-white text-base">
                      Администраторы команды ({adminList.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748b]">Права доступа по email</span>
                </div>

                <form onSubmit={handleAddAdmin} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="manager@example.com"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#161922] border border-[#273244] text-white text-xs font-mono focus:border-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAddingAdmin}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isAddingAdmin ? '...' : '+ Добавить'}
                  </button>
                </form>

                <div className="space-y-2">
                  {adminList.map((admEmail) => {
                    const isOwner = admEmail.toLowerCase() === 'dimshim67@gmail.com';
                    return (
                      <div
                        key={admEmail}
                        className="p-3 rounded-xl bg-[#0c0e12] border border-[#1b2029] flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isOwner
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-[#181d26] text-[#94a3b8]'
                            }`}
                          >
                            {admEmail.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white font-semibold">{admEmail}</span>
                            {isOwner && (
                              <span className="ml-2 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px]">
                                Владелец
                              </span>
                            )}
                          </div>
                        </div>

                        {!isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(admEmail)}
                            className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 transition-colors"
                            title="Отозвать доступ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3.3 SUB-TAB: TELEGRAM BOT & SETUP MEMO */}
          {settingsSubTab === 'telegram' && (
            <div className="space-y-5">
              {/* Telegram Memo Card (Moved back into settings, no moving slider!) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#10141d] border border-[#1e293b] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c293d] pb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#38bdf8]" />
                    <h3 className="font-display font-bold text-white text-base">
                      Памятка по Telegram Mini App и @BotFather
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUrl);
                      setCopiedBotUrl(true);
                      showToast('Ссылка на магазин скопирована для @BotFather');
                      setTimeout(() => setCopiedBotUrl(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182334] hover:bg-[#22334a] border border-[#2b4468] text-[#38bdf8] font-mono text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedBotUrl ? 'Скопировано!' : 'Скопировать URL магазина'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-[#8b96a7]">
                  <div className="p-3.5 rounded-xl bg-[#0c0f16] border border-[#192333] space-y-1.5">
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      <span>📍 1. Ссылка вашего приложения</span>
                    </div>
                    <p className="text-[11px] break-all text-[#38bdf8] font-bold">{currentUrl}</p>
                    <p className="text-[11px] text-[#6b7280]">
                      В боте @BotFather через команду <span className="text-white">/newapp</span> или <span className="text-white">/setmenubutton</span> укажите именно эту ссылку.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0c0f16] border border-[#192333] space-y-1.5">
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      <span>⚡ 2. Сброс кэша в Telegram</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">
                      Telegram кэширует экраны внутри мессенджера. Чтобы увидеть свежие обновления:
                    </p>
                    <p className="text-[11px] text-amber-300">
                      В приложении Telegram нажмите три точки <span className="text-white font-bold">⋮</span> вверху справа → <span className="underline">«Перезагрузить страницу»</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bot Branding Generator component */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e]">
                <BotBrandingGenerator settings={settings} onPreviewClick={onSwitchToClient} />
              </div>
            </div>
          )}

          {/* 3.4 SUB-TAB: SUPABASE DATABASE */}
          {settingsSubTab === 'database' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e]">
              <DatabaseSettings
                initialConfig={supabaseConfig}
                productsCount={products.length}
                ordersCount={orders.length}
                onRefreshData={onRefreshFromDatabase}
                onResetData={async () => {
                  await onResetDefaults();
                }}
                showToast={showToast}
              />
            </div>
          )}

          {/* 3.5 SUB-TAB: BACKUP & DATA RESET */}
          {settingsSubTab === 'backup' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#111317] border border-[#20252e] space-y-6">
              <div className="border-b border-[#1c212a] pb-3">
                <h3 className="font-display font-bold text-white text-base">
                  Резервные копии и управление базой
                </h3>
                <p className="text-xs font-mono text-[#788597]">
                  Экспорт, импорт каталога в JSON и восстановление демо-данных
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1b2029] space-y-2">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-xs uppercase">
                    <Download className="w-4 h-4 text-[#38bdf8]" />
                    <span>Экспорт каталога</span>
                  </div>
                  <p className="text-[11px] font-mono text-[#64748b]">
                    Скачать файл со всеми товарами, заказами и настройками магазина.
                  </p>
                  <button
                    onClick={onExportData}
                    className="w-full py-2 rounded-xl bg-[#18202d] hover:bg-[#202c3e] border border-[#2b3d56] text-[#38bdf8] font-mono text-xs font-semibold transition-colors"
                  >
                    Скачать backup.json
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1b2029] space-y-2">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-xs uppercase">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Импорт данных</span>
                  </div>
                  <p className="text-[11px] font-mono text-[#64748b]">
                    Загрузить ранее сохраненный JSON файл с товарами.
                  </p>
                  <label className="w-full py-2 rounded-xl bg-[#20192b] hover:bg-[#2b223a] border border-[#3e2e54] text-purple-300 font-mono text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer">
                    <span>Выбрать JSON файл</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            try {
                              const parsed = JSON.parse(evt.target?.result as string);
                              onImportData(parsed);
                            } catch {
                              alert('Некорректный JSON файл');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Archive Products */}
              <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1b2029] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white uppercase">
                      Восстановление каталога USHIMA
                    </h4>
                    <p className="text-[11px] font-mono text-[#64748b]">
                      Загружает 7 фирменных архивных моделей (пуховики, худи, карго, сумки) с остатками по размерам.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Восстановить фирменный архив товаров USHIMA?')) {
                        onResetDefaults();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1c222c] hover:bg-[#252e3c] border border-[#303c4f] text-white font-mono text-xs font-semibold transition-colors"
                  >
                    Восстановить модели
                  </button>
                </div>
              </div>

              {/* Clear All Products */}
              {onClearAllProducts && (
                <div className="p-4 rounded-xl bg-rose-950/10 border border-rose-900/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-rose-400 uppercase">
                        Очистить каталог товаров
                      </h4>
                      <p className="text-[11px] font-mono text-[#717d8e]">
                        Удаляет все товары из базы для наполнения с нуля вручную.
                      </p>
                    </div>

                    {showClearConfirm ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClearAllProducts();
                            setShowClearConfirm(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-mono text-xs font-bold"
                        >
                          Да, удалить все
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-[#1a1e26] text-[#94a3b8] font-mono text-xs"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 font-mono text-xs font-semibold transition-colors"
                      >
                        Очистить каталог
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
