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
      console.log('🔄 New message received via WebSocket:', data);
      
      // Invalidate all message-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    });

    return unsubscribe;
  }, [user, queryClient]);
}