/**
 * RENDIZY - WhatsApp Conversation Component
 * 
 * Componente melhorado para exibir e enviar mensagens do WhatsApp
 * 
 * @version v1.0.104.001
 * @date 2025-11-21
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Loader2, 
  Check, 
  CheckCheck, 
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner';
import { 
  fetchWhatsAppMessages, 
  sendWhatsAppMessage,
  extractMessageText,
  formatPhoneDisplay,
  formatWhatsAppNumber
} from '../utils/whatsappChatApi';
import { uploadChatAttachment } from '../utils/whatsappChatApi';
import { QuickActionsModal } from './QuickActionsModal';
import { QuotationModal } from './QuotationModal';
import { CreateReservationWizard } from './CreateReservationWizard';
import { TemplateManagerModal, MessageTemplate } from './TemplateManagerModal';
import { LocalContact } from '../utils/services/evolutionContactsService';

interface WhatsAppConversationProps {
  contact: LocalContact;
}

interface MessageDisplay {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
}

export function WhatsAppConversation({ contact }: WhatsAppConversationProps) {
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Buscar mensagens do chat
   */
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      // Formatar chatId do contato
      const chatId = formatWhatsAppNumber(contact.phone);
      console.log('[WhatsAppConversation] 📥 Buscando mensagens do chat:', chatId);
      
      const whatsappMessages = await fetchWhatsAppMessages(chatId, 100);
      
      // Converter mensagens do WhatsApp para formato de exibição
      const formattedMessages: MessageDisplay[] = whatsappMessages.map((msg) => ({
        id: msg.key.id || `${msg.messageTimestamp}-${Math.random()}`,
        text: extractMessageText(msg),
        fromMe: msg.key.fromMe || false,
        timestamp: new Date(msg.messageTimestamp * 1000),
        status: msg.status as any || 'sent',
        type: msg.message?.imageMessage ? 'image' : 
              msg.message?.videoMessage ? 'video' :
              msg.message?.audioMessage ? 'audio' :
              msg.message?.documentMessage ? 'document' : 'text'
      }));

      // Ordenar por timestamp (mais antigas primeiro)
      formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      // Filtrar mensagens de mock/boas-vindas fixas (ex.: 'Bem-vindo', 'Mensagem Fixa')
      const filtered = formattedMessages.filter(m => {
        const t = (m.text || '').toLowerCase();
        if (!t) return true;
        if (t.includes('bem-vindo') || t.includes('mensagem fixa') || t.includes('boas-vindas')) return false;
        return true;
      });

      setMessages(filtered);
      console.log('[WhatsAppConversation] ✅', formattedMessages.length, 'mensagens carregadas');
    } catch (error) {
      console.error('[WhatsAppConversation] ❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * Enviar mensagem
   */
  const handleSendMessage = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
      // Adicionar mensagem otimista (aparece imediatamente)
      const optimisticMessage: MessageDisplay = {
        id: `temp-${Date.now()}`,
        text: messageText,
        fromMe: true,
        timestamp: new Date(),
        status: 'pending'
      };
      setMessages((prev: MessageDisplay[]) => [...prev, optimisticMessage]);

    try {
      // Formatar número do contato
      const phoneNumber = formatWhatsAppNumber(contact.phone);
      console.log('[WhatsAppConversation] 📤 Enviando mensagem para:', phoneNumber);
      
      // If there are attachments, upload them first and collect URLs
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        setIsUploading(true);
        // Determine propertyId fallback - try to use contact.id or 'external'
        const propertyIdFallback = contact.id || 'external';
        const uploadPromises = attachments.map((file) =>
          // uploadChatAttachment is defined in utils
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          uploadChatAttachment(file, propertyIdFallback, 'chat')
        );

        const uploadResults = await Promise.all(uploadPromises);
        const failed = uploadResults.filter(r => !r.success);
        if (failed.length > 0) {
          console.error('[WhatsAppConversation] Alguns uploads falharam', failed);
          toast.error('Erro ao enviar anexos. Tente novamente.');
          // restore attachments and abort send
          setIsSending(false);
          setIsUploading(false);
          return;
        }

        attachmentUrls = uploadResults.map(r => r.url!).filter(Boolean);
        setIsUploading(false);
      }

      const result = await sendWhatsAppMessage(phoneNumber, messageText, {
        isInternal: isInternalNote,
        attachments: attachmentUrls,
      });
      
      // Atualizar mensagem otimista com dados reais
      setMessages((prev: MessageDisplay[]) => prev.map((msg: MessageDisplay) => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: result.id || msg.id, status: 'sent' as const }
          : msg
      ));
      
      toast.success('Mensagem enviada');
      
      // Recarregar mensagens após 1 segundo para pegar a versão do servidor
      setTimeout(() => {
        loadMessages();
      }, 1000);
    } catch (error) {
      console.error('[WhatsAppConversation] ❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remover mensagem otimista em caso de erro
      setMessages((prev: MessageDisplay[]) => prev.filter((msg: MessageDisplay) => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
      // reset attachments and internal note after send
      setAttachments([]);
      setIsInternalNote(false);
    }
  };

  /**
   * Scroll automático para última mensagem
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load saved templates from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rendizy_chat_templates');
      if (saved) {
        const parsed = JSON.parse(saved) as MessageTemplate[];
        // normalize dates
        const normalized = parsed.map((t) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at) : new Date(),
          updated_at: t.updated_at ? new Date(t.updated_at) : new Date(),
        }));
        setTemplates(normalized);
      }
    } catch (e) {
      console.warn('Erro ao carregar templates do localStorage', e);
      setTemplates([]);
    }
  }, []);

  /**
   * Carregar mensagens ao montar e quando contato mudar
   */
  useEffect(() => {
    if (contact) {
      loadMessages();
      
      // Atualizar mensagens a cada 10 segundos
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [contact.id]);

  /**
   * Formatar timestamp
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  /**
   * Obter ícone de status
   */
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'error':
        return <span className="text-red-500 text-xs">!</span>;
      default:
        return null;
    }
  };

  /**
   * Obter iniciais do contato
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={contact.profilePicUrl} alt={contact.name} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              {contact.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {contact.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatPhoneDisplay(contact.phone)}</span>
                {contact.isOnline && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 dark:text-green-400">Online</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowQuickActions(true)}>
              Ações
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      <QuickActionsModal
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onSelectAction={(action) => {
          setShowQuickActions(false);
          if (action === 'quote') {
            // Need property/date context to open full QuotationModal
            if (!contact) {
              toast.error('Selecione uma conversa com propriedade antes de fazer uma cotação');
              return;
            }
            setShowQuotation(true);
          }
          if (action === 'reservation') {
            if (!contact) {
              toast.error('Selecione uma conversa com propriedade antes de criar reserva');
              return;
            }
            setShowCreateReservation(true);
          }
          // other actions handled elsewhere
        }}
      />

      <QuotationModal
        isOpen={showQuotation}
        onClose={() => setShowQuotation(false)}
        // no property context here — require user to select inside modal
        property={undefined as any}
        startDate={new Date()}
        endDate={new Date(new Date().getTime() + 1000 * 60 * 60 * 24)}
      />

      <CreateReservationWizard
        open={showCreateReservation}
        onClose={() => setShowCreateReservation(false)}
        onComplete={() => {
          setShowCreateReservation(false);
          toast.success('Reserva criada');
        }}
      />

      {/* Mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
            <p className="text-sm text-center max-w-xs">
              Inicie uma conversa com {contact.name}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: MessageDisplay, index: number) => {
              const showDate = index === 0 || 
                messages[index - 1].timestamp.toDateString() !== message.timestamp.toDateString();
              
              return (
                <div key={message.id}>
                  {/* Data separadora */}
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {message.timestamp.toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                  )}
                  
                  {/* Mensagem */}
                  <div className={`flex gap-2 ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
                    {!message.fromMe && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={contact.profilePicUrl} alt={contact.name} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col max-w-[70%] ${message.fromMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.fromMe
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                      
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${message.fromMe ? 'flex-row-reverse' : ''}`}>
                        <span>{formatTimestamp(message.timestamp)}</span>
                        {message.fromMe && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input de mensagem */}
      <div className="border-t bg-white dark:bg-gray-800 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => { /* emoji picker placeholder */ }}>
              <Smile className="w-5 h-5" />
            </Button>

            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}>
                Templates
              </Button>
              {showTemplatesDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 border rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Nenhum template</div>
                  ) : (
                    templates.map((t) => (
                      <button
                        key={t.id}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          // insert template at cursor (append for simplicity)
                          const newText = `${inputText}${inputText ? '\n\n' : ''}${t.content}`;
                          setInputText(newText);
                          setShowTemplatesDropdown(false);
                        }}
                      >
                        <div className="font-medium text-sm">{t.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-2">{t.content}</div>
                      </button>
                    ))
                  )}
                  <div className="p-2 border-t flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowTemplateManager(true)}>Gerenciar</Button>
                    <Button variant="link" size="sm" onClick={() => { setShowTemplatesDropdown(false); }}>Fechar</Button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                const valid = Array.from(files);
                setAttachments((prev) => [...prev, ...valid]);
                // reset input so same file can be selected again
                e.currentTarget.value = '';
              }}
            />

            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-5 h-5" />
            </Button>
            {isUploading && (
              <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">Enviando anexos...</div>
            )}

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="internal-note" checked={isInternalNote} onCheckedChange={(v: any) => setIsInternalNote(!!v)} />
                <Label htmlFor="internal-note" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Nota interna</Label>
              </div>
            </div>
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((f, idx) => (
                <div key={`${f.name}-${idx}`} className="p-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center gap-2">
                  <div className="text-xs max-w-xs truncate">{f.name}</div>
                  <Button variant="ghost" size="icon" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}>
                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                className="pr-12"
                disabled={isSending}
                rows={2}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && attachments.length === 0) || isSending}
              size="icon"
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <TemplateManagerModal
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        onSaveTemplate={(t) => {
          // upsert
          setTemplates((prev) => {
            const found = prev.find((p) => p.id === t.id);
            const updated = found ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev];
            localStorage.setItem('rendizy_chat_templates', JSON.stringify(updated));
            return updated;
          });
        }}
        onDeleteTemplate={(id) => {
          setTemplates((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            localStorage.setItem('rendizy_chat_templates', JSON.stringify(updated));
            return updated;
          });
        }}
      />
    </div>
  );
}

