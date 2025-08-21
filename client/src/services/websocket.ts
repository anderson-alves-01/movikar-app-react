import { useAuthStore } from "@/lib/auth";

export type WebSocketMessage = {
  type: 'new_message' | 'authenticated' | 'error' | 'pong';
  message?: any;
  userId?: number;
  error?: string;
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private reconnectTimeout: number | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private pingInterval: number | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for current connection attempt
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          } else {
            reject(new Error('Connection failed'));
          }
        }, 1000);
        return;
      }

      this.isConnecting = true;

      try {
        // For development, always use the current host
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.isConnecting = false;
          
          // Authenticate with JWT token
          const authState = useAuthStore.getState();
          if (authState.token) {
            this.send({
              type: 'authenticate',
              token: authState.token
            });
          }

          // Start ping interval to keep connection alive
          this.startPing();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            
            // Handle authentication confirmation
            if (message.type === 'authenticated') {
              console.log('✅ WebSocket authenticated for user:', message.userId);
            }
            
            // Special handling for new messages
            if (message.type === 'new_message') {
              console.log('🔔 NEW MESSAGE EVENT detected:', message);
            }
            
            // Call registered handlers for this message type
            const handlers = this.messageHandlers.get(message.type);
            if (handlers && handlers.size > 0) {
              console.log(`📢 Calling ${handlers.size} handlers for message type: ${message.type}`);
              handlers.forEach(handler => {
                try {
                  handler(message);
                } catch (handlerError) {
                  console.error('Error in message handler:', handlerError);
                }
              });
            } else {
              console.log(`⚠️ No handlers registered for message type: ${message.type}`);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          this.isConnecting = false;
          this.stopPing();
          
          // Attempt to reconnect after 3 seconds
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
          }
          this.reconnectTimeout = window.setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            this.connect().catch(console.error);
          }, 3000);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.messageHandlers.clear();
    console.log('🔌 WebSocket disconnected manually');
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message not sent:', data);
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return cleanup function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  private startPing() {
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when user is authenticated
useAuthStore.subscribe((state) => {
  if (state.user && state.token && !websocketService.isConnected()) {
    websocketService.connect().catch(console.error);
  } else if (!state.user && websocketService.isConnected()) {
    websocketService.disconnect();
  }
});