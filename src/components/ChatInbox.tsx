import React, { useState, useRef, useEffect } from 'react';
import { ChatFilterSidebar } from './ChatFilterSidebar';
import { 
  MessageSquare, 
  MessageCircle,
  Search, 
  Filter, 
  Send, 
  Paperclip, 
  MoreVertical,
  CheckCheck,
  Check,
  Clock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  FileText,
  X,
  ChevronDown,
  Circle,
  ChevronLeft,
  ChevronRight,
  Pin,
  GripVertical,
  AlertCircle,
  Zap,
  DollarSign,
  Lock,
  Home,
  Users,
  CheckSquare,
  Square,
  Tags,
  Tag,
  Loader2,
  Upload,
  Image as ImageIcon,
  File,
  StickyNote
} from 'lucide-react';
// import { DndProvider, useDrag, useDrop } from 'react-dnd'; // Removido - causando erro
import { QuickActionsModal } from './QuickActionsModal';
import { QuotationModal } from './QuotationModal';
import { CreateReservationWizard } from './CreateReservationWizard';
import { BlockModal } from './BlockModal';
import { Property } from '../App';
import { toast } from 'sonner';
import { TemplateManagerModal, MessageTemplate as TemplateType } from './TemplateManagerModal';
import { ChatTagsModal, ChatTag } from './ChatTagsModal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { DateRangePicker } from './DateRangePicker';
import { conversationsApi, messagesApi, templatesApi, tagsApi, filesApi, FileMetadata } from '../utils/chatApi';
import type { Conversation as ApiConversation, Message as ApiMessage } from '../utils/chatApi';
import { WhatsAppChatsImporter } from './WhatsAppChatsImporter';
import { sendWhatsAppMessage, fetchWhatsAppMessages, extractMessageText, extractPhoneNumber } from '../utils/whatsappChatApi';

// Mock data types
interface Message {
  id: string;
  sender_type: 'guest' | 'staff' | 'system';
  sender_name: string;
  content: string;
  sent_at: Date;
  read_at?: Date;
}

type ConversationCategory = 'urgent' | 'normal' | 'resolved';

interface Conversation {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  reservation_code: string;
  property_name: string;
  property_id?: string;
  channel: 'email' | 'system' | 'whatsapp';
  status: 'unread' | 'read' | 'resolved';
  category: ConversationCategory;
  conversation_type: 'guest' | 'lead'; // guest = já é hóspede, lead = negociação
  last_message: string;
  last_message_at: Date;
  checkin_date: Date;
  checkout_date: Date;
  messages: Message[];
  order?: number;
  isPinned?: boolean;
  tags?: string[]; // IDs das tags
  // Dados de negociação para leads
  lead_data?: {
    desired_location?: string;
    num_guests?: number;
    desired_checkin?: Date;
    desired_checkout?: Date;
  };
}

// Removido - usando interface do TemplateManagerModal

