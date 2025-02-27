
// API Response Types
export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    display_name: string;
    email: string;
    id: number;
    roles: string[];
    site_id: number;
    site_title: string;
    site_url: string;
    username: string;
  };
}

// Request Types
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

export interface ProcessVideoRequest {
  youtube_url: string;
  store_url: string;
  auto_approve: boolean;
}

export interface BulkReviewRequest {
  product_ids: string[];
  status: 'pending' | 'approved' | 'rejected';
  review_all: boolean;
}

// Model Types
export interface Product {
  id?: number;
  name: string;
  description: string;
  price?: string | null;
  status: string;
  confidence_score: number;
  video_clip_url: string;
  thumbnail_url: string;
  timestamp_start: string;
  timestamp_end: string;
  created_at?: string;
}

export interface ProductMetadata {
  _id?: string;
  wc_product_id: number | string;
  collection_id: string;
  youtube_timestamp_start: number;
  youtube_timestamp_end: number;
  confidence_score: number;
  review_status: string;
  reviewer_id?: number | null;
  review_date?: string | null;
  review_notes?: string | null;
}

export interface CollectionMetadata {
  _id?: string;
  youtube_url: string;
  video_title: string;
  video_thumbnail: string;
  store_url: string;
  wc_collection_id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  total_products: number;
  approved_products: number;
  rejected_products: number;
  pending_products: number;
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
  video_url?: string;
  thumbnail?: string;
  created_at?: string;
  last_updated?: string;
}

export interface CollectionSummary {
  id: string;
  title: string;
  video_url: string;
  total_products: number;
  status: string;
  created_at: string;
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

export interface ProcessingStats {
  total_videos_processed: number;
  total_products_detected: number;
  total_products_approved: number;
  total_products_rejected: number;
  total_products_pending: number;
  processing_success_rate: number;
  average_products_per_video: number;
  last_processed_at: string | null;
}

export interface RecentActivity {
  timestamp: string;
  action: string;
  details: Record<string, any>;
}

export interface StoreUsage {
  total_storage_used: number;
  total_api_calls: number;
  last_activity: string;
  subscription_status: string;
  subscription_expires: string;
}

export interface Store {
  store_url: string;
  store_title: string;
  owner_email: string;
  created_at: string;
  status: string;
  processing_stats: ProcessingStats;
  collections_count: number;
  recent_collections: CollectionSummary[];
  total_products: number;
  products_by_status: Record<string, number>;
  usage: StoreUsage;
  recent_activity: RecentActivity[];
  name?: string; // For backward compatibility
  url?: string; // For backward compatibility
  total_collections?: number; // For backward compatibility
}

export interface ReviewResponse {
  success: boolean;
  collection_id: string;
  total_reviewed: number;
  status_counts: Record<string, number>;
}

export type ProductStatus = 'draft' | 'approved' | 'rejected';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReviewResponse {
  id: number;
  name: string;
  status: string;
  confidence_score: number;
  review_status?: string;
  review_date?: string;
  reviewer?: string;
}
