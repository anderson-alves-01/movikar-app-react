import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import chatService, { ChatMessage, ChatRoom } from '../services/chatService';
import imageService from '../services/imageService';
import authService from '../services/authService';

type RootStackParamList = {
  Chat: { roomId: string; bookingId?: number };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

export default function ChatScreen({ navigation, route }: Props) {
  const { roomId, bookingId } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      cleanup();
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Initialize chat service
      await chatService.initialize();

      // Set up listeners
      chatService.addMessageListener(handleNewMessage);
      chatService.addConnectionListener(handleConnectionChange);

      // Get or create room if bookingId is provided
      if (bookingId) {
        const chatRoom = await chatService.getOrCreateBookingRoom(bookingId);
        setRoom(chatRoom);
        await chatService.joinRoom(chatRoom.id);
      } else {
        await chatService.joinRoom(roomId);
      }

      // Load messages
      await loadMessages();
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Erro', 'Erro ao carregar o chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const currentRoomId = room?.id || roomId;
      const chatMessages = await chatService.getMessages(currentRoomId);
      
      // Convert to GiftedChat format
      const giftedMessages = chatMessages.map(convertToGiftedMessage);
      setMessages(giftedMessages);

      // Mark messages as read
      const messageIds = chatMessages.map(msg => msg._id);
      await chatService.markMessagesAsRead(currentRoomId, messageIds);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const convertToGiftedMessage = (chatMessage: ChatMessage): IMessage => {
    return {
      _id: chatMessage._id,
      text: chatMessage.text,
      createdAt: new Date(chatMessage.createdAt),
      user: {
        _id: chatMessage.user._id,
        name: chatMessage.user.name,
        avatar: chatMessage.user.avatar,
      },
      image: chatMessage.image,
      video: chatMessage.video,
      audio: chatMessage.audio,
      system: chatMessage.system,
      sent: chatMessage.sent,
      received: chatMessage.received,
      pending: chatMessage.pending,
    };
  };

  const handleNewMessage = useCallback((message: ChatMessage) => {
    const giftedMessage = convertToGiftedMessage(message);
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [giftedMessage])
    );
  }, []);

  const handleConnectionChange = useCallback((isConnected: boolean) => {
    setConnected(isConnected);
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const message = newMessages[0];
    const currentRoomId = room?.id || roomId;

    try {
      // Add message optimistically
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, newMessages)
      );

      // Send through chat service
      await chatService.sendMessage(currentRoomId, message.text);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Erro ao enviar mensagem');
    }
  }, [room, roomId]);

  const handleImagePicker = async () => {
    try {
      const imageResult = await imageService.showImagePickerOptions({
        allowsEditing: true,
        quality: 0.8,
      });

      if (imageResult) {
        const currentRoomId = room?.id || roomId;
        await chatService.sendImage(currentRoomId, imageResult.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Erro ao enviar imagem');
    }
  };

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
          },
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
          left: {
            color: '#333',
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#007AFF" />
        </View>
      </Send>
    );
  };

  const renderActions = () => {
    return (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleImagePicker}
      >
        <Ionicons name="camera" size={24} color="#007AFF" />
      </TouchableOpacity>
    );
  };

  const cleanup = () => {
    chatService.removeMessageListener(handleNewMessage);
    chatService.removeConnectionListener(handleConnectionChange);
    chatService.leaveRoom();
  };

  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro: Usuário não autenticado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {room?.participants.find(p => p.id !== currentUser.id.toString())?.name || 'Chat'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#FF5722' }]} />
            <Text style={styles.statusText}>
              {connected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: currentUser.id.toString(),
          name: currentUser.name,
          avatar: currentUser.profileImage,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderActions={renderActions}
        alwaysShowSend
        showUserAvatar
        isTyping={typing}
        placeholder="Digite uma mensagem..."
        isLoadingEarlier={loading}
        listViewProps={{
          style: styles.messagesList,
        }}
        textInputProps={{
          multiline: true,
          maxLength: 1000,
          onChangeText: (text) => {
            if (text.length > 0) {
              chatService.sendTyping(room?.id || roomId);
            } else {
              chatService.sendStopTyping(room?.id || roomId);
            }
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    backgroundColor: '#f8f9fa',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    width: 36,
    height: 36,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 8,
    width: 36,
    height: 36,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
  },
});