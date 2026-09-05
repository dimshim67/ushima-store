export interface CategoryItem {
  id: string;
  slug: string;
  label: string;
}

export interface Product {
  id: string;
  title: string;
  sku?: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  description: string;
  composition?: string;
  sizes: string[];
  sizeStock?: Record<string, number>;
  inStock: boolean;
  isFeatured?: boolean;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  telegramUsername: string;
  phone: string;
  address: string;
  comment?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  currency: string;
  customer: CustomerDetails;
  status: 'new' | 'confirmed' | 'paid' | 'shipped';
  createdAt: string;
}

export interface BrandSettings {
  brandName: string;
  brandTagline: string;
  announcementText: string;
  botUsername: string;
  telegramChannel?: string;
  currency: string;
  adminPin: string;
  adminPassword?: string;
  adminEmails?: string[];
  contactTelegram: string;

  // Категории
  categories?: CategoryItem[];

  // Главный экран (Hero)
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;

  // Информационные блоки (Преимущества и условия)
  feature1Title?: string;
  feature1Text?: string;
  feature2Title?: string;
  feature2Text?: string;
  feature3Title?: string;
  feature3Text?: string;
}

export type ViewMode = 'client' | 'admin';
