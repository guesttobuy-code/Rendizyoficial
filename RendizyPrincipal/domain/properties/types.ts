/**
 * DOMAIN LAYER - Types e constantes para Properties V3
 * Sem React, sem HTTP. Pura modelagem do negócio.
 * OTA-Ready: Preparado para integração com OTAs de hotelaria
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export type PropertyStatus = 'draft' | 'published' | 'archived';

// Tipos de Local (Structure Types) - baseado no backend routes-property-types.ts
export type PropertyLocationType = 
  | 'acomodacao_movel' | 'albergue' | 'apartamento' | 'apartamento_residencial'
  | 'bangalo' | 'barco' | 'barco_beira' | 'boutique' | 'cabana' | 'cama_cafe'
  | 'camping' | 'casa' | 'casa_movel' | 'castelo' | 'chale' | 'chale_camping'
  | 'condominio' | 'estalagem' | 'fazenda' | 'hotel' | 'hotel_boutique' | 'hostel'
  | 'iate' | 'industrial' | 'motel' | 'pousada' | 'residencia' | 'resort'
  | 'treehouse' | 'villa';

// Tipos de Acomodação (Accommodation Types)
export type PropertyAccommodationType =
  | 'apartamento' | 'bangalo' | 'cabana' | 'camping' | 'capsula' | 'casa'
  | 'casa_dormitorios' | 'chale' | 'condominio' | 'dormitorio' | 'estudio'
  | 'holiday_home' | 'hostel' | 'hotel' | 'iate' | 'industrial' | 'loft'
  | 'quarto_compartilhado' | 'quarto_inteiro' | 'quarto_privado' | 'suite'
  | 'treehouse' | 'villa';

// Modalidades de uso (múltipla seleção)
export type PropertyModality = 'seasonal' | 'sale' | 'residential';

// Tipo de anúncio
export type AnnouncementType = 'individual' | 'linked';

// Tipo legado (compatibilidade)
export type PropertyType = 'residential' | 'commercial' | 'land' | 'other';

export const PROPERTY_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  LAND: 'land',
  OTHER: 'other'
} as const;

export const PROPERTY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const;

// ============================================================================
// WIZARD STEPS - O que o usuário preenche em cada etapa
// ============================================================================

export enum PropertyStep {
  BASIC_INFO = 0,
  ADDRESS = 1,
  DETAILS = 2,
  PRICING = 3,
  GALLERY = 4,
  PUBLISH = 5
}

export const PROPERTY_STEPS_CONFIG = {
  [PropertyStep.BASIC_INFO]: {
    title: 'Tipo e Identificação',
    fields: ['internalName', 'propertyType', 'accommodationType', 'subtype', 'modalities', 'announcementType']
  },
  [PropertyStep.ADDRESS]: {
    title: 'Localização',
    fields: ['street', 'number', 'complement', 'city', 'state', 'zipCode']
  },
  [PropertyStep.DETAILS]: {
    title: 'Cômodos e Fotos',
    fields: ['bedrooms', 'bathrooms', 'area', 'totalArea', 'buildYear']
  },
  [PropertyStep.PRICING]: {
    title: 'Financeiro',
    fields: ['price', 'pricePerUnit']
  },
  [PropertyStep.GALLERY]: {
    title: 'Galeria',
    fields: ['images']
  },
  [PropertyStep.PUBLISH]: {
    title: 'Publicar',
    fields: []
  }
} as const;

// ============================================================================
// DADOS ESTRUTURADOS POR SEÇÃO
// ============================================================================

/**
 * Step 0: Tipo e Identificação (OTA-Ready)
 */
export interface BasicInfo {
  // === Identificação ===
  internalName: string;                          // Nome interno (obrigatório)
  
  // === Tipo e Classificação (OTA) ===
  propertyType: PropertyLocationType | '';       // Tipo do local (obrigatório)
  accommodationType: PropertyAccommodationType | ''; // Tipo de acomodação (obrigatório)
  subtype?: string;                              // Subtipo (opcional)
  
  // === Modalidade (múltipla seleção) ===
  modalities: Set<PropertyModality>;             // Temporada, Venda, Residencial
  
  // === Estrutura do Anúncio ===
  announcementType: AnnouncementType;            // Individual ou Vinculado
  linkedProperties?: string[];                   // IDs de propriedades vinculadas
  totalUnits?: number;                           // Quantidade de acomodações (se linked)
  
  // === Campos Legados (compatibilidade) ===
  title?: string;                                // @deprecated - usar internalName
  description?: string;                          // @deprecated - movido para outro step
  type?: PropertyType;                           // @deprecated - usar propertyType
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface Details {
  bedrooms: number;
  bathrooms: number;
  area: number; // área útil em m²
  totalArea: number; // área total do terreno
  buildYear?: number;
  garage?: number;
}

export interface Pricing {
  price: number;
  pricePerUnit?: number; // preço por m² por exemplo
}

export interface ImageData {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export interface GalleryData {
  images: ImageData[];
}

// ============================================================================
// ERRO DE VALIDAÇÃO
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// PROPRIEDADE - MODEL CENTRAL
// ============================================================================

export interface PropertyDraft {
  // Identidade
  id: string;
  tenantId: string;
  
  // Versionamento - prevenir conflitos
  version: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Status
  status: PropertyStatus;
  
  // Dados da propriedade
  basicInfo: BasicInfo;
  address: Address;
  details: Details;
  pricing: Pricing;
  gallery: GalleryData;
  
  // Estado do wizard
  completedSteps: Set<PropertyStep>;
  
  // Erros de validação por step
  stepErrors: Map<PropertyStep, ValidationError[]>;
}

// ============================================================================
// FACTORY - Criar uma property em branco
// ============================================================================

export function createEmptyProperty(tenantId: string): PropertyDraft {
  return {
    id: generateId(),
    tenantId,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    
    basicInfo: {
      internalName: '',
      propertyType: '',
      accommodationType: '',
      subtype: '',
      modalities: new Set(),
      announcementType: 'individual',
      linkedProperties: [],
      totalUnits: 0,
      // Legados (compatibilidade)
      title: '',
      description: '',
      type: 'residential'
    },
    
    address: {
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      zipCode: ''
    },
    
    details: {
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      totalArea: 0
    },
    
    pricing: {
      price: 0,
      pricePerUnit: 0
    },
    
    gallery: {
      images: []
    },
    
    completedSteps: new Set(),
    stepErrors: new Map()
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isPropertyComplete(property: PropertyDraft): boolean {
  // Property é completa quando todos os steps estão completed
  const totalSteps = Object.values(PropertyStep).filter(v => typeof v === 'number').length;
  return property.completedSteps.size === totalSteps;
}

export function getCompletionPercentage(property: PropertyDraft): number {
  const totalSteps = Object.values(PropertyStep).filter(v => typeof v === 'number').length;
  return Math.round((property.completedSteps.size / totalSteps) * 100);
}

export function getStepTitle(step: PropertyStep): string {
  return PROPERTY_STEPS_CONFIG[step]?.title || 'Desconhecido';
}

export function getStepFields(step: PropertyStep): string[] {
  return PROPERTY_STEPS_CONFIG[step]?.fields || [];
}
