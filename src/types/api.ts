
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | null;
  status: 'draft' | 'approved' | 'rejected';
  confidence_score: number;
  video_clip_url: string;
  thumbnail_url: string;
  timestamp_start: string;
  timestamp_end: string;
  created_at: string;
}

export interface Collection {
  id: number;
  name: string;
  url: string;
  total_products: number;
  approved_products: number;
  draft_products: number;
  rejected_products: number;
  products: Product[];
  video_url?: string;    // Original YouTube URL
  thumbnail?: string;    // Collection thumbnail
  created_at?: string;
  last_updated?: string;
}

export interface DashboardStats {
  collections: {
    total: number;
    trend: { value: number; isPositive: boolean };
  };
  videos: {
    total: number;
    trend: { value: number; isPositive: boolean };
  };
  approved: {
    total: number;
    trend: { value: number; isPositive: boolean };
  };
  rejected: {
    total: number;
    trend: { value: number; isPositive: boolean };
  };
}

export interface Store {
  url: string;
  name: string;
  total_collections: number;
  total_products: number;
  processing_stats: {
    videos_processed: number;
    products_created: number;
    pending_reviews: number;
  };
}

export interface CollectionsList {
  collections: Collection[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
  };
}

export interface StoreCollectionsResponse {
  collections: Collection[];
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
  };
}

// Auth related interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username?: string;
  site_title: string;
  site_url: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}
