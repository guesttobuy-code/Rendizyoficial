/**
 * PROPERTY CONSTANTS - Listas de tipos OTA
 * Baseado em: supabase/functions/rendizy-server/routes-property-types.ts
 * 
 * Estas listas são usadas nos selects/dropdowns do Step 1
 */

export interface PropertyTypeOption {
  code: string;
  name: string;
  icon?: string;
  description?: string;
}

// ============================================================================
// TIPOS DE LOCAL (Structure Types)
// ============================================================================

export const LOCATION_TYPES: PropertyTypeOption[] = [
  { code: 'acomodacao_movel', name: 'Acomodação Móvel', icon: '🚐', description: 'Trailers, motorhomes, etc' },
  { code: 'albergue', name: 'Albergue', icon: '🏕️', description: 'Hospedagem compartilhada' },
  { code: 'apartamento', name: 'Apartamento', icon: '🏢', description: 'Unidade residencial em prédio' },
  { code: 'apartamento_residencial', name: 'Apartamento/Residencial', icon: '🏘️', description: 'Condomínio residencial' },
  { code: 'bangalo', name: 'Bangalô', icon: '🏡', description: 'Casa térrea independente' },
  { code: 'barco', name: 'Barco', icon: '⛵', description: 'Embarcação' },
  { code: 'barco_beira', name: 'Barco/Beira', icon: '🚤', description: 'Barco atracado' },
  { code: 'boutique', name: 'Boutique Hotel', icon: '✨', description: 'Hotel boutique de alto padrão' },
  { code: 'cabana', name: 'Cabana', icon: '🛖', description: 'Construção rústica' },
  { code: 'cama_cafe', name: 'Cama e Café (B&B)', icon: '☕', description: 'Bed & Breakfast' },
  { code: 'camping', name: 'Camping', icon: '⛺', description: 'Área de acampamento' },
  { code: 'casa', name: 'Casa', icon: '🏠', description: 'Casa independente' },
  { code: 'casa_movel', name: 'Casa Móvel', icon: '🚚', description: 'Trailer fixo' },
  { code: 'castelo', name: 'Castelo', icon: '🏰', description: 'Castelo ou fortaleza' },
  { code: 'chale', name: 'Chalé', icon: '🏔️', description: 'Casa de montanha' },
  { code: 'chale_camping', name: 'Chalé (Área de Camping)', icon: '🏕️', description: 'Chalé em camping' },
  { code: 'condominio', name: 'Condomínio', icon: '🏘️', description: 'Conjunto residencial' },
  { code: 'estalagem', name: 'Estalagem', icon: '🏨', description: 'Pousada tradicional' },
  { code: 'fazenda', name: 'Fazenda para Viajantes', icon: '🌾', description: 'Propriedade rural' },
  { code: 'hotel', name: 'Hotel', icon: '🏨', description: 'Hotel tradicional' },
  { code: 'hotel_boutique', name: 'Hotel Boutique', icon: '💎', description: 'Hotel exclusivo e sofisticado' },
  { code: 'hostel', name: 'Hostel', icon: '🛏️', description: 'Albergue moderno' },
  { code: 'iate', name: 'Iate', icon: '🛥️', description: 'Embarcação de luxo' },
  { code: 'industrial', name: 'Industrial', icon: '🏭', description: 'Espaço industrial convertido' },
  { code: 'motel', name: 'Motel/Carro', icon: '🚗', description: 'Motel' },
  { code: 'pousada', name: 'Pousada Exclusiva', icon: '🏡', description: 'Pousada boutique' },
  { code: 'residencia', name: 'Residência', icon: '🏡', description: 'Casa residencial' },
  { code: 'resort', name: 'Resort', icon: '🏖️', description: 'Resort com infraestrutura completa' },
  { code: 'treehouse', name: 'Treehouse (Casa na Árvore)', icon: '🌳', description: 'Casa construída em árvore' },
  { code: 'villa', name: 'Villa/Casa', icon: '🏰', description: 'Casa de alto padrão' },
];

