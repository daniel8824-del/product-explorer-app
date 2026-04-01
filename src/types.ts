export interface TrendProduct {
  rank: number;
  title: string;
  title_ko?: string;
  price: string;
  price_krw?: string;
  rating: string;
  review_count: string;
  image_url: string;
  product_url: string;
  change?: string;
}

export interface TrendData {
  updated_at: string;
  platforms: Record<string, Record<string, TrendProduct[]>>;
}

export interface ProductData {
  product_title: string;
  brand: string;
  price: string;
  price_krw?: number;
  rating: string;
  review_count: string;
  description: string;
  product_subtitle?: string;
  features: string[];
  about_this_item?: string[];
  product_specs?: Record<string, string>;
  ingredients?: string;
  from_the_brand?: string;
  sustainability?: string;
  important_information?: string;
  images: string[];
  reviews: ReviewItem[];
  selling_points?: string[];
  source_url?: string;
}

export interface ReviewItem {
  title: string;
  rating: string;
  text: string;
  author?: string;
  date?: string;
}

export type Platform = 'naver' | 'amazon' | 'temu' | 'qoo10' | 'cosme' | 'ebay';
export type Category = 'beauty' | 'skincare' | 'makeup' | 'fashion' | 'electronics' | 'food_health' | 'home_living' | 'sports';

export interface CategoryInfo {
  id: Category;
  label: string;
  platforms: Record<Platform, { url: string; param?: string } | null>;
}

export type AppMode = 'trend' | 'product';
export type ProcessStep = 'idle' | 'scraping' | 'analyzing' | 'translating' | 'generating' | 'done' | 'error';
