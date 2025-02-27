
import React from 'react';
import StoreSelector from '@/components/StoreSelector';

const StoreEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">No Store Selected</h1>
      <p className="text-muted-foreground">Please select a store to manage collections</p>
      <StoreSelector />
    </div>
  );
};

export default StoreEmptyState;
