/**
 * RENDIZY - Chat Inbox Unificado Completo
 * 
 * Chat centralizador de conversas de todas as fontes com sistema Kanban completo:
 * - WhatsApp (Evolution API)
 * - Airbnb
 * - Booking.com
 * - SMS
 * - Site (chat interno)
 * - Email
 * 
 * Funcionalidades:
 * - ✅ Sistema Kanban (Fixadas, Urgentes, Normais, Resolvidas)
 * - ✅ Sistema de Pin (máx 5)
 * - ✅ RES-ID e propriedade nos cards
 * - ✅ Tags personalizadas
 * - ✅ Seleção múltipla
 * - ✅ Ícones de canal
 * - ✅ Cores por categoria/status/canal
 * - ✅ Header completo (check-in/check-out, link HÓSPEDE, botão Bloqueio)
 * 
 * @version v1.0.104.003
 * @date 2025-11-22
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pin, 
  Zap, 
  MessageCircle, 
  CheckCircle2, 
  Circle,
  Home,
  Building2,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Search,
  Loader2,
  Lock,
  Calendar,
  User,
  Tag as TagIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox as UICheckbox } from './ui/checkbox';
import { ChatFilterSidebar } from './ChatFilterSidebar';
import { WhatsAppConversation } from './WhatsAppConversation';
import { QuickActionsModal } from './QuickActionsModal';
import { QuotationModal } from './QuotationModal';
import { CreateReservationWizard } from './CreateReservationWizard';
import { BlockModal } from './BlockModal';
import { TemplateManagerModal } from './TemplateManagerModal';
import { ChatTagsModal, ChatTag } from './ChatTagsModal';
import { CreateTicketModal } from './crm/CreateTicketModal';
import { funnelsApi } from '../utils/api';
import { Funnel } from '../types/funnels';
import { ServiceTicket } from '../types/funnels';
import { useAuth } from '../contexts/AuthContext';
import { 
  Conversation, 
  chatApi, 
  ChatTag as ChatTagType 
} from '../utils/chatApi';
import { 
  getEvolutionContactsService, 
  LocalContact 
} from '../utils/services/evolutionContactsService';
import { Property } from '../App';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhoneDisplay, extractPhoneNumber } from '../utils/whatsappChatApi';

// ============================================
// TYPES
// ============================================

interface UnifiedConversation {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  channel: 'whatsapp' | 'airbnb' | 'booking' | 'sms' | 'email' | 'site' | 'system';
  status: 'unread' | 'read' | 'resolved';
  category: 'pinned' | 'urgent' | 'normal' | 'resolved';
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isOnline?: boolean;
  reservationCode?: string;
  propertyName?: string;
  propertyId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  tags?: string[];
  isPinned?: boolean;
  conversationType?: 'guest' | 'lead';
  // Dados originais
  conversation?: Conversation;
  contact?: LocalContact;
}

// ============================================
// DESIGN SYSTEM - CORES
// ============================================

const channelColors = {
  whatsapp: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', icon: MessageCircle },
  airbnb: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50', icon: Home },
  booking: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', icon: Building2 },
  sms: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', icon: Phone },
  email: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', icon: Mail },
  site: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', icon: Globe },
  system: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50', icon: MessageSquare }
};

const categoryColors = {
  pinned: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', icon: Pin },
  urgent: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', icon: Zap },
  normal: { bg: 'bg-white dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-900 dark:text-white', icon: MessageCircle },
  resolved: { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', icon: CheckCircle2 }
};

const statusColors = {
  unread: { text: 'text-red-500', badge: 'bg-red-500', icon: Circle },
  read: { text: 'text-gray-500', badge: 'bg-gray-500', icon: CheckCircle2 },
  resolved: { text: 'text-green-500', badge: 'bg-green-500', icon: CheckCircle2 }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

function getChannelIcon(channel: string) {
  const config = channelColors[channel as keyof typeof channelColors] || channelColors.system;
  const Icon = config.icon;
  return <Icon className="h-4 w-4" style={{ color: config.text.replace('text-', '') }} />;
}

// ============================================
// COMPONENT
// ============================================

export function ChatInbox() {
  const { organization, user } = useAuth();
  const organizationId = organization?.id || (user?.type === 'superadmin' ? null : undefined);

  // State
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tags, setTags] = useState<ChatTagType[]>([]);
  
  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['unread', 'read', 'active', 'resolved']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Modals
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [defaultFunnel, setDefaultFunnel] = useState<Funnel | null>(null);

  // Drag & Drop
  const [draggedConversationId, setDraggedConversationId] = useState<string | null>(null);
  const [conversationOrder, setConversationOrder] = useState<Map<string, number>>(new Map());

  // ============================================
  // LOAD DATA
  // ============================================

  // Carregar funil padrão de serviços
  useEffect(() => {
    loadDefaultFunnel();
  }, []);

  const loadDefaultFunnel = async () => {
    try {
      const response = await funnelsApi.list();
      if (response.success && response.data) {
        const servicesFunnels = response.data.filter(f => f.type === 'SERVICES');
        if (servicesFunnels.length > 0) {
          setDefaultFunnel(servicesFunnels[0]);
        } else {
          // Criar funil padrão se não existir
          const defaultFunnel: Funnel = {
            id: 'services-default',
            organizationId: organizationId || '',
            name: 'Funil de Serviços',
            type: 'SERVICES',
            description: 'Gestão de tickets e resolução de problemas',
            stages: [
              { id: '1', funnelId: 'services-default', name: 'Triagem', order: 1, color: '#3b82f6', createdAt: new Date().toISOString() },
              { id: '2', funnelId: 'services-default', name: 'Em Análise', order: 2, color: '#f59e0b', createdAt: new Date().toISOString() },
              { id: '3', funnelId: 'services-default', name: 'Em Resolução', order: 3, color: '#8b5cf6', createdAt: new Date().toISOString() },
              { id: '4', funnelId: 'services-default', name: 'Aguardando Cliente', order: 4, color: '#6366f1', createdAt: new Date().toISOString() },
              { id: '5', funnelId: 'services-default', name: 'Resolvido', order: 5, color: '#10b981', createdAt: new Date().toISOString() },
              { id: '6', funnelId: 'services-default', name: 'Não Resolvido', order: 6, color: '#ef4444', createdAt: new Date().toISOString() },
            ],
            statusConfig: {
              resolvedStatus: 'Resolvido',
              unresolvedStatus: 'Não Resolvido',
              inProgressStatus: 'Em Análise',
            },
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDefaultFunnel(defaultFunnel);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar funil:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar conversas do backend
      if (organizationId) {
        const convResult = await chatApi.conversations.list(organizationId);
        if (convResult.success && convResult.data) {
          const unified = convResult.data.map(conv => convertToUnified(conv));
          setConversations(unified);
        }
      }

      // Carregar contatos WhatsApp
      const service = getEvolutionContactsService();
      const storedContacts = await service.getStoredContacts(organizationId || undefined);
      setContacts(storedContacts);

      // Carregar tags
      if (organizationId) {
        const tagsResult = await chatApi.tags.list(organizationId);
        if (tagsResult.success && tagsResult.data) {
          setTags(tagsResult.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para extrair texto de lastMessage (pode ser string ou objeto)
  const extractMessageText = (lastMessage: any): string => {
    if (!lastMessage) return '';
    if (typeof lastMessage === 'string') return lastMessage;
    return (lastMessage as any)?.message?.conversation 
      || (lastMessage as any)?.message?.extendedTextMessage?.text
      || (lastMessage as any)?.conversation
      || 'Mensagem de mídia';
  };

  const convertToUnified = (conv: Conversation): UnifiedConversation => {
    // Determinar categoria
    let category: 'pinned' | 'urgent' | 'normal' | 'resolved' = 'normal';
    if (conv.isPinned) category = 'pinned';
    else if (conv.status === 'resolved') category = 'resolved';
    else if (conv.status === 'unread' || conv.category === 'urgent') category = 'urgent';

    return {
      id: conv.id,
      name: conv.guest_name,
      phone: conv.guest_phone,
      email: conv.guest_email,
      channel: conv.channel === 'whatsapp' ? 'whatsapp' : 
               conv.channel === 'sms' ? 'sms' : 
               conv.channel === 'email' ? 'email' : 'system',
      status: conv.status,
      category,
      lastMessage: extractMessageText(conv.last_message),
      lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : undefined,
      unreadCount: conv.status === 'unread' ? 1 : 0,
      reservationCode: conv.reservation_code,
      propertyName: conv.property_name,
      propertyId: conv.property_id,
      checkInDate: conv.checkin_date,
      checkOutDate: conv.checkout_date,
      tags: conv.tags,
      isPinned: conv.isPinned,
      conversationType: conv.conversation_type,
      conversation: conv
    };
  };

  // Converter contatos WhatsApp para conversas unificadas
  const convertContactsToConversations = (contacts: LocalContact[]): UnifiedConversation[] => {
    return contacts.map(contact => {
      // Verificar se já existe conversa para este contato
      const existing = conversations.find(c => 
        c.phone === contact.phone || 
        (c.contact && c.contact.id === contact.id)
      );

      if (existing) return existing;

      // Criar nova conversa do WhatsApp
      let category: 'pinned' | 'urgent' | 'normal' | 'resolved' = 'normal';
      if (contact.unreadCount > 0) category = 'urgent';

      // Garantir que phone seja um número válido, não o ID
      let phoneNumber = contact.phone;
      if (!phoneNumber || phoneNumber === contact.id || phoneNumber.includes('@') || phoneNumber.includes('cmi')) {
        // Se phone é inválido ou é o ID, tentar extrair do ID
        const phoneFromId = contact.id.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@g.us', '');
        if (/^\d+$/.test(phoneFromId)) {
          phoneNumber = phoneFromId;
        } else {
          phoneNumber = contact.phone || '';
        }
      }

      return {
        id: `whatsapp-${contact.id}`,
        name: contact.name,
        phone: phoneNumber,
        avatar: contact.profilePicUrl,
        channel: 'whatsapp',
        status: contact.unreadCount > 0 ? 'unread' : 'read',
        category,
        lastMessage: extractMessageText(contact.lastMessage),
        lastMessageAt: contact.updatedAt,
        unreadCount: contact.unreadCount,
        isOnline: contact.isOnline,
        contact
      };
    });
  };

  // ============================================
  // FILTERED & GROUPED CONVERSATIONS
  // ============================================

  const allUnifiedConversations = useMemo(() => {
    const fromBackend = conversations;
    const fromWhatsApp = convertContactsToConversations(contacts);
    
    // Mesclar, evitando duplicatas
    const merged = new Map<string, UnifiedConversation>();
    
    fromBackend.forEach(c => merged.set(c.id, c));
    fromWhatsApp.forEach(c => {
      if (!merged.has(c.id)) {
        merged.set(c.id, c);
      }
    });

    return Array.from(merged.values());
  }, [conversations, contacts]);

  // Helper para normalizar número de telefone (remove caracteres especiais)
  const normalizePhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    // Remove caracteres especiais: +, espaços, parênteses, hífens, pontos
    return phone.replace(/[\s\+\-\(\)\.]/g, '');
  };

  const filteredConversations = useMemo(() => {
    let filtered = allUnifiedConversations;

    // Busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const normalizedQuery = normalizePhoneNumber(query);
      
      filtered = filtered.filter(c => {
        // Busca por nome
        if (c.name.toLowerCase().includes(query)) return true;
        
        // Busca por email
        if (c.email?.toLowerCase().includes(query)) return true;
        
        // Busca por código de reserva
        if (c.reservationCode?.toLowerCase().includes(query)) return true;
        
        // Busca por propriedade
        if (c.propertyName?.toLowerCase().includes(query)) return true;
        
        // Busca por última mensagem
        if (c.lastMessage?.toLowerCase().includes(query)) return true;
        
        // Busca por telefone (normalizado e original)
        if (c.phone) {
          const phoneLower = c.phone.toLowerCase();
          const phoneNormalized = normalizePhoneNumber(c.phone);
          
          // Busca no número original (com formatação)
          if (phoneLower.includes(query)) return true;
          
          // Busca no número normalizado (sem formatação)
          if (phoneNormalized.includes(normalizedQuery)) return true;
          
          // Busca reversa: se a query é um número, verifica se está contido no telefone normalizado
          if (normalizedQuery && phoneNormalized.includes(normalizedQuery)) return true;
        }
        
        return false;
      });
    }

    // Status
    if (selectedStatuses.length < 4) {
      filtered = filtered.filter(c => selectedStatuses.includes(c.status));
    }

    // Canais
    if (selectedChannels.length > 0) {
      filtered = filtered.filter(c => selectedChannels.includes(c.channel));
    }

    // Tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags && c.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Propriedades
    if (selectedProperties.length > 0) {
      filtered = filtered.filter(c => 
        c.propertyId && selectedProperties.includes(c.propertyId)
      );
    }

    return filtered;
  }, [allUnifiedConversations, searchQuery, selectedStatuses, selectedChannels, selectedTags, selectedProperties]);

  const groupedConversations = useMemo(() => {
    let pinned = filteredConversations.filter(c => c.category === 'pinned' || c.isPinned);
    let urgent = filteredConversations.filter(c => c.category === 'urgent' && !c.isPinned);
    let normal = filteredConversations.filter(c => c.category === 'normal' && !c.isPinned);
    let resolved = filteredConversations.filter(c => c.category === 'resolved' && !c.isPinned);

    // ✅ CORREÇÃO: Ordenar por ordem customizada OU por data/prioridade padrão
    const sortByOrder = (list: UnifiedConversation[]) => {
      return list.sort((a, b) => {
        const orderA = conversationOrder.get(a.id);
        const orderB = conversationOrder.get(b.id);
        
        // Se ambos têm ordem personalizada, usar ordem
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }
        
        // Se apenas um tem ordem, ele vem primeiro
        if (orderA !== undefined) return -1;
        if (orderB !== undefined) return 1;
        
        // Se nenhum tem ordem personalizada, ordenar por data/prioridade padrão
        // Prioridade: unread > read > resolved
        const statusPriority = { unread: 3, read: 2, resolved: 1 };
        const priorityDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Se mesma prioridade, ordenar por data (mais recente primeiro)
        const dateA = a.lastMessageAt?.getTime() || 0;
        const dateB = b.lastMessageAt?.getTime() || 0;
        return dateB - dateA;
      });
    };

    pinned = sortByOrder(pinned);
    urgent = sortByOrder(urgent);
    normal = sortByOrder(normal);
    resolved = sortByOrder(resolved);

    return { pinned, urgent, normal, resolved };
  }, [filteredConversations, conversationOrder]);

  // ============================================
  // ACTIONS
  // ============================================

  const handleTogglePin = async (conversationId: string) => {
    if (!organizationId) return;
    
    const conv = allUnifiedConversations.find(c => c.id === conversationId);
    const currentPinnedState = conv?.isPinned ?? false;
    const newPinnedState = !currentPinnedState;
    
    // ✅ CORREÇÃO: Ao desfixar, remover da ordem personalizada para reordenar por data/prioridade
    if (!newPinnedState) {
      const newOrder = new Map(conversationOrder);
      newOrder.delete(conversationId);
      setConversationOrder(newOrder);
    }
    
    try {
      const result = await chatApi.conversations.togglePin(conversationId, organizationId);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao fixar/desafixar:', error);
    }
  };

  const handleSelectConversation = (conv: UnifiedConversation) => {
    setSelectedConversation(conv);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // ============================================
  // DRAG & DROP
  // ============================================

  const handleDragStart = (conversationId: string) => {
    setDraggedConversationId(conversationId);
  };

  const handleDragOver = (e: React.DragEvent, targetConversationId: string, category: 'pinned' | 'urgent' | 'normal' | 'resolved') => {
    e.preventDefault();
    if (!draggedConversationId || draggedConversationId === targetConversationId) return;

    const grouped = groupedConversations;
    let categoryList: UnifiedConversation[] = [];
    
    switch (category) {
      case 'pinned':
        categoryList = grouped.pinned;
        break;
      case 'urgent':
        categoryList = grouped.urgent;
        break;
      case 'normal':
        categoryList = grouped.normal;
        break;
      case 'resolved':
        categoryList = grouped.resolved;
        break;
    }

    const draggedIndex = categoryList.findIndex((c) => c.id === draggedConversationId);
    const targetIndex = categoryList.findIndex((c) => c.id === targetConversationId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reordenar apenas dentro da mesma categoria
    const newList = [...categoryList];
    const [draggedConv] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedConv);

    // Atualizar ordem local
    const newOrder = new Map(conversationOrder);
    newList.forEach((conv, index) => {
      newOrder.set(conv.id, index);
    });
    setConversationOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedConversationId(null);
  };

  // ============================================
  // RENDER CONVERSATION CARD
  // ============================================

  const renderConversationCard = (conv: UnifiedConversation, category: 'pinned' | 'urgent' | 'normal' | 'resolved') => {
    // ✅ CORREÇÃO: Usar cor especial (azul) SOMENTE se estiver realmente fixado
    // Se não estiver fixado, usar a cor da categoria normal (urgent, normal, resolved)
    const actualCategory = conv.isPinned ? 'pinned' : conv.category;
    const categoryConfig = categoryColors[actualCategory];
    const channelConfig = channelColors[conv.channel];
    const statusConfig = statusColors[conv.status];
    const isSelected = selectedConversation?.id === conv.id;
    const isChecked = selectedIds.has(conv.id);
    const isDragging = draggedConversationId === conv.id;

    return (
      <div
        key={conv.id}
        className={`
          relative p-4 cursor-move transition-all border-b
          ${categoryConfig.bg} ${categoryConfig.border}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isDragging ? 'opacity-50' : ''}
          hover:shadow-md
        `}
        style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
        draggable
        onDragStart={() => handleDragStart(conv.id)}
        onDragOver={(e) => handleDragOver(e, conv.id, category)}
        onDragEnd={handleDragEnd}
        onClick={() => !isSelectionMode && handleSelectConversation(conv)}
      >
        <div className="flex gap-3 w-full min-w-0" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          {/* Checkbox (modo seleção) */}
          {isSelectionMode && (
            <UICheckbox
              checked={isChecked}
              onCheckedChange={() => handleToggleSelect(conv.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12">
              <AvatarImage src={conv.avatar} />
              <AvatarFallback className={channelConfig.light}>
                {getInitials(conv.name)}
              </AvatarFallback>
            </Avatar>
            {conv.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0" style={{ width: 0, maxWidth: '100%', overflow: 'hidden' }}>
            {/* Nome e timestamp */}
            <div className="flex items-start justify-between gap-2 mb-1" style={{ width: '100%', minWidth: 0 }}>
              <div className="flex items-center gap-2 min-w-0 flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                <span className={`font-medium truncate ${categoryConfig.text}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.name}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getChannelIcon(conv.channel)}
                  {conv.isPinned && (
                    <Pin className="h-3 w-3 text-blue-500 fill-blue-500 flex-shrink-0" />
                  )}
                </div>
              </div>
              {conv.lastMessageAt && (
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {formatTimeAgo(conv.lastMessageAt)}
                </span>
              )}
            </div>

            {/* RES-ID e Propriedade */}
            {(conv.reservationCode || conv.propertyName) && (
              <div className="flex items-center gap-2 mb-1" style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
                {conv.reservationCode && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {conv.reservationCode}
                  </Badge>
                )}
                {conv.category === 'urgent' && (
                  <Zap className="h-3 w-3 text-orange-500 flex-shrink-0" />
                )}
                {conv.propertyName && (
                  <span className="text-xs text-gray-600 truncate flex-1 min-w-0" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.propertyName}
                  </span>
                )}
              </div>
            )}

            {/* Última mensagem */}
            {conv.lastMessage && (
              <p className="text-sm text-gray-600 truncate mb-1 min-w-0" style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv.lastMessage.replace(/\n/g, ' ').trim()}
              </p>
            )}

            {/* Tags */}
            {conv.tags && conv.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {conv.tags.slice(0, 3).map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge key={tagId} variant="outline" className="text-xs" style={{ borderColor: tag.color }}>
                      <TagIcon className="h-2.5 w-2.5 mr-1" />
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Unread indicator */}
            {conv.unreadCount > 0 && (
              <div className="mt-2">
                <Badge variant="default" className="bg-red-500">
                  {conv.unreadCount} nova{conv.unreadCount > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>

          {/* Pin button */}
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(conv.id);
              }}
            >
              <Pin className={`h-4 w-4 ${conv.isPinned ? 'text-blue-500 fill-blue-500' : 'text-gray-400'}`} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: '100vh' }}>
      {/* Left column: filters + conversations - LARGURA FIXA */}
      <div className="flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 overflow-hidden h-full" style={{ width: 380, maxWidth: 380, minWidth: 380, height: '100vh' }}>
        {/* Filters */}
        <div className="h-auto flex-shrink-0">
          <ChatFilterSidebar
            properties={properties}
            selectedProperties={selectedProperties}
            onToggleProperty={(id) => {
              setSelectedProperties(prev => 
                prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
              );
            }}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedStatuses={selectedStatuses}
            onStatusesChange={setSelectedStatuses}
            selectedChannels={selectedChannels}
            onChannelsChange={setSelectedChannels}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            chatTags={tags.map(t => ({ id: t.id, name: t.name, color: t.color }))}
            onManageTags={() => setShowTagsManager(true)}
          />
        </div>

        {/* Search */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List - SCROLLABLE */}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)', maxHeight: 'calc(100vh - 200px)' }}>
          <ScrollArea className="h-full w-full" style={{ height: '100%', width: '100%', maxHeight: '100%' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                {/* Fixadas */}
                {groupedConversations.pinned.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <Pin className="h-3 w-3" />
                      Fixadas ({groupedConversations.pinned.length}/5)
                    </div>
                    {groupedConversations.pinned.map(conv => renderConversationCard(conv, 'pinned'))}
                  </div>
                )}

                {/* Urgentes */}
                {groupedConversations.urgent.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-orange-600 uppercase flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      Urgentes ({groupedConversations.urgent.length})
                    </div>
                    {groupedConversations.urgent.map(conv => renderConversationCard(conv, 'urgent'))}
                  </div>
                )}

                {/* Normais */}
                {groupedConversations.normal.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" />
                      Normais ({groupedConversations.normal.length})
                    </div>
                    {groupedConversations.normal.map(conv => renderConversationCard(conv, 'normal'))}
                  </div>
                )}

                {/* Resolvidas */}
                {groupedConversations.resolved.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-green-600 uppercase flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolvidas ({groupedConversations.resolved.length})
                    </div>
                    {groupedConversations.resolved.map(conv => renderConversationCard(conv, 'resolved'))}
                  </div>
                )}

                {/* Empty state */}
                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">
                      {searchQuery || selectedStatuses.length < 4 || selectedChannels.length > 0 || selectedTags.length > 0
                        ? 'Nenhuma conversa encontrada'
                        : 'Nenhuma conversa ainda'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Middle column: conversation - FLEX-1 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedConversation ? (
          <WhatsAppConversation 
            contact={selectedConversation.contact || {
              id: selectedConversation.id,
              name: selectedConversation.name,
              phone: selectedConversation.phone && selectedConversation.phone !== selectedConversation.id && !selectedConversation.phone.includes('cmi') 
                ? selectedConversation.phone 
                : extractPhoneNumber(selectedConversation.id) || selectedConversation.phone || '',
              profilePicUrl: selectedConversation.avatar,
              isBusiness: false,
              source: 'evolution',
              unreadCount: selectedConversation.unreadCount,
              isOnline: selectedConversation.isOnline || false,
              createdAt: new Date(),
              updatedAt: new Date()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione uma conversa à esquerda
          </div>
        )}
      </div>

      {/* Right column: details - LARGURA FIXA */}
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden lg:flex flex-col flex-shrink-0">
        {selectedConversation ? (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Detalhes</h3>
              {selectedConversation.reservationCode && (
                <div className="mb-2">
                  <Badge variant="outline">{selectedConversation.reservationCode}</Badge>
                </div>
              )}
              {selectedConversation.propertyName && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Propriedade</p>
                  <p className="text-sm font-medium">{selectedConversation.propertyName}</p>
                </div>
              )}
              {selectedConversation.checkInDate && selectedConversation.checkOutDate && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedConversation.checkInDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Check-out</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedConversation.checkOutDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {selectedConversation.phone && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="text-sm font-medium">{selectedConversation.phone}</p>
                </div>
              )}
              {selectedConversation.email && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium">{selectedConversation.email}</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-2"
                onClick={() => setShowQuickActions(true)}
              >
                Ações Rápidas
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowBlockModal(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Bloqueio
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-600">Detalhes</div>
        )}
      </div>

      {/* Modals */}
      <QuickActionsModal
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        contactId={selectedConversation?.contact?.id}
        contactName={selectedConversation?.contact?.name || selectedConversation?.contactName}
        propertyId={selectedConversation?.propertyId}
        propertyName={selectedConversation?.propertyName}
        onSelectAction={(action) => {
          setShowQuickActions(false);
          if (action === 'quote') {
            setShowQuotation(true);
          } else if (action === 'reservation') {
            setShowCreateReservation(true);
          } else if (action === 'ticket') {
            setShowCreateTicket(true);
          }
        }}
      />

      {showQuotation && selectedConversation && selectedConversation.propertyId && (
        <QuotationModal
          isOpen={showQuotation}
          onClose={() => setShowQuotation(false)}
          property={{
            id: selectedConversation.propertyId,
            name: selectedConversation.propertyName || 'Propriedade',
            location: '',
            type: 'house',
            bedrooms: 0,
            bathrooms: 0,
            maxGuests: 0,
            pricePerNight: 0,
            images: [],
            amenities: [],
            status: 'active'
          }}
          startDate={selectedConversation.checkInDate ? new Date(selectedConversation.checkInDate) : new Date()}
          endDate={selectedConversation.checkOutDate ? new Date(selectedConversation.checkOutDate) : new Date()}
        />
      )}

      <CreateReservationWizard
        open={showCreateReservation}
        onClose={() => setShowCreateReservation(false)}
        onComplete={() => {
          setShowCreateReservation(false);
          loadData();
        }}
      />

      {showBlockModal && selectedConversation && selectedConversation.propertyId && (
        <BlockModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          propertyId={selectedConversation.propertyId}
          propertyName={selectedConversation.propertyName || ''}
          startDate={selectedConversation.checkInDate ? new Date(selectedConversation.checkInDate) : new Date()}
          endDate={selectedConversation.checkOutDate ? new Date(selectedConversation.checkOutDate) : new Date()}
          onSave={() => {
            setShowBlockModal(false);
            loadData();
          }}
        />
      )}

      <TemplateManagerModal
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={[]}
        onSaveTemplate={() => {}}
        onDeleteTemplate={() => {}}
      />

      <ChatTagsModal
        open={showTagsManager}
        onClose={() => setShowTagsManager(false)}
        tags={tags.map(t => ({ id: t.id, name: t.name, color: t.color }))}
        onSaveTag={async (tag) => {
          if (!organizationId) return;
          await chatApi.tags.create({ ...tag, organization_id: organizationId });
          await loadData();
        }}
        onDeleteTag={async (tagId) => {
          if (!organizationId) return;
          await chatApi.tags.delete(tagId, organizationId);
          await loadData();
        }}
      />

      {/* Modal de Criar Ticket */}
      {showCreateTicket && defaultFunnel && (
        <CreateTicketModal
          open={showCreateTicket}
          onClose={() => setShowCreateTicket(false)}
          onSuccess={(ticket: ServiceTicket) => {
            // TODO: Vincular automaticamente pessoas e imóveis da conversa ao ticket
            // Por enquanto, apenas fecha o modal
            setShowCreateTicket(false);
            // Redirecionar para o ticket criado ou mostrar notificação
            window.location.href = `/crm/services`;
          }}
          funnel={defaultFunnel}
          prefillContactId={selectedConversation?.contact?.id}
          prefillContactName={selectedConversation?.contact?.name || selectedConversation?.name}
          prefillContactPhone={selectedConversation?.phone || selectedConversation?.contact?.number}
          prefillContactEmail={selectedConversation?.email || selectedConversation?.contact?.email}
          prefillPropertyId={selectedConversation?.propertyId}
          prefillPropertyName={selectedConversation?.propertyName}
          prefillReservationId={selectedConversation?.reservationCode ? `res-${selectedConversation.reservationCode}` : undefined}
          prefillReservationCode={selectedConversation?.reservationCode}
          prefillGuestId={selectedConversation?.contact?.id} // TODO: Mapear para guestId real
          prefillGuestName={selectedConversation?.contact?.name || selectedConversation?.name}
        />
      )}
    </div>
  );
}

export default ChatInbox;
