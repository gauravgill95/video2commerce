import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, ThumbsUp, ThumbsDown, AlertCircle, Play, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAuthHeaders } from '@/lib/auth';
import { ProductReviewResponse, BulkReviewRequest } from '@/types/api';
import API_URL from '@/config/apiConfig';

const ProductReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const youtubeUrl = queryParams.get('youtube_url');
  const storeUrl = queryParams.get('store_url');
  
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isPlayingVideo, setIsPlayingVideo] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  
  // Validate required parameters
  useEffect(() => {
    if (!youtubeUrl || !storeUrl) {
      toast.error('Missing required parameters');
      navigate('/process');
      return;
    }
  }, [youtubeUrl, storeUrl, navigate]);
  
  // If required parameters are missing, render a redirect message
  if (!youtubeUrl || !storeUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Missing Parameters</h2>
        <p className="text-muted-foreground mb-4">
          Please start from the Process Video page to review products.
        </p>
        <Button onClick={() => navigate('/process')}>
          Go to Process Video
        </Button>
      </div>
    );
  }
  
  // Fetch products for the YouTube video
  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products', youtubeUrl, storeUrl],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/v1/collections/by-youtube-url?youtube_url=${encodeURIComponent(youtubeUrl)}&store_url=${encodeURIComponent(storeUrl)}`,
        { headers: getAuthHeaders() }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json() as Promise<ProductReviewResponse[]>;
    },
    enabled: !!youtubeUrl && !!storeUrl,
  });
  
  // Mutations for approving and rejecting products
  const reviewMutation = useMutation({
    mutationFn: async (data: BulkReviewRequest) => {
      const endpoint = data.status === 'approved' 
        ? '/api/v1/collections/approve' 
        : '/api/v1/collections/reject';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${data.status === 'approved' ? 'approve' : 'reject'} products`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success(
        confirmAction === 'approve' 
          ? 'Products approved successfully' 
          : 'Products rejected successfully'
      );
      setSelectedProducts([]);
      refetch();
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setConfirmDialogOpen(false);
    },
  });
  
  // Filter products based on active tab
  const filteredProducts = products?.filter(product => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return product.review_status === 'pending' || !product.review_status;
    if (activeTab === 'approved') return product.review_status === 'approved';
    if (activeTab === 'rejected') return product.review_status === 'rejected';
    return true;
  }) || [];
  
  // Calculate counts for each status
  const counts = (products || []).reduce(
    (acc, product) => {
      const status = product.review_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 } as Record<string, number>
  );
  
  // Handle product selection toggle
  const toggleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };
  
  // Handle select all products
  const handleSelectAll = (filtered = false) => {
    if (filtered) {
      const allSelected = filteredProducts.every(product => 
        selectedProducts.includes(product.id));
      
      if (allSelected) {
        setSelectedProducts(selectedProducts.filter(id => 
          !filteredProducts.some(product => product.id === id)));
      } else {
        const newSelected = [...selectedProducts];
        filteredProducts.forEach(product => {
          if (!newSelected.includes(product.id)) {
            newSelected.push(product.id);
          }
        });
        setSelectedProducts(newSelected);
      }
    } else {
      const allSelected = products && products.length === selectedProducts.length;
      setSelectedProducts(allSelected ? [] : (products || []).map(p => p.id));
    }
  };
  
  // Handle bulk review action
  const handleBulkReview = (action: 'approve' | 'reject') => {
    if (selectedProducts.length === 0 && action !== 'approve' && action !== 'reject') {
      toast.error('No products selected');
      return;
    }
    
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };
  
  // Handle confirm bulk review
  const confirmBulkReview = (reviewAll: boolean) => {
    if (!youtubeUrl || !storeUrl) {
      toast.error('Missing required parameters');
      return;
    }
    
    if (!confirmAction) return;
    
    const requestData: BulkReviewRequest = {
      product_ids: selectedProducts,
      status: confirmAction === 'approve' ? 'approved' : 'rejected',
      review_all: reviewAll,
      store_url: storeUrl,
      youtube_url: youtubeUrl
    };
    
    reviewMutation.mutate(requestData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Error loading products</h3>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button 
          onClick={() => navigate('/process')} 
          className="mt-4"
          variant="outline"
        >
          Go back
        </Button>
      </div>
    );
  }
  
  const videoId = youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^\/\?\&]+)/)?.[1];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/process')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Product Review</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(true)}
            disabled={filteredProducts.length === 0}
          >
            {filteredProducts.every(p => selectedProducts.includes(p.id))
              ? 'Deselect All Visible'
              : 'Select All Visible'}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => handleBulkReview('approve')}
            disabled={selectedProducts.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <ThumbsUp className="h-4 w-4 mr-2" /> Approve Selected
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkReview('reject')}
            disabled={selectedProducts.length === 0}
          >
            <ThumbsDown className="h-4 w-4 mr-2" /> Reject Selected
          </Button>
        </div>
      </div>
      
      {/* Video and stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videoId && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Video Source</CardTitle>
              <CardDescription>
                Products were extracted from this video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Review Summary</CardTitle>
            <CardDescription>
              Status of products detected in this video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{counts.pending}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Approved</div>
                <div className="text-2xl font-bold">{counts.approved}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Rejected</div>
                <div className="text-2xl font-bold">{counts.rejected}</div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Products</div>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-1">Review Progress</div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500" 
                  style={{ 
                    width: `${Math.round(
                      ((counts.approved + counts.rejected) / 
                      ((products?.length || 1) * 0.01)) * 100) / 100}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm mt-1">
                {Math.round(((counts.approved + counts.rejected) / ((products?.length || 1) * 0.01)) * 100) / 100}% complete
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => handleBulkReview('approve')}
              disabled={counts.pending === 0}
            >
              Complete Review
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Product tabs and list */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-purple-100/50 text-purple-900 grid w-full grid-cols-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({products?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-white">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-white">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No products found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className={`overflow-hidden transition-all ${
                    selectedProducts.includes(product.id) 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : ''
                  }`}
                >
                  <div className="relative">
                    {product.thumbnail_url && (
                      <div className="relative aspect-video bg-gray-100">
                        <img 
                          src={product.thumbnail_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                        {product.video_clip_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute inset-0 m-auto bg-black/40 rounded-full p-2 hover:bg-black/60"
                            onClick={() => setIsPlayingVideo(product.id)}
                          >
                            <Play className="h-8 w-8 text-white" />
                          </Button>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`${
                              product.review_status === 'approved'
                                ? 'bg-green-500'
                                : product.review_status === 'rejected'
                                ? 'bg-red-500'
                                : 'bg-purple-500'
                            }`}
                          >
                            {product.review_status || 'pending'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-white/80">
                            {Math.round(product.confidence_score * 100)}% confidence
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                          <Badge variant="outline" className="bg-black/60 text-white">
                            {formatTime(product.timestamp_start || 0)}
                          </Badge>
                          <Badge variant="outline" className="bg-black/60 text-white">
                            {formatTime(product.timestamp_end || 0)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-0 right-0 m-2">
                      <input
                        type="checkbox"
                        className="h-5 w-5 cursor-pointer accent-purple-600"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {product.name}
                    </CardTitle>
                    {product.price && (
                      <CardDescription>
                        Price: ${product.price.toFixed(2)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.description || 'No description available'}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        setSelectedProducts([product.id]);
                        setConfirmAction('approve');
                        setConfirmDialogOpen(true);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedProducts([product.id]);
                        setConfirmAction('reject');
                        setConfirmDialogOpen(true);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Video player dialog */}
      {isPlayingVideo && (
        <Dialog open={!!isPlayingVideo} onOpenChange={() => setIsPlayingVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {products?.find(p => p.id === isPlayingVideo)?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="aspect-video mt-2">
              {videoId && isPlayingVideo && (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?start=${
                    Math.floor(products?.find(p => p.id === isPlayingVideo)?.timestamp_start || 0)
                  }&end=${
                    Math.ceil(products?.find(p => p.id === isPlayingVideo)?.timestamp_end || 0)
                  }&autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button onClick={() => setIsPlayingVideo(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' ? 'Approve Products' : 'Reject Products'}
            </DialogTitle>
            <DialogDescription>
              {selectedProducts.length > 0 
                ? `You are about to ${confirmAction === 'approve' ? 'approve' : 'reject'} ${selectedProducts.length} selected product(s).`
                : `You haven't selected any products.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">
              {confirmAction === 'approve'
                ? 'Approved products will be published to your store.'
                : 'Rejected products will not be published to your store.'}
            </p>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="review-all"
                className="h-4 w-4 accent-purple-600"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleSelectAll(false);
                  }
                }}
              />
              <label htmlFor="review-all" className="text-sm">
                {confirmAction === 'approve'
                  ? 'Approve all products in this video'
                  : 'Reject all products in this video'}
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'approve' ? 'default' : 'destructive'}
              onClick={() => confirmBulkReview(false)}
              disabled={selectedProducts.length === 0}
            >
              {confirmAction === 'approve' ? 'Approve Selected' : 'Reject Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default ProductReview;
