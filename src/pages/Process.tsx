
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProcessVideoRequest, ProcessingResult } from '@/types/api';
import { Store } from '@/lib/store';
import StoreSelector from '@/components/StoreSelector';
import API_URL from '@/config/apiConfig';
import { getAuthHeaders } from '@/lib/auth';

const Process = () => {
  const navigate = useNavigate();
  const currentStore = Store.useStore();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [storeUrl, setStoreUrl] = useState(currentStore?.url || '');
  const [autoApprove, setAutoApprove] = useState(false);

  // Update store URL when current store changes
  React.useEffect(() => {
    if (currentStore) {
      setStoreUrl(currentStore.url);
    }
  }, [currentStore]);

  const processVideoMutation = useMutation({
    mutationFn: async (data: ProcessVideoRequest) => {
      console.log('Sending request:', data);
      const response = await fetch(`${API_URL}/process-video/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to process video');
      }
      
      return response.json() as Promise<ProcessingResult>;
    },
    onSuccess: (data) => {
      toast.success('Video has been submitted for processing');
      
      // Navigate to review page with parameters
      navigate(`/review?youtube_url=${encodeURIComponent(youtubeUrl)}&store_url=${encodeURIComponent(storeUrl)}`);
      
      // Reset form
      setYoutubeUrl('');
      setAutoApprove(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      toast.error('YouTube URL is required');
      return;
    }
    
    if (!storeUrl) {
      toast.error('Store URL is required');
      return;
    }
    
    processVideoMutation.mutate({
      youtube_url: youtubeUrl,
      store_url: storeUrl,
      auto_approve: autoApprove,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Process Video</h1>
        <StoreSelector />
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Submit a Video for Processing</CardTitle>
          <CardDescription>
            Enter a YouTube URL to extract products from the video
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input 
                id="youtube-url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store-url">Store URL</Label>
              <Input 
                id="store-url" 
                placeholder="https://your-store.com" 
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {currentStore ? 
                  `Using store: ${currentStore.name}` : 
                  'Select a store using the store selector or enter a store URL manually'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="auto-approve" 
                checked={autoApprove}
                onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
              />
              <Label htmlFor="auto-approve">Auto-approve products with high confidence</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={processVideoMutation.isPending}
            >
              {processVideoMutation.isPending ? 'Processing...' : 'Process Video'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select a store or enter a store URL</li>
            <li>Enter a YouTube URL of a video containing products</li>
            <li>Our AI will analyze the video and extract product information</li>
            <li>Review and approve the extracted products</li>
            <li>Products will be added to your store's collection</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default Process;
