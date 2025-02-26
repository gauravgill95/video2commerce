
import React from 'react';
import { Box, Youtube, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Card } from '@/components/ui/card';

const Index = () => {
  const stats = [
    {
      title: 'Total Collections',
      value: '24',
      icon: <Box size={24} />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Videos Processed',
      value: '156',
      icon: <Youtube size={24} />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Products Approved',
      value: '1,234',
      icon: <CheckCircle size={24} />,
      trend: { value: 5, isPositive: true },
    },
    {
      title: 'Products Rejected',
      value: '89',
      icon: <XCircle size={24} />,
      trend: { value: 2, isPositive: false },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Collections</h2>
          <p className="text-gray-500">No collections yet</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Processing Queue</h2>
          <p className="text-gray-500">No videos in queue</p>
        </Card>
      </div>
    </div>
  );
};

export default Index;
