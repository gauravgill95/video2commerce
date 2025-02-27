
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {
          Math.min(currentPage * itemsPerPage, totalItems)
        } of {totalItems} collections
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="border-purple hover-purple"
        >
          Previous
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="border-purple hover-purple"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