// ============================================================================
// TIPOS DE ACOMODAÇÃO (Accommodation Types)
// ============================================================================

export const ACCOMMODATION_TYPES: PropertyTypeOption[] = [
  { code: 'apartamento', name: 'Apartamento', icon: '🏢', description: 'Apartamento completo' },
  { code: 'bangalo', name: 'Bangalô', icon: '🏡', description: 'Bangalô independente' },
  { code: 'cabana', name: 'Cabana', icon: '🛖', description: 'Cabana rústica' },
  { code: 'camping', name: 'Camping', icon: '⛺', description: 'Local de camping' },
  { code: 'capsula', name: 'Cápsula/Trailer/Casa Móvel', icon: '🚐', description: 'Acomodação móvel' },
  { code: 'casa', name: 'Casa', icon: '🏠', description: 'Casa completa' },
  { code: 'casa_dormitorios', name: 'Casa em Dormitórios', icon: '🏠', description: 'Casa com quartos compartilhados' },
  { code: 'chale', name: 'Chalé', icon: '🏔️', description: 'Chalé de montanha' },
  { code: 'condominio', name: 'Condomínio', icon: '🏘️', description: 'Unidade em condomínio' },
  { code: 'dormitorio', name: 'Dormitório', icon: '🛏️', description: 'Dormitório compartilhado' },
  { code: 'estudio', name: 'Estúdio', icon: '🏠', description: 'Apartamento estúdio' },
  { code: 'holiday_home', name: 'Holiday Home', icon: '🏖️', description: 'Casa de temporada' },
  { code: 'hostel', name: 'Hostel', icon: '🛏️', description: 'Quarto de hostel' },
  { code: 'hotel', name: 'Hotel', icon: '🏨', description: 'Quarto de hotel' },
  { code: 'iate', name: 'Iate', icon: '🛥️', description: 'Cabine de iate' },
  { code: 'industrial', name: 'Industrial', icon: '🏭', description: 'Loft industrial' },
  { code: 'loft', name: 'Loft', icon: '🏢', description: 'Loft moderno' },
  { code: 'quarto_compartilhado', name: 'Quarto Compartilhado', icon: '👥', description: 'Quarto compartilhado' },
  { code: 'quarto_inteiro', name: 'Quarto Inteiro', icon: '🚪', description: 'Quarto privativo com banheiro' },
  { code: 'quarto_privado', name: 'Quarto Privado', icon: '🔐', description: 'Quarto privativo sem banheiro' },
  { code: 'suite', name: 'Suíte', icon: '🛏️', description: 'Suíte com banheiro privativo' },
  { code: 'treehouse', name: 'Treehouse', icon: '🌳', description: 'Casa na árvore' },
  { code: 'villa', name: 'Villa/Casa', icon: '🏰', description: 'Villa completa' },
];

// ============================================================================
// MODALIDADES
// ============================================================================

export const MODALITY_OPTIONS = [
  { code: 'seasonal', name: 'Alugar por temporada', icon: '🏖️' },
  { code: 'sale', name: 'Compra e venda', icon: '💰' },
  { code: 'residential', name: 'Locação residencial', icon: '🏠' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Busca um tipo de local pelo código
 */
export function getLocationTypeByCode(code: string): PropertyTypeOption | undefined {
  return LOCATION_TYPES.find(t => t.code === code);
}

/**
 * Busca um tipo de acomodação pelo código
 */
export function getAccommodationTypeByCode(code: string): PropertyTypeOption | undefined {
  return ACCOMMODATION_TYPES.find(t => t.code === code);
}

/**
 * Retorna o nome formatado de um tipo de local
 */
export function getLocationTypeName(code: string): string {
  const type = getLocationTypeByCode(code);
  return type ? type.name : code;
}

/**
 * Retorna o nome formatado de um tipo de acomodação
 */
export function getAccommodationTypeName(code: string): string {
  const type = getAccommodationTypeByCode(code);
  return type ? type.name : code;
}
