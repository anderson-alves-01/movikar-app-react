import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Bot,
  MessageSquare,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportChatProps {
  trigger?: React.ReactNode;
}

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  messages?: SupportMessage[];
}

interface SupportMessage {
  id: number;
  ticketId: number;
  senderId: number;
  message: string;
  isAdminResponse: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'booking_issue', label: 'Problema com Reserva' },
  { value: 'payment_problem', label: 'Problema de Pagamento' },
  { value: 'vehicle_issue', label: 'Problema com Veículo' },
  { value: 'account_help', label: 'Ajuda com Conta' },
  { value: 'general', label: 'Ajuda Geral' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

export default function SupportChat({ trigger }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
    enabled: isAuthenticated && isOpen,
    refetchInterval: 30000, // Refetch every 30 seconds when chat is open
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/support/tickets', selectedTicket?.id, 'messages'],
    enabled: !!selectedTicket,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time chat
  });

  // Create new ticket
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: typeof newTicketForm) => 
      apiRequest('POST', '/api/support/tickets', ticketData),
    onSuccess: (newTicket) => {
      toast({
        title: "Ticket Criado",
        description: "Sua solicitação foi enviada. Responderemos em breve!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setSelectedTicket(newTicket);
      setView('chat');
      setNewTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Criar Ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { ticketId: number; message: string }) =>
      apiRequest('POST', `/api/support/tickets/${messageData.ticketId}/messages`, {
        message: messageData.message,
      }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ 
        queryKey: ['/api/support/tickets', selectedTicket?.id, 'messages'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Enviar Mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = () => {
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o assunto e a descrição.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(newTicketForm);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    sendMessageMutation.mutate({
      ticketId: selectedTicket.id,
      message: newMessage.trim(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  if (!isAuthenticated) {
    return null;
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow z-50"
      data-testid="button-open-support-chat"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>
              {view === 'list' ? 'Suporte & Ajuda' :
               view === 'new' ? 'Nova Solicitação' :
               `Chat - ${selectedTicket?.subject}`}
            </span>
          </DialogTitle>
          {view === 'chat' && (
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(selectedTicket?.status || '')}>
                {getStatusLabel(selectedTicket?.status || '')}
              </Badge>
              <Badge className={getPriorityInfo(selectedTicket?.priority || '').color}>
                {getPriorityInfo(selectedTicket?.priority || '').label}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Tickets List View */}
          {view === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Suas solicitações de suporte
                </p>
                <Button onClick={() => setView('new')} size="sm">
                  Nova Solicitação
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>Carregando...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhuma solicitação ainda</p>
                    <p className="text-xs">Clique em "Nova Solicitação" para começar</p>
                  </div>
                ) : (
                  tickets.map((ticket: SupportTicket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setView('chat');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                          <Badge className={getStatusColor(ticket.status)} size="sm">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {ticket.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES.find(c => c.value === ticket.category)?.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* New Ticket Form */}
          {view === 'new' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Nova Solicitação</h3>
                <Button variant="ghost" size="sm" onClick={() => setView('list')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    placeholder="Descreva brevemente seu problema"
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-support-subject"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      className="w-full p-2 border rounded-md"
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <select
                      id="priority"
                      className="w-full p-2 border rounded-md"
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      {PRIORITIES.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição Detalhada *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Descreva seu problema em detalhes. Inclua passos para reproduzir o erro, mensagens de erro, etc."
                    value={newTicketForm.description}
                    onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="textarea-support-description"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setView('list')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={createTicketMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-support-ticket"
                  >
                    {createTicketMutation.isPending ? 'Enviando...' : 'Criar Solicitação'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chat View */}
          {view === 'chat' && selectedTicket && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="sm" onClick={() => setView('list')}>
                  ← Voltar
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-80">
                {messages.map((message: SupportMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : message.isAdminResponse
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.senderId === user?.id ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.senderId === user?.id ? 'Você' : 'Suporte'}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-support-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {selectedTicket.status === 'closed' && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Esta solicitação foi encerrada. Para novos problemas, crie uma nova solicitação.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}