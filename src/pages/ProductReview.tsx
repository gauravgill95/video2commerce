import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAuthHeaders } from '@/lib/auth';
import { ProductReviewResponse, BulkReviewRequest } from '@/types/api';
import API_URL from '@/config/apiConfig';
import { useIsMobile } from '@/hooks/use-mobile';

const ProductReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const youtubeUrl = queryParams.get('youtube_url');
  const storeUrl = queryParams.get('store_url');
  
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [activeVideoProduct, setActiveVideoProduct] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Validate required parameters
  useEffect(() => {
    if (!youtubeUrl || !storeUrl) {
      toast.error('Missing required parameters');
      navigate('/process');
      return;
    }
  }, [youtubeUrl, storeUrl, navigate]);

  // Fetch products for the YouTube video
  const { data: products, isLoading, error } = useQuery({
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
      
      const apiPayload = {
        product_ids: data.product_ids,
        approve_all: data.review_all,
        youtube_url: data.youtube_url,
        store_url: data.store_url
      };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiPayload),
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
      // Invalidate and refetch the products query
      queryClient.invalidateQueries({ queryKey: ['products', youtubeUrl, storeUrl] });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setConfirmDialogOpen(false);
    },
  });

  // Filter products based on active tab and status
  const filteredProducts = products?.filter(product => {
    if (activeTab === 'pending') return product.status === 'draft';
    if (activeTab === 'approved') return product.status === 'approved';
    if (activeTab === 'rejected') return product.status === 'private';
    return true;
  }) || [];

  // Calculate counts for each status
  const counts = (products || []).reduce(
    (acc, product) => {
      if (product.status === 'draft') acc.pending++;
      else if (product.status === 'approved') acc.approved++;
      else if (product.status === 'private') acc.rejected++;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  // Handle product review (approve/reject)
  const handleProductReview = (productId: string, action: 'approve' | 'reject') => {
    if (!youtubeUrl || !storeUrl) {
      toast.error('Missing required parameters');
      return;
    }
    
    const requestData: BulkReviewRequest = {
      product_ids: [productId],
      status: action === 'approve' ? 'approved' : 'rejected',
      review_all: false,
      approve_all: false,
      store_url: storeUrl,
      youtube_url: youtubeUrl
    };
    
    reviewMutation.mutate(requestData);
  };

  // Handle swipe gesture for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = (productId: string) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      handleProductReview(productId, 'reject');
    } else if (isRightSwipe) {
      handleProductReview(productId, 'approve');
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };
  
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
      approve_all: reviewAll,
      store_url: storeUrl,
      youtube_url: youtubeUrl
    };
    
    reviewMutation.mutate(requestData);
  };

  if (!youtubeUrl || !storeUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Missing Parameters</h2>
        <p className="text-muted-foreground mb-4">
          Please start from the Process Video page to review products.
        </p>
        <Button 
          onClick={() => navigate('/process')} 
          className="mt-4"
          variant="outline"
        >
          Go to Process Video
        </Button>
      </div>
    );
  }

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
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-purple-100/50 text-purple-900 grid w-full grid-cols-3">
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
                  onTouchStart={isMobile ? handleTouchStart : undefined}
                  onTouchMove={isMobile ? handleTouchMove : undefined}
                  onTouchEnd={isMobile ? () => handleTouchEnd(product.id) : undefined}
                >
                  <div className="relative">
                    {videoId && product.timestamp_start !== null && product.timestamp_end !== null && (
                      <div className="relative aspect-video bg-gray-100">
                        {activeVideoProduct === product.id ? (
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?start=${
                              Math.floor(product.timestamp_start || 0)
                            }&end=${
                              Math.ceil(product.timestamp_end || 0)
                            }&autoplay=1&controls=1&showinfo=0&rel=0`}
                            title={`Product: ${product.name}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <>
                            {product.thumbnail_url ? (
                              <img 
                                src={product.thumbnail_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setActiveVideoProduct(product.id)}
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer"
                                onClick={() => setActiveVideoProduct(product.id)}
                              >
                                <span className="text-sm text-gray-500">Click to play video clip</span>
                              </div>
                            )}
                            <div 
                              className="absolute inset-0 flex items-center justify-center cursor-pointer"
                              onClick={() => setActiveVideoProduct(product.id)}
                            >
                              <div className="h-12 w-12 bg-black/70 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 border-t-8 border-l-8 border-b-8 border-t-transparent border-l-white border-b-transparent ml-1"></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`${
                              product.status === 'approved'
                                ? 'bg-green-500'
                                : product.status === 'private'
                                ? 'bg-red-500'
                                : 'bg-purple-500'
                            }`}
                          >
                            {product.status === 'draft' ? 'pending' : product.status}
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
                        Price: ₹{product.price.toFixed(2)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.description || 'No description available'}
                    </p>

                    {isMobile && activeTab === 'pending' && (
                      <div className="text-xs text-muted-foreground mt-2 text-center italic">
                        Swipe right to approve, left to reject
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="justify-center">
                    {isMobile ? (
                      // For mobile, swipe instructions (actual swipe handling done above)
                      activeTab === 'pending' ? null : (
                        <Button
                          variant="outline"
                          onClick={() => handleProductReview(
                            product.id, 
                            product.status === 'approved' ? 'reject' : 'approve'
                          )}
                        >
                          {product.status === 'approved' ? 'Change to Reject' : 'Change to Approve'}
                        </Button>
                      )
                    ) : (
                      // For desktop, regular buttons
                      activeTab === 'pending' ? (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleProductReview(product.id, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          
                          <Button
                            variant="destructive"
                            onClick={() => handleProductReview(product.id, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleProductReview(
                            product.id, 
                            product.status === 'approved' ? 'reject' : 'approve'
                          )}
                        >
                          {product.status === 'approved' ? 'Change to Reject' : 'Change to Approve'}
                        </Button>
                      )
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Confirmation dialog for bulk actions only */}
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