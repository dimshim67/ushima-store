import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Edit3,
  Send,
  Sparkles,
  Check,
  ArrowUpDown,
  ChevronDown,
  MessageSquare,
  PackagePlus,
  RotateCcw,
  Radio,
} from 'lucide-react';
import { Product, ViewMode, BrandSettings } from '../types';
import { ProductCard } from './ProductCard';
import { TerminalHeroTitle } from './TerminalHeroTitle';
import { triggerHaptic } from '../utils/telegram';

interface ClientCatalogProps {
  products: Product[];
  settings: BrandSettings;
  viewMode: ViewMode;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product, size: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onToggleStock?: (productId: string) => void;
  onOpenSiteContentModal?: () => void;
  onAddProduct?: () => void;
  onResetDefaults?: () => void;
}

type SortOption = 'featured' | 'price_asc' | 'price_desc';

const SORT_CONFIG: Record<SortOption, { label: string; desc: string }> = {
  featured: {
    label: 'Рекомендуемые',
    desc: 'Актуальный порядок моделей',
  },
  price_asc: {
    label: 'По возрастанию цены',
    desc: 'От доступных к премиальным',
  },
  price_desc: {
    label: 'По убыванию цены',
    desc: 'Премиальные и архивные позиции',
  },
};

export const ClientCatalog: React.FC<ClientCatalogProps> = ({
  products,
  settings,
  viewMode,
  onSelectProduct,
  onQuickAddToCart,
  onEditProduct,
  onDeleteProduct,
  onToggleStock,
  onOpenSiteContentModal,
  onAddProduct,
  onResetDefaults,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sorting dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSortDropdownOpen]);

  // Available categories calculation
  const availableCategories: { slug: string; label: string }[] = useMemo(() => {
    const list: { slug: string; label: string }[] = [{ slug: 'all', label: 'ВСЕ ВЕЩИ' }];

    const configured = settings.categories || [
      { id: 'cat-1', slug: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
      { id: 'cat-2', slug: 'hoodies', label: 'ХУДИ' },
      { id: 'cat-3', slug: 'tees', label: 'ФУТБОЛКИ' },
      { id: 'cat-4', slug: 'bottoms', label: 'БРЮКИ' },
      { id: 'cat-5', slug: 'accessories', label: 'АКСЕССУАРЫ' },
    ];

    configured.forEach((cat) => {
      const hasItems = products.some((p) => {
        const matchCat = p.category === cat.slug;
        if (!matchCat) return false;
        if (viewMode === 'admin') return true;
        if (!p.inStock) return false;
        if (!p.sizeStock) return true;
        const total = Object.values(p.sizeStock).reduce<number>((a, b) => Number(a) + Number(b), 0);
        return total > 0;
      });

      if (hasItems || viewMode === 'admin') {
        list.push({ slug: cat.slug, label: cat.label });
      }
    });

    return list;
  }, [products, settings.categories, viewMode]);

  const activeCategory = useMemo(() => {
    if (selectedCategory === 'all') return 'all';
    const exists = availableCategories.some((c) => c.slug === selectedCategory);
    return exists ? selectedCategory : 'all';
  }, [selectedCategory, availableCategories]);

  const handleCategoryChange = (slug: string) => {
    triggerHaptic('light');
    setSelectedCategory(slug);
  };

  const handleSortSelect = (option: SortOption) => {
    triggerHaptic('light');
    setSortBy(option);
    setIsSortDropdownOpen(false);
  };

  const handleToggleOnlyInStock = () => {
    triggerHaptic('light');
    setOnlyInStock((prev) => !prev);
  };

  // Filtered & Sorted Products
  const filteredProducts = products
    .filter((p) => {
      if (viewMode !== 'admin') {
        if (!p.inStock) return false;
        if (p.sizeStock && Object.keys(p.sizeStock).length > 0) {
          const totalStock = Object.values(p.sizeStock).reduce<number>((a, b) => Number(a) + Number(b), 0);
          if (totalStock <= 0) return false;
        }
      }

      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }

      if (onlyInStock) {
        if (!p.inStock) return false;
        if (p.sizeStock) {
          const total = Object.values(p.sizeStock).reduce<number>((a, b) => Number(a) + Number(b), 0);
          if (total <= 0) return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchSku = p.sku && p.sku.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchSku;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.createdAt - a.createdAt;
    });

  const heroTitle = settings.heroTitle || 'USHIMA. ///';
  const heroBadge = settings.heroBadge || 'USHIMA ARCHIVE // METALLIC ATELIER';
  const heroDescription =
    settings.heroDescription ||
    'Концептуальный бренд одежды и аксессуаров в индастриал эстетике. Лимитированные серии, титановая фурнитура.';

  const totalInStock = products.filter((p) => p.inStock).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: Atmospheric & Luxury on Desktop, Clean & Compact on Mobile */}
      {/* ========================================================================= */}
      <section className="relative rounded-2xl overflow-hidden border border-[#222834] bg-[#0c0e12] shadow-xl">
        {/* Desktop ambient decorative lighting (Hidden on mobile) */}
        <div className="hidden sm:block absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-bl from-[#38bdf8]/10 via-[#94a3b8]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-[#64748b]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 p-4 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#161a22] border border-[#2a3445] text-[#38bdf8] font-mono text-[10px] font-bold tracking-widest uppercase">
                  {heroBadge}
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-mono text-[#64748b]">
                  FALL/WINTER 2025
                </span>
              </div>

              <TerminalHeroTitle title={heroTitle} />

              <p className="text-xs sm:text-sm text-[#94a3b8] font-mono leading-relaxed max-w-xl">
                {heroDescription}
              </p>
            </div>

            {/* Right Status & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {totalInStock > 0 && (
                <div className="text-[11px] font-mono text-[#cbd5e1] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14171e] border border-[#262f3f]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{totalInStock} моделей в наличии</span>
                </div>
              )}

              {/* Telegram Bot Button (Larger & clearer on PC) */}
              {settings.botUsername && (
                <a
                  href={`https://t.me/${settings.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#162130] hover:bg-[#1e2e42] border border-[#2c405c] hover:border-[#38bdf8]/70 text-xs font-mono font-medium text-[#38bdf8] hover:text-white transition-all shadow-[0_2px_12px_rgba(0,0,0,0.4)] group"
                  title="Официальный Telegram бот для покупок"
                >
                  <Send className="w-3.5 h-3.5 text-[#38bdf8] group-hover:translate-x-0.5 transition-transform" />
                  <span>@{settings.botUsername}</span>
                </a>
              )}

              {/* Telegram Channel Button (Заготовка для канала) */}
              <a
                href={`https://t.me/${(settings.telegramChannel || 'ushima_channel').replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14171e] hover:bg-[#1b2029] border border-[#252c38] hover:border-[#94a3b8]/60 text-xs font-mono font-medium text-[#cbd5e1] hover:text-white transition-all shadow-[0_2px_12px_rgba(0,0,0,0.4)] group"
                title="Официальный Telegram-канал бренда"
              >
                <Radio className="w-3.5 h-3.5 text-[#38bdf8] group-hover:animate-pulse" />
                <span>Канал бренда</span>
              </a>

              {viewMode === 'admin' && onOpenSiteContentModal && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenSiteContentModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e232d] hover:bg-[#272e3b] border border-[#3b4556] text-[11px] font-mono text-[#cbd5e1] hover:text-white transition-colors"
                  title="Редактировать тексты магазина"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Редактировать</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATALOG CONTROLS: Categories Scroll & Filter Bar                       */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Category horizontal scroll list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-200 whitespace-nowrap ${
                activeCategory === cat.slug
                  ? 'bg-[#f1f5f9] text-[#090a0c] shadow-[0_0_15px_rgba(241,245,249,0.2)] font-bold'
                  : 'bg-[#111318] text-[#8b96a7] border border-[#202530] hover:text-white hover:border-[#3b4455]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter / Search Sub-row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, ткани..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#111318] border border-[#202530] text-white text-xs font-mono focus:border-white focus:outline-none placeholder:text-[#525b68]"
            />
          </div>

          {/* Right filters: Admin add button, custom In-stock checkbox toggle & custom Sort dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {viewMode === 'admin' && onAddProduct && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onAddProduct();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <PackagePlus className="w-3.5 h-3.5 text-black" />
                <span>+ Добавить модель</span>
              </button>
            )}

            {/* ============================================================= */}
            {/* CUSTOM "В НАЛИЧИИ" TOGGLE BUTTON (Custom checkbox)           */}
            {/* ============================================================= */}
            <button
              type="button"
              role="switch"
              aria-checked={onlyInStock}
              onClick={handleToggleOnlyInStock}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 select-none ${
                onlyInStock
                  ? 'bg-[#151a22] border border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-[#111318] border border-[#202530] text-[#8e9aa8] hover:text-white hover:border-[#343e50]'
              }`}
              title="Фильтровать товары в наличии"
            >
              {/* Custom metallic micro-switch box */}
              <span
                className={`relative inline-flex items-center justify-center w-4 h-4 rounded-md border transition-all duration-200 ${
                  onlyInStock
                    ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-[#181b22] border-[#384152] text-transparent group-hover:border-[#536177]'
                }`}
              >
                <Check
                  className={`w-3 h-3 stroke-[3] transition-transform duration-150 ${
                    onlyInStock ? 'scale-100' : 'scale-0'
                  }`}
                />
              </span>
              <span className="tracking-wide">В наличии</span>
            </button>

            {/* ============================================================= */}
            {/* CUSTOM LUXURY SORTING DROPDOWN                                */}
            {/* ============================================================= */}
            <div className="relative" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsSortDropdownOpen((prev) => !prev);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 select-none ${
                  isSortDropdownOpen
                    ? 'bg-[#171a22] border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-[#111318] border-[#202530] text-[#cbd5e1] hover:border-[#384152] hover:text-white'
                }`}
                aria-expanded={isSortDropdownOpen}
                title="Сортировка каталога"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="hidden xs:inline text-[#717e90]">Сортировка:</span>
                <span className="font-semibold text-white">{SORT_CONFIG[sortBy].label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#717e90] transition-transform duration-200 ${
                    isSortDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Floating Menu Popover */}
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-[#272e3d] bg-[#0f1116]/98 backdrop-blur-xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-mono text-[#5c687a] uppercase tracking-widest">
                    Порядок отображения
                  </div>
                  {(Object.keys(SORT_CONFIG) as SortOption[]).map((key) => {
                    const isSelected = sortBy === key;
                    const config = SORT_CONFIG[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSortSelect(key)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#1c222e] text-white font-semibold'
                            : 'text-[#94a3b8] hover:bg-[#151820] hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-mono">{config.label}</span>
                          <span className="text-[10px] font-mono text-[#5f6c80]">{config.desc}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRODUCT GRID / EMPTY STATE                                            */}
      {/* ========================================================================= */}
      <section>
        {filteredProducts.length === 0 ? (
          <div className="p-8 sm:p-14 text-center rounded-2xl border border-[#222731] bg-[#0d0f14] space-y-4 shadow-xl">
            {/* Minimalist Archive Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14171f] border border-[#252c3b] text-[10px] font-mono font-bold tracking-widest text-[#94a3b8] uppercase">
              <Sparkles className="w-3 h-3 text-[#38bdf8]" />
              <span>USHIMA ATELIER // ARCHIVE DROP</span>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-display font-bold text-white text-lg sm:text-xl tracking-wider uppercase">
                {products.length === 0
                  ? 'Каталог обновляется'
                  : 'По выбранным фильтрам ничего не найдено'}
              </h3>
              <p className="text-xs font-mono text-[#788597] leading-relaxed">
                {products.length === 0
                  ? 'Новый лимитированный тираж готовится к релизу. Все прошлые архивные серии распроданы. Чтобы узнать о дате дропа или сделать индивидуальный предзаказ, свяжитесь с нами в Telegram.'
                  : 'Попробуйте сбросить параметры поиска или фильтр наличия, чтобы увидеть все доступные позиции.'}
              </p>
            </div>

            {/* Action buttons depending on viewMode */}
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              {products.length === 0 ? (
                <>
                  {settings.contactTelegram && (
                    <a
                      href={`https://t.me/${settings.contactTelegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Написать менеджеру</span>
                    </a>
                  )}

                  {settings.botUsername && (
                    <a
                      href={`https://t.me/${settings.botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#162130] hover:bg-[#1e2e42] border border-[#2c405c] hover:border-[#38bdf8]/60 text-white font-mono text-xs font-medium transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Открыть бота @{settings.botUsername}</span>
                    </a>
                  )}

                  <a
                    href={`https://t.me/${(settings.telegramChannel || 'ushima_channel').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14171e] hover:bg-[#1b2029] border border-[#252c38] hover:border-[#94a3b8]/60 text-[#cbd5e1] hover:text-white font-mono text-xs font-medium transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Канал @{(settings.telegramChannel || 'ushima_channel').replace('@', '')}</span>
                  </a>

                  {viewMode === 'admin' && onAddProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        onAddProduct();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1e2634] hover:bg-[#283346] border border-[#3c4a63] text-white font-mono text-xs font-bold transition-colors"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>+ Добавить первую модель</span>
                    </button>
                  )}

                  {viewMode === 'admin' && onResetDefaults && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        onResetDefaults();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14171d] hover:bg-[#1a1f27] border border-[#262c37] text-[#8e9cae] hover:text-white font-mono text-xs transition-colors"
                      title="Загрузить тестовые образцы для проверки"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Загрузить тестовый архив</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setOnlyInStock(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#191d26] hover:bg-[#242a37] border border-[#2d3646] text-white text-xs font-mono font-medium transition-colors"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
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

      {/* ========================================================================= */}
      {/* 4. BRAND STANDARDS / EDITORIAL STRIP                                      */}
      {/* ========================================================================= */}
      <section className="pt-8 border-t border-[#1c2027] space-y-4">
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

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c] hover:border-[#2d3544] transition-colors">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature1Title || 'ОПЛАТА ЧЕРЕЗ TELEGRAM БОТА'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature1Text ||
                'Безопасная оплата картой или СБП через официальный бот бренда без лишних регистраций.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c] hover:border-[#2d3544] transition-colors">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature2Title || 'ФИРМЕННЫЙ СТИЛЬ USHIMA'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature2Text ||
                'Ограниченные тиражи, серые металлик оттенки, премиальные ткани и титановые элементы.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#101216] border border-[#1e232c] hover:border-[#2d3544] transition-colors">
            <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold mb-1">
              {settings.feature3Title || 'МЕНЕДЖЕР В TELEGRAM 24/7'}
            </h4>
            <p className="text-[11px] font-mono text-[#717d8e] leading-relaxed">
              {settings.feature3Text ||
                `Помощь с оформлением заказа и подбором нужного размера в Telegram: @${settings.contactTelegram}`}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-6 pb-4 text-center text-xs font-mono text-[#4b5563] border-t border-[#181c24]">
        <p>
          © {new Date().getFullYear()} {settings.brandName}. Все права защищены.
        </p>
      </footer>
    </div>
  );
};
