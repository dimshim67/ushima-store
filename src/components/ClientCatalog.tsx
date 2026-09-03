import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, Send, ArrowUpRight, Edit3, FileText, Image, Plus } from 'lucide-react';
import { Product, ViewMode, BrandSettings } from '../types';
import { ProductCard } from './ProductCard';
import { triggerHaptic } from '../utils/telegram';

interface ClientCatalogProps {
  products: Product[];
  settings: BrandSettings;
  viewMode: ViewMode;
  onOpenTelegramSetup: () => void;
  onOpenSiteContentModal?: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product, size: string) => void;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onToggleStock?: (productId: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'ВСЕ ВЕЩИ' },
  { id: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
  { id: 'hoodies', label: 'ХУДИ' },
  { id: 'tees', label: 'ФУТБОЛКИ' },
  { id: 'bottoms', label: 'БРЮКИ' },
  { id: 'accessories', label: 'АКСЕССУАРЫ' },
];

export const ClientCatalog: React.FC<ClientCatalogProps> = ({
  products,
  settings,
  viewMode,
  onOpenTelegramSetup,
  onOpenSiteContentModal,
  onSelectProduct,
  onQuickAddToCart,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const handleCategoryChange = (catId: string) => {
    triggerHaptic('light');
    setSelectedCategory(catId);
  };

  const filteredProducts = products
    .filter((product) => {
      const matchCat = selectedCategory === 'all' || product.category === selectedCategory;
      const matchSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.subtitle && product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStock = !onlyInStock || product.inStock;
      return matchCat && matchSearch && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      // Default: featured first, then newest
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.createdAt - a.createdAt;
    });

  const heroBadge = settings.heroBadge || 'УШИМА ARCHIVE // METALLIC ATELIER';
  const heroTitle = settings.heroTitle || 'У Ш И М А.';
  const heroSubtitle = settings.heroSubtitle || 'METALLIC SILHOUETTE.';
  const heroDescription =
    settings.heroDescription ||
    'Архитектурный крой, ткани с микро-металлическим напылением холодного хрома и оружейной стали. Покупка и оплата напрямую через Telegram Mini Apps.';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Minimalist Metallic Editorial Hero Section */}
      <section className="relative rounded-2xl overflow-hidden border border-[#20252e] bg-gradient-to-b from-[#14161b] via-[#0f1115] to-[#0a0b0d] p-6 sm:p-10 shadow-2xl">
        {/* Subtle metallic sheen accent lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ffffff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#38bdf8]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1f28] border border-[#2c3442] text-[11px] font-mono text-[#94a3b8] tracking-widest uppercase">
              <Sparkles className="w-3 h-3 text-[#cbd5e1]" />
              <span>{heroBadge}</span>
            </div>

            {viewMode === 'admin' && onOpenSiteContentModal && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenSiteContentModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e232d] hover:bg-[#272e3b] border border-[#3b4556] text-[11px] font-mono text-[#cbd5e1] hover:text-white transition-colors"
                title="Редактировать описание и тексты магазина"
              >
                <Edit3 className="w-3 h-3 text-[#38bdf8]" />
                <span>Редактировать тексты сайта</span>
              </button>
            )}
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tighter leading-[1.05]">
            {heroTitle} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#cbd5e1] via-[#94a3b8] to-[#64748b]">
              {heroSubtitle}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#8c98a8] font-mono max-w-xl leading-relaxed">
            {heroDescription}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenTelegramSetup();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#38bdf8] text-[#082f49] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7dd3fc] transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Запуск в Telegram (2 мин)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenTelegramSetup();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#181c24] hover:bg-[#222834] text-white font-mono text-xs font-semibold border border-[#303847] transition-all"
              title="Скачать баннер 640x360 для @BotFather"
            >
              <Image className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Баннер 640×360</span>
            </button>

            <a
              href={`https://t.me/${settings.botUsername.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@{settings.botUsername}</span>
            </a>

            <div className="w-full sm:w-auto text-[11px] font-mono text-[#6c7787] flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 rounded-lg bg-[#14171d] border border-[#222731]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{products.filter((p) => p.inStock).length} моделей в наличии</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Controls: Categories, Search, Filters */}
      <section className="space-y-4">
        {/* Category horizontal scroll list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#f1f5f9] text-[#090a0c] shadow-[0_0_15px_rgba(241,245,249,0.2)]'
                  : 'bg-[#121419] text-[#8b96a7] border border-[#222731] hover:text-white hover:border-[#3b4455]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter / Search Sub-row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по модели, ткани..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#121419] border border-[#222731] text-white text-xs font-mono focus:border-white focus:outline-none placeholder:text-[#525b68]"
            />
          </div>

          {/* Right filters: Sort & In-stock toggle */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {viewMode === 'admin' && onAddProduct && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onAddProduct();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(241,245,249,0.2)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить товар</span>
              </button>
            )}

            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#121419] border border-[#222731] text-xs font-mono text-[#94a3b8] cursor-pointer hover:border-[#384152] transition-colors">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-black border-[#384152] accent-white"
              />
              <span>В наличии</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-[#121419] border border-[#222731] text-white text-xs font-mono focus:border-white focus:outline-none cursor-pointer"
            >
              <option value="featured">Сначала рекомендуемые</option>
              <option value="price_asc">Сначала недорогие</option>
              <option value="price_desc">Сначала премиум</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section>
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-[#20252e] bg-[#111317]">
            <p className="font-display text-white text-base font-semibold mb-1">
              По вашему запросу ничего не найдено
            </p>
            <p className="text-xs font-mono text-[#717e90] max-w-xs mx-auto mb-4">
              Попробуйте сбросить фильтры или выбрать другую категорию
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="px-4 py-2 rounded-lg bg-[#1e232c] border border-[#303746] text-white text-xs font-mono"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={settings.currency}
                viewMode={viewMode}
                onSelect={onSelectProduct}
                onQuickAddToCart={onQuickAddToCart}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onToggleStock={onToggleStock}
              />
            ))}
          </div>
        )}
      </section>

      {/* Brand Values & Footer strip */}
      <section className="pt-8 border-t border-[#1c2027] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider">
            Стандарты бренда // USHIMA ARCHIVE
          </span>
          {viewMode === 'admin' && onOpenSiteContentModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenSiteContentModal();
              }}
              className="text-[11px] font-mono text-[#38bdf8] hover:text-white flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Редактировать блоки</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c]">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature1Title || 'ОПЛАТА ЧЕРЕЗ TELEGRAM БОТА'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature1Text || 'Безопасная оплата картой или СБП через официальный бот бренда без лишних регистраций.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c]">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature2Title || 'ФИРМЕННЫЙ СТИЛЬ УШИМА'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature2Text || 'Ограниченные тиражи, серые металлик оттенки, премиальные ткани и титановые элементы.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c]">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature3Title || 'МЕНЕДЖЕР В TELEGRAM 24/7'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature3Text || `Помощь с оформлением заказа и подбором нужного размера в Telegram: @${settings.contactTelegram}`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
