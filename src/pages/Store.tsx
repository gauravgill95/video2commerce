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
  const [youtubeLink, setYoutubeLink] = useState('');
  const [storeLink, setStoreLink] = useState('');
  const [showLinkInputs, setShowLinkInputs] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const currentStore = StoreLib.useStore();
  const storeUrl = currentStore?.url || '';
  const navigate = useNavigate();
  
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
  
  const handleReviewProduct = () => {
    if (!showLinkInputs) {
      setShowLinkInputs(true);
      return;
    }
    
    // Validate links
    if (!youtubeLink.trim()) {
      toast.error('Please enter a YouTube video link');
      return;
    }
    
    if (!storeLink.trim()) {
      toast.error('Please enter a store link');
      return;
    }
    
    // Navigate to review page with the links
    navigate('/review', { 
      state: { 
        youtubeLink, 
        storeLink,
        // Include any other necessary data
        productId: selectedProduct?.id,
        productName: selectedProduct?.name
      } 
    });
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setShowLinkInputs(false); // Reset link inputs when selecting a new product
  };
  
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

      {selectedProduct && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
          {showLinkInputs ? (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="youtubeLink" className="block text-sm font-medium text-gray-700">
                  YouTube Video Link
                </label>
                <input
                  type="text"
                  id="youtubeLink"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              
              <div>
                <label htmlFor="storeLink" className="block text-sm font-medium text-gray-700">
                  Store Link
                </label>
                <input
                  type="text"
                  id="storeLink"
                  value={storeLink}
                  onChange={(e) => setStoreLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://store.example.com/product/..."
                />
              </div>
              
              <button
                onClick={handleReviewProduct}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue to Review
              </button>
            </div>
          ) : (
            <button
              onClick={handleReviewProduct}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Review Product
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Store;
