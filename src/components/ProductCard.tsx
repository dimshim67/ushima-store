import React, { useState } from 'react';
import { Plus, Eye, Edit3, Trash2, Check, AlertCircle } from 'lucide-react';
import { Product, ViewMode } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ProductCardProps {
  product: Product;
  currency: string;
  viewMode: ViewMode;
  onSelect: (product: Product) => void;
  onQuickAddToCart: (product: Product, size: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onToggleStock?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  viewMode,
  onSelect,
  onQuickAddToCart,
  onEdit,
  onDelete,
  onToggleStock,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const hasAvailableSizes = product.inStock && (
    !product.sizeStock ||
    Object.keys(product.sizeStock).length === 0 ||
    Object.values(product.sizeStock).some((q) => Number(q) > 0)
  );

  const availableSizes = product.sizes.filter((sz) => {
    if (!product.sizeStock) return true;
    return (product.sizeStock[sz] ?? 0) > 0;
  });
  const defaultSize = availableSizes.length > 0 ? availableSizes[0] : (product.sizes[0] || 'OS');

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicked on action buttons, don't open modal
    if ((e.target as HTMLElement).closest('button')) return;
    triggerHaptic('light');
    onSelect(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAvailableSizes) return;
    triggerHaptic('medium');
    onQuickAddToCart(product, defaultSize);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const images = product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop'];

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-xl bg-[#111317] border border-[#20242b] hover:border-[#3d4450] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Visual image viewport with metallic framing */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#0c0d0f]"
        onMouseEnter={() => images.length > 1 && setActiveImgIndex(1)}
        onMouseLeave={() => setActiveImgIndex(0)}
      >
        <img
          src={images[activeImgIndex] || images[0]}
          alt={product.title}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-95 group-hover:brightness-100"
          loading="lazy"
        />

        {/* Subtle metallic sheen gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-[#e2e8f0] text-[#090a0c] font-bold uppercase shadow-sm">
              KEY PIECE
            </span>
          )}

          {!hasAvailableSizes && (
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#fca5a5] uppercase">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Multiple images indicator bars */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  i === activeImgIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Client quick view button on hover */}
        {viewMode === 'client' && product.inStock && (
          <div className="absolute inset-x-3 bottom-3 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={handleQuickAdd}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-medium tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-1.5 shadow-xl ${
                addedAnimation
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-[#e2e8f0] text-[#090a0c] hover:bg-white'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Добавлено</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>В корзину ({defaultSize})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Admin floating quick action tools */}
        {viewMode === 'admin' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(product);
              }}
              title="Редактировать товар"
              className="p-1.5 rounded-md bg-[#181b21]/90 border border-[#2f3540] text-[#e2e8f0] hover:bg-[#252a33] hover:text-white backdrop-blur transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {isConfirmingDelete ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-rose-950/95 border border-rose-600 px-1.5 py-0.5 rounded-md backdrop-blur animate-in fade-in"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('heavy');
                    onDelete?.(product.id);
                    setIsConfirmingDelete(false);
                  }}
                  title="Подтвердить удаление"
                  className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold hover:bg-rose-500"
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(false);
                  }}
                  className="px-1 py-0.5 rounded bg-[#1e232d] text-[#cbd5e1] font-mono text-[9px] hover:text-white"
                >
                  Нет
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setIsConfirmingDelete(true);
                }}
                title="Удалить товар"
                className="p-1.5 rounded-md bg-[#181b21]/90 border border-[#2f3540] text-[#f87171] hover:bg-red-950/60 hover:text-red-300 backdrop-blur transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info card block */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Subtitle / Category */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#717b8a] uppercase truncate">
              {product.subtitle || product.category}
            </span>
            {viewMode === 'admin' && onToggleStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStock(product.id);
                }}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                  product.inStock
                    ? 'border-emerald-700/50 text-emerald-400 bg-emerald-950/30'
                    : 'border-rose-800/50 text-rose-400 bg-rose-950/30'
                }`}
              >
                {product.inStock ? 'В наличии' : 'Нет на складе'}
              </button>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-sm sm:text-base text-[#e5e7eb] group-hover:text-white line-clamp-1 tracking-tight">
            {product.title}
          </h3>

          {/* Sizes preview */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {product.sizes.map((sz) => {
                const count = product.sizeStock ? product.sizeStock[sz] : undefined;
                const isOutOfStock = count !== undefined && count === 0;
                return (
                  <span
                    key={sz}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isOutOfStock
                        ? 'bg-[#14161a] border-[#22252c] text-[#4b5563] line-through opacity-60'
                        : 'bg-[#181b20] border-[#252931] text-[#9ca3af]'
                    }`}
                    title={count !== undefined ? `Остаток: ${count} шт.` : undefined}
                  >
                    {sz}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom row: Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1d2127]">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm sm:text-base font-semibold text-[#f1f5f9]">
              {product.price.toLocaleString('ru-RU')} {currency}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-xs text-[#52525b] line-through">
                {product.originalPrice.toLocaleString('ru-RU')}
              </span>
            )}
          </div>

          {/* Mobile direct add button / detail open */}
          <button
            onClick={handleQuickAdd}
            disabled={!product.inStock}
            className={`sm:hidden p-2 rounded-lg border text-xs font-mono transition-all ${
              !product.inStock
                ? 'opacity-40 border-[#22252a] text-[#52525b] cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-[#181b20] border-[#292f38] text-white active:scale-95'
            }`}
            aria-label="В корзину"
          >
            {addedAnimation ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
