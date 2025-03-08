
// API Response Types
export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: number;
  username?: string;
  email?: string;
  display_name?: string;
  roles: string[];
  site_id?: number;
  site_title?: string;
  store_url?: string;
  is_admin?: boolean;
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

// Updated to match the new API specification
export interface BulkReviewRequest {
  product_ids: string[];
  status: 'pending' | 'approved' | 'rejected';
  review_all: boolean; // For backward compatibility
  approve_all?: boolean; // New field from the API
  youtube_url?: string;
  store_url?: string;
}

// Response Types
export interface ProcessingResult {
  collection_id: string;
  collection_url: string;
  total_products: number;
  status: string;
  products: ProductReviewResponse[];
}

// Model Types
export interface Product {
  id?: string;
  name: string;
  description: string;
  price?: number | null;
  status: string;
  confidence_score: number;
  video_clip_url: string;
  thumbnail_url: string;
  timestamp_start: number;
  timestamp_end: number;
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

export interface ProductReviewResponse {
  id: string;
  name: string;
  price?: number | null;
  status: string;
  confidence_score: number;
  description?: string | null;
  video_clip_url?: string | null;
  thumbnail_url?: string | null;
  timestamp_start?: number | null;
  timestamp_end?: number | null;
  created_at?: string | null;
  review_status?: string | null;
  review_date?: string | null;
  reviewer?: string | null;
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

export interface CollectionResponse {
  id: number;
  name: string;
  url: string;
  total_products: number;
  approved_products: number;
  draft_products: number;
  rejected_products: number;
  products: ProductReviewResponse[];
}

// Adding Store type for the StoreSelector component
export interface Store {
  store_url?: string;
  url?: string; // For backward compatibility
  store_title?: string;
  name?: string; // For backward compatibility
  owner_email?: string;
  created_at?: string;
  status?: string;
  total_collections?: number;
  collections_count?: number;
  total_products?: number;
  processing_stats?: ProcessingStats;
}

// Alias for StoreCollectionsResponse to match the code
export type StoreCollectionsResponse = CollectionsList;

export interface ProcessingStats {
  total_videos_processed: number;
  total_products_detected: number;
  total_products_approved: number;
  total_products_rejected: number;
  total_products_pending: number;
  processing_success_rate: number;
  average_products_per_video: number;
  last_processed_at: string | null;
  videos_processed?: number; // For backward compatibility
  pending_reviews?: number; // For backward compatibility
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

export interface StoreDetails {
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
  recent_activity: RecentActivity[];
  name?: string; // For backward compatibility
  url?: string; // For backward compatibility
  total_collections?: number; // For backward compatibility
  usage?: StoreUsage;
}

export interface ReviewResponse {
  success: boolean;
  collection_id: string;
  total_reviewed: number;
  status_counts: Record<string, number>;
}

export type ProductStatus = 'draft' | 'approved' | 'rejected';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
