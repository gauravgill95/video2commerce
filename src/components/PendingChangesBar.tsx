import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface PendingChangesBarProps {
  changesCount: number;
  onSave: () => void;
  onDiscard: () => void;
}

export function PendingChangesBar({ changesCount, onSave, onDiscard }: PendingChangesBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom">
      <div className="text-sm">
        <span className="font-medium">{changesCount} changes pending</span>
        <p className="text-muted-foreground text-xs">Review and save your changes</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onDiscard}>
          <X className="h-4 w-4 mr-1" />
          Discard
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-1" />
          Save All
        </Button>
      </div>
    </div>
  );
} 