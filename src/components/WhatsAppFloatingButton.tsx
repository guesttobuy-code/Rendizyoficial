/**
 * RENDIZY - Botão Flutuante WhatsApp IA Evolution
 * 
 * Botão fixo no canto inferior direito com:
 * - Animação de pulso
 * - Tooltip "Atendimento via IA"
 * - Modal de chat ao clicar
 * - Integração completa com Evolution API
 * 
 * @version 1.0.103.84
 * @date 2025-10-30
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { evolutionService } from '../utils/services/evolutionService';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WhatsAppFloatingButton() {
  const organizationId = 'org_default'; // TODO: Get from context/props
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // VERIFICAR CONEXÃO AO ABRIR
  // ============================================================================

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      checkConnectionAndSendWelcome();
    }
  }, [isOpen]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkConnectionAndSendWelcome = async () => {
    setIsCheckingConnection(true);
    try {
      // ✅ Passar organization_id para o serviço
      const status = await evolutionService.getStatus(organizationId);
      setIsConnected(status === 'CONNECTED');

      if (status === 'CONNECTED') {
        // Mensagem de boas-vindas
        setMessages([
          {
            id: '1',
            text: 'Olá! Bem-vindo à RENDIZY 👋\n\nSou a IA de atendimento. Como posso ajudar você hoje?',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages([
          {
            id: '1',
            text: 'WhatsApp está desconectado. Por favor, configure a integração em Configurações → Integrações.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao verificar conexão:', error);
      setIsConnected(false);
      setMessages([
        {
          id: '1',
          text: 'Não foi possível conectar ao WhatsApp. Verifique as configurações.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // ============================================================================
  // ENVIAR MENSAGEM
  // ============================================================================

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    if (!isConnected) {
      toast.error('WhatsApp desconectado', {
        description: 'Configure a integração primeiro.',
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      // Enviar para Evolution API
      // Nota: Aqui você deve ter um número de destino (ex: número da empresa)
      // Para um chat genérico, pode enviar para um número configurado
      const recipientNumber = '+5511999999999'; // TODO: Configurar em settings
      
      await evolutionService.sendMessage(recipientNumber, inputText);

      // Atualizar status da mensagem
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Simular resposta da IA (em produção, viria de webhook/backend)
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Obrigado pela sua mensagem! Nossa equipe entrará em contato em breve. 🚀',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);

      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('[WhatsApp] Erro ao enviar:', error);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );

      toast.error('Erro ao enviar mensagem', {
        description: 'Tente novamente.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Atendimento via IA
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>

        {/* Botão */}
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="size-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 animate-pulse hover:animate-none relative overflow-hidden"
        >
          <MessageCircle className="size-7 text-white" />
          
          {/* Indicador de status */}
          {isConnected && (
            <span className="absolute top-1 right-1 size-3 bg-white rounded-full border-2 border-green-500" />
          )}
        </Button>
      </div>

      {/* Modal de Chat */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-white/30">
                  <AvatarFallback className="bg-white/20 text-white">
                    <Bot className="size-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-white text-xl">
                    RENDIZY IA
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={isConnected ? 'default' : 'secondary'}
                      className={
                        isConnected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-red-500/20 text-white border-red-300/30'
                      }
                    >
                      <span
                        className={`size-2 rounded-full mr-1 ${
                          isConnected ? 'bg-green-300' : 'bg-red-300'
                        }`}
                      />
                      {isConnected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isCheckingConnection ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback
                          className={
                            message.sender === 'user'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }
                        >
                          {message.sender === 'user' ? (
                            <User className="size-4" />
                          ) : (
                            <Bot className="size-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {message.sender === 'user' && message.status === 'sending' && (
                            <Loader2 className="size-3 animate-spin opacity-70" />
                          )}
                          {message.sender === 'user' && message.status === 'sent' && (
                            <span className="text-xs opacity-70">✓</span>
                          )}
                          {message.sender === 'user' && message.status === 'error' && (
                            <span className="text-xs text-red-300">✗</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending || !isConnected}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !inputText.trim() || !isConnected}
                className="bg-green-500 hover:bg-green-600"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            {!isConnected && (
              <p className="text-xs text-muted-foreground mt-2">
                WhatsApp desconectado. Configure em Integrações.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WhatsAppFloatingButton;
