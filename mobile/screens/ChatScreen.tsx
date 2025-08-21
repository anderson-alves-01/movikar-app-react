import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useRoute, useNavigation } from '@react-navigation/native';
import chatService, { ChatMessage } from '../services/chatService';
import authService from '../services/authService';

interface RouteParams {
  bookingId: number;
  partnerName: string;
}

// Placeholder GiftedChat component until dependency is resolved
const GiftedChat = ({ messages, onSend, user }: any) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Chat Interface</Text>
    <Text style={styles.placeholderSubtext}>
      Chat functionality will be available once dependencies are resolved
    </Text>
  </View>
);

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, partnerName } = route.params as RouteParams;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: `Chat com ${partnerName}`,
    });
  }, [navigation, partnerName]);

  useEffect(() => {
    initializeChat();
    return () => {
      chatService.leaveRoom(bookingId);
    };
  }, [bookingId]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser({
          _id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.profileImage,
        });
      }

      // Connect to chat if not connected
      if (!chatService.getConnectionStatus()) {
        const token = await authService.getToken();
        if (token) {
          await chatService.connect(token);
        }
      }

      // Join the chat room
      chatService.joinRoom(bookingId);

      // Load chat history
      const chatHistory = await chatService.getMessages(bookingId);
      const formattedMessages = chatHistory.map(convertToGiftedChatMessage);
      setMessages(formattedMessages.reverse());

      // Listen for new messages
      chatService.onMessage(handleNewMessage);

      // Mark messages as read
      await chatService.markAsRead(bookingId);

    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar o chat. Tente novamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const convertToGiftedChatMessage = (message: ChatMessage): any => {
    return {
      _id: message._id,
      text: message.text,
      createdAt: new Date(message.createdAt),
      user: {
        _id: message.user._id,
        name: message.user.name,
        avatar: message.user.avatar,
      },
    };
  };

  const handleNewMessage = (message: ChatMessage) => {
    const giftedMessage = convertToGiftedChatMessage(message);
    setMessages(previousMessages => 
      // GiftedChat.append(previousMessages, [giftedMessage])
      [giftedMessage, ...previousMessages] // Placeholder implementation
    );
  };

  const onSend = useCallback(async (messages: any[] = []) => {
    if (messages.length === 0) return;

    const message = messages[0];
    
    try {
      // Send message via API
      const sentMessage = await chatService.sendMessage(bookingId, message.text);
      
      if (sentMessage) {
        // Message will be received via socket and added to the chat
        // So we don't need to manually add it here
      } else {
        Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={user}
        placeholder="Digite sua mensagem..."
        showUserAvatar
        alwaysShowSend
        scrollToBottom
        renderUsernameOnMessage
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});