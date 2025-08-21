import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '@/services/websocket';
import { useAuthStore } from '@/lib/auth';

export function useWebSocketConnection() {
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (user) {
      websocketService.connect().catch(console.error);
    } else {
      websocketService.disconnect();
    }
  }, [user]);

  return websocketService;
}

export function useWebSocketMessages() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.onMessage('new_message', (data) => {
      console.log('🔄 Global WebSocket message handler - New message received:', data);
      
      if (data.message) {
        // Invalidate specific message queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages'],
          exact: false
        });
        
        // Invalidate conversations list
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations'],
          exact: true
        });

        // Force refetch all active queries
        queryClient.refetchQueries({ 
          queryKey: ['/api/messages'],
          type: 'active'
        });

        console.log('✅ Cache invalidated and queries refetched for new message');
      }
    });

    return unsubscribe;
  }, [user, queryClient]);
}