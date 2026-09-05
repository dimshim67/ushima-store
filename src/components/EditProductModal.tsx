import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Product, CategoryItem } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  currency: string;
  categories?: CategoryItem[];
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

// Client-side image compressor: scales high-res camera photos down to crisp ~1200px JPEG (~80-140KB)
function compressImageFile(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.onerror = () => resolve(readerEvent.target?.result as string);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
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
  categories = [],
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>('outerwear');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({ S: 3, M: 5, L: 2 });
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // File input ref for replacing an existing image at a specific index
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setSubtitle(product.subtitle || '');
      setPrice(product.price);
      setOriginalPrice(product.originalPrice);
      setCategory(product.category || 'outerwear');
      setImages(product.images || []);
      setDescription(product.description || '');
      setComposition(product.composition || '');
      const prodSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L'];
      setSizes(prodSizes);

      // Initialize size stock
      const initialStock: Record<string, number> = {};
      for (const sz of prodSizes) {
        initialStock[sz] = product.sizeStock && product.sizeStock[sz] !== undefined ? product.sizeStock[sz] : 3;
      }
      setSizeStock(initialStock);
      setInStock(product.inStock ?? true);
      setIsFeatured(product.isFeatured ?? false);
    } else {
      // New product default
      setTitle('');
      setSubtitle('COLLECTION 2026');
      setPrice(9900);
      setOriginalPrice(undefined);
      const defaultCat = categories.length > 0 ? categories[0].slug : 'outerwear';
      setCategory(defaultCat);
      setImages([]);
      setDescription('Минималистичный крой в холодном стальном оттенке. Премиальные материалы, архитектурный силуэт.');
      setComposition('100% High-grade Metalized Cotton');
      const defaultSizes = ['S', 'M', 'L', 'XL'];
      setSizes(defaultSizes);
      setSizeStock({ S: 5, M: 5, L: 5, XL: 3 });
      setInStock(true);
      setIsFeatured(false);
    }
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  // Handle local image file upload with compression
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    triggerHaptic('light');

    setIsProcessingImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const compressedResults = await Promise.all(
        validFiles.map((file) => compressImageFile(file, 1200, 0.82))
      );
      const validImages = compressedResults.filter((img) => Boolean(img && img.length > 50));
      if (validImages.length > 0) {
        setImages((prev) => [...prev, ...validImages]);
        triggerHaptic('medium');
      }
    } catch (err) {
      console.error('Error compressing images:', err);
    } finally {
      setIsProcessingImages(false);
    }
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

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    triggerHaptic('light');
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleTriggerReplace = (index: number) => {
    setReplaceTargetIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex === null) return;
    triggerHaptic('medium');
    setIsProcessingImages(true);
    try {
      const compressed = await compressImageFile(file, 1200, 0.82);
      if (compressed) {
        setImages((prev) => {
          const next = [...prev];
          next[replaceTargetIndex] = compressed;
          return next;
        });
      }
    } catch (err) {
      console.error('Error replacing image:', err);
    } finally {
      setIsProcessingImages(false);
      setReplaceTargetIndex(null);
    }
  };

  const toggleSize = (sz: string) => {
    triggerHaptic('light');
    if (sizes.includes(sz)) {
      setSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setSizes((prev) => [...prev, sz]);
      setSizeStock((prev) => ({
        ...prev,
        [sz]: prev[sz] !== undefined ? prev[sz] : 3,
      }));
    }
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim().toUpperCase();
    if (!sizes.includes(clean)) {
      setSizes((prev) => [...prev, clean]);
      setSizeStock((prev) => ({
        ...prev,
        [clean]: 3,
      }));
    }
    setCustomSizeInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Укажите название модели');
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

    // Clean up sizeStock to only include active sizes
    const cleanedStock: Record<string, number> = {};
    const finalSizes = sizes.length > 0 ? sizes : ['ONE SIZE'];
    for (const sz of finalSizes) {
      cleanedStock[sz] = typeof sizeStock[sz] === 'number' ? sizeStock[sz] : 0;
    }

    const totalQuantity = Object.values(cleanedStock).reduce((a, b) => a + b, 0);

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
      sizes: finalSizes,
      sizeStock: cleanedStock,
      inStock: inStock && (totalQuantity > 0 || finalSizes.length === 0),
      isFeatured,
      createdAt: product ? product.createdAt : Date.now(),
    };

    onSave(updatedProduct);
    onClose();
  };

  const categoryOptions =
    categories.length > 0
      ? categories
      : [
          { id: 'cat-1', slug: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
          { id: 'cat-2', slug: 'hoodies', label: 'ХУДИ' },
          { id: 'cat-3', slug: 'tees', label: 'ФУТБОЛКИ' },
          { id: 'cat-4', slug: 'bottoms', label: 'БРЮКИ' },
          { id: 'cat-5', slug: 'accessories', label: 'АКСЕССУАРЫ' },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden file input for replacing single photos */}
      <input
        type="file"
        ref={replaceInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFileChange}
      />

      <div
        id="edit-product-modal"
        className="relative z-10 w-full max-w-2xl bg-[#0f1115] border border-[#262c36] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#212630] flex items-center justify-between bg-[#14161b]">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white">
              {product ? 'Редактировать модель' : 'Новая модель в каталог'}
            </h3>
            <p className="text-xs font-mono text-[#717d8e] mt-0.5">
              Управление фотографиями, размерами и остатками на складе
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181b21] text-[#9ca3af] hover:text-white hover:bg-[#232833] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="product-editor-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1"
        >
          {/* Photos Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider font-semibold">
                Фотографии модели ({images.length}) *
              </label>
              <span className="text-[11px] font-mono text-[#38bdf8]">
                Автоматическое сжатие без потери качества
              </span>
            </div>

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
                disabled={isProcessingImages}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              {isProcessingImages ? (
                <div className="py-3 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[#38bdf8] animate-spin mb-2" />
                  <p className="font-mono text-xs text-white font-medium">Оптимизация и подготовка фото...</p>
                  <p className="font-mono text-[11px] text-[#6b7685] mt-0.5">Уменьшаем размер для быстрой работы в Telegram</p>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 mx-auto mb-2 text-[#94a3b8]" />
                  <p className="font-mono text-xs text-white font-medium mb-1">
                    Нажмите для загрузки или перетащите фото сюда
                  </p>
                  <p className="font-mono text-[11px] text-[#6b7685]">
                    Поддерживаются JPG, PNG, WEBP, фото с телефона. Файлы автоматически оптимизируются.
                  </p>
                </>
              )}
            </div>

            {/* Add by URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Или ссылка на фото (https://...)"
                className="flex-1 px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-xs font-mono focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-3.5 py-2 rounded-lg bg-[#1e222a] border border-[#2d3442] text-xs font-mono text-[#cbd5e1] hover:text-white hover:bg-[#272c36] whitespace-nowrap"
              >
                + Добавить
              </button>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-mono text-[#6c7786] block mb-1">
                Быстрые фото из коллекции:
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

            {/* Uploaded Images Gallery with Reordering and Replacing */}
            {images.length > 0 && (
              <div className="space-y-2 mt-3">
                <span className="text-xs font-mono text-[#9ca3af] block">
                  Загруженные фото (используйте стрелки для смены порядка, первое фото — обложка):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#28303d] group bg-black shadow-md flex flex-col justify-between p-1.5"
                    >
                      <img
                        src={img}
                        alt={`фото ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                      {/* Top bar: Badge & Delete */}
                      <div className="relative z-10 flex items-center justify-between">
                        {idx === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-white text-black font-mono font-bold text-[9px] uppercase tracking-wider">
                            Обложка
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[#cbd5e1] font-mono text-[9px]">
                            #{idx + 1}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors"
                          title="Удалить фото"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom bar: Move Left / Replace / Move Right */}
                      <div className="relative z-10 flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, idx - 1)}
                          className={`p-1 rounded bg-black/70 border border-white/20 text-white transition-opacity ${
                            idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                          }`}
                          title="Сдвинуть левее"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerReplace(idx)}
                          className="p-1 rounded bg-black/70 border border-white/20 text-white hover:bg-sky-500 hover:border-sky-400 hover:text-white transition-colors"
                          title="Заменить это фото"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => handleMoveImage(idx, idx + 1)}
                          className={`p-1 rounded bg-black/70 border border-white/20 text-white transition-opacity ${
                            idx === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                          }`}
                          title="Сдвинуть правее"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model titles & Price */}
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
                placeholder="EDITION 01 / LIQUID CHROME"
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
                Старая цена (до скидки)
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
              Категория товара
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#14161b] border border-[#272d38] text-white text-sm font-mono focus:border-white focus:outline-none"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sizes and Inventory per Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider font-semibold">
                Размеры и остаток на складе
              </label>
              <span className="text-[11px] font-mono text-emerald-400">
                Всего в наличии: {Object.values(sizeStock).reduce<number>((a, b) => Number(a) + Number(b), 0)} шт.
              </span>
            </div>

            {/* Standard sizes picker */}
            <div className="flex flex-wrap gap-2">
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

            {/* Per-size inventory quantity inputs */}
            {sizes.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#13161c] border border-[#242a35] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#9ca3af]">
                  <span className="uppercase tracking-wider font-semibold text-white">
                    Количество для каждого размера (шт):
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    При заказе списывается из базы данных
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {sizes.map((sz) => (
                    <div
                      key={sz}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0d0f12] border border-[#232731]"
                    >
                      <span className="font-mono text-xs font-bold text-white">{sz}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="9999"
                          value={sizeStock[sz] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setSizeStock((prev) => ({ ...prev, [sz]: val }));
                          }}
                          className="w-14 px-1.5 py-1 rounded bg-[#181b22] border border-[#313947] text-white text-xs font-mono text-center focus:border-white focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-[#64748b]">шт</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              {product ? 'Сохранить изменения' : 'Опубликовать модель'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
