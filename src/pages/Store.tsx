
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CollectionsList, Collection } from '@/types/api';
import { Box, Youtube, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Store as StoreLib } from '@/lib/store';
import API_URL from '@/config/apiConfig';
import { getAuthHeaders } from '@/lib/auth';

// Import the refactored components
import StoreHeader from '@/components/store/StoreHeader';
import StoreEmptyState from '@/components/store/StoreEmptyState';
import CollectionSearchFilter from '@/components/store/CollectionSearchFilter';
import CollectionTabs from '@/components/store/CollectionTabs';

// Helper function to fetch store collections
const fetchStoreCollections = async (storeUrl: string, page = 1, perPage = 20): Promise<CollectionsList> => {
  if (!storeUrl) {
    return { 
      collections: [], 
      pagination: { total: 0, pages: 0, current_page: 1, per_page: perPage } 
    };
  }
  
  const response = await fetch(
    `${API_URL}/store/collections?store_url=${encodeURIComponent(storeUrl)}&page=${page}&per_page=${perPage}`, 
    { headers: getAuthHeaders() }
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
  const [perPage] = useState(20);
  
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
  
  if (!currentStore) {
    return <StoreEmptyState />;
  }
  
  const stats = [
    {
      title: 'Total Collections',
      value: currentStore?.total_collections?.toString() ?? '0',
      icon: <Box size={24} />,
    },
    {
      title: 'Total Products',
      value: currentStore?.total_products?.toString() ?? '0',
      icon: <Box size={24} />,
    },
    {
      title: 'Videos Processed',
      value: currentStore?.processing_stats?.videos_processed?.toString() ?? '0',
      icon: <Youtube size={24} />,
    },
    {
      title: 'Pending Reviews',
      value: currentStore?.processing_stats?.pending_reviews?.toString() ?? '0',
      icon: <Clock size={24} />,
    },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <StoreHeader store={currentStore} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <CollectionSearchFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <CollectionTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filteredCollections={filteredCollections}
        isLoading={isLoading}
        error={error as Error}
        pagination={data?.pagination}
        setPage={setPage}
      />
    </div>
  );
};

export default Store;
