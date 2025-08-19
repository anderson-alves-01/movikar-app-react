import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteScrollOptions {
  queryKey: string[];
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<{
    vehicles: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
      totalPages: number;
    };
  }>;
  enabled?: boolean;
  initialPageParam?: number;
}

export function useInfiniteScroll({
  queryKey,
  queryFn,
  enabled = true,
  initialPageParam = 1,
}: UseInfiniteScrollOptions) {
  const [isNearBottom, setIsNearBottom] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    enabled,
    initialPageParam,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
  });

  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Trigger when user is 200px from bottom
    const threshold = 200;
    const nearBottom = scrollTop + windowHeight >= documentHeight - threshold;
    
    setIsNearBottom(nearBottom);
    
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Flatten all pages data
  const vehicles = data?.pages.flatMap(page => page.vehicles) ?? [];
  const totalCount = data?.pages[0]?.pagination?.total ?? 0;

  return {
    vehicles,
    totalCount,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    isNearBottom,
    fetchNextPage,
  };
}