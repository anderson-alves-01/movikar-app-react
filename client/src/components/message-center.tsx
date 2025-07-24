import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, User, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageCenterProps {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  bookingId?: number;
}

export default function MessageCenter({ 
  otherUserId, 
  otherUserName, 
  otherUserAvatar, 
  bookingId 
}: MessageCenterProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages', { userId: otherUserId, bookingId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: otherUserId.toString(),
      });
      if (bookingId) {
        params.append('bookingId', bookingId.toString());
      }
      
      const response = await fetch(`/api/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('/api/messages', 'POST', {
        receiverId: otherUserId,
        content,
        bookingId,
      });
      return response;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', { userId: otherUserId, bookingId }] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/messages/read', 'PUT', {
        senderId: otherUserId,
      });
      return response;
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Faça login para ver as mensagens</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-lg">{otherUserName}</span>
        </CardTitle>
      </CardHeader>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Carregando mensagens...</div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message: any, index: number) => {
              const isFromUser = message.senderId === user.id;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isFromUser
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isFromUser ? 'text-red-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Nenhuma mensagem ainda. Inicie a conversa!
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
