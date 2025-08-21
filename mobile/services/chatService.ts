import { io, Socket } from 'socket.io-client';
import apiService from './apiService';

export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: string;
  };
  bookingId: number;
}

export interface ChatRoom {
  id: number;
  bookingId: number;
  participants: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

class ChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];

  async connect(authToken: string): Promise<void> {
    try {
      this.socket = io('wss://alugae.mobi', {
        auth: {
          token: authToken
        },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to chat server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        this.isConnected = false;
      });

      this.socket.on('newMessage', (message: ChatMessage) => {
        this.messageCallbacks.forEach(callback => callback(message));
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      console.log('Chat service initialized with real WebSocket connection');
    } catch (error) {
      console.error('Error connecting to chat server:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await apiService.makeRequest<ChatRoom[]>('/chat/rooms');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  }

  async getMessages(bookingId: number, page = 1, limit = 50): Promise<ChatMessage[]> {
    try {
      const response = await apiService.makeRequest<ChatMessage[]>(`/chat/messages/${bookingId}?page=${page}&limit=${limit}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(bookingId: number, text: string): Promise<ChatMessage | null> {
    try {
      const response = await apiService.makeRequest<ChatMessage>('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
          text
        })
      });
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  joinRoom(bookingId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinRoom', { bookingId });
      console.log(`Joined room for booking ${bookingId}`);
    }
  }

  leaveRoom(bookingId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveRoom', { bookingId });
      console.log(`Left room for booking ${bookingId}`);
    }
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  offMessage(callback: (message: ChatMessage) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  async markAsRead(bookingId: number): Promise<void> {
    try {
      await apiService.makeRequest(`/chat/mark-read/${bookingId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default new ChatService();