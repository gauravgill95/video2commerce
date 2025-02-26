
import React from 'react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <p className={`text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
