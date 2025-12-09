/**
 * CONSTANTES - Steps do Wizard de Propriedades V3
 * Define estrutura de 17 steps em 3 blocos
 */

import { Home, MapPin, DoorOpen, Image, Building2, Sparkles, FileText, Receipt, DollarSign, Users, ShieldAlert, Calendar, Tag, CalendarRange, Share2 } from 'lucide-react';

export enum PropertyStepId {
  // BLOCO 1: CONTEÚDO (7 steps)
  TYPE_IDENTIFICATION = 1,
  LOCATION = 2,
  ROOMS = 3,
  TOUR = 4,
  LOCAL_AMENITIES = 5,
  ACCOMMODATION_AMENITIES = 6,
  DESCRIPTION = 7,

  // BLOCO 2: FINANCEIRO (5 steps)
  CONTRACT = 8,
  RESIDENTIAL_PRICING = 9,
  SEASONAL_CONFIG = 10,
  INDIVIDUAL_PRICING = 11,
  DERIVED_PRICING = 12,

  // BLOCO 3: CONFIGURAÇÕES (5 steps)
  RULES = 13,
  BOOKING_CONFIG = 14,
  TAGS_GROUPS = 15,
  ICAL_SYNC = 16,
  OTA_INTEGRATIONS = 17
}

export type StepValidation = 'required' | 'recommended' | 'optional';

export interface PropertyStepConfig {
  id: PropertyStepId;
  title: string;
  subtitle: string;
  validation: StepValidation;
  icon: any;
  block: 'content' | 'financial' | 'settings';
}

export const PROPERTY_STEPS: PropertyStepConfig[] = [
  // BLOCO 1: CONTEÚDO
  {
    id: PropertyStepId.TYPE_IDENTIFICATION,
    title: 'Tipo e Identificação',
    subtitle: 'Que tipo de propriedade você está anunciando?',
    validation: 'required',
    icon: Home,
    block: 'content'
  },
  {
    id: PropertyStepId.LOCATION,
    title: 'Localização',
    subtitle: 'Onde fica sua propriedade?',
    validation: 'required',
    icon: MapPin,
    block: 'content'
  },
  {
    id: PropertyStepId.ROOMS,
    title: 'Cômodos e Fotos',
    subtitle: 'Defina cômodos e adicione fotos',
    validation: 'recommended',
    icon: DoorOpen,
    block: 'content'
  },
  {
    id: PropertyStepId.TOUR,
    title: 'Tour Visual',
    subtitle: 'Visualize o tour da propriedade',
    validation: 'recommended',
    icon: Image,
    block: 'content'
  },
  {
    id: PropertyStepId.LOCAL_AMENITIES,
    title: 'Amenidades do Local',
    subtitle: 'Comodidades herdadas do local',
    validation: 'optional',
    icon: Building2,
    block: 'content'
  },
  {
    id: PropertyStepId.ACCOMMODATION_AMENITIES,
    title: 'Amenidades da Acomodação',
    subtitle: 'Comodidades específicas desta unidade',
    validation: 'recommended',
    icon: Sparkles,
    block: 'content'
  },
  {
    id: PropertyStepId.DESCRIPTION,
    title: 'Descrição',
    subtitle: 'Descreva sua propriedade',
    validation: 'required',
    icon: FileText,
    block: 'content'
  },

  // BLOCO 2: FINANCEIRO
  {
    id: PropertyStepId.CONTRACT,
    title: 'Configuração de Relacionamento',
    subtitle: 'Configure titular, remuneração e comunicação',
    validation: 'required',
    icon: Receipt,
    block: 'financial'
  },
  {
    id: PropertyStepId.RESIDENTIAL_PRICING,
    title: 'Preços Locação e Venda',
    subtitle: 'Valores de locação residencial e venda de imóveis',
    validation: 'optional',
    icon: Home,
    block: 'financial'
  },
  {
    id: PropertyStepId.SEASONAL_CONFIG,
    title: 'Configuração de preço temporada',
    subtitle: 'Configure taxas de limpeza, serviços e encargos adicionais',
    validation: 'recommended',
    icon: Receipt,
    block: 'financial'
  },
  {
    id: PropertyStepId.INDIVIDUAL_PRICING,
    title: 'Precificação Individual de Temporada',
    subtitle: 'Defina preços de diárias, períodos sazonais e descontos',
    validation: 'required',
    icon: DollarSign,
    block: 'financial'
  },
  {
    id: PropertyStepId.DERIVED_PRICING,
    title: 'Preços Derivados',
    subtitle: 'Configure taxas por hóspede adicional e faixas etárias',
    validation: 'recommended',
    icon: Users,
    block: 'financial'
  },

  // BLOCO 3: CONFIGURAÇÕES
  {
    id: PropertyStepId.RULES,
    title: 'Regras de Hospedagem',
    subtitle: 'Regras da acomodação',
    validation: 'required',
    icon: ShieldAlert,
    block: 'settings'
  },
  {
    id: PropertyStepId.BOOKING_CONFIG,
    title: 'Configurações de Reserva',
    subtitle: 'Como aceitar reservas?',
    validation: 'optional',
    icon: Calendar,
    block: 'settings'
  },
  {
    id: PropertyStepId.TAGS_GROUPS,
    title: 'Tags e Grupos',
    subtitle: 'Organize sua propriedade',
    validation: 'optional',
    icon: Tag,
    block: 'settings'
  },
  {
    id: PropertyStepId.ICAL_SYNC,
    title: 'iCal e Sincronização',
    subtitle: 'Sincronizar calendários',
    validation: 'optional',
    icon: CalendarRange,
    block: 'settings'
  },
  {
    id: PropertyStepId.OTA_INTEGRATIONS,
    title: 'Integrações OTAs',
    subtitle: 'Canais de distribuição',
    validation: 'optional',
    icon: Share2,
    block: 'settings'
  }
];

