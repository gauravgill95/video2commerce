
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collection } from '@/types/api';
import CollectionsList from './CollectionsList';

interface CollectionTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  filteredCollections: Collection[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
  } | undefined;
  setPage: (page: number) => void;
}

const CollectionTabs: React.FC<CollectionTabsProps> = ({
  activeTab,
  setActiveTab,
  filteredCollections,
  isLoading,
  error,
  pagination,
  setPage,
}) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
      <TabsList className="bg-purple-100/50 text-purple-900">
        <TabsTrigger value="all" className="data-[state=active]:bg-white">All Collections</TabsTrigger>
        <TabsTrigger value="with-products" className="data-[state=active]:bg-white">With Products</TabsTrigger>
        <TabsTrigger value="empty" className="data-[state=active]:bg-white">Empty</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-6">
        <CollectionsList 
          collections={filteredCollections}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          setPage={setPage}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CollectionTabs;
