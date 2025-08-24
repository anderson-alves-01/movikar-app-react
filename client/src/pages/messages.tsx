import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, User, Clock, Car } from "lucide-react";
import Header from "@/components/header";
import MessageCenter from "@/components/message-center";
import { useWebSocketConnection, useWebSocketMessages } from "@/hooks/use-websocket";

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromUser: boolean;
  };
  unreadCount: number;
  booking?: {
    id: number;
    vehicle: {
      brand: string;
      model: string;
      year: number;
    };
  };
}

export default function Messages() {
  const { user } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Setup WebSocket connection and real-time message handling
  useWebSocketConnection();
  useWebSocketMessages();

  // Check for URL parameters to start a conversation
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('userId');
  const urlBookingId = urlParams.get('bookingId');
  const urlUserName = urlParams.get('userName');

  // If URL params exist, set up the conversation
  const directConversation = urlUserId ? {
    id: parseInt(urlUserId),
    otherUser: {
      id: parseInt(urlUserId),
      name: urlUserName || 'Usuário',
    },
    lastMessage: {
      content: 'Nova conversa iniciada',
      createdAt: new Date().toISOString(),
      isFromUser: false,
    },
    unreadCount: 0,
    booking: urlBookingId ? {
      id: parseInt(urlBookingId),
      vehicle: { brand: '', model: '', year: 0 }
    } : undefined
  } : null;

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user && !directConversation, // Enable only if user exists and no direct conversation
  });

  // Auto-select direct conversation if coming from URL params
  useEffect(() => {
    if (directConversation && !selectedConversation) {
      setSelectedConversation(directConversation);
    }
  }, [directConversation, selectedConversation]);

  const filteredConversations = conversations?.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) { // 7 dias
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
              <p className="text-gray-600">Faça login para ver suas mensagens.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-4 sm:pb-8">
        <div className="max-w-7xl mx-auto mobile-padding">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Mensagens</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-200px)] sm:h-[600px]">
            {/* Lista de Conversas */}
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Conversas
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-0">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-600">Carregando conversas...</div>
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={conversation.otherUser.avatar} />
                              <AvatarFallback>
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.otherUser.name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conversation.lastMessage.createdAt)}
                                  </span>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {conversation.booking && (
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Car className="h-3 w-3 mr-1" />
                                  {conversation.booking.vehicle.brand} {conversation.booking.vehicle.model}
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.lastMessage.isFromUser && "Você: "}
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm 
                          ? "Tente buscar por outro nome" 
                          : "Suas conversas aparecerão aqui quando você começar a falar com outros usuários."
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Área de Mensagens */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <MessageCenter
                  otherUserId={selectedConversation.otherUser.id}
                  otherUserName={selectedConversation.otherUser.name}
                  otherUserAvatar={selectedConversation.otherUser.avatar}
                  bookingId={selectedConversation.booking?.id || (urlBookingId ? parseInt(urlBookingId) : undefined)}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-gray-600">
                      Escolha uma conversa da lista para começar a trocar mensagens.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}