import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Check, Shield, Truck, Send, Edit3, Trash2 } from 'lucide-react';
import { Product, ViewMode } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ProductModalProps {
  product: Product | null;
  currency: string;
  botUsername: string;
  viewMode?: ViewMode;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onDirectOrder?: (product: Product, size: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currency,
  botUsername,
  viewMode = 'client',
  onClose,
  onAddToCart,
  onDirectOrder,
  onEdit,
  onDelete,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'ONE SIZE');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(product.sizes[0] || 'ONE SIZE');
    setQuantity(1);
    setIsAdded(false);
  }, [product]);

  const images = product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
  ];

  const handleNextImage = () => {
    triggerHaptic('light');
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    triggerHaptic('light');
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    triggerHaptic('medium');
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleDirectTelegramOrder = () => {
    triggerHaptic('heavy');
    if (onDirectOrder) {
      onDirectOrder(product, selectedSize);
    } else {
      const text = encodeURIComponent(`Здравствуйте! Хочу заказать: ${product.title} (Размер: ${selectedSize}) за ${product.price} ${currency}`);
      window.open(`https://t.me/${botUsername}?start=buy_${product.id}_${selectedSize}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="product-modal-dialog"
        className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0f1114] border border-[#262c36] shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-[#181b21]/90 border border-[#2f3540] text-[#9ca3af] hover:text-white hover:bg-[#252b34] transition-all"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery column */}
        <div className="md:w-1/2 relative bg-[#090a0c] flex flex-col items-center justify-center min-h-[340px] md:min-h-[500px]">
          <div className="relative w-full h-[380px] md:h-full overflow-hidden">
            <img
              src={images[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Prev/Next arrows if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#121418]/80 text-white border border-[#262b33] hover:bg-black/90 transition-all"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#121418]/80 text-white border border-[#262b33] hover:bg-black/90 transition-all"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Thumbnail selector on bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 px-3 z-20">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveImageIndex(idx);
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex
                        ? 'border-white scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="миниатюра" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product details column */}
        <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between gap-5 bg-gradient-to-b from-[#121418] to-[#0d0e10]">
          <div>
            {/* Header: Subtitle & Stock */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-mono tracking-widest text-[#717b8a] uppercase">
                {product.subtitle || `АРТИКУЛ #${product.id.slice(-4).toUpperCase()}`}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  product.inStock
                    ? 'border-emerald-800/40 text-emerald-400 bg-emerald-950/20'
                    : 'border-rose-800/40 text-rose-400 bg-rose-950/20'
                }`}
              >
                {product.inStock ? 'В наличии' : 'Распродано'}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight leading-snug">
              {product.title}
            </h2>

            {/* Price row */}
            <div className="flex items-baseline gap-3 mt-2.5 pb-4 border-b border-[#21262f]">
              <span className="font-mono text-2xl font-bold text-[#f1f5f9]">
                {product.price.toLocaleString('ru-RU')} {currency}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="font-mono text-sm text-[#52525b] line-through">
                  {product.originalPrice.toLocaleString('ru-RU')} {currency}
                </span>
              )}
            </div>

            {/* Sizes selection */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono tracking-wider text-[#9ca3af] uppercase">
                  Размер:
                </span>
                <span className="text-[11px] font-mono text-[#64748b]">
                  Выбран: <strong className="text-white">{selectedSize}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedSize(sz);
                    }}
                    className={`min-w-[44px] h-10 px-3.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all duration-150 ${
                      selectedSize === sz
                        ? 'bg-[#f1f5f9] text-[#0b0c0e] shadow-[0_0_12px_rgba(241,245,249,0.25)]'
                        : 'bg-[#181b21] border border-[#2b313a] text-[#9ca3af] hover:text-white hover:border-[#404856]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Description text */}
            <div className="mt-5 space-y-3">
              <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
                {product.description}
              </p>

              {product.composition && (
                <div className="p-3 rounded-lg bg-[#16181d] border border-[#23272f] text-xs font-mono text-[#828c9b]">
                  <span className="text-[#cbd5e1] font-semibold block mb-0.5">Состав и материалы:</span>
                  {product.composition}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons & Stepper */}
          <div className="space-y-3 pt-4 border-t border-[#20242b]">
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center rounded-lg bg-[#16191f] border border-[#272d38] p-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-white rounded hover:bg-[#20242d] transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono text-xs font-semibold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setQuantity((q) => q + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-white rounded hover:bg-[#20242d] transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAdd}
                disabled={!product.inStock}
                className={`flex-1 h-11 px-4 rounded-lg font-mono text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  !product.inStock
                    ? 'bg-[#1e2229] text-[#52525b] cursor-not-allowed border border-[#272b33]'
                    : isAdded
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#f1f5f9] text-[#090a0c] hover:bg-white shadow-[0_0_20px_rgba(241,245,249,0.15)] active:scale-[0.99]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Добавлено в корзину</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>В корзину • {(product.price * quantity).toLocaleString('ru-RU')} {currency}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick 1-click order via Telegram bot */}
            <button
              onClick={handleDirectTelegramOrder}
              disabled={!product.inStock}
              className="w-full py-2.5 px-4 rounded-lg bg-[#171a20] border border-[#282e38] text-[#93c5fd] hover:text-white hover:border-[#3b82f6]/50 hover:bg-[#1e232b] text-xs font-mono flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Купить сразу через Telegram (@{botUsername})</span>
            </button>

            {/* Admin action strip */}
            {viewMode === 'admin' && (
              <div className="p-3 rounded-xl bg-[#14161c] border border-[#2c3340] flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#cbd5e1] uppercase font-bold">
                    Панель владельца:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        onClose();
                        onEdit(product);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e232d] hover:bg-[#28303d] border border-[#343e4f] text-white text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Изменить</span>
                    </button>
                  )}

                  {onDelete && (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-rose-950 border border-rose-600 px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-mono text-rose-200 font-bold">
                          Удалить?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('heavy');
                            onDelete(product.id);
                            setIsConfirmingDelete(false);
                            onClose();
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold hover:bg-rose-500"
                        >
                          Да
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-1.5 py-0.5 rounded bg-[#1e232d] text-[#cbd5e1] font-mono text-[10px]"
                        >
                          Нет
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('medium');
                          setIsConfirmingDelete(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-400 text-xs font-mono flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Удалить</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-[#64748b]">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-[#94a3b8]" />
                <span>Быстрая доставка CDEK/Почта</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#94a3b8]" />
                <span>Оригинал и гарантия качества</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
