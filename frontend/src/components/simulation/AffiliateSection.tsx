import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { AffiliateBroker } from '@/types/affiliate';
import { AffiliateBrokerCard } from './AffiliateBrokerCard';
import { Skeleton } from '@/components/ui/skeleton';

export const AffiliateSection: React.FC = () => {
  const { data: brokers, isLoading, error } = useQuery<AffiliateBroker[]>({
    queryKey: ['affiliate-recommendations'],
    queryFn: () => fetchApi<AffiliateBroker[]>('/api/affiliates/recommendations'),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Recommended Brokers for Your Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !brokers || brokers.length === 0) {
    return null;
  }

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recommended Brokers for Your Portfolio</h2>
        <p className="text-muted-foreground mt-1">
          Open an account with these brokers to start implementing your investment strategy.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brokers.map((broker) => (
          <AffiliateBrokerCard key={broker.id} broker={broker} />
        ))}
      </div>
    </div>
  );
};
