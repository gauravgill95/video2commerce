import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronRight, Calendar, ArrowUpDown } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Store as StoreLib } from '@/lib/store';
import { StoreCollectionsResponse, Collection } from '@/types/api';
import StoreSelector from '@/components/StoreSelector';

import API_URL from '@/config/apiConfig';

// Helper function to create Authorization header
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + btoa('admin:password') // Replace with actual credentials
});

const fetchStoreCollections = async (storeUrl: string, page = 1, perPage = 20): Promise<StoreCollectionsResponse> => {
  if (!storeUrl) {
    return { collections: [], pagination: { total: 0, pages: 0, current_page: 1, per_page: perPage } };
  }
  
  const response = await fetch(
    `${API_URL}/store/collections?store_url=${encodeURIComponent(storeUrl)}&page=${page}&per_page=${perPage}`, 
    { headers: getHeaders() }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch store collections');
  }
  
  return response.json();
};

const Store = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  const currentStore = StoreLib.useStore();
  const storeUrl = currentStore?.url || '';
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['storeCollections', storeUrl, page, perPage, sortBy],
    queryFn: () => fetchStoreCollections(storeUrl, page, perPage),
    enabled: !!storeUrl,
  });
  
  // Filter collections based on search term and active tab
  const filteredCollections = data?.collections?.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'with-products') return matchesSearch && collection.total_products > 0;
    if (activeTab === 'empty') return matchesSearch && collection.total_products === 0;
    
    return matchesSearch;
  }) || [];
  
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
  
  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">No Store Selected</h1>
        <p className="text-muted-foreground">Please select a store to manage collections</p>
        <StoreSelector />
      </div>
    );
  }
  
  const stats = [
    {
      title: 'Total Collections',
      value: currentStore.total_collections.toString(),
      icon: <Box size={24} />,
    },
    {
      title: 'Total Products',
      value: currentStore.total_products.toString(),
      icon: <Box size={24} />,
    },
    {
      title: 'Videos Processed',
      value: currentStore.processing_stats.videos_processed.toString(),
      icon: <Youtube size={24} />,
    },
    {
      title: 'Pending Reviews',
      value: currentStore.processing_stats.pending_reviews.toString(),
      icon: <Clock size={24} />,
    },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{currentStore.name}</h1>
          <p className="text-muted-foreground">{currentStore.url}</p>
        </div>
        <StoreSelector />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="products">Product Count</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
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
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              Error loading collections. Please try again.
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No collections found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCollections.map((collection) => (
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
          
          {data && data.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(data.pagination.current_page - 1) * data.pagination.per_page + 1} to {
                  Math.min(data.pagination.current_page * data.pagination.per_page, data.pagination.total)
                } of {data.pagination.total} collections
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={data.pagination.current_page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={data.pagination.current_page === data.pagination.pages}
                  onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Store;

// Import the Box, Youtube, and Clock icons
import { Box, Youtube, Clock } from 'lucide-react';