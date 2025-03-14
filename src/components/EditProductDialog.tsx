import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProductReviewResponse, ProductUpdate } from '@/types/api';

interface EditProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductReviewResponse | null;
  pendingChanges: Record<string, ProductUpdate>;
  onSave: (updates: { name?: string; price?: number; description?: string }) => void;
}

export function EditProductDialog({ open, onClose, product, pendingChanges, onSave }: EditProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    if (product) {
      const pendingChange = pendingChanges[product.id];
      setFormData({
        name: pendingChange?.name || product.name || '',
        price: (pendingChange?.price?.toString() || product.price?.toString() || ''),
        description: pendingChange?.description || product.description || ''
      });
    }
  }, [product, pendingChanges]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      description: formData.description || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Edit Product
            {product && pendingChanges[product.id] && (
              <span className="ml-2 text-xs text-muted-foreground">(Has pending changes)</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            {product && pendingChanges[product.id]?.name && (
              <p className="text-xs text-muted-foreground">
                Original: {product.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            />
            {product && pendingChanges[product.id]?.price && (
              <p className="text-xs text-muted-foreground">
                Original: ₹{product.price?.toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            {product && pendingChanges[product.id]?.description && (
              <p className="text-xs text-muted-foreground">
                Original: {product.description}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 