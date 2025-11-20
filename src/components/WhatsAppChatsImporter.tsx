/**
 * Componente para importar conversas do WhatsApp Evolution API
 * Busca e exibe conversas do WhatsApp na aba Chat
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCw, MessageCircle, CheckCircle2 } from 'lucide-react';
import {
  fetchWhatsAppChats,
  fetchWhatsAppMessages,
  sendWhatsAppMessage,
  formatPhoneDisplay,
  extractMessageText,
  extractPhoneNumber,
} from '../utils/whatsappChatApi';

interface WhatsAppChat {
  id: string;
  name?: string;
  profilePictureUrl?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number;
  lastMessage?: {
    fromMe: boolean;
    message: string;
  };
}

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: any;
  messageTimestamp: number;
  pushName?: string;
  status?: string;
}

interface WhatsAppChatsImporterProps {
  onChatsLoaded?: (chats: any[]) => void;
  onMessagesLoaded?: (chatId: string, messages: any[]) => void;
}

export function WhatsAppChatsImporter({ onChatsLoaded, onMessagesLoaded }: WhatsAppChatsImporterProps) {
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  /**
   * Buscar conversas do WhatsApp
   */
  const handleImportChats = async () => {
    setLoading(true);
    
    try {
      console.log('🔄 Importando conversas do WhatsApp...');
      toast.info('📥 Importando conversas do WhatsApp...', { duration: 2000 });
      
      const whatsappChats = await fetchWhatsAppChats();
      
      console.log('✅ Conversas importadas:', whatsappChats.length);
      
      if (whatsappChats.length === 0) {
        toast.info('ℹ️ Nenhuma conversa encontrada no WhatsApp', {
          description: 'Verifique se o WhatsApp está conectado e possui conversas',
        });
        setImportedCount(0);
        return;
      }
      
      // Converter conversas do WhatsApp para o formato do sistema
      const convertedChats = whatsappChats.map((chat, index) => {
        // ✅ CORREÇÃO: Verificar se chat.id existe antes de processar
        if (!chat || !chat.id) {
          console.warn('⚠️ Conversa inválida encontrada (sem ID):', chat);
          return null;
        }
        
        const phoneNumber = extractPhoneNumber(chat.id);
        const displayPhone = formatPhoneDisplay(chat.id);
        
        return {
          id: `wa-${chat.id}`,
          guest_name: chat.name || displayPhone || 'Contato sem nome',
          guest_email: '',
          guest_phone: displayPhone || 'Número desconhecido',
          reservation_code: '',
          property_name: '',
          property_id: '',
          channel: 'whatsapp' as const,
          status: chat.unreadCount && chat.unreadCount > 0 ? 'unread' as const : 'read' as const,
          category: 'normal' as const,
          conversation_type: 'lead' as const,
          last_message: chat.lastMessage?.message || '',
          last_message_at: chat.lastMessageTimestamp 
            ? new Date(chat.lastMessageTimestamp * 1000)
            : new Date(),
          checkin_date: new Date(),
          checkout_date: new Date(),
          messages: [],
          order: index,
          isPinned: false,
          tags: [],
          whatsapp_chat_id: chat.id, // ID original do WhatsApp
          profile_picture_url: chat.profilePictureUrl,
          unread_count: chat.unreadCount || 0,
        };
      }).filter((chat): chat is NonNullable<typeof chat> => chat !== null); // ✅ CORREÇÃO: Filtrar nulls
      
      setChats(whatsappChats);
      setImportedCount(convertedChats.length);
      
      // Notificar componente pai
      if (onChatsLoaded) {
        onChatsLoaded(convertedChats);
      }
      
      toast.success(`✅ ${convertedChats.length} conversas importadas do WhatsApp!`, {
        description: 'As conversas agora aparecem na lista',
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao importar conversas:', error);
      
      // Não mostrar toast de erro, apenas log no console
      // O fetchWhatsAppChats já retorna array vazio em caso de erro
      console.warn('⚠️ WhatsApp não disponível no momento');
      setImportedCount(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Importar automaticamente ao montar
   */
  useEffect(() => {
    console.log('🔵 WhatsAppChatsImporter montado - iniciando importação em 1 segundo...');
    
    // Auto-import na primeira carga
    const timer = setTimeout(() => {
      console.log('⏰ Timer acionado - chamando handleImportChats...');
      handleImportChats();
    }, 1000);
    
    return () => {
      console.log('🔴 WhatsAppChatsImporter desmontado - limpando timer');
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-2 p-4 bg-green-50 border-b border-green-200">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            WhatsApp Evolution API
          </span>
          {importedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {importedCount} conversas
            </Badge>
          )}
        </div>
        {importedCount > 0 && (
          <p className="text-xs text-green-700 mt-1">
            Conversas sincronizadas e prontas para uso
          </p>
        )}
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={handleImportChats}
        disabled={loading}
        className="border-green-300 hover:bg-green-100"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            {importedCount > 0 ? 'Atualizar' : 'Importar Conversas'}
          </>
        )}
      </Button>
    </div>
  );
}