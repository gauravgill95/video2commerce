
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Store as StoreType } from '@/types/api';
import { Loader2, Store as StoreIcon } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

import API_URL from '@/config/apiConfig';

const fetchStoreDetails = async (storeUrl: string): Promise<StoreType> => {
  if (!storeUrl) throw new Error('Store URL is required');
  
  const response = await fetch(`${API_URL}/api/v1/store/details?store_url=${encodeURIComponent(storeUrl)}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch store details');
  }
  
  return response.json();
};

const fetchMyStore = async (): Promise<StoreType> => {
  const response = await fetch(`${API_URL}/api/v1/store/my-store`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch your store');
  }
  
  return response.json();
};

interface StoreSelectorProps {
  onStoreChange?: (store: StoreType) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ onStoreChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const currentStore = Store.useStore();
  
  // Query for getting the current user's store
  const { data: myStore } = useQuery({
    queryKey: ['myStore'],
    queryFn: fetchMyStore,
    enabled: false, // We'll manually trigger this
  });
  
  // Query for getting any store details by URL
  const { data: storeDetails, isLoading, error, refetch } = useQuery({
    queryKey: ['storeDetails', storeUrl],
    queryFn: () => fetchStoreDetails(storeUrl),
    enabled: false, // Don't fetch automatically
  });
  
  const validateStore = async () => {
    if (!storeUrl) {
      setValidationError('Store URL is required');
      return;
    }
    
    setIsValidating(true);
    setValidationError('');
    
    try {
      const result = await refetch();
      if (result.data) {
        // Convert new API format to the expected format for backward compatibility
        const formattedStore: StoreType = {
          ...result.data,
          name: result.data.store_title,
          url: result.data.store_url,
          total_collections: result.data.collections_count
        };
        
        Store.setStore(formattedStore);
        if (onStoreChange) {
          onStoreChange(formattedStore);
        }
        setIsOpen(false);
        toast({
          title: 'Store Connected',
          description: `Successfully connected to ${formattedStore.store_title}`,
        });
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to connect to store');
    } finally {
      setIsValidating(false);
    }
  };
  
  const recentStores = Store.getRecentStores();
  
  const selectRecentStore = async (store: StoreType) => {
    setStoreUrl(store.store_url || store.url);
    Store.setStore(store);
    if (onStoreChange) {
      onStoreChange(store);
    }
    setIsOpen(false);
    toast({
      title: 'Store Selected',
      description: `Switched to ${store.store_title || store.name}`,
    });
  };
  
  const loadMyStore = async () => {
    setIsValidating(true);
    try {
      const myStoreData = await fetchMyStore();
      
      // Convert to expected format for backward compatibility
      const formattedStore: StoreType = {
        ...myStoreData,
        name: myStoreData.store_title,
        url: myStoreData.store_url,
        total_collections: myStoreData.collections_count
      };
      
      Store.setStore(formattedStore);
      if (onStoreChange) {
        onStoreChange(formattedStore);
      }
      setIsOpen(false);
      toast({
        title: 'Store Connected',
        description: `Connected to your store: ${formattedStore.store_title}`,
      });
    } catch (error) {
      setValidationError('Failed to load your store');
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple hover-purple">
          <StoreIcon className="h-4 w-4" />
          {currentStore ? (currentStore.store_title || currentStore.name) : 'Select Store'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Store</DialogTitle>
          <DialogDescription>
            Enter your store URL to connect and manage your collections.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button 
            onClick={loadMyStore} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <StoreIcon className="mr-2 h-4 w-4" />
            )}
            Load My Store
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or connect to another store</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="store-url">Store URL</Label>
            <Input
              id="store-url"
              placeholder="https://your-store.cataloghub.in"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className="border-purple"
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>
          
          {recentStores.length > 0 && (
            <div className="space-y-2">
              <Label>Recent Stores</Label>
              <div className="space-y-2">
                {recentStores.map((store, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-2 border-purple hover-purple"
                    onClick={() => selectRecentStore(store)}
                  >
                    <StoreIcon className="h-4 w-4" />
                    {store.store_title || store.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {storeDetails && (
            <div className="rounded-md border p-4 border-purple-100">
              <h4 className="font-medium">{storeDetails.store_title}</h4>
              <p className="text-sm text-muted-foreground">{storeDetails.store_url}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Collections</p>
                  <p className="font-medium">{storeDetails.collections_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Products</p>
                  <p className="font-medium">{storeDetails.total_products}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={validateStore} disabled={isValidating} className="bg-purple-600 hover:bg-purple-700">
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Store'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSelector;
