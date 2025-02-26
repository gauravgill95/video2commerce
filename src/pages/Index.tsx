
import React from 'react';
import { Box, Youtube, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import type { Collection, DashboardStats } from '@/types/api';

const API_URL = 'http://bore.pub:58856';

// Helper function to create Authorization header
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + btoa('admin:password') // Replace with actual credentials
});

// API functions
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_URL}/dashboard/stats`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
};

const fetchRecentCollections = async (): Promise<Collection[]> => {
  const response = await fetch(`${API_URL}/collections?page=1&per_page=5`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch recent collections');
  }
  return response.json();
};

const fetchProcessingQueue = async (): Promise<Collection[]> => {
  const response = await fetch(`${API_URL}/processing-queue`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch processing queue');
  }
  return response.json();
};

const Index = () => {
  // Fetch dashboard stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    // Fallback data while loading or if there's an error
    placeholderData: {
      collections: { total: 0, trend: { value: 0, isPositive: true } },
      videos: { total: 0, trend: { value: 0, isPositive: true } },
      approved: { total: 0, trend: { value: 0, isPositive: true } },
      rejected: { total: 0, trend: { value: 0, isPositive: true } },
    }
  });

  // Fetch recent collections
  const { data: recentCollections } = useQuery({
    queryKey: ['recentCollections'],
    queryFn: fetchRecentCollections,
    placeholderData: [],
  });

  // Fetch processing queue
  const { data: processingQueue } = useQuery({
    queryKey: ['processingQueue'],
    queryFn: fetchProcessingQueue,
    placeholderData: [],
  });

  const stats = [
    {
      title: 'Total Collections',
      value: statsData?.collections.total.toString() || '0',
      icon: <Box size={24} />,
      trend: statsData?.collections.trend,
    },
    {
      title: 'Videos Processed',
      value: statsData?.videos.total.toString() || '0',
      icon: <Youtube size={24} />,
      trend: statsData?.videos.trend,
    },
    {
      title: 'Products Approved',
      value: statsData?.approved.total.toString() || '0',
      icon: <CheckCircle size={24} />,
      trend: statsData?.approved.trend,
    },
    {
      title: 'Products Rejected',
      value: statsData?.rejected.total.toString() || '0',
      icon: <XCircle size={24} />,
      trend: statsData?.rejected.trend,
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
          {recentCollections?.length ? (
            <div className="space-y-2">
              {recentCollections.map((collection) => (
                <div key={collection.id} className="p-2 border rounded">
                  <div className="flex justify-between items-center">
                    <span>{collection.name}</span>
                    <span className="text-sm text-gray-500">
                      {collection.total_products} products
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No collections yet</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Processing Queue</h2>
          {processingQueue?.length ? (
            <div className="space-y-2">
              {processingQueue.map((collection) => (
                <div key={collection.id} className="p-2 border rounded">
                  <div className="flex justify-between items-center">
                    <span>{collection.name}</span>
                    <span className="text-sm text-gray-500">Processing...</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No videos in queue</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
