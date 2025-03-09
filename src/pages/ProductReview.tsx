import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAuthHeaders } from '@/lib/auth';
import { ProductReviewResponse, BulkReviewRequest, ProductUpdate, ProductEditRequest } from '@/types/api';
import API_URL from '@/config/apiConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import YouTubeSegmentPlayer from '@/components/YouTubeSegmentPlayer';
import { EditProductDialog } from '@/components/EditProductDialog';
import { PendingChangesBar } from '@/components/PendingChangesBar';

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
  const [players, setPlayers] = useState<{[key: string]: any}>({});
  const playerRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditProduct, setCurrentEditProduct] = useState<ProductReviewResponse | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, ProductUpdate>>({});

  // Replace the navigation guard effects with useBlocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => 
      Object.keys(pendingChanges).length > 0 && 
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const userChoice = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (userChoice) {
        setPendingChanges({});
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Keep the beforeunload handler for browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingChanges).length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingChanges]);

  // Update the validation effect
  useEffect(() => {
    if (!youtubeUrl || !storeUrl) {
      if (Object.keys(pendingChanges).length === 0) {
        toast.error('Missing required parameters');
        navigate('/process');
      }
    }
  }, [youtubeUrl, storeUrl, navigate, pendingChanges]);

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
      
      const data = await response.json() as ProductReviewResponse[];
      
      // Map initial statuses correctly
      return data.map(product => ({
        ...product,
        // Ensure rejected products have 'private' status
        status: product.status === 'rejected' ? 'private' : product.status
      }));
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

  // Add this mutation near your other mutations
  const editProductsMutation = useMutation({
    mutationFn: async (data: ProductEditRequest) => {
      const response = await fetch(`${API_URL}/api/v1/collections/edit-product`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update products');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('All changes saved successfully');
      setPendingChanges({});
      // Invalidate and refetch the products query
      queryClient.invalidateQueries({ queryKey: ['products', youtubeUrl, storeUrl] });
    },
    onError: (error: Error) => {
      toast.error('Failed to save changes: ' + error.message);
    },
  });

  // Update the product filtering logic to use review_status
  const filteredProducts = products?.filter(product => {
    // Get the effective status (pending change or current status)
    const effectiveStatus = pendingChanges[product.id]?.status || product.review_status;

    switch (activeTab) {
      case 'pending':
        // Show products that haven't been reviewed yet
        return !product.review_status && 
               (!pendingChanges[product.id]?.status || 
                !['approved', 'private'].includes(pendingChanges[product.id]?.status || ''));
        
      case 'approved':
        // Show products that are either approved or pending approval
        return effectiveStatus === 'approved';
        
      case 'rejected':
        // Show products that are either rejected or pending rejection
        return effectiveStatus === 'private';
        
      default:
        return true;
    }
  }) || [];

  // Update the counts calculation to use review_status
  const counts = (products || []).reduce(
    (acc, product) => {
      const effectiveStatus = pendingChanges[product.id]?.status || product.review_status;
      
      if (effectiveStatus === 'approved') {
        acc.approved++;
      } else if (effectiveStatus === 'private') {
        acc.rejected++;
      } else if (!product.review_status && 
                 (!pendingChanges[product.id]?.status || 
                  !['approved', 'private'].includes(pendingChanges[product.id]?.status || ''))) {
        acc.pending++;
      }
      
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
    
    // Update the pending changes with the new status
    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        id: productId,
        ...prev[productId], // Keep any existing changes
        status: action === 'approve' ? 'approved' : 'private'
      }
    }));
    
    toast.success(
      action === 'approve' 
        ? 'Product marked for approval' 
        : 'Product marked for rejection'
    );
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
  const handleBulkReview = (productIds: string[], action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'private';
    
    // Update all selected products in pending changes
    const updates = productIds.reduce((acc, productId) => ({
      ...acc,
      [productId]: {
        id: productId,
        ...pendingChanges[productId], // Keep any existing changes
        status: newStatus
      }
    }), {});
    
    setPendingChanges(prev => ({
      ...prev,
      ...updates
    }));
    
    setSelectedProducts([]); // Clear selection
    setConfirmDialogOpen(false);
    
    toast.success(
      action === 'approve' 
        ? `${productIds.length} products marked for approval` 
        : `${productIds.length} products marked for rejection`
    );
  };

  // Add this function to generate a YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId: string, timestamp: number) => {
    // YouTube allows getting thumbnails at specific timestamps
    // Format: https://i3.ytimg.com/vi/[VIDEO_ID]/[quality].jpg
    // We'll use the high quality version
    return `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    
    // Note: YouTube doesn't officially support timestamp-based thumbnails
    // If you need exact frame thumbnails, you'd need a backend service to extract them
  };

  // Add this effect to initialize YouTube API
  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Clean up
    return () => {
      // Destroy all players when component unmounts
      Object.values(players).forEach(player => {
        if (player && typeof player.destroy === 'function') {
          player.destroy();
        }
      });
    };
  }, []);

  // Add this function to initialize a player for a specific product
  const initializePlayer = (productId: string, videoId: string, startTime: number, endTime: number) => {
    if (!window.YT || !window.YT.Player) {
      // YouTube API not loaded yet, try again in a moment
      setTimeout(() => initializePlayer(productId, videoId, startTime, endTime), 100);
      return;
    }

    if (players[productId]) {
      // Player already exists
      return;
    }

    const playerElement = playerRefs.current[productId];
    if (!playerElement) return;

    const player = new window.YT.Player(playerElement, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(startTime),
        end: Math.ceil(endTime),
      },
      events: {
        onReady: (event: any) => {
          event.target.seekTo(startTime);
          event.target.playVideo();
        },
        onStateChange: (event: any) => {
          // When video ends (state = 0), restart from the segment start
          if (event.data === 0) {
            event.target.seekTo(startTime);
            event.target.playVideo();
          }
        },
      },
    });

    setPlayers(prev => ({ ...prev, [productId]: player }));
  };

  const handleEditProduct = (product: ProductReviewResponse) => {
    setCurrentEditProduct(product);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updates: Partial<ProductUpdate>) => {
    if (!currentEditProduct) return;
    
    setPendingChanges(prev => ({
      ...prev,
      [currentEditProduct.id]: {
        id: currentEditProduct.id,
        ...prev[currentEditProduct.id],
        ...updates
      }
    }));
    
    setEditDialogOpen(false);
    setCurrentEditProduct(null);
    
    toast.success('Changes saved locally', {
      description: 'Your changes will be applied when you save all changes',
    });
  };

  const handleSaveAllChanges = async () => {
    if (!youtubeUrl || !storeUrl) {
      toast.error('Cannot save changes: Missing required parameters');
      return;
    }
    
    const editRequest: ProductEditRequest = {
      youtube_url: youtubeUrl,
      store_url: storeUrl,
      products: Object.values(pendingChanges).map(change => ({
        id: change.id,
        name: change.name,
        price: change.price,
        description: change.description,
        status: change.status // Include status in the update
      }))
    };
    
    try {
      await editProductsMutation.mutateAsync(editRequest);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all changes?')) {
      setPendingChanges({});
      toast.success('Changes discarded');
    }
  };

  // Add this helper function to get the current value (either pending or original)
  const getProductValue = (product: ProductReviewResponse, field: keyof ProductUpdate) => {
    if (pendingChanges[product.id] && pendingChanges[product.id][field] !== undefined) {
      return pendingChanges[product.id][field];
    }
    return product[field];
  };

  // Update the PendingChangesBar to show different types of changes
  const getPendingChangesSummary = () => {
    const changes = Object.values(pendingChanges);
    const approvals = changes.filter(c => c.status === 'approved').length;
    const rejections = changes.filter(c => c.status === 'private').length;
    const edits = changes.filter(c => c.name || c.price || c.description).length;
    
    const summary = [];
    if (approvals) summary.push(`${approvals} approvals`);
    if (rejections) summary.push(`${rejections} rejections`);
    if (edits) summary.push(`${edits} edits`);
    
    return summary.join(', ');
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
            onClick={() => handleBulkReview(selectedProducts, 'approve')}
            disabled={selectedProducts.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <ThumbsUp className="h-4 w-4 mr-2" /> Approve Selected
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkReview(selectedProducts, 'reject')}
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
                <YouTubeSegmentPlayer
                  videoId={videoId}
                  startTime={0}
                  endTime={0} // 0 means play the whole video
                  autoplay={false}
                  loop={false}
                  className="w-full h-full"
                  isSourcePlayer={true}
                />
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
              onClick={() => handleBulkReview(selectedProducts, 'approve')}
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
                  } ${
                    pendingChanges[product.id] 
                      ? 'bg-purple-50/50' 
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
                          <YouTubeSegmentPlayer
                            videoId={videoId}
                            startTime={product.timestamp_start || 0}
                            endTime={product.timestamp_end || 0}
                            onClose={() => setActiveVideoProduct(null)}
                            autoplay={true}
                            loop={true}
                            className="w-full h-full"
                          />
                        ) : (
                          // Thumbnail view
                          <div 
                            className="w-full h-full cursor-pointer relative overflow-hidden"
                            onClick={() => setActiveVideoProduct(product.id)}
                          >
                            {/* Thumbnail image */}
                            <img 
                              src={product.thumbnail_url || `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                            
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                              <div className="h-14 w-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all transform hover:scale-110">
                                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1"></div>
                              </div>
                            </div>
                            
                            {/* Time indicators */}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {formatTime(product.timestamp_start || 0)}
                              </div>
                              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Duration: {formatDuration(product.timestamp_start || 0, product.timestamp_end || 0)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Status badge */}
                        <div className="absolute top-2 left-2 z-20">
                          <Badge
                            className={`${
                              getProductValue(product, 'status') === 'approved'
                                ? 'bg-green-500 hover:bg-green-600'
                                : getProductValue(product, 'status') === 'private'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-purple-500 hover:bg-purple-600'
                            } transition-colors ${
                              pendingChanges[product.id]?.status ? 'animate-pulse' : ''
                            }`}
                          >
                            {getProductValue(product, 'status') === 'draft' ? 'pending' : getProductValue(product, 'status')}
                            {pendingChanges[product.id]?.status && (
                              <span className="ml-1 text-xs">(was: {product.status})</span>
                            )}
                          </Badge>
                        </div>
                        
                        {/* Confidence score */}
                        <div className="absolute top-2 right-2 z-20">
                          <Badge variant="outline" className="bg-white/90 border-none">
                            {Math.round(product.confidence_score * 100)}% match
                          </Badge>
                        </div>
                        
                        {/* Checkbox for selection */}
                        <div className="absolute top-2 right-12 z-20">
                          <div className="h-6 w-6 bg-white/90 rounded-full flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer accent-purple-600"
                              checked={selectedProducts.includes(product.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleProductSelection(product.id);
                              }}
                            />
                          </div>
                        </div>

                        {/* Add this edit button */}
                        <div className="absolute top-2 right-12 z-20">
                          <button
                            className="h-6 w-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                          >
                            <Edit className="h-3 w-3 text-gray-700" />
                          </button>
                        </div>

                        {/* Show pending changes indicator if the product has changes */}
                        {pendingChanges[product.id] && (
                          <div className="absolute top-2 left-2 z-20">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              Edited
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {getProductValue(product, 'name')}
                        {pendingChanges[product.id]?.name && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Edited
                          </Badge>
                        )}
                      </CardTitle>
                      {getProductValue(product, 'price') && (
                        <CardDescription className="font-medium text-green-700">
                          ₹{getProductValue(product, 'price')?.toFixed(2)}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        {getProductValue(product, 'price') && (
                          <div className="text-sm">
                            Price: ₹{getProductValue(product, 'price')?.toFixed(2)}
                            {pendingChanges[product.id]?.price && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (was: ₹{product.price?.toFixed(2)})
                              </span>
                            )}
                          </div>
                        )}
                        
                        {getProductValue(product, 'description') && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {getProductValue(product, 'description')}
                            {pendingChanges[product.id]?.description && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {isMobile && activeTab === 'pending' && (
                        <div className="text-xs text-muted-foreground mt-2 text-center italic">
                          Swipe right to approve, left to reject
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="justify-center pt-0 pb-3">
                      {isMobile ? (
                        // For mobile, swipe instructions (actual swipe handling done above)
                        activeTab === 'pending' ? null : (
                          <Button
                            variant="outline"
                            onClick={() => handleProductReview(
                              product.id, 
                              getProductValue(product, 'status') === 'approved' ? 'reject' : 'approve'
                            )}
                            className="w-full"
                          >
                            {getProductValue(product, 'status') === 'approved' ? 'Change to Reject' : 'Change to Approve'}
                          </Button>
                        )
                      ) : (
                        // For desktop, improved buttons
                        activeTab === 'pending' ? (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                              onClick={() => handleProductReview(product.id, 'approve')}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            
                            <Button
                              variant="destructive"
                              onClick={() => handleProductReview(product.id, 'reject')}
                              className="transition-colors"
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => handleProductReview(
                              product.id, 
                              getProductValue(product, 'status') === 'approved' ? 'reject' : 'approve'
                            )}
                            className="w-full"
                          >
                            {getProductValue(product, 'status') === 'approved' ? 'Change to Reject' : 'Change to Approve'}
                          </Button>
                        )
                      )}
                    </CardFooter>
                  </div>
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
              onClick={() => handleBulkReview(selectedProducts, confirmAction === 'approve' ? 'approve' : 'reject')}
              disabled={selectedProducts.length === 0}
            >
              {confirmAction === 'approve' ? 'Approve Selected' : 'Reject Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {Object.keys(pendingChanges).length > 0 && (
        <PendingChangesBar
          changesCount={Object.keys(pendingChanges).length}
          changesSummary={getPendingChangesSummary()}
          onSave={handleSaveAllChanges}
          onDiscard={handleDiscardChanges}
        />
      )}
      
      <EditProductDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        product={currentEditProduct}
        pendingChanges={pendingChanges}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// New helper function to format duration
const formatDuration = (start: number, end: number): string => {
  const durationSeconds = Math.floor(end - start);
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export default ProductReview;