import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
import imageService from './imageService';

export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

export interface ChatRoom {
  id: string;
  bookingId: number;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'renter';
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

class ChatService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private typingListeners: ((typing: TypingUser[]) => void)[] = [];
  private roomListeners: ((rooms: ChatRoom[]) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  // Initialize chat service
  async initialize(): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        console.warn('User not authenticated, cannot initialize chat');
        return;
      }

      await this.connect();
    } catch (error) {
      console.error('Error initializing chat service:', error);
    }
  }

  // Connect to WebSocket
  private async connect(): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io('https://alugae.mobi', {
        auth: {
          token,
        },
        transports: ['websocket'],
        timeout: 20000,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Error connecting to chat:', error);
      throw error;
    }
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat connection error:', error);
      this.notifyConnectionListeners(false);
    });

    // Message events
    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message);
      this.notifyMessageListeners(message);
    });

    this.socket.on('message_sent', (message: ChatMessage) => {
      console.log('Message sent confirmation:', message);
      this.notifyMessageListeners({ ...message, sent: true });
    });

    this.socket.on('message_delivered', (messageId: string) => {
      console.log('Message delivered:', messageId);
      // Update message status in UI
    });

    this.socket.on('message_read', (messageId: string) => {
      console.log('Message read:', messageId);
      // Update message status in UI
    });

    // Typing events
    this.socket.on('user_typing', (data: { userId: string; userName: string; roomId: string }) => {
      if (data.roomId === this.currentRoom) {
        console.log('User typing:', data);
        // Handle typing indicator
      }
    });

    this.socket.on('user_stopped_typing', (data: { userId: string; roomId: string }) => {
      if (data.roomId === this.currentRoom) {
        console.log('User stopped typing:', data);
        // Handle stop typing indicator
      }
    });

    // Room events
    this.socket.on('rooms_updated', (rooms: ChatRoom[]) => {
      console.log('Rooms updated:', rooms);
      this.notifyRoomListeners(rooms);
    });

    this.socket.on('room_created', (room: ChatRoom) => {
      console.log('New room created:', room);
      // Handle new room creation
    });
  }

  // Join a chat room
  async joinRoom(roomId: string): Promise<void> {
    try {
      if (!this.socket?.connected) {
        await this.connect();
      }

      if (this.currentRoom) {
        this.socket?.emit('leave_room', this.currentRoom);
      }

      this.currentRoom = roomId;
      this.socket?.emit('join_room', roomId);

      console.log('Joined room:', roomId);
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Leave current room
  leaveRoom(): void {
    if (this.currentRoom && this.socket?.connected) {
      this.socket.emit('leave_room', this.currentRoom);
      this.currentRoom = null;
    }
  }

  // Send text message
  async sendMessage(roomId: string, text: string): Promise<void> {
    try {
      if (!this.socket?.connected) {
        throw new Error('Not connected to chat server');
      }

      const message: Partial<ChatMessage> = {
        _id: `temp_${Date.now()}`,
        text,
        createdAt: new Date(),
        user: {
          _id: authService.getCurrentUser()?.id.toString() || '',
          name: authService.getCurrentUser()?.name || '',
          avatar: authService.getCurrentUser()?.profileImage,
        },
        pending: true,
      };

      // Add message to UI immediately (optimistic update)
      this.notifyMessageListeners(message as ChatMessage);

      // Send to server
      this.socket.emit('send_message', {
        roomId,
        text,
        type: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send image message
  async sendImage(roomId: string, imageUri: string): Promise<void> {
    try {
      if (!this.socket?.connected) {
        throw new Error('Not connected to chat server');
      }

      // Compress and upload image
      const imageResult = await imageService.processImage(imageUri, {
        compress: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      const uploadedUrl = await imageService.uploadImage({
        uri: imageResult.uri,
        width: imageResult.width,
        height: imageResult.height,
        fileSize: 0,
        fileName: `chat_image_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      }, 'chat');

      const message: Partial<ChatMessage> = {
        _id: `temp_${Date.now()}`,
        text: '',
        image: uploadedUrl,
        createdAt: new Date(),
        user: {
          _id: authService.getCurrentUser()?.id.toString() || '',
          name: authService.getCurrentUser()?.name || '',
          avatar: authService.getCurrentUser()?.profileImage,
        },
        pending: true,
      };

      // Add message to UI immediately
      this.notifyMessageListeners(message as ChatMessage);

      // Send to server
      this.socket.emit('send_message', {
        roomId,
        image: uploadedUrl,
        type: 'image',
      });
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }

  // Send typing indicator
  sendTyping(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { roomId });
    }
  }

  // Send stop typing indicator
  sendStopTyping(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { roomId });
    }
  }

  // Mark messages as read
  async markMessagesAsRead(roomId: string, messageIds: string[]): Promise<void> {
    try {
      if (!this.socket?.connected) {
        return;
      }

      this.socket.emit('mark_read', {
        roomId,
        messageIds,
      });

      // Also update on backend
      const token = authService.getToken();
      if (token) {
        await fetch('https://alugae.mobi/api/chat/mark-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId,
            messageIds,
          }),
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get chat rooms
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('https://alugae.mobi/api/chat/rooms', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar salas de chat');
      }

      const data = await response.json();
      return data.rooms || [];
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  }

  // Get messages for a room
  async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `https://alugae.mobi/api/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar mensagens');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Create or get chat room for booking
  async getOrCreateBookingRoom(bookingId: number): Promise<ChatRoom> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('https://alugae.mobi/api/chat/booking-room', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar/buscar sala de chat');
      }

      const data = await response.json();
      return data.room;
    } catch (error) {
      console.error('Error getting/creating booking room:', error);
      throw error;
    }
  }

  // Add message listener
  addMessageListener(listener: (message: ChatMessage) => void): void {
    this.messageListeners.push(listener);
  }

  // Remove message listener
  removeMessageListener(listener: (message: ChatMessage) => void): void {
    const index = this.messageListeners.indexOf(listener);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  // Add typing listener
  addTypingListener(listener: (typing: TypingUser[]) => void): void {
    this.typingListeners.push(listener);
  }

  // Remove typing listener
  removeTypingListener(listener: (typing: TypingUser[]) => void): void {
    const index = this.typingListeners.indexOf(listener);
    if (index > -1) {
      this.typingListeners.splice(index, 1);
    }
  }

  // Add room listener
  addRoomListener(listener: (rooms: ChatRoom[]) => void): void {
    this.roomListeners.push(listener);
  }

  // Remove room listener
  removeRoomListener(listener: (rooms: ChatRoom[]) => void): void {
    const index = this.roomListeners.indexOf(listener);
    if (index > -1) {
      this.roomListeners.splice(index, 1);
    }
  }

  // Add connection listener
  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  // Remove connection listener
  removeConnectionListener(listener: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(listener);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  // Notify message listeners
  private notifyMessageListeners(message: ChatMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  // Notify typing listeners
  private notifyTypingListeners(typing: TypingUser[]): void {
    this.typingListeners.forEach(listener => listener(typing));
  }

  // Notify room listeners
  private notifyRoomListeners(rooms: ChatRoom[]): void {
    this.roomListeners.forEach(listener => listener(rooms));
  }

  // Notify connection listeners
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current room
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
    }
  }

  // Cleanup
  cleanup(): void {
    this.disconnect();
    this.messageListeners = [];
    this.typingListeners = [];
    this.roomListeners = [];
    this.connectionListeners = [];
  }
}

export default new ChatService();