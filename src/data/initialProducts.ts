import { Product, BrandSettings } from '../types';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', slug: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
  { id: 'cat-2', slug: 'hoodies', label: 'ХУДИ' },
  { id: 'cat-3', slug: 'tees', label: 'ФУТБОЛКИ' },
  { id: 'cat-4', slug: 'bottoms', label: 'БРЮКИ' },
  { id: 'cat-5', slug: 'accessories', label: 'АКСЕССУАРЫ' },
];

export const INITIAL_BRAND_SETTINGS: BrandSettings = {
  brandName: 'USHIMA',
  brandTagline: 'AVANT-GARDE METALLIC ARCHIVE // USHIMA',
  announcementText: '',
  botUsername: 'ushima_bot',
  currency: '₽',
  adminPin: '9482',
  adminPassword: 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{',
  adminEmails: ['dimshim67@gmail.com'],
  contactTelegram: 'ushima_manager',

  // Категории каталога
  categories: DEFAULT_CATEGORIES,

  // Главный экран (Hero)
  heroBadge: 'USHIMA ARCHIVE // METALLIC ATELIER',
  heroTitle: 'USHIMA. ///',
  heroSubtitle: '',
  heroDescription: 'Концептуальный бренд одежды и аксессуаров в индастриал эстетике.',

  // Информационные блоки
  feature1Title: 'ОПЛАТА ЧЕРЕЗ TELEGRAM БОТА',
  feature1Text: 'Безопасная оплата картой или СБП через официальный бот бренда без лишних регистраций.',
  feature2Title: 'ФИРМЕННЫЙ СТИЛЬ USHIMA',
  feature2Text: 'Ограниченные тиражи, серые металлик оттенки, премиальные ткани и титановые элементы.',
  feature3Title: 'МЕНЕДЖЕР В TELEGRAM 24/7',
  feature3Text: 'Помощь с оформлением заказа и подбором нужного размера в Telegram: @ushima_manager',
};

// По умолчанию каталог пустой для загрузки реальных товаров
export const INITIAL_PRODUCTS: Product[] = [];

// Архивные образцы для опционального восстановления при необходимости
export const DEMO_ARCHIVE_PRODUCTS: Product[] = [
  {
    id: 'ush-01',
    title: 'ARCHIVE TITANIUM PUFFER // 01',
    subtitle: 'Мембранная ткань с микро-металлическим напылением',
    description: 'Оверсайз пуховик с титановым отблеском. Водоотталкивающая мембрана 20 000 мм, наполнитель 90/10 гусиный пух, фирменная металлическая фурнитура USHIMA.',
    price: 28900,
    category: 'outerwear',
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: {
      'S': 4,
      'M': 6,
      'L': 5,
      'XL': 2,
    },
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: true,
    sku: 'USH-JKT-01',
    createdAt: 1700000001000,
  },
  {
    id: 'ush-02',
    title: 'RAW HEAVYWEIGHT HOODIE // 02',
    subtitle: 'Плотный хлопковый футер 520 г/м²',
    description: 'Худи глубокого графитового оттенка с необработанными швами и капюшоном двойной плотности. Металлическая гравированная плашка на груди.',
    price: 14500,
    category: 'hoodies',
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: {
      'S': 5,
      'M': 8,
      'L': 7,
      'XL': 3,
    },
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: true,
    sku: 'USH-HD-02',
    createdAt: 1700000002000,
  },
  {
    id: 'ush-03',
    title: 'METALLURGIC GRAPHIC TEE // 03',
    subtitle: 'Премиальный хлопок пенье 280 г/м²',
    description: 'Футболка коробчатого силуэта (boxy fit) с авторским серебряным шелкотрафаретным принтом архива токийской лаборатории USHIMA.',
    price: 7800,
    category: 'tees',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      'XS': 3,
      'S': 7,
      'M': 10,
      'L': 8,
      'XL': 4,
    },
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: true,
    sku: 'USH-TEE-03',
    createdAt: 1700000003000,
  },
  {
    id: 'ush-04',
    title: 'TACTICAL MODULAR CARGO // 04',
    subtitle: 'Нейлон высокой прочности Cordura blend',
    description: 'Широкие брюки карго с регулируемой геометрией штанины на стропах с магнитными замками Fidlock и анатомическими складками.',
    price: 18400,
    category: 'bottoms',
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: {
      'S': 3,
      'M': 6,
      'L': 5,
      'XL': 2,
    },
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: false,
    sku: 'USH-PNT-04',
    createdAt: 1700000004000,
  },
  {
    id: 'ush-05',
    title: 'TITANIUM CROSSBODY SLING // 05',
    subtitle: 'Баллистический нейлон 1050D с титановой клипсой',
    description: 'Компактная сумка через плечо с водонепроницаемыми молниями YKK Aquaguard и титановым карабином ручной полировки.',
    price: 9600,
    category: 'accessories',
    sizes: ['ONE SIZE'],
    sizeStock: {
      'ONE SIZE': 12,
    },
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: true,
    sku: 'USH-ACC-05',
    createdAt: 1700000005000,
  },
  {
    id: 'ush-06',
    title: 'ACID WASHED ZIP-CARDIGAN // 06',
    subtitle: 'Мериносовая шерсть 80% / Хлопок 20%',
    description: 'Вязаный кардиган на двусторонней молнии с эффектом кислотной стирки и структурным металлическим блеском волокон.',
    price: 16900,
    category: 'hoodies',
    sizes: ['S', 'M', 'L'],
    sizeStock: {
      'S': 4,
      'M': 5,
      'L': 3,
    },
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: false,
    sku: 'USH-ZIP-06',
    createdAt: 1700000006000,
  },
  {
    id: 'ush-07',
    title: 'METALLIC ARCHIVE CAP // 07',
    subtitle: 'Плотный хлопковый твил с металлической застежкой',
    description: 'Бейсболка с изогнутым козырьком, титановой гравированной застежкой и лаконичной объемной вышивкой логотипа USHIMA.',
    price: 5200,
    category: 'accessories',
    sizes: ['ONE SIZE'],
    sizeStock: {
      'ONE SIZE': 18,
    },
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200',
    ],
    inStock: true,
    isFeatured: false,
    sku: 'USH-CAP-07',
    createdAt: 1700000007000,
  },
];
