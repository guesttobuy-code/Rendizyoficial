/**
 * Tipos e Interfaces para o módulo CRM - Deals/Negócios
 */

export type DealStage = 
  | 'QUALIFIED' 
  | 'CONTACT_MADE' 
  | 'MEETING_ARRANGED' 
  | 'PROPOSAL_MADE' 
  | 'NEGOTIATIONS'
  | 'WON'
  | 'LOST';

export type DealSource = 'WHATSAPP' | 'EMAIL' | 'AIRBNB' | 'PHONE' | 'WEBSITE' | 'OTHER';

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'STAGE_CHANGE';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: 'BRL' | 'USD' | 'EUR';
  stage: DealStage;
  source: DealSource;
  probability: number; // 0-100
  contactId?: string;
  contactName: string;
  contactAvatar?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
  isStale?: boolean; // Lead estagnado
  products?: DealProduct[];
  notes?: string;
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: ActivityType;
  title: string;
  description?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface DealContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  company?: string;
  source: DealSource;
}

export interface DealMessage {
  id: string;
  dealId: string;
  contactId: string;
  content: string;
  sender: 'USER' | 'CONTACT';
  source: DealSource;
  createdAt: string;
  read: boolean;
}

export interface DealStageConfig {
  id: DealStage;
  label: string;
  order: number;
  color: string;
  deals: Deal[];
  totalValue: number;
}

