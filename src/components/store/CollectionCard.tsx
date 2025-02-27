
import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Collection } from '@/types/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CollectionCardProps {
  collection: Collection;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
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
    <Card className="overflow-hidden border-purple-100 hover:shadow-md transition-shadow duration-200">
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
              <h3 className="text-xl font-semibold text-gray-900">{collection.name}</h3>
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
          <Button variant="ghost" size="icon" className="hover-purple">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t px-6 py-4 bg-purple-50/30">
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
  );
};

export default CollectionCard;
