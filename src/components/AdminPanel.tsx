import React, { useState } from 'react';
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
  DollarSign,
  Layers,
  Eye,
  Database,
} from 'lucide-react';
import { Product, Order, BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { BotBrandingGenerator } from './BotBrandingGenerator';
import { DatabaseSettings } from './DatabaseSettings';

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
  onSwitchToClient: () => void;
  onOpenTelegramSetup: () => void;
  onRefreshFromDatabase?: () => Promise<void>;
  showToast?: (msg: string) => void;
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
  onSwitchToClient,
  onOpenTelegramSetup,
  onRefreshFromDatabase = async () => {},
  showToast = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'telegram' | 'database' | 'settings' | 'data'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localSettings, setLocalSettings] = useState<BrandSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalInStock = products.filter((p) => p.inStock).length;
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    onUpdateSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportData(parsed);
        alert('Данные успешно импортированы!');
      } catch {
        alert('Ошибка при чтении JSON файла');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Admin Notice Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#181b22] via-[#1a1e27] to-[#14161d] border border-[#2b3240] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/10 font-bold">
            ⚡
          </div>
          <div>
            <h2 className="font-display font-bold text-sm sm:text-base text-white">
              Панель управления брендом: {settings.brandName}
            </h2>
            <p className="text-xs font-mono text-[#8b96a7]">
              Здесь вы можете загружать свои фото, менять цены, описания и смотреть заказы из Telegram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTelegramSetup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a2333] border border-[#2b4468] text-[#38bdf8] font-mono text-xs font-semibold hover:bg-[#202d42] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Оформление бота & Кнопка меню</span>
          </button>

          <button
            onClick={onSwitchToClient}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <Eye className="w-4 h-4" />
            <span>Посмотреть как клиент</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#121419] border border-[#212630]">
          <span className="text-[10px] font-mono text-[#717d8e] uppercase block mb-1">Всего товаров</span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-white">{products.length}</span>
            <span className="text-[11px] font-mono text-emerald-400">{totalInStock} в наличии</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#121419] border border-[#212630]">
          <span className="text-[10px] font-mono text-[#717d8e] uppercase block mb-1">Заказов в боте</span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-white">{orders.length}</span>
            <span className="text-[11px] font-mono text-[#38bdf8]">
              {orders.filter((o) => o.status === 'new').length} новых
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#121419] border border-[#212630]">
          <span className="text-[10px] font-mono text-[#717d8e] uppercase block mb-1">Общая сумма заказов</span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl sm:text-2xl font-bold text-white">
              {totalRevenue.toLocaleString('ru-RU')} {settings.currency}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#121419] border border-[#212630]">
          <span className="text-[10px] font-mono text-[#717d8e] uppercase block mb-1">Telegram Бот</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#38bdf8] truncate font-medium">
            <Send className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">@{settings.botUsername}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-[#212630] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[#1e222a] text-white border border-[#363f4f]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Каталог товаров ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#1e222a] text-white border border-[#363f4f]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Заказы ({orders.length})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('telegram');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'telegram'
              ? 'bg-[#1a2333] text-[#38bdf8] border border-[#2d476f] shadow-[0_0_15px_rgba(56,189,248,0.2)]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 text-[#38bdf8]" />
          <span>Оформление TG-бота</span>
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('database');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-[#162721] text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>База данных (Supabase)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#1e222a] text-white border border-[#363f4f]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Настройки бренда</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'data'
              ? 'bg-[#1e222a] text-white border border-[#363f4f]'
              : 'text-[#8b96a7] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Бэкап и сброс</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="w-full sm:max-w-xs px-3.5 py-2 rounded-lg bg-[#14161b] border border-[#262c37] text-white text-xs font-mono focus:border-white focus:outline-none"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg bg-[#14161b] border border-[#262c37] text-white text-xs font-mono focus:border-white focus:outline-none"
              >
                <option value="all">Все категории</option>
                <option value="outerwear">Верхняя одежда</option>
                <option value="hoodies">Худи и Свитшоты</option>
                <option value="tees">Футболки</option>
                <option value="bottoms">Брюки</option>
                <option value="accessories">Аксессуары</option>
              </select>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onAddProduct();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(241,245,249,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить новый товар</span>
            </button>
          </div>

          {/* Products Table/List */}
          <div className="rounded-xl border border-[#242933] overflow-hidden bg-[#121419]">
            <div className="divide-y divide-[#20252e]">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-[#6e7b8c] font-mono text-xs">
                  Товары не найдены. Нажмите «Добавить новый товар», чтобы опубликовать первую позицию.
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#16181f] transition-colors"
                  >
                    {/* Item preview */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-16 rounded-lg overflow-hidden bg-black border border-[#242933] flex-shrink-0">
                        <img
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000'}
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono tracking-widest text-[#717e90] uppercase">
                            {prod.category}
                          </span>
                          {prod.isFeatured && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#e2e8f0] text-black font-bold">
                              KEY
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-semibold text-sm text-white truncate">
                          {prod.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#94a3b8]">
                          <span className="text-white font-bold">
                            {prod.price.toLocaleString('ru-RU')} {settings.currency}
                          </span>
                          <span>•</span>
                          <span>{prod.sizes.join(', ')}</span>
                          <span>•</span>
                          <span className="text-[#64748b]">{prod.images.length} фото</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stock Switcher & Action buttons */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onToggleStock(prod.id);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                          prod.inStock
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/50 hover:bg-emerald-900/50'
                            : 'bg-rose-950/40 text-rose-400 border-rose-700/50 hover:bg-rose-900/50'
                        }`}
                      >
                        {prod.inStock ? 'В наличии' : 'Снят с продажи'}
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onDuplicateProduct(prod);
                        }}
                        title="Дублировать товар"
                        className="p-2 rounded-lg bg-[#191c23] border border-[#2b313d] text-[#cbd5e1] hover:text-white hover:bg-[#222732] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('medium');
                          onEditProduct(prod);
                        }}
                        title="Редактировать описание, цену и фото"
                        className="p-2 rounded-lg bg-[#191c23] border border-[#2b313d] text-[#cbd5e1] hover:text-white hover:bg-[#222732] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {deletingProductId === prod.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-600/80 px-2 py-1 rounded-lg animate-in fade-in">
                          <span className="text-[11px] font-mono text-rose-200 font-bold whitespace-nowrap">
                            Удалить?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('heavy');
                              onDeleteProduct(prod.id);
                              setDeletingProductId(null);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold hover:bg-rose-500 transition-colors"
                          >
                            Да
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProductId(null)}
                            className="px-1.5 py-0.5 rounded bg-[#1e232d] text-[#cbd5e1] font-mono text-[10px] hover:text-white transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('medium');
                            setDeletingProductId(prod.id);
                          }}
                          title="Удалить товар"
                          className="p-2 rounded-lg bg-[#191c23] border border-[#2b313d] text-[#f87171] hover:text-rose-200 hover:bg-rose-950/60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white">
              Заказы клиентов (Telegram Mini Apps)
            </h3>
            <span className="text-xs font-mono text-[#8b96a7]">
              Всего: {orders.length} заказов
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 rounded-xl border border-[#242933] bg-[#121419] text-center">
              <ShoppingBag className="w-10 h-10 text-[#4c5666] mx-auto mb-3" />
              <h4 className="font-display font-semibold text-white text-base mb-1">
                Заказов пока нет
              </h4>
              <p className="text-xs font-mono text-[#717e90] max-w-sm mx-auto">
                Когда покупатель оформит заказ в каталоге или через бота, детали появятся здесь.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-[#121419] border border-[#242933] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f242d] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">#{ord.id}</span>
                      <span className="text-[11px] font-mono text-[#717e90]">
                        {new Date(ord.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#9ca3af]">Статус:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as Order['status'])}
                        className={`text-xs font-mono px-2 py-1 rounded border bg-[#16181f] ${
                          ord.status === 'paid'
                            ? 'border-emerald-600 text-emerald-400'
                            : ord.status === 'shipped'
                            ? 'border-sky-600 text-sky-400'
                            : 'border-amber-600 text-amber-400'
                        }`}
                      >
                        <option value="new">Новый</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="paid">Оплачен в боте</option>
                        <option value="shipped">Отправлен</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-[#94a3b8]">
                    <div>
                      <span className="text-[#64748b] block">Покупатель:</span>
                      <strong className="text-white">{ord.customer.name}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block">Контакты:</span>
                      <span>{ord.customer.phone}</span>
                      {ord.customer.telegramUsername && (
                        <span className="text-[#38bdf8] block">{ord.customer.telegramUsername}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#64748b] block">Адрес / Доставка:</span>
                      <span className="text-white">{ord.customer.address || 'Самовывоз'}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="p-3 rounded-lg bg-[#0e1014] border border-[#1e222a] text-xs font-mono space-y-1">
                    {ord.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-[#cbd5e1]">
                        <span>• {i.product.title} (р-р: {i.selectedSize}) × {i.quantity}</span>
                        <span>{(i.product.price * i.quantity).toLocaleString('ru-RU')} {ord.currency}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#222731] pt-1.5 flex justify-between font-bold text-white text-sm">
                      <span>Итого:</span>
                      <span>{ord.total.toLocaleString('ru-RU')} {ord.currency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TELEGRAM BOT BRANDING & MENU BUTTON */}
      {activeTab === 'telegram' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1117] border border-[#222835]">
          <BotBrandingGenerator
            settings={settings}
            onPreviewClick={onSwitchToClient}
          />
        </div>
      )}

      {/* TAB 4: DATABASE & SUPABASE */}
      {activeTab === 'database' && (
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
      )}

      {/* TAB 5: BRAND SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-xl bg-[#121419] border border-[#242933] space-y-4 max-w-2xl">
          <h3 className="font-display font-bold text-base text-white mb-2">
            Настройки бренда и интеграции Telegram
          </h3>

          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Название бренда
            </label>
            <input
              type="text"
              required
              value={localSettings.brandName}
              onChange={(e) => setLocalSettings({ ...localSettings, brandName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Слоган / Дескриптор бренда
            </label>
            <input
              type="text"
              value={localSettings.brandTagline}
              onChange={(e) => setLocalSettings({ ...localSettings, brandTagline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Текст бегущей строки / Анонс в шапке
            </label>
            <input
              type="text"
              value={localSettings.announcementText}
              onChange={(e) => setLocalSettings({ ...localSettings, announcementText: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
            />
          </div>

          <div className="border-t border-[#222731] pt-4 mt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span>Главный экран (Hero) и описание магазина</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Верхний бэйдж (Badge)
                </label>
                <input
                  type="text"
                  value={localSettings.heroBadge || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroBadge: e.target.value })}
                  placeholder="УШИМА ARCHIVE // METALLIC ATELIER"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Главный заголовок
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroTitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                    placeholder="У Ш И М А."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Подзаголовок (Вторая строка)
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroSubtitle || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                    placeholder="METALLIC SILHOUETTE."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Главное описание магазина (Под заголовком)
                </label>
                <textarea
                  rows={3}
                  value={localSettings.heroDescription || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroDescription: e.target.value })}
                  placeholder="Архитектурный крой, ткани с микро-металлическим напылением..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#222731] pt-4 mt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-3">
              Информационные блоки внизу страницы
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#15181f] border border-[#262c37] space-y-1.5">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold">Блок 1</span>
                <input
                  type="text"
                  value={localSettings.feature1Title || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature1Title: e.target.value })}
                  placeholder="ОПЛАТА ЧЕРЕЗ TELEGRAM БОТА"
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-white text-xs font-mono"
                />
                <input
                  type="text"
                  value={localSettings.feature1Text || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature1Text: e.target.value })}
                  placeholder="Описание блока 1..."
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-[#cbd5e1] text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#15181f] border border-[#262c37] space-y-1.5">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold">Блок 2</span>
                <input
                  type="text"
                  value={localSettings.feature2Title || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature2Title: e.target.value })}
                  placeholder="ФИРМЕННЫЙ СТИЛЬ УШИМА"
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-white text-xs font-mono"
                />
                <input
                  type="text"
                  value={localSettings.feature2Text || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature2Text: e.target.value })}
                  placeholder="Описание блока 2..."
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-[#cbd5e1] text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#15181f] border border-[#262c37] space-y-1.5">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold">Блок 3</span>
                <input
                  type="text"
                  value={localSettings.feature3Title || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature3Title: e.target.value })}
                  placeholder="МЕНЕДЖЕР В TELEGRAM 24/7"
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-white text-xs font-mono"
                />
                <input
                  type="text"
                  value={localSettings.feature3Text || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, feature3Text: e.target.value })}
                  placeholder="Описание блока 3..."
                  className="w-full px-3 py-1.5 rounded bg-[#0f1115] border border-[#282f3c] text-[#cbd5e1] text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Юзернейм Telegram Бота для оплаты
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-[#64748b] font-mono text-sm">@</span>
                <input
                  type="text"
                  required
                  value={localSettings.botUsername.replace(/^@/, '')}
                  onChange={(e) => setLocalSettings({ ...localSettings, botUsername: e.target.value.replace(/^@/, '') })}
                  placeholder="ushima_bot"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
                />
              </div>
              <span className="text-[10px] font-mono text-[#64748b] mt-1 block">
                Сюда переходят клиенты для оплаты заказов
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Юзернейм менеджера Telegram
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-[#64748b] font-mono text-sm">@</span>
                <input
                  type="text"
                  required
                  value={localSettings.contactTelegram.replace(/^@/, '')}
                  onChange={(e) => setLocalSettings({ ...localSettings, contactTelegram: e.target.value.replace(/^@/, '') })}
                  placeholder="ushima_manager"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
                />
              </div>
              <span className="text-[10px] font-mono text-[#64748b] mt-1 block">
                Для прямой связи и вопросов клиентов
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                PIN-код для входа в панель владельца
              </label>
              <input
                type="password"
                required
                value={localSettings.adminPin}
                onChange={(e) => setLocalSettings({ ...localSettings, adminPin: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#15181f] border border-[#2b313d] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
              <span className="text-[10px] font-mono text-[#64748b] mt-1 block">
                По умолчанию: 1234
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Сохранить настройки
            </button>
            {savedNotice && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Настройки сохранены!
              </span>
            )}
          </div>
        </form>
      )}

      {/* TAB 4: DATA BACKUP / RESTORE */}
      {activeTab === 'data' && (
        <div className="p-5 rounded-xl bg-[#121419] border border-[#242933] space-y-5 max-w-2xl">
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Экспорт и резервная копия
            </h3>
            <p className="text-xs font-mono text-[#8b96a7] mt-1">
              Все ваши отредактированные описания, загруженные фотографии и заказы сохраняются в браузере. Вы можете скачать полный архив в формате JSON для переноса на другое устройство.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExportData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c2028] border border-[#2e3544] text-xs font-mono text-white hover:bg-[#252a35] transition-colors"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" />
              <span>Скачать каталог и заказы (JSON)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c2028] border border-[#2e3544] text-xs font-mono text-white hover:bg-[#252a35] transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Импортировать из JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          <div className="pt-4 border-t border-[#20252e]">
            <h4 className="font-mono text-xs text-[#ef4444] uppercase tracking-wider mb-1 font-semibold">
              Сброс к заводским настройкам
            </h4>
            <p className="text-xs font-mono text-[#717d8e] mb-3">
              Восстановит стартовую коллекцию металлик-одежды и сбросит все внесенные изменения.
            </p>
            <button
              onClick={() => {
                if (confirm('Вы уверены, что хотите сбросить коллекцию к начальной?')) {
                  onResetDefaults();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 font-mono text-xs hover:bg-rose-900/40 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Сбросить к исходным товарам</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