export const getStepConfig = (stepId: PropertyStepId): PropertyStepConfig | undefined => {
  return PROPERTY_STEPS.find(s => s.id === stepId);
};

export const getStepsByBlock = (block: 'content' | 'financial' | 'settings'): PropertyStepConfig[] => {
  return PROPERTY_STEPS.filter(s => s.block === block);
};

export const getBlockTitle = (block: 'content' | 'financial' | 'settings'): string => {
  const titles = {
    content: 'Conteúdo',
    financial: 'Financeiro',
    settings: 'Configurações'
  };
  return titles[block];
};

export const getValidationBadgeColor = (validation: StepValidation): string => {
  const colors = {
    required: 'bg-red-500 text-white',
    recommended: 'bg-orange-500 text-white',
    optional: 'bg-gray-400 text-white'
  };
  return colors[validation];
};

export const getValidationLabel = (validation: StepValidation): string => {
  const labels = {
    required: 'Obrigatório',
    recommended: 'Recomendado',
    optional: 'Opcional'
  };
  return labels[validation];
};

/**
 * Mapeia PropertyStepId (17 steps da UI) para PropertyStep (6 steps do domain)
 * Necessário porque o Domain Layer usa PropertyStep com índices 0-5
 * Mas a UI usa PropertyStepId com 17 steps
 */
export function mapStepIdToPropertyStep(stepId: PropertyStepId): number {
  // PropertyStep enum: BASIC_INFO=0, ADDRESS=1, DETAILS=2, PRICING=3, GALLERY=4, PUBLISH=5
  const mapping: Record<PropertyStepId, number> = {
    [PropertyStepId.TYPE_IDENTIFICATION]: 0,  // BASIC_INFO
    [PropertyStepId.LOCATION]: 1,              // ADDRESS
    [PropertyStepId.ROOMS]: 2,                 // DETAILS
    [PropertyStepId.TOUR]: 2,                  // DETAILS (compartilha)
    [PropertyStepId.LOCAL_AMENITIES]: 2,       // DETAILS (compartilha)
    [PropertyStepId.ACCOMMODATION_AMENITIES]: 2, // DETAILS (compartilha)
    [PropertyStepId.DESCRIPTION]: 2,           // DETAILS (compartilha)
    [PropertyStepId.CONTRACT]: 3,              // PRICING (financeiro)
    [PropertyStepId.RESIDENTIAL_PRICING]: 3,   // PRICING
    [PropertyStepId.SEASONAL_CONFIG]: 3,       // PRICING
    [PropertyStepId.INDIVIDUAL_PRICING]: 3,    // PRICING
    [PropertyStepId.DERIVED_PRICING]: 3,       // PRICING
    [PropertyStepId.RULES]: 4,                 // GALLERY (configs)
    [PropertyStepId.BOOKING_CONFIG]: 4,        // GALLERY (configs)
    [PropertyStepId.TAGS_GROUPS]: 4,           // GALLERY (configs)
    [PropertyStepId.ICAL_SYNC]: 4,             // GALLERY (configs)
    [PropertyStepId.OTA_INTEGRATIONS]: 4       // GALLERY (configs)
  };
  
  return mapping[stepId] ?? 0;
}