// Mock data inicial de templates
const initialMockTemplates: TemplateType[] = [
  {
    id: 'tpl-001',
    name: 'Confirmação de Reserva',
    category: 'Pré Check-in',
    content: 'Olá {guest_name}!\n\nSua reserva foi confirmada! ✅\n\n📅 Check-in: {checkin_date}\n📅 Check-out: {checkout_date}\n🏠 Imóvel: {property_name}\n\nEm breve enviaremos mais informações.\n\nEquipe RENDIZY'
  },
  {
    id: 'tpl-002',
    name: 'Instruções Check-in',
    category: 'Pré Check-in',
    content: 'Olá {guest_name}!\n\nEstamos aguardando você! 🎉\n\n📍 Endereço: {property_address}\n🔑 Código de acesso: {access_code}\n📶 WiFi: {wifi_name}\n🔐 Senha WiFi: {wifi_password}\n\nQualquer dúvida, estamos à disposição!'
  },
  {
    id: 'tpl-003',
    name: 'Lembrete 24h',
    category: 'Pré Check-in',
    content: 'Olá {guest_name}!\n\nSeu check-in é amanhã às {checkin_time}! ⏰\n\nEstamos ansiosos para recebê-lo em {property_name}.\n\nTem alguma dúvida? Estamos aqui para ajudar!'
  },
  {
    id: 'tpl-004',
    name: 'Agradecimento',
    category: 'Pós Check-out',
    content: 'Olá {guest_name}!\n\nObrigado por se hospedar conosco! 😊\n\nEsperamos que tenha aproveitado sua estadia em {property_name}.\n\nSeria uma honra recebê-lo novamente!'
  },
  {
    id: 'tpl-005',
    name: 'Pedido de Avaliação',
    category: 'Pós Check-out',
    content: 'Olá {guest_name}!\n\nSua opinião é muito importante! ⭐\n\nPoderia nos contar como foi sua experiência em {property_name}?\n\nSua avaliação nos ajuda a melhorar cada vez mais!'
  }
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    guest_name: 'João Silva',
    guest_email: 'joao@email.com',
    guest_phone: '+55 21 99999-8888',
    reservation_code: 'RES-015',
    property_name: 'Casa Itaúnas Vista Mar',
    property_id: 'prop-001',
    channel: 'system',
    status: 'unread',
    category: 'urgent',
    conversation_type: 'guest',
    last_message: 'Qual o código do WiFi?',
    last_message_at: new Date(2025, 9, 29, 10, 30),
    checkin_date: new Date(2025, 9, 29),
    checkout_date: new Date(2025, 10, 3),
    order: 0,
    isPinned: false,
    messages: [
      {
        id: 'msg-001',
        sender_type: 'guest',
        sender_name: 'João Silva',
        content: 'Olá! Já estou no imóvel. Qual o código do WiFi?',
        sent_at: new Date(2025, 9, 29, 10, 30),
      }
    ]
  },
  {
    id: 'conv-002',
    guest_name: 'Maria Santos',
    guest_email: 'maria@email.com',
    guest_phone: '+55 21 98888-7777',
    reservation_code: 'RES-020',
    property_name: 'Arraial Novo Beach',
    property_id: 'prop-002',
    channel: 'email',
    status: 'read',
    category: 'normal',
    conversation_type: 'guest',
    last_message: 'Perfeito, muito obrigada!',
    last_message_at: new Date(2025, 9, 28, 15, 45),
    checkin_date: new Date(2025, 10, 5),
    checkout_date: new Date(2025, 10, 10),
    order: 1,
    isPinned: false,
    messages: [
      {
        id: 'msg-002',
        sender_type: 'guest',
        sender_name: 'Maria Santos',
        content: 'Boa tarde! Gostaria de confirmar o horário de check-in.',
        sent_at: new Date(2025, 9, 28, 14, 20),
        read_at: new Date(2025, 9, 28, 14, 25)
      },
      {
        id: 'msg-003',
        sender_type: 'staff',
        sender_name: 'Você',
        content: 'Olá Maria! O check-in é a partir das 14h. Você pode chegar a qualquer momento após esse horário.',
        sent_at: new Date(2025, 9, 28, 14, 30),
        read_at: new Date(2025, 9, 28, 15, 40)
      },
      {
        id: 'msg-004',
        sender_type: 'guest',
        sender_name: 'Maria Santos',
        content: 'Perfeito, muito obrigada!',
        sent_at: new Date(2025, 9, 28, 15, 45),
        read_at: new Date(2025, 9, 28, 15, 50)
      }
    ]
  },
  {
    id: 'conv-003',
    guest_name: 'Carlos Mendes',
    guest_email: 'carlos@email.com',
    guest_phone: '+55 21 97777-6666',
    reservation_code: 'RES-012',
    property_name: 'Barra Beach House',
    property_id: 'prop-003',
    channel: 'whatsapp',
    status: 'resolved',
    category: 'resolved',
    conversation_type: 'guest',
    last_message: 'Obrigado pela estadia!',
    last_message_at: new Date(2025, 9, 27, 11, 15),
    checkin_date: new Date(2025, 9, 20),
    checkout_date: new Date(2025, 9, 27),
    order: 2,
    isPinned: false,
    messages: [
      {
        id: 'msg-005',
        sender_type: 'system',
        sender_name: 'Sistema',
        content: 'Reserva confirmada! Check-in: 20/10/2025',
        sent_at: new Date(2025, 9, 15, 9, 0),
        read_at: new Date(2025, 9, 15, 9, 5)
      },
      {
        id: 'msg-006',
        sender_type: 'guest',
        sender_name: 'Carlos Mendes',
        content: 'Obrigado pela estadia! Tudo estava perfeito.',
        sent_at: new Date(2025, 9, 27, 11, 15),
        read_at: new Date(2025, 9, 27, 11, 20)
      }
    ]
  },
  {
    id: 'conv-004',
    guest_name: 'Ana Paula',
    guest_email: 'ana@email.com',
    guest_phone: '+55 21 96666-5555',
    reservation_code: 'RES-025',
    property_name: 'Copacabana Lux Apt',
    property_id: 'prop-004',
    channel: 'system',
    status: 'unread',
    category: 'normal',
    conversation_type: 'guest',
    last_message: 'Tem estacionamento no prédio?',
    last_message_at: new Date(2025, 9, 29, 9, 15),
    checkin_date: new Date(2025, 10, 1),
    checkout_date: new Date(2025, 10, 4),
    order: 3,
    isPinned: false,
    messages: [
      {
        id: 'msg-025-1',
        sender_type: 'guest',
        sender_name: 'Ana Paula',
        content: 'Tem estacionamento no prédio?',
        sent_at: new Date(2025, 9, 29, 9, 15)
      },
      {
        id: 'msg-025-2',
        sender_type: 'staff',
        sender_name: 'Você',
        content: 'Bom dia Ana! Sim, temos estacionamento gratuito no prédio.',
        sent_at: new Date(2025, 9, 29, 9, 20),
        read_at: new Date(2025, 9, 29, 9, 21)
      }
    ]
  },
  // LEAD - Negociação (não tem reserva ainda)
  {
    id: 'conv-005',
    guest_name: 'Patricia Oliveira',
    guest_email: 'patricia@email.com',
    guest_phone: '+55 22 99888-7766',
    reservation_code: '', // Sem reserva ainda
    property_name: '', // Ainda não escolheu
    channel: 'whatsapp',
    status: 'unread',
    category: 'urgent',
    conversation_type: 'lead',
    last_message: 'Quero uma casa em Cabo Frio para 6 pessoas, de 15 a 22 de novembro',
    last_message_at: new Date(2025, 9, 29, 14, 20),
    checkin_date: new Date(2025, 10, 15), // Data desejada
    checkout_date: new Date(2025, 10, 22), // Data desejada
    order: 4,
    isPinned: false,
    lead_data: {
      desired_location: 'Cabo Frio',
      num_guests: 6,
      desired_checkin: new Date(2025, 10, 15),
      desired_checkout: new Date(2025, 10, 22)
    },
    messages: [
      {
        id: 'msg-lead-001',
        sender_type: 'guest',
        sender_name: 'Patricia Oliveira',
        content: 'Olá! Quero uma casa em Cabo Frio para 6 pessoas, de 15 a 22 de novembro',
        sent_at: new Date(2025, 9, 29, 14, 20)
      }
    ]
  }
];

