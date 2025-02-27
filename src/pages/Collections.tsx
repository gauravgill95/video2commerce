import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronRight, Calendar } from 'lucide-react';
import type { Collection } from '@/types/api';
import { Store } from '@/lib/store';
import StoreSelector from '@/components/StoreSelector';

import API_URL from '@/config/apiConfig';

// Helper function to create Authorization header
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + btoa('admin:password') // Replace with actual credentials
});

const fetchCollections = async (storeUrl?: string): Promise<Collection[]> => {
  // If no store URL is provided, throw an error
  if (!storeUrl) {
    throw new Error('Store URL is required to fetch collections');
  }

  // Fetch collections for the provided store URL
  const response = await fetch(`${API_URL}/store/collections?store_url=${encodeURIComponent(storeUrl)}`, {
    headers: getHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch store collections');
  }
  
  const data = await response.json();
  return data.collections;
};

const Collections = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const currentStore = Store.useStore();
  const storeUrl = currentStore?.url;

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections', storeUrl],
    queryFn: () => fetchCollections(storeUrl),
    placeholderData: [],
  });

  // Filter collections based on search term and active tab
  const filteredCollections = collections?.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'with-products') return matchesSearch && collection.total_products > 0;
    if (activeTab === 'empty') return matchesSearch && collection.total_products === 0;
    
    return matchesSearch;
  });

  const getStatusBadge = (collection: Collection) => {
    if (collection.total_products === 0) {
      return <Badge variant="outline">Empty</Badge>;
    }
    
    const approvalRate = collection.approved_products / collection.total_products;
    
    if (approvalRate === 1) {
      return <Badge className="bg-success">Complete</Badge>;
    } else if (collection.draft_products > 0) {
      return <Badge className="bg-warning">In Review</Badge>;
    } else {
      return <Badge>Processed</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {currentStore ? `${currentStore.name} Collections` : 'All Collections'}
        </h1>
        <div className="flex gap-2">
          <StoreSelector />
          <Button>New Collection</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Collections</TabsTrigger>
          <TabsTrigger value="with-products">With Products</TabsTrigger>
          <TabsTrigger value="empty">Empty</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-10">Loading collections...</div>
          ) : filteredCollections?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No collections found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCollections?.map((collection) => (
                <Card key={collection.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        {collection.thumbnail && (
                          <div className="h-16 w-24 rounded overflow-hidden bg-muted">
                            <img 
                              src={collection.thumbnail} 
                              alt={collection.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-xl">{collection.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(collection)}
                            <span className="text-sm text-muted-foreground">
                              {collection.total_products} products
                            </span>
                            {collection.last_updated && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(collection.last_updated)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t px-6 py-4 bg-muted/50">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Approved</p>
                          <p className="font-medium">{collection.approved_products}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">In Review</p>
                          <p className="font-medium">{collection.draft_products}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rejected</p>
                          <p className="font-medium">{collection.rejected_products}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Collections;