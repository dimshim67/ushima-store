import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  currency: string;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

const PRESET_METALLIC_PHOTOS = [
  { label: 'Серебряный пуховик', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Графитовое худи', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Стальная футболка', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Хромированные брюки', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Сланцевый бомбер', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Титановая сумка', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop' },
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE'];

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  currency,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<Product['category']>('outerwear');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setSubtitle(product.subtitle || '');
      setPrice(product.price);
      setOriginalPrice(product.originalPrice);
      setCategory(product.category);
      setImages(product.images || []);
      setDescription(product.description || '');
      setComposition(product.composition || '');
      setSizes(product.sizes || ['S', 'M', 'L']);
      setInStock(product.inStock ?? true);
      setIsFeatured(product.isFeatured ?? false);
    } else {
      // New product default
      setTitle('');
      setSubtitle('COLLECTION 2026');
      setPrice(9900);
      setOriginalPrice(undefined);
      setCategory('outerwear');
      setImages([]);
      setDescription('Минималистичный крой в холодном стальном оттенке. Премиальные материалы, архитектурный силуэт.');
      setComposition('100% High-grade Metalized Cotton');
      setSizes(['S', 'M', 'L', 'XL']);
      setInStock(true);
      setIsFeatured(false);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload (converts to base64 for persistent client-side storage)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    triggerHaptic('light');

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    triggerHaptic('light');
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (sz: string) => {
    triggerHaptic('light');
    if (sizes.includes(sz)) {
      setSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setSizes((prev) => [...prev, sz]);
    }
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim().toUpperCase();
    if (!sizes.includes(clean)) {
      setSizes((prev) => [...prev, clean]);
    }
    setCustomSizeInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Укажите название товара');
      return;
    }
    if (price <= 0) {
      alert('Укажите корректную стоимость');
      return;
    }
    if (images.length === 0) {
      alert('Загрузите хотя бы одну фотографию товара');
      return;
    }

    triggerHaptic('success');

    const updatedProduct: Product = {
      id: product ? product.id : `prod-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      images,
      description: description.trim(),
      composition: composition.trim(),
      sizes: sizes.length > 0 ? sizes : ['ONE SIZE'],
      inStock,
      isFeatured,
      createdAt: product ? product.createdAt : Date.now(),
    };

    onSave(updatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="edit-product-modal"
        className="relative z-10 w-full max-w-2xl bg-[#0f1115] border border-[#262c36] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#212630] flex items-center justify-between bg-[#14161b]">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white">
              {product ? 'Редактировать товар' : 'Новый товар в каталог'}
            </h3>
            <p className="text-xs font-mono text-[#818c9b]">
              Загрузите фото, настройте цену, описание и размеры
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1f242d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="product-editor-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Photos Upload Section */}
          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-2">
              Фотографии товара * ({images.length} загружено)
            </label>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-white bg-[#1e232c]'
                  : 'border-[#2d3441] bg-[#121419] hover:border-[#475266]'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Upload className="w-7 h-7 mx-auto mb-2 text-[#94a3b8]" />
              <p className="font-mono text-xs text-white font-medium mb-1">
                Нажмите для выбора фото или перетащите файлы сюда
              </p>
              <p className="font-mono text-[11px] text-[#6b7685]">
                Поддерживаются JPG, PNG, WEBP, а также фото прямо с камеры смартфона
              </p>
            </div>

            {/* Add by URL input */}
            <div className="flex gap-2 mt-2.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Или вставьте прямую ссылку на фото (https://...)"
                className="flex-1 px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-xs font-mono focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-3 py-2 rounded-lg bg-[#1e222a] border border-[#2d3442] text-xs font-mono text-[#cbd5e1] hover:text-white hover:bg-[#272c36]"
              >
                Добавить ссылку
              </button>
            </div>

            {/* Presets picker */}
            <div className="mt-3">
              <span className="text-[11px] font-mono text-[#6c7786] block mb-1.5">
                Быстрые металлик-фото из коллекции:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_METALLIC_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!images.includes(p.url)) {
                        setImages((prev) => [...prev, p.url]);
                      }
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-[#17191f] border border-[#242933] text-[#9ca3af] hover:text-white hover:border-[#424c5c]"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uploaded Images Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#262c38] group bg-black">
                    <img src={img} alt={`фото ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        Главная
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors"
                      title="Удалить фото"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Titles & Pricing row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Название модели *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="TITANIUM BOMBER JACKET"
                className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Подзаголовок / Дроп
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="EDITION 02 / LIQUID CHROME"
                className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Стоимость ({currency}) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                Старая цена (для скидки, по желанию)
              </label>
              <input
                type="number"
                min="0"
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Например, 15000"
                className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Product['category'])}
              className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
            >
              <option value="outerwear">Верхняя одежда (Куртки, Бомберы, Пуховики)</option>
              <option value="hoodies">Худи и Свитшоты</option>
              <option value="tees">Футболки и Лонгсливы</option>
              <option value="bottoms">Брюки и Карго</option>
              <option value="accessories">Аксессуары и Сумки</option>
            </select>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-2">
              Доступные размеры
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {STANDARD_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold border transition-all ${
                    sizes.includes(sz)
                      ? 'bg-white text-black border-white'
                      : 'bg-[#15171d] text-[#8892a0] border-[#262c37] hover:border-[#3d4657]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Custom size input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                placeholder="Свой размер (например: 42, 44, OVERSIZED)"
                className="w-64 px-3 py-1.5 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-xs font-mono focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="px-3 py-1.5 rounded-lg bg-[#1e222a] border border-[#2d3442] text-xs font-mono text-[#cbd5e1] hover:text-white"
              >
                + Добавить
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Описание модели *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание силуэта, деталей, посадки и особенностей..."
              className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none resize-none"
            />
          </div>

          {/* Composition */}
          <div>
            <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
              Состав ткани и фурнитура
            </label>
            <input
              type="text"
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              placeholder="100% Cotton (450 GSM), фурнитура YKK титан"
              className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
            />
          </div>

          {/* Status Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#14171d] border border-[#232935] cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0f1115] border-[#384152] accent-white"
              />
              <div>
                <span className="text-xs font-mono text-white font-medium block">В наличии</span>
                <span className="text-[10px] font-mono text-[#717b8a]">Товар доступен для заказа</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#14171d] border border-[#232935] cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0f1115] border-[#384152] accent-white"
              />
              <div>
                <span className="text-xs font-mono text-white font-medium block">Хит дропа (Featured)</span>
                <span className="text-[10px] font-mono text-[#717b8a]">Особая отметка в каталоге</span>
              </div>
            </label>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-[#212630] bg-[#14161b] flex items-center justify-between gap-3">
          <div>
            {product && onDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-600/80 px-3 py-1.5 rounded-lg animate-in fade-in">
                  <span className="text-xs font-mono text-rose-200 font-bold">
                    Удалить товар навсегда?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      onDelete(product.id);
                      setIsConfirmingDelete(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-xs font-bold hover:bg-rose-500 transition-colors"
                  >
                    Да, удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 rounded bg-[#1e232d] text-[#cbd5e1] font-mono text-xs hover:text-white transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setIsConfirmingDelete(true);
                  }}
                  className="px-3 py-2 rounded-lg border border-rose-900/50 bg-rose-950/30 text-xs font-mono text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить товар</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#2b313d] bg-[#191c23] text-xs font-mono text-[#9ca3af] hover:text-white hover:bg-[#20252e] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="product-editor-form"
              className="px-6 py-2.5 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(241,245,249,0.2)]"
            >
              {product ? 'Сохранить изменения' : 'Опубликовать товар'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