// Componente de Card de Conversa com Drag and Drop
interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  onCategoryChange: (category: ConversationCategory) => void;
  onReorder: (dragId: string, hoverId: string) => void;
  formatTime: (date: Date) => string;
  getChannelIcon: (channel: string) => React.ReactNode;
  getChannelColor: (channel: string) => string;
  isPinned: boolean;
  canPin: boolean;
  isSelectionMode?: boolean;
  isSelectedForBulk?: boolean;
  onToggleSelection?: () => void;
  chatTags?: ChatTag[];
  onToggleTag?: (tagId: string) => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isSelected,
  onSelect,
  onPin,
  onCategoryChange,
  onReorder,
  formatTime,
  getChannelIcon,
  getChannelColor,
  isPinned,
  canPin,
  isSelectionMode = false,
  isSelectedForBulk = false,
  onToggleSelection,
  chatTags = [],
  onToggleTag
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Drag & Drop temporariamente desabilitado - será reimplementado em versão futura
  const isDragging = false;
  const isOver = false;

  return (
    <div
      ref={ref}
      className={`relative p-4 cursor-pointer transition-all ${
        isSelected
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox para seleção múltipla */}
        {isSelectionMode && (
          <div className="pt-2">
            <Checkbox
              checked={isSelectedForBulk}
              onCheckedChange={(checked) => {
                onToggleSelection?.();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <Avatar>
          <AvatarFallback>
            {conversation.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-900 dark:text-white truncate">
              {conversation.guest_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {formatTime(conversation.last_message_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {conversation.reservation_code}
            </Badge>
            <div className={`p-0.5 rounded ${getChannelColor(conversation.channel)}`}>
              {getChannelIcon(conversation.channel)}
            </div>
            {conversation.category === 'urgent' && (
              <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 truncate">
            {conversation.property_name}
          </p>
          
          <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-500 text-sm truncate flex-1">
              {conversation.last_message}
            </p>
            {conversation.status === 'unread' && (
              <Circle className="h-2 w-2 fill-red-500 text-red-500 flex-shrink-0 ml-2" />
            )}
          </div>

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {conversation.tags.map(tagId => {
                const tag = chatTags.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tagId}
                    className={`${tag.color} text-xs cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTag?.(tagId);
                    }}
                  >
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Pin Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          disabled={!isPinned && !canPin}
          title={isPinned ? 'Desafixar' : canPin ? 'Fixar no topo (máx 5)' : 'Máximo de 5 conversas fixadas'}
        >
          <Pin className={`h-4 w-4 ${isPinned ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
        </Button>
      </div>
    </div>
  );
};

export function ChatInbox() {
  // TODO: Get from auth context
  const organizationId = 'org-demo-001';
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2025, 9, 1),
    to: new Date(2025, 10, 30)
  });
  
  // File upload states
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Internal notes
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<TemplateType[]>(() => {
    const saved = localStorage.getItem('rendizy_chat_templates');
    return saved ? JSON.parse(saved) : initialMockTemplates;
  });
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Template autocomplete com "/"
  const [showTemplatePopup, setShowTemplatePopup] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tags
  const [chatTags, setChatTags] = useState<ChatTag[]>(() => {
    const saved = localStorage.getItem('rendizy_chat_tags');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tag-vip',
        name: 'VIP',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
        description: 'Clientes VIP que merecem atenção especial',
        created_at: new Date(2025, 9, 1),
        conversations_count: 0
      },
      {
        id: 'tag-urgente',
        name: 'Urgente',
        color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        description: 'Requer resposta imediata',
        created_at: new Date(2025, 9, 1),
        conversations_count: 0
      },
      {
        id: 'tag-followup',
        name: 'Follow-up',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
        description: 'Necessita acompanhamento',
        created_at: new Date(2025, 9, 1),
        conversations_count: 0
      }
    ];
  });
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Seleção múltipla
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  
  // Filtros
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['unread', 'read', 'active', 'resolved']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  // Sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modais de ações rápidas
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showReservationWizard, setShowReservationWizard] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Dados para os modais
  const [modalDates, setModalDates] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);

  // Properties list
  const [properties, setProperties] = useState<Property[]>([]);

  // ============================================
  // API INTEGRATION - Load conversations
  // ============================================
  useEffect(() => {
    loadConversations();
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadProperties = async () => {
    try {
      // Import supabase info
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/rendizy-server/properties`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      // Set empty array on error to prevent UI breaks
      setProperties([]);
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const result = await conversationsApi.list(organizationId);
      if (result.success && result.data) {
        // Convert API data to component format
        const formattedConversations = result.data.map((conv: ApiConversation) => ({
          ...conv,
          last_message_at: new Date(conv.last_message_at),
          checkin_date: conv.checkin_date ? new Date(conv.checkin_date) : new Date(),
          checkout_date: conv.checkout_date ? new Date(conv.checkout_date) : new Date(),
          created_at: new Date(conv.created_at),
          updated_at: new Date(conv.updated_at)
        }));
        setConversations(formattedConversations);
        if (formattedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(formattedConversations[0]);
        }
      } else {
        console.error('Failed to load conversations:', result.error);
        // Fallback to mock data on error
        setConversations(mockConversations);
        if (mockConversations.length > 0) {
          setSelectedConversation(mockConversations[0]);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to mock data
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Se for conversa do WhatsApp, buscar mensagens da Evolution API
      if (conversationId.startsWith('wa-')) {
        await loadWhatsAppMessages(conversationId);
        return;
      }

      const result = await messagesApi.list(conversationId, organizationId);
      if (result.success && result.data) {
        // Convert API data to component format
        const formattedMessages = result.data.map((msg: ApiMessage) => ({
          ...msg,
          sent_at: new Date(msg.sent_at),
          read_at: msg.read_at ? new Date(msg.read_at) : undefined
        }));
        setMessages(formattedMessages);
        
        // Update conversation messages
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: formattedMessages }
            : conv
        ));
      } else {
        console.error('Failed to load messages:', result.error);
        // Use messages from conversation if API fails
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          setMessages(conv.messages || []);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setMessages(conv.messages || []);
      }
    }
  };

  // ============================================
  // WHATSAPP INTEGRATION
  // ============================================

  /**
   * Callback para carregar conversas do WhatsApp
   */
  const handleWhatsAppChatsLoaded = (whatsappChats: any[]) => {
    console.log('📥 Conversas do WhatsApp carregadas:', whatsappChats.length);
    console.log('📦 Dados das conversas:', whatsappChats);
    
    // Adicionar conversas do WhatsApp às conversas existentes
    setConversations(prev => {
      console.log('🔄 Conversas anteriores:', prev.length);
      
      // Remover conversas antigas do WhatsApp
      const withoutWhatsApp = prev.filter(c => !c.id.startsWith('wa-'));
      console.log('🗑️ Conversas sem WhatsApp:', withoutWhatsApp.length);
      
      // Adicionar novas conversas do WhatsApp
      const updated = [...whatsappChats, ...withoutWhatsApp];
      console.log('✅ Total de conversas após merge:', updated.length);
      
      return updated;
    });
  };

  /**
   * Carregar mensagens de uma conversa do WhatsApp
   */
  const loadWhatsAppMessages = async (conversationId: string) => {
    try {
      const conv = conversations.find(c => c.id === conversationId);
      if (!conv || !(conv as any).whatsapp_chat_id) {
        console.error('Conversa do WhatsApp não encontrada');
        return;
      }

      const whatsappChatId = (conv as any).whatsapp_chat_id;
      console.log('📥 Carregando mensagens do WhatsApp:', whatsappChatId);

      const whatsappMessages = await fetchWhatsAppMessages(whatsappChatId, 50);
      
      // Converter mensagens do WhatsApp para o formato do sistema
      const formattedMessages = whatsappMessages.map((msg: any) => ({
        id: msg.key.id,
        sender_type: msg.key.fromMe ? 'staff' : 'guest',
        sender_name: msg.key.fromMe ? 'Você' : (msg.pushName || conv.guest_name),
        content: extractMessageText(msg),
        sent_at: new Date(msg.messageTimestamp * 1000),
        read_at: msg.status === 'read' ? new Date() : undefined,
      }));

      setMessages(formattedMessages);
      
      // Atualizar conversa com mensagens
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: formattedMessages }
          : c
      ));

      console.log('✅ Mensagens do WhatsApp carregadas:', formattedMessages.length);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens do WhatsApp:', error);
      toast.error('Erro ao carregar mensagens do WhatsApp');
    }
  };

  // 🆕 v1.0.101 - Multi-channel icons
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': 
        return <MessageCircle className="h-3 w-3" />;
      case 'sms': 
        return <Phone className="h-3 w-3" />;
      case 'email': 
        return <Mail className="h-3 w-3" />;
      case 'internal':
      case 'system': 
        return <MessageSquare className="h-3 w-3" />;
      default: 
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // 🆕 v1.0.101 - Multi-channel colors
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': 
        return 'bg-green-500'; // WhatsApp verde
      case 'sms': 
        return 'bg-blue-500'; // SMS azul
      case 'email': 
        return 'bg-purple-500'; // Email roxo
      case 'internal':
      case 'system': 
        return 'bg-gray-500'; // Interno cinza
      default: 
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'text-red-500';
      case 'read': return 'text-gray-500';
      case 'resolved': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'ontem';
    } else if (days < 7) {
      return `${days}d atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // 🆕 v1.0.101 - Render delivery status icon based on channel and status
  const renderDeliveryStatus = (message: any) => {
    // For WhatsApp messages, show external status
    if (message.channel === 'whatsapp' && message.external_status) {
      switch (message.external_status) {
        case 'read':
          return <CheckCheck className="h-3 w-3 text-blue-400" />;
        case 'delivered':
          return <CheckCheck className="h-3 w-3" />;
        case 'sent':
          return <Check className="h-3 w-3" />;
        case 'pending':
          return <Clock className="h-3 w-3" />;
        case 'failed':
          return <AlertCircle className="h-3 w-3 text-red-400" />;
        default:
          return null;
      }
    }
    
    // For SMS messages
    if (message.channel === 'sms' && message.external_status) {
      switch (message.external_status) {
        case 'delivered':
          return <CheckCheck className="h-3 w-3" />;
        case 'sent':
          return <Check className="h-3 w-3" />;
        case 'pending':
          return <Clock className="h-3 w-3" />;
        case 'failed':
          return <AlertCircle className="h-3 w-3 text-red-400" />;
        default:
          return null;
      }
    }
    
    // For internal/system messages (original behavior)
    if (message.sender_type === 'staff') {
      if (message.read_at) {
        return <CheckCheck className="h-3 w-3" />;
      }
      return <Check className="h-3 w-3" />;
    }
    
    return null;
  };

  // Pin/Unpin functions
  const handleTogglePin = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    const pinnedCount = conversations.filter(c => c.isPinned).length;
    
    // Se está tentando fixar e já tem 5 fixadas, não permite
    if (!conv.isPinned && pinnedCount >= 5) {
      toast.error('Máximo de 5 conversas fixadas');
      return;
    }

    try {
      const result = await conversationsApi.togglePin(convId, organizationId);
      if (result.success && result.data) {
        setConversations(prevConvs =>
          prevConvs.map(c =>
            c.id === convId ? { ...c, isPinned: !c.isPinned } : c
          )
        );
        toast.success(conv.isPinned ? 'Conversa desafixada' : 'Conversa fixada');
      } else {
        // Fallback to local update
        setConversations(prevConvs =>
          prevConvs.map(c =>
            c.id === convId ? { ...c, isPinned: !c.isPinned } : c
          )
        );
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Fallback to local update
      setConversations(prevConvs =>
        prevConvs.map(c =>
          c.id === convId ? { ...c, isPinned: !c.isPinned } : c
        )
      );
    }
  };

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file size (max 10MB each)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`Arquivo ${file.name} é muito grande (máx 10MB)`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (convId: string, newCategory: ConversationCategory) => {
    setConversations(prevConvs =>
      prevConvs.map(c =>
        c.id === convId ? { ...c, category: newCategory } : c
      )
    );
  };

  const handleReorder = (dragId: string, hoverId: string) => {
    setConversations(prevConvs => {
      const dragIndex = prevConvs.findIndex(c => c.id === dragId);
      const hoverIndex = prevConvs.findIndex(c => c.id === hoverId);
      
      if (dragIndex === -1 || hoverIndex === -1) return prevConvs;
      
      const newConvs = [...prevConvs];
      const [draggedItem] = newConvs.splice(dragIndex, 1);
      newConvs.splice(hoverIndex, 0, draggedItem);
      
      return newConvs.map((c, idx) => ({ ...c, order: idx }));
    });
  };

  const filteredConversations = conversations.filter(conv => {
    // Enhanced search: includes guest name, reservation code, property name, email, phone, and message content
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || (
      conv.guest_name.toLowerCase().includes(searchLower) ||
      conv.reservation_code.toLowerCase().includes(searchLower) ||
      conv.property_name.toLowerCase().includes(searchLower) ||
      conv.guest_email.toLowerCase().includes(searchLower) ||
      conv.guest_phone.includes(searchQuery) ||
      conv.last_message.toLowerCase().includes(searchLower) ||
      conv.messages?.some(msg => msg.content.toLowerCase().includes(searchLower))
    );
    
    // Status filter - handle 'active' as a special case (unread + read, not resolved)
    let matchesStatus = true;
    if (selectedStatuses.length > 0) {
      if (selectedStatuses.includes('active')) {
        // If 'active' is selected, show unread and read (not resolved)
        const isActive = conv.status === 'unread' || conv.status === 'read';
        const otherStatuses = selectedStatuses.filter(s => s !== 'active');
        matchesStatus = isActive || otherStatuses.includes(conv.status);
      } else {
        matchesStatus = selectedStatuses.includes(conv.status);
      }
    }
    
    const matchesChannel = selectedChannels.length === 0 || selectedChannels.includes(conv.channel);
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tagId => conv.tags?.includes(tagId));
    const matchesProperty = selectedProperties.length === 0 || (conv.property_id && selectedProperties.includes(conv.property_id));
    
    return matchesSearch && matchesStatus && matchesChannel && matchesTags && matchesProperty;
  });

  // Separar conversas por categoria e pin
  const pinnedConversations = filteredConversations.filter(c => c.isPinned).sort((a, b) => (a.order || 0) - (b.order || 0));
  const urgentConversations = filteredConversations.filter(c => !c.isPinned && c.category === 'urgent').sort((a, b) => (a.order || 0) - (b.order || 0));
  const normalConversations = filteredConversations.filter(c => !c.isPinned && c.category === 'normal').sort((a, b) => (a.order || 0) - (b.order || 0));
  const resolvedConversations = filteredConversations.filter(c => !c.isPinned && c.category === 'resolved').sort((a, b) => (a.order || 0) - (b.order || 0));

  const pinnedCount = conversations.filter(c => c.isPinned).length;
  const canPinMore = pinnedCount < 5;

  // Mock property para os modais (você vai pegar do backend)
  const mockProperty: Property = {
    id: selectedConversation?.property_id || 'prop-001',
    name: selectedConversation?.property_name || 'Casa Vista Mar',
    location: 'Cabo Frio, RJ',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    base_price: 450,
    weekend_price: 550,
    min_nights: 2,
    max_nights: 30,
    status: 'active' as const,
    created_at: new Date(),
    organization_id: 'org-001'
  };

  // Função para abrir Quick Actions
  const handleOpenQuickActions = () => {
    if (!selectedConversation) return;
    
    setModalDates({
      start: selectedConversation.checkin_date,
      end: selectedConversation.checkout_date
    });
    setSelectedPropertyForModal(mockProperty);
    setShowQuickActionsModal(true);
  };

  // Função para selecionar ação do Quick Actions Modal
  const handleSelectQuickAction = (action: 'reservation' | 'quote' | 'block' | 'tiers' | 'seasonality') => {
    setShowQuickActionsModal(false);
    
    switch (action) {
      case 'quote':
        setShowQuotationModal(true);
        break;
      case 'reservation':
        setShowReservationWizard(true);
        break;
      case 'block':
        setShowBlockModal(true);
        break;
      default:
        toast('Funcionalidade em desenvolvimento', {
          description: 'Esta ação será implementada em breve'
        });
    }
  };

  // Função para enviar cotação pelo chat
  const handleSendQuotationToChat = () => {
    if (!selectedConversation) return;
    
    const quotationMessage = `📋 Cotação enviada!\n\nPara ${selectedConversation.guest_name}\nPeríodo: ${formatDate(modalDates?.start)} a ${formatDate(modalDates?.end)}\nPropriedade: ${mockProperty.name}\n\nO link da cotação foi enviado por email.`;
    
    toast.success('Cotação enviada!', {
      description: 'A cotação foi enviada para o hóspede via chat'
    });
    
    setShowQuotationModal(false);
    // Aqui você adicionaria a mensagem ao chat
  };

  // Função para enviar reserva criada pelo chat
  const handleReservationCreatedFromChat = () => {
    if (!selectedConversation) return;
    
    toast.success('Reserva criada!', {
      description: 'A confirmação foi enviada para o hóspede'
    });
    
    setShowReservationWizard(false);
  };

  const handleSendMessage = async () => {
    if ((!messageContent.trim() && attachments.length === 0) || !selectedConversation) return;
    
    setIsSending(true);
    try {
      // ============================================
      // WHATSAPP - Enviar via Evolution API
      // ============================================
      if (selectedConversation.channel === 'whatsapp' && (selectedConversation as any).whatsapp_chat_id) {
        const whatsappChatId = (selectedConversation as any).whatsapp_chat_id;
        const phoneNumber = extractPhoneNumber(whatsappChatId);
        
        console.log('📤 Enviando mensagem pelo WhatsApp para:', phoneNumber);
        
        try {
          await sendWhatsAppMessage(phoneNumber, messageContent);
          
          // Adicionar mensagem localmente
          const newWhatsAppMessage: Message = {
            id: `msg-${Date.now()}`,
            sender_type: 'staff',
            sender_name: 'Você',
            content: messageContent,
            sent_at: new Date(),
            read_at: undefined,
          };
          
          setMessages(prev => [...prev, newWhatsAppMessage]);
          
          // Atualizar conversa
          setConversations(prev => prev.map(conv =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  last_message: messageContent,
                  last_message_at: new Date(),
                  messages: [...(conv.messages || []), newWhatsAppMessage]
                }
              : conv
          ));
          
          setMessageContent('');
          setAttachments([]);
          
          toast.success('✅ Mensagem enviada pelo WhatsApp!');
          return;
        } catch (error) {
          console.error('❌ Erro ao enviar mensagem pelo WhatsApp:', error);
          toast.error('❌ Erro ao enviar mensagem pelo WhatsApp', {
            description: 'Verifique se o WhatsApp está conectado'
          });
          setIsSending(false);
          return;
        }
      }

      // ============================================
      // SISTEMA - Enviar via API interna
      // ============================================

      // Upload files first if any
      const uploadedFiles: FileMetadata[] = [];
      if (attachments.length > 0) {
        setIsUploading(true);
        for (const file of attachments) {
          const uploadResult = await filesApi.upload(
            file,
            organizationId,
            selectedConversation.id
          );
          
          if (uploadResult.success && uploadResult.data) {
            uploadedFiles.push(uploadResult.data);
          } else {
            toast.error(`Erro ao fazer upload de ${file.name}`, {
              description: uploadResult.error
            });
          }
        }
        setIsUploading(false);
      }

      const newMessage: Partial<ApiMessage> = {
        conversation_id: selectedConversation.id,
        sender_type: isInternalNote ? 'system' : 'staff',
        sender_name: 'Você', // TODO: Get from auth context
        content: messageContent || '(anexo)',
        organization_id: organizationId,
        attachments: uploadedFiles.map(f => f.url),
        // 🆕 v1.0.101 - Multi-channel support
        channel: selectedConversation.channel || 'internal', // Use conversation's channel
        direction: 'outgoing'
      };

      const result = await messagesApi.send(selectedConversation.id, newMessage);
      
      if (result.success && result.data) {
        // Add message to list
        const formattedMessage: Message = {
          ...result.data,
          sent_at: new Date(result.data.sent_at),
          read_at: result.data.read_at ? new Date(result.data.read_at) : undefined
        };
        
        setMessages(prev => [...prev, formattedMessage]);
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                last_message: messageContent,
                last_message_at: new Date(),
                messages: [...(conv.messages || []), formattedMessage]
              }
            : conv
        ));
        
        // Clear inputs
        setMessageContent('');
        setAttachments([]);
        setIsInternalNote(false);
        
        toast.success(isInternalNote ? 'Nota interna adicionada' : 'Mensagem enviada');
      } else {
        toast.error('Erro ao enviar mensagem', {
          description: result.error || 'Tente novamente'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleUseTemplate = (template: TemplateType) => {
    if (!selectedConversation) return;
    
    let content = template.content;
    content = content.replace('{guest_name}', selectedConversation.guest_name);
    content = content.replace('{property_name}', selectedConversation.property_name);
    content = content.replace('{checkin_date}', selectedConversation.checkin_date.toLocaleDateString('pt-BR'));
    content = content.replace('{checkout_date}', selectedConversation.checkout_date.toLocaleDateString('pt-BR'));
    
    setMessageContent(content);
    setShowTemplatePopup(false);
    setTemplateSearchTerm('');
    setSelectedTemplateIndex(0);
  };

  // Detectar "/" para abrir popup de templates
  const handleMessageContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageContent(value);

    // Detectar se digitou "/"
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    // Se encontrou "/" e é o início ou tem espaço antes
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === ' ' || textBeforeCursor[lastSlashIndex - 1] === '\n')) {
      const searchText = textBeforeCursor.substring(lastSlashIndex + 1);
      // Se não tem espaço depois do "/" (ainda está digitando o comando)
      if (!searchText.includes(' ') && !searchText.includes('\n')) {
        setTemplateSearchTerm(searchText.toLowerCase());
        setShowTemplatePopup(true);
        setSelectedTemplateIndex(0);
        return;
      }
    }
    
    // Fechar popup se não encontrou padrão válido
    setShowTemplatePopup(false);
    setTemplateSearchTerm('');
  };

  // Filtrar templates baseado no termo de busca
  const filteredTemplatesForPopup = templates.filter(template => 
    template.name.toLowerCase().includes(templateSearchTerm) ||
    template.category.toLowerCase().includes(templateSearchTerm)
  );

  // Inserir template selecionado via popup
  const insertTemplateFromPopup = (template: TemplateType) => {
    if (!selectedConversation || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = messageContent.substring(0, cursorPosition);
    const textAfterCursor = messageContent.substring(cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    // Preparar conteúdo do template
    let content = template.content;
    content = content.replace('{guest_name}', selectedConversation.guest_name);
    content = content.replace('{property_name}', selectedConversation.property_name);
    content = content.replace('{checkin_date}', selectedConversation.checkin_date.toLocaleDateString('pt-BR'));
    content = content.replace('{checkout_date}', selectedConversation.checkout_date.toLocaleDateString('pt-BR'));

    // Substituir desde o "/" até o cursor pelo template
    const newContent = textBeforeCursor.substring(0, lastSlashIndex) + content + textAfterCursor;
    setMessageContent(newContent);
    setShowTemplatePopup(false);
    setTemplateSearchTerm('');
    setSelectedTemplateIndex(0);

    // Focar no textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = lastSlashIndex + content.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleSaveTemplate = (template: TemplateType) => {
    const updatedTemplates = templates.find(t => t.id === template.id)
      ? templates.map(t => t.id === template.id ? template : t)
      : [...templates, template];
    
    setTemplates(updatedTemplates);
    localStorage.setItem('rendizy_chat_templates', JSON.stringify(updatedTemplates));
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('rendizy_chat_templates', JSON.stringify(updatedTemplates));
  };

  // Funções de Tags
  const handleSaveTag = (tag: ChatTag) => {
    const updatedTags = chatTags.find(t => t.id === tag.id)
      ? chatTags.map(t => t.id === tag.id ? tag : t)
      : [...chatTags, tag];
    
    setChatTags(updatedTags);
    localStorage.setItem('rendizy_chat_tags', JSON.stringify(updatedTags));
  };

  const handleDeleteTag = (id: string) => {
    const updatedTags = chatTags.filter(t => t.id !== id);
    setChatTags(updatedTags);
    localStorage.setItem('rendizy_chat_tags', JSON.stringify(updatedTags));
    
    // Remove tag de todas as conversas
    const updatedConversations = conversations.map(conv => ({
      ...conv,
      tags: conv.tags?.filter(tagId => tagId !== id) || []
    }));
    setConversations(updatedConversations);
  };

  const handleToggleConversationTag = (conversationId: string, tagId: string) => {
    setConversations(prevConvs => prevConvs.map(conv => {
      if (conv.id === conversationId) {
        const currentTags = conv.tags || [];
        const newTags = currentTags.includes(tagId)
          ? currentTags.filter(t => t !== tagId)
          : [...currentTags, tagId];
        return { ...conv, tags: newTags };
      }
      return conv;
    }));

    // Atualiza contador nas tags
    updateTagCounts();
  };

  const updateTagCounts = () => {
    const updatedTags = chatTags.map(tag => ({
      ...tag,
      conversations_count: conversations.filter(conv => conv.tags?.includes(tag.id)).length
    }));
    setChatTags(updatedTags);
    localStorage.setItem('rendizy_chat_tags', JSON.stringify(updatedTags));
  };

  // Seleção múltipla
  const handleToggleSelection = (conversationId: string) => {
    setSelectedConversationIds(prev =>
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedConversationIds.length === filteredConversations.length) {
      setSelectedConversationIds([]);
    } else {
      setSelectedConversationIds(filteredConversations.map(c => c.id));
    }
  };

  const handleBulkAddTags = (tagIds: string[]) => {
    setConversations(prevConvs => prevConvs.map(conv => {
      if (selectedConversationIds.includes(conv.id)) {
        const currentTags = conv.tags || [];
        const newTags = Array.from(new Set([...currentTags, ...tagIds]));
        return { ...conv, tags: newTags };
      }
      return conv;
    }));

    toast.success('Tags adicionadas!', {
      description: `${tagIds.length} tag(s) adicionada(s) a ${selectedConversationIds.length} conversa(s)`
    });

    setSelectedConversationIds([]);
    setIsSelectionMode(false);
    updateTagCounts();
  };

  const handleBulkRemoveTags = (tagIds: string[]) => {
    setConversations(prevConvs => prevConvs.map(conv => {
      if (selectedConversationIds.includes(conv.id)) {
        const newTags = (conv.tags || []).filter(t => !tagIds.includes(t));
        return { ...conv, tags: newTags };
      }
      return conv;
    }));

    toast.success('Tags removidas!', {
      description: `${tagIds.length} tag(s) removida(s) de ${selectedConversationIds.length} conversa(s)`
    });

    setSelectedConversationIds([]);
    setIsSelectionMode(false);
    updateTagCounts();
  };

  const unreadCount = conversations.filter(c => c.status === 'unread').length;
  const activeCount = conversations.filter(c => c.status !== 'resolved').length;

  return (
    <div className="flex h-full bg-white dark:bg-[#1a1f2e]">
      {/* Sidebar de Filtros - Novo Componente Padrão */}
      {!isSidebarCollapsed && (
        <ChatFilterSidebar
          properties={properties}
          selectedProperties={selectedProperties}
          onToggleProperty={(id) => {
            if (selectedProperties.includes(id)) {
              setSelectedProperties(selectedProperties.filter(p => p !== id));
            } else {
              setSelectedProperties([...selectedProperties, id]);
            }
          }}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          selectedChannels={selectedChannels}
          onChannelsChange={setSelectedChannels}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          chatTags={chatTags}
          onManageTags={() => setShowTagsManager(true)}
        />
      )}

      {/* Botão para reabrir sidebar quando colapsado */}
      {isSidebarCollapsed && (
        <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 bg-white dark:bg-[#1a1f2e]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lista de Conversas */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* WhatsApp Integration */}
        <WhatsAppChatsImporter 
          onChatsLoaded={handleWhatsAppChatsLoaded}
        />
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900 dark:text-white">
              Conversas ({filteredConversations.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant={isSelectionMode ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedConversationIds([]);
                }}
                className="h-8 w-8"
                title={isSelectionMode ? "Cancelar seleção" : "Selecionar conversas"}
              >
                {isSelectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Barra de Ações em Lote */}
          {isSelectionMode && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-900 dark:text-blue-300">
                  {selectedConversationIds.length} {selectedConversationIds.length === 1 ? 'selecionada' : 'selecionadas'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                >
                  {selectedConversationIds.length === filteredConversations.length ? 'Desmarcar' : 'Todas'}
                </Button>
              </div>

              {selectedConversationIds.length > 0 && (
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="flex-1 h-8 text-xs">
                        <Tags className="h-3 w-3 mr-1" />
                        + Tags
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {chatTags.map(tag => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => handleBulkAddTags([tag.id])}
                        >
                          <Badge className={tag.color}>
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <Tags className="h-3 w-3 mr-1" />
                        - Tags
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {chatTags.map(tag => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => handleBulkRemoveTags([tag.id])}
                        >
                          <Badge className={tag.color}>
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}

          {/* Info Fixadas */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Pin className="h-3 w-3" />
            <span>Fixadas: {pinnedCount}/5</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}

          {/* Conversas Fixadas */}
          {!isLoading && pinnedConversations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20">
              <div className="px-4 py-2 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <Pin className="h-3 w-3" />
                  <span>Fixadas ({pinnedConversations.length})</span>
                </div>
              </div>
              {pinnedConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onSelect={() => setSelectedConversation(conversation)}
                  onPin={() => handleTogglePin(conversation.id)}
                  onCategoryChange={(cat) => handleCategoryChange(conversation.id, cat)}
                  onReorder={handleReorder}
                  formatTime={formatTime}
                  getChannelIcon={getChannelIcon}
                  getChannelColor={getChannelColor}
                  isPinned={true}
                  canPin={canPinMore}
                  isSelectionMode={isSelectionMode}
                  isSelectedForBulk={selectedConversationIds.includes(conversation.id)}
                  onToggleSelection={() => handleToggleSelection(conversation.id)}
                  chatTags={chatTags}
                  onToggleTag={(tagId) => handleToggleConversationTag(conversation.id, tagId)}
                />
              ))}
            </div>
          )}

          {/* Conversas Urgentes */}
          {urgentConversations.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 border-y border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
                  <Zap className="h-3 w-3 fill-orange-500 text-orange-500" />
                  <span>Urgentes ({urgentConversations.length})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {urgentConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={() => setSelectedConversation(conversation)}
                    onPin={() => handleTogglePin(conversation.id)}
                    onCategoryChange={(cat) => handleCategoryChange(conversation.id, cat)}
                    onReorder={handleReorder}
                    formatTime={formatTime}
                    getChannelIcon={getChannelIcon}
                    getChannelColor={getChannelColor}
                    isPinned={conversation.isPinned || false}
                    canPin={canPinMore}
                    isSelectionMode={isSelectionMode}
                    isSelectedForBulk={selectedConversationIds.includes(conversation.id)}
                    onToggleSelection={() => handleToggleSelection(conversation.id)}
                    chatTags={chatTags}
                    onToggleTag={(tagId) => handleToggleConversationTag(conversation.id, tagId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conversas Normais */}
          {normalConversations.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <MessageSquare className="h-3 w-3" />
                  <span>Normais ({normalConversations.length})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {normalConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={() => setSelectedConversation(conversation)}
                    onPin={() => handleTogglePin(conversation.id)}
                    onCategoryChange={(cat) => handleCategoryChange(conversation.id, cat)}
                    onReorder={handleReorder}
                    formatTime={formatTime}
                    getChannelIcon={getChannelIcon}
                    getChannelColor={getChannelColor}
                    isPinned={conversation.isPinned || false}
                    canPin={canPinMore}
                    isSelectionMode={isSelectionMode}
                    isSelectedForBulk={selectedConversationIds.includes(conversation.id)}
                    onToggleSelection={() => handleToggleSelection(conversation.id)}
                    chatTags={chatTags}
                    onToggleTag={(tagId) => handleToggleConversationTag(conversation.id, tagId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conversas Resolvidas */}
          {resolvedConversations.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 border-y border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <CheckCheck className="h-3 w-3" />
                  <span>Resolvidas ({resolvedConversations.length})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {resolvedConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={() => setSelectedConversation(conversation)}
                    onPin={() => handleTogglePin(conversation.id)}
                    onCategoryChange={(cat) => handleCategoryChange(conversation.id, cat)}
                    onReorder={handleReorder}
                    formatTime={formatTime}
                    getChannelIcon={getChannelIcon}
                    getChannelColor={getChannelColor}
                    isPinned={conversation.isPinned || false}
                    canPin={canPinMore}
                    isSelectionMode={isSelectionMode}
                    isSelectedForBulk={selectedConversationIds.includes(conversation.id)}
                    onToggleSelection={() => handleToggleSelection(conversation.id)}
                    chatTags={chatTags}
                    onToggleTag={(tagId) => handleToggleConversationTag(conversation.id, tagId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mensagem quando vazio */}
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">Nenhuma conversa encontrada</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Thread de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-gray-900 dark:text-white">
                      {selectedConversation.guest_name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {selectedConversation.reservation_code}
                      </Badge>
                      <span>•</span>
                      <span>{selectedConversation.property_name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {selectedConversation.guest_email}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {selectedConversation.guest_phone}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Marcar como não lida</DropdownMenuItem>
                      <DropdownMenuItem>Marcar como resolvida</DropdownMenuItem>
                      <DropdownMenuItem>Ver reserva</DropdownMenuItem>
                      <DropdownMenuItem>Ver hóspede</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Info da Reserva */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedConversation.checkin_date.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedConversation.checkout_date.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="mt-3">
                {selectedConversation.conversation_type === 'lead' ? (
                  // LEAD: Mostra botões para negociação
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mb-2">
                      <Users className="h-3 w-3" />
                      <span>NEGOCIAÇÃO - Cliente interessado</span>
                      {selectedConversation.lead_data && (
                        <span className="text-gray-500">
                          • {selectedConversation.lead_data.num_guests} pessoas
                          {selectedConversation.lead_data.desired_location && ` • ${selectedConversation.lead_data.desired_location}`}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={handleOpenQuickActions}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Fazer Cotação
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setModalDates({
                            start: selectedConversation.checkin_date,
                            end: selectedConversation.checkout_date
                          });
                          setShowReservationWizard(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Criar Reserva
                      </Button>
                    </div>
                  </div>
                ) : (
                  // HÓSPEDE: Mostra botões para ações na reserva existente
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mb-2">
                      <Home className="h-3 w-3" />
                      <span>HÓSPEDE - Reserva {selectedConversation.reservation_code}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={handleOpenQuickActions}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Ações Rápidas
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setModalDates({
                            start: selectedConversation.checkin_date,
                            end: selectedConversation.checkout_date
                          });
                          setShowBlockModal(true);
                        }}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Bloqueio
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                  </div>
                )}
                {messages.map((message) => {
                  // Check if it's an internal note (system type)
                  const isInternalNote = message.sender_type === 'system';
                  
                  if (isInternalNote) {
                    // Render internal note differently
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-[80%] bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <StickyNote className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              NOTA INTERNA
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{message.sender_name}</span>
                            <span>•</span>
                            <span>{formatTime(message.sent_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular message
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'guest' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'guest'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'bg-[#2563eb] text-white'
                        }`}
                      >
                        {message.sender_type === 'guest' && (
                          <div className="text-xs mb-1 opacity-70">
                            {message.sender_name}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs opacity-80"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          message.sender_type === 'staff' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>{formatTime(message.sent_at)}</span>
                          {/* 🆕 v1.0.101 - Multi-channel delivery status */}
                          {renderDeliveryStatus(message)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Composer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* Templates rápidos */}
              <div className="mb-3 flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="flex flex-col items-start"
                      >
                        <span>{template.name}</span>
                        <span className="text-xs text-gray-500">
                          {template.category === 'pre_checkin' && 'Pré Check-in'}
                          {template.category === 'post_checkout' && 'Pós Check-out'}
                          {template.category === 'during_stay' && 'Durante a Estadia'}
                          {template.category === 'payment' && 'Pagamento'}
                          {template.category === 'general' && 'Geral'}
                          {template.category === 'urgent' && 'Urgente'}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateManager(true)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Gerenciar
                </Button>
              </div>

              {/* File attachments preview */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <File className="h-4 w-4" />
                      )}
                      <span className="max-w-[200px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Internal note toggle */}
              <div className="mb-2 flex items-center gap-2">
                <Checkbox
                  id="internal-note"
                  checked={isInternalNote}
                  onCheckedChange={(checked) => setIsInternalNote(checked as boolean)}
                />
                <Label 
                  htmlFor="internal-note"
                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  <StickyNote className="inline h-3 w-3 mr-1" />
                  Nota interna (visível apenas para equipe)
                </Label>
              </div>

              <div className="flex items-end gap-2 relative">
                <div className="flex-1 relative">
                  {/* Popup de Templates */}
                  {showTemplatePopup && filteredTemplatesForPopup.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1.5 flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Templates disponíveis {templateSearchTerm && `(${filteredTemplatesForPopup.length})`}
                        </div>
                        <Separator className="my-1" />
                        {filteredTemplatesForPopup.map((template, index) => (
                          <div
                            key={template.id}
                            className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                              index === selectedTemplateIndex
                                ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                            onClick={() => insertTemplateFromPopup(template)}
                            onMouseEnter={() => setSelectedTemplateIndex(index)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 dark:text-white truncate">
                                  {template.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {template.category === 'pre_checkin' && 'Pré Check-in'}
                                  {template.category === 'post_checkout' && 'Pós Check-out'}
                                  {template.category === 'during_stay' && 'Durante a Estadia'}
                                  {template.category === 'payment' && 'Pagamento'}
                                  {template.category === 'general' && 'Geral'}
                                  {template.category === 'urgent' && 'Urgente'}
                                </div>
                              </div>
                              {index === selectedTemplateIndex && (
                                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                              )}
                            </div>
                          </div>
                        ))}
                        <Separator className="my-1" />
                        <div className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 flex items-center justify-between">
                          <span>Use ↑↓ para navegar</span>
                          <span>ESC para fechar</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Textarea
                    ref={textareaRef}
                    placeholder="Digite sua mensagem ou use / para templates..."
                    value={messageContent}
                    onChange={handleMessageContentChange}
                    onKeyDown={(e) => {
                      // Navegação no popup de templates
                      if (showTemplatePopup && filteredTemplatesForPopup.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSelectedTemplateIndex(prev => 
                            prev < filteredTemplatesForPopup.length - 1 ? prev + 1 : 0
                          );
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSelectedTemplateIndex(prev => 
                            prev > 0 ? prev - 1 : filteredTemplatesForPopup.length - 1
                          );
                          return;
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          insertTemplateFromPopup(filteredTemplatesForPopup[selectedTemplateIndex]);
                          return;
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowTemplatePopup(false);
                          setTemplateSearchTerm('');
                          return;
                        }
                      }
                      
                      // Enviar mensagem normalmente
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon"
                    disabled={isSending || (!messageContent.trim() && attachments.length === 0)}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

      {/* Modais de Ação Rápida */}
      {modalDates && selectedPropertyForModal && (
        <>
          {/* Modal de Ações Rápidas */}
          <QuickActionsModal
            open={showQuickActionsModal}
            onClose={() => setShowQuickActionsModal(false)}
            startDate={modalDates.start}
            endDate={modalDates.end}
            propertyId={selectedPropertyForModal.id}
            propertyName={selectedPropertyForModal.name}
            onSelectAction={handleSelectQuickAction}
          />

          {/* Modal de Cotação */}
          <QuotationModal
            isOpen={showQuotationModal}
            onClose={() => setShowQuotationModal(false)}
            property={selectedPropertyForModal}
            startDate={modalDates.start}
            endDate={modalDates.end}
          />

          {/* Modal de Bloqueio */}
          <BlockModal
            isOpen={showBlockModal}
            onClose={() => setShowBlockModal(false)}
            startDate={modalDates.start}
            endDate={modalDates.end}
            propertyId={selectedPropertyForModal.id}
            propertyName={selectedPropertyForModal.name}
          />
        </>
      )}

      {/* Wizard de Criar Reserva */}
      {modalDates && (
        <CreateReservationWizard
          isOpen={showReservationWizard}
          onClose={() => setShowReservationWizard(false)}
          initialStartDate={modalDates.start}
          initialEndDate={modalDates.end}
          prefilledGuest={selectedConversation ? {
            name: selectedConversation.guest_name,
            email: selectedConversation.guest_email,
            phone: selectedConversation.guest_phone
          } : undefined}
        />
      )}

      {/* Gerenciador de Templates */}
      <TemplateManagerModal
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      {/* Gerenciador de Tags */}
      <ChatTagsModal
        open={showTagsManager}
        onClose={() => setShowTagsManager(false)}
        tags={chatTags}
        onSaveTag={handleSaveTag}
        onDeleteTag={handleDeleteTag}
      />
    </div>
  );
}
