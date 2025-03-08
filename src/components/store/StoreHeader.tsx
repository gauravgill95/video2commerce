
import React from 'react';
import { Store } from '@/types/api';
import StoreSelector from '@/components/StoreSelector';

interface StoreHeaderProps {
  store: Store | null;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ store }) => {
  if (!store) return null;
  
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{store.name || store.store_title}</h1>
        <p className="text-muted-foreground">{store.url || store.store_url}</p>
      </div>
      <StoreSelector />
    </div>
  );
};

export default StoreHeader;
