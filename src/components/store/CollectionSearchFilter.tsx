
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CollectionSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const CollectionSearchFilter: React.FC<CollectionSearchFilterProps> = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          className="pl-8 border-purple"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] border-purple">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="products">Product Count</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-purple hover-purple">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
    </div>
  );
};

export default CollectionSearchFilter;
