import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Users, Car, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

interface MessageTemplate {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
  sentCount?: number;
}

interface MessageHistory {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  recipientCount: number;
  sentAt: string;
  status: 'sent' | 'failed' | 'sending';
}

export default function AdminMessagesPage() {
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const { toast } = useToast();

  // Fetch message history
  const { data: messageHistory = [], refetch: refetchHistory } = useQuery<MessageHistory[]>({
    queryKey: ['/api/admin/message-history'],
  });

  // Fetch user statistics for preview
  const { data: userStats } = useQuery({
    queryKey: ['/api/admin/user-stats'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      targetAudience: string;
      sendPushNotification: boolean;
      sendEmail: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/admin/send-bulk-message', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Build detailed success message
      let description = `Total de usuários: ${data.recipientCount}`;
      
      if (data.pushNotifications) {
        description += `\n📱 Push: ${data.pushNotifications.sent}/${data.pushNotifications.total} enviadas`;
      }
      
      if (data.emails) {
        description += `\n📧 Email: ${data.emails.sent}/${data.emails.total} enviados`;
      }
      
      if (data.errors && data.errors.length > 0) {
        description += `\n⚠️ ${data.errors.length} erros encontrados`;
      }

      toast({
        title: "Mensagem enviada!",
        description: description,
      });
      setMessageTitle("");
      setMessageContent("");
      setTargetAudience("all");
      setSendPushNotification(true);
      setSendEmail(false);
      refetchHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    sendMessageMutation.mutate({
      title: messageTitle,
      content: messageContent,
      targetAudience,
      sendPushNotification,
      sendEmail,
    });
    setIsSending(false);
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'owners':
        return 'Proprietários';
      case 'renters':
        return 'Locatários';
      case 'both':
        return 'Proprietários e Locatários';
      case 'all':
        return 'Todos os usuários';
      default:
        return audience;
    }
  };

  const getAudienceCount = () => {
    if (!userStats) return 0;
    
    switch (targetAudience) {
      case 'owners':
        return userStats.ownersCount || 0;
      case 'renters':
        return userStats.rentersCount || 0;
      case 'both':
        return (userStats.ownersCount || 0) + (userStats.rentersCount || 0) - (userStats.bothCount || 0);
      case 'all':
        return userStats.totalUsers || 0;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Enviada</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-800">Enviando</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensagens em Massa</h1>
          <p className="text-muted-foreground">
            Envie mensagens para grupos específicos de usuários
          </p>
        </div>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nova Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Título da Mensagem
              </label>
              <Input
                placeholder="Ex: Novidades na plataforma alugae.mobi"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                data-testid="input-message-title"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Público-alvo
              </label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger data-testid="select-target-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="owners">Apenas proprietários</SelectItem>
                  <SelectItem value="renters">Apenas locatários</SelectItem>
                  <SelectItem value="both">Proprietários e locatários</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {getAudienceCount()} usuários serão notificados
              </p>
            </div>

            {/* Message Content */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Conteúdo da Mensagem
              </label>
              <Textarea
                placeholder="Digite o conteúdo da mensagem aqui..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={6}
                data-testid="textarea-message-content"
              />
            </div>

            {/* Delivery Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Opções de Entrega
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push-notification"
                    checked={sendPushNotification}
                    onCheckedChange={setSendPushNotification}
                    data-testid="checkbox-push-notification"
                  />
                  <label htmlFor="push-notification" className="text-sm">
                    Enviar notificação push (mobile)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                    data-testid="checkbox-email"
                  />
                  <label htmlFor="email" className="text-sm">
                    Enviar por email
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewMode && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>Título:</strong> {messageTitle}</div>
                    <div><strong>Público:</strong> {getAudienceLabel(targetAudience)}</div>
                    <div><strong>Destinatários:</strong> {getAudienceCount()} usuários</div>
                    <div><strong>Conteúdo:</strong></div>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      {messageContent}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                data-testid="button-preview"
              >
                {previewMode ? "Ocultar" : "Visualizar"} Prévia
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !messageTitle.trim() || !messageContent.trim()}
                className="flex items-center gap-2"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
                {isSending ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Público-alvo</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Envio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma mensagem enviada ainda
                      </TableCell>
                    </TableRow>
                  ) : (
                    messageHistory.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">
                          {message.title}
                        </TableCell>
                        <TableCell>
                          {getAudienceLabel(message.targetAudience)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {message.recipientCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(message.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(message.sentAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold">{userStats.totalUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Proprietários</p>
                    <p className="text-2xl font-bold">{userStats.ownersCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Locatários</p>
                    <p className="text-2xl font-bold">{userStats.rentersCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Verificados</p>
                    <p className="text-2xl font-bold">{userStats.verifiedCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}