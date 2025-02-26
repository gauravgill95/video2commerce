
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
}

export interface ProcessVideoRequest {
  youtube_url: string;
  store_url: string;
  auto_approve: boolean;
}
