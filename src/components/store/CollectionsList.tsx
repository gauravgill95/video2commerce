
import React from 'react';
import { Collection } from '@/types/api';
import CollectionCard from './CollectionCard';
import Pagination from './Pagination';

interface CollectionsListProps {
  collections: Collection[];
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

const CollectionsList: React.FC<CollectionsListProps> = ({
  collections,
  isLoading,
  error,
  pagination,
  setPage,
}) => {
  if (isLoading) {
    return <div className="text-center py-10">Loading collections...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        Error loading collections. Please try again.
      </div>
    );
  }
  
  if (collections.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No collections found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
      
      {pagination && pagination.pages > 1 && (
        <Pagination 
          currentPage={pagination.current_page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.per_page}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default CollectionsList;
