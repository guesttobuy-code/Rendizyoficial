/**
 * WhatsApp Chat API - Integração com Evolution API
 * Busca conversas e mensagens do WhatsApp para exibir no Chat
 */

import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a`;

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
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: any;
    videoMessage?: any;
    audioMessage?: any;
    documentMessage?: any;
  };
  messageTimestamp: number;
  pushName?: string;
  status?: string;
}

/**
 * Buscar todas as conversas do WhatsApp
 */
export async function fetchWhatsAppChats(): Promise<WhatsAppChat[]> {
  try {
    console.log('[WhatsApp Chat API] 📥 Buscando conversas...');
    console.log('[WhatsApp Chat API] 🌐 URL:', `${BASE_URL}/whatsapp/chats`);
    
    const response = await fetch(`${BASE_URL}/whatsapp/chats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    console.log('[WhatsApp Chat API] 📡 Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp Chat API] ❌ Erro ao buscar conversas:', error);
      console.error('[WhatsApp Chat API] ❌ Status:', response.status);
      
      // Se o backend não está disponível, retorna array vazio
      if (response.status === 404 || response.status === 500) {
        console.warn('[WhatsApp Chat API] ⚠️ Backend não disponível, retornando array vazio');
        return [];
      }
      
      throw new Error(`Erro ao buscar conversas: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('[WhatsApp Chat API] ✅ Conversas recebidas:', result.data?.length || 0);
    
    return result.data || [];
  } catch (error) {
    console.error('[WhatsApp Chat API] ❌ Erro:', error);
    // Retorna array vazio em caso de erro para não quebrar a UI
    return [];
  }
}

/**
 * Buscar mensagens de uma conversa específica
 */
export async function fetchWhatsAppMessages(chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
  try {
    console.log('[WhatsApp Chat API] 📥 Buscando mensagens do chat:', chatId);
    
    const response = await fetch(`${BASE_URL}/whatsapp/messages/${encodeURIComponent(chatId)}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp Chat API] ❌ Erro ao buscar mensagens:', error);
      throw new Error('Erro ao buscar mensagens do WhatsApp');
    }

    const result = await response.json();
    console.log('[WhatsApp Chat API] ✅ Mensagens recebidas:', result.data?.length || 0);
    
    return result.data || [];
  } catch (error) {
    console.error('[WhatsApp Chat API] ❌ Erro:', error);
    throw error;
  }
}

/**
 * Enviar mensagem de texto
 */
export async function sendWhatsAppMessage(number: string, text: string): Promise<any> {
  try {
    console.log('[WhatsApp Chat API] 📤 Enviando mensagem para:', number);
    
    const response = await fetch(`${BASE_URL}/whatsapp/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ number, text }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp Chat API] ❌ Erro ao enviar mensagem:', error);
      throw new Error('Erro ao enviar mensagem do WhatsApp');
    }

    const result = await response.json();
    console.log('[WhatsApp Chat API] ✅ Mensagem enviada com sucesso');
    
    return result.data;
  } catch (error) {
    console.error('[WhatsApp Chat API] ❌ Erro:', error);
    throw error;
  }
}

/**
 * Formatar número para o padrão WhatsApp (55DDDNÚMERO@s.whatsapp.net)
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tiver código do país, adiciona 55 (Brasil)
  const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  
  // Adiciona @s.whatsapp.net se não tiver
  return withCountry.includes('@') ? withCountry : `${withCountry}@s.whatsapp.net`;
}

/**
 * Extrair número limpo do formato WhatsApp
 */
export function extractPhoneNumber(whatsappId: string): string {
  // Remove @s.whatsapp.net ou @g.us
  return whatsappId.replace(/@.*/, '');
}

/**
 * Formatar número para exibição (+55 21 99999-9999)
 */
export function formatPhoneDisplay(whatsappId: string): string {
  const number = extractPhoneNumber(whatsappId);
  
  // Verifica se é número brasileiro (começa com 55)
  if (number.startsWith('55') && number.length >= 12) {
    const ddd = number.substring(2, 4);
    const firstPart = number.substring(4, number.length - 4);
    const lastPart = number.substring(number.length - 4);
    return `+55 ${ddd} ${firstPart}-${lastPart}`;
  }
  
  // Retorna com + na frente se não for Brasil
  return `+${number}`;
}

/**
 * Extrair texto da mensagem (suporta vários tipos)
 */
export function extractMessageText(message: WhatsAppMessage): string {
  if (message.message?.conversation) {
    return message.message.conversation;
  }
  
  if (message.message?.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text;
  }
  
  // Outros tipos de mensagem
  if (message.message?.imageMessage) {
    return '📷 Imagem';
  }
  
  if (message.message?.videoMessage) {
    return '🎥 Vídeo';
  }
  
  if (message.message?.audioMessage) {
    return '🎵 Áudio';
  }
  
  if (message.message?.documentMessage) {
    return '📄 Documento';
  }
  
  return '[Mensagem não suportada]';
}
