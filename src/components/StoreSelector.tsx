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

import API_URL from '@/config/apiConfig';

// Helper function to create Authorization header
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + btoa('admin:password') // Replace with actual credentials
});

const fetchStoreDetails = async (storeUrl: string): Promise<StoreType> => {
  if (!storeUrl) throw new Error('Store URL is required');
  
  const response = await fetch(`${API_URL}/store/details?store_url=${encodeURIComponent(storeUrl)}`, {
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch store details');
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
        Store.setStore(result.data);
        if (onStoreChange) {
          onStoreChange(result.data);
        }
        setIsOpen(false);
        toast({
          title: 'Store Connected',
          description: `Successfully connected to ${result.data.name}`,
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
    setStoreUrl(store.url);
    Store.setStore(store);
    if (onStoreChange) {
      onStoreChange(store);
    }
    setIsOpen(false);
    toast({
      title: 'Store Selected',
      description: `Switched to ${store.name}`,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <StoreIcon className="h-4 w-4" />
          {currentStore ? currentStore.name : 'Select Store'}
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
          <div className="space-y-2">
            <Label htmlFor="store-url">Store URL</Label>
            <Input
              id="store-url"
              placeholder="https://your-store.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
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
                    className="w-full justify-start gap-2"
                    onClick={() => selectRecentStore(store)}
                  >
                    <StoreIcon className="h-4 w-4" />
                    {store.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {storeDetails && (
            <div className="rounded-md border p-4">
              <h4 className="font-medium">{storeDetails.name}</h4>
              <p className="text-sm text-muted-foreground">{storeDetails.url}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Collections</p>
                  <p className="font-medium">{storeDetails.total_collections}</p>
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
          <Button onClick={validateStore} disabled={isValidating}>
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