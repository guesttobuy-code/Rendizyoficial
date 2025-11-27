// ============================================================================
// ROTAS DE PROPRIEDADES (IMÓVEIS)
// ============================================================================

import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';
import type {
  Property,
  CreatePropertyDTO,
  UpdatePropertyDTO,
  PropertyFilters,
  PropertyStats,
} from './types.ts';
import {
  generatePropertyId,
  getCurrentDateTime,
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  sanitizeString,
  sanitizeEmail,
  generatePropertyCode,
  getRandomPropertyColor,
  matchesSearch,
  matchesAnyTag,
  logInfo,
  logError,
} from './utils.ts';
import { generateShortId, updateShortIdMapping, ID_PREFIXES } from './short-id-generator.ts';
// ✅ MELHORIA v1.0.103.400 - Tenancy Middleware (Passo 2)
import { getTenant, isSuperAdmin, getImobiliariaId } from './utils-tenancy.ts';
import { getSupabaseClient } from './kv_store.tsx';
// ✅ REFATORADO v1.0.103.500 - Helper híbrido para organization_id (UUID)
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';
import { getOrganizationIdForRequest } from './utils-multi-tenant.ts';
// ✅ MIGRAÇÃO v1.0.103.400 - SQL + RLS + Multi-tenant
import { propertyToSql, sqlToProperty, PROPERTY_SELECT_FIELDS } from './utils-property-mapper.ts';
// ✅ MELHORIA v1.0.103.400 - Listings separados de Properties
import { sqlToListing, LISTING_SELECT_FIELDS } from './utils-listing-mapper.ts';
import type { Listing } from './types.ts';

// ============================================================================
// LISTAR TODAS AS PROPRIEDADES
// ============================================================================

export async function listProperties(c: Context) {
  try {
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de tenant.imobiliariaId
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    
    logInfo(`Listing properties for tenant: ${tenant.username} (${tenant.type})`);

    // ✅ MIGRAÇÃO: Buscar do SQL ao invés de KV Store
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT_FIELDS);
    
    // ✅ REGRA MESTRE: Filtrar por organization_id (superadmin = Rendizy master, outros = sua organização)
    const organizationId = await getOrganizationIdForRequest(c);
    query = query.eq('organization_id', organizationId);
    logInfo(`✅ [listProperties] Filtering properties by organization_id: ${organizationId}`);
    
    // Aplicar filtros de query params
    const statusFilter = c.req.query('status');
    const typeFilter = c.req.query('type');
    const cityFilter = c.req.query('city');
    
    if (statusFilter) {
      query = query.in('status', statusFilter.split(','));
    }
    
    if (typeFilter) {
      query = query.in('type', typeFilter.split(','));
    }
    
    if (cityFilter) {
      query = query.in('address_city', cityFilter.split(','));
    }
    
    // Ordenar por created_at DESC
    query = query.order('created_at', { ascending: false });
    
    const { data: rows, error } = await query;
    
    if (error) {
      console.error('❌ [listProperties] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar propriedades', { details: error.message }), 500);
    }
    
    // ✅ Converter resultados SQL para Property (TypeScript)
    let properties = (rows || []).map(sqlToProperty);
    
    logInfo(`Found ${properties.length} properties`);
    
    // Buscar todos os locations para enriquecer os dados (ainda do KV Store por enquanto)
    const locations = await kv.getByPrefix<any>('location:');
    const locationsMap = new Map(locations.map(loc => [loc.id, loc]));

    // Enriquecer propriedades com dados do location
    for (const property of properties) {
      if (property.locationId && locationsMap.has(property.locationId)) {
        const location = locationsMap.get(property.locationId);
        property.locationName = location.name;
        property.locationAmenities = location.amenities || [];
      }
    }

    // ✅ Aplicar filtros adicionais que não podem ser feitos na query SQL (tags, busca, folder)
    const tagsFilter = c.req.query('tags');
    const folderFilter = c.req.query('folder');
    const searchFilter = c.req.query('search');

    let filtered = properties;

    // Filtro por tags (precisa ser feito em memória pois é array)
    if (tagsFilter && tagsFilter.length > 0) {
      const tags = tagsFilter.split(',');
      filtered = filtered.filter(p => matchesAnyTag(p.tags, tags));
    }

    // Filtro por pasta
    if (folderFilter) {
      filtered = filtered.filter(p => p.folder === folderFilter);
    }

    // Filtro por busca (nome ou código) - busca de texto precisa ser feita em memória
    if (searchFilter) {
      filtered = filtered.filter(p => 
        matchesSearch(p.name, searchFilter) ||
        matchesSearch(p.code, searchFilter)
      );
    }

    // Ordenar por nome (já está ordenado por created_at no SQL, mas pode reordenar se necessário)
    // filtered.sort((a, b) => a.name.localeCompare(b.name));

    logInfo(`Found ${filtered.length} properties (after filters)`);

    return c.json(successResponse(filtered));
  } catch (error) {
    logError('Error listing properties', error);
    return c.json(errorResponse('Failed to list properties'), 500);
  }
}

// ============================================================================
// BUSCAR PROPRIEDADE POR ID
// ============================================================================

export async function getProperty(c: Context) {
  try {
    // ✅ MIGRAÇÃO v1.0.103.400 - SQL + RLS + Multi-tenant
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const id = c.req.param('id');
    logInfo(`Getting property: ${id} for tenant: ${tenant.username}`);

    // ✅ MIGRAÇÃO: Buscar do SQL ao invés de KV Store
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT_FIELDS)
      .eq('id', id);
    
    // ✅ FILTRO MULTI-TENANT: Se for imobiliária, garantir que property pertence à organização
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      query = query.eq('organization_id', organizationId);
    }
    
    const { data: row, error } = await query.maybeSingle();
    
    if (error) {
      console.error('❌ [getProperty] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar propriedade', { details: error.message }), 500);
    }
    
    if (!row) {
      return c.json(notFoundResponse('Property'), 404);
    }

    // ✅ Converter resultado SQL para Property (TypeScript)
    const property = sqlToProperty(row);

    // ✅ VERIFICAR PERMISSÃO: Se for imobiliária, garantir que propriedade pertence à organização
    // (já filtrado na query SQL acima, mas validar novamente para segurança)
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      // ✅ Multi-tenant garantido pela query SQL (já filtra por organization_id)
      logInfo(`Property ${id} belongs to organization ${organizationId}`);
    }

    // Se a propriedade tem locationId, buscar dados do location (ainda do KV Store por enquanto)
    if (property.locationId) {
      const location = await kv.get<any>(`location:${property.locationId}`);
      if (location) {
        property.locationName = location.name;
        property.locationAmenities = location.amenities || [];
      }
    }

    return c.json(successResponse(property));
  } catch (error) {
    logError('Error getting property', error);
    return c.json(errorResponse('Failed to get property'), 500);
  }
}

// ============================================================================
// CRIAR NOVA PROPRIEDADE
// ============================================================================

export async function createProperty(c: Context) {
  try {
    const body = await c.req.json<CreatePropertyDTO>();
    logInfo('Creating property', body);

    // ✅ BOAS PRÁTICAS v1.0.103.1000 - NORMALIZAR ANTES DE VALIDAR
    // Normalizar dados do wizard (converte estrutura aninhada para plana)
    const normalized = normalizeWizardData(body);
    
    // Usar dados normalizados para validações e criação
    const dataToValidate = {
      ...body,
      name: normalized.name || body.name,
      code: normalized.code || body.code,
      type: normalized.type || body.type,
      address: normalized.address || body.address,
    };

    // Validações (agora usando dados normalizados)
    if (!dataToValidate.name || !dataToValidate.code || !dataToValidate.type) {
      console.error('❌ [createProperty] Validação falhou:', {
        name: dataToValidate.name,
        code: dataToValidate.code,
        type: dataToValidate.type,
        rawBody: {
          name: body.name,
          code: body.code,
          type: body.type,
          contentType: body.contentType
        }
      });
      return c.json(
        validationErrorResponse('Name, code, and type are required'),
        400
      );
    }

    if (!dataToValidate.address || !dataToValidate.address.city || !dataToValidate.address.state) {
      return c.json(
        validationErrorResponse('Address with city and state is required'),
        400
      );
    }

    if (!body.maxGuests || body.maxGuests < 1) {
      return c.json(
        validationErrorResponse('Max guests must be at least 1'),
        400
      );
    }

    if (!body.basePrice || body.basePrice < 0) {
      return c.json(
        validationErrorResponse('Base price must be greater than 0'),
        400
      );
    }

    // 🆕 v1.0.103.262 - Validações de novos campos
    
    // Validar subtype
    if (body.subtype && !['entire_place', 'private_room', 'shared_room'].includes(body.subtype)) {
      return c.json(
        validationErrorResponse('Invalid subtype. Must be: entire_place, private_room, or shared_room'),
        400
      );
    }
    
    // Validar modalities
    if (body.modalities) {
      const validModalities = ['short_term_rental', 'buy_sell', 'residential_rental'];
      const invalidModality = body.modalities.find(m => !validModalities.includes(m));
      if (invalidModality) {
        return c.json(
          validationErrorResponse(`Invalid modality: ${invalidModality}`),
          400
        );
      }
    }
    
    // Validar dados financeiros se modalidade exigir
    if (body.modalities?.includes('residential_rental') && body.financialInfo) {
      if (body.financialInfo.monthlyRent && body.financialInfo.monthlyRent < 0) {
        return c.json(
          validationErrorResponse('Monthly rent must be positive'),
          400
        );
      }
    }
    
    if (body.modalities?.includes('buy_sell') && body.financialInfo) {
      if (body.financialInfo.salePrice && body.financialInfo.salePrice < 0) {
        return c.json(
          validationErrorResponse('Sale price must be positive'),
          400
        );
      }
    }
    
    // Validar coordenadas GPS
    if (body.address?.coordinates) {
      const { lat, lng } = body.address.coordinates;
      if (lat < -90 || lat > 90) {
        return c.json(
          validationErrorResponse('Latitude must be between -90 and 90'),
          400
        );
      }
      if (lng < -180 || lng > 180) {
        return c.json(
          validationErrorResponse('Longitude must be between -180 and 180'),
          400
        );
      }
    }
    
    // Validar comissão
    if (body.contract?.commission?.percentage) {
      if (body.contract.commission.percentage < 0 || body.contract.commission.percentage > 100) {
        return c.json(
          validationErrorResponse('Commission percentage must be between 0 and 100'),
          400
        );
      }
    }

    // Verificar se código já existe (usando código normalizado)
    const existingProperties = await kv.getByPrefix<Property>('property:');
    const codeExists = existingProperties.some(p => p.code === dataToValidate.code);

    if (codeExists) {
      return c.json(
        validationErrorResponse(`Property code '${dataToValidate.code}' already exists`),
        400
      );
    }

    // ✅ Dados já normalizados acima - usar normalized
    console.log('📝 [CREATE] Dados normalizados prontos para criar:', {
      name: normalized.name,
      code: normalized.code,
      type: normalized.type,
      photos: normalized.photos?.length || 0,
      locationAmenities: normalized.locationAmenities?.length || 0,
      listingAmenities: normalized.listingAmenities?.length || 0,
    });
    
    // ✅ MIGRAÇÃO v1.0.103.400 - SQL + RLS + Multi-tenant
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido para obter organization_id (UUID)
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      // Para superadmin, buscar a primeira organização disponível ou usar UUID fixo
      try {
        const { data: defaultOrg, error: orgError } = await client
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (orgError) {
          console.warn('⚠️ [createProperty] Erro ao buscar organização padrão:', orgError);
        }
        
        organizationId = defaultOrg?.id || '00000000-0000-0000-0000-000000000001';
        console.log('✅ [createProperty] Usando organization_id para superadmin:', organizationId);
      } catch (error) {
        console.warn('⚠️ [createProperty] Erro ao buscar organização, usando fallback:', error);
        organizationId = '00000000-0000-0000-0000-000000000001';
      }
    }
    
    // Criar propriedade
    const id = generatePropertyId();
    const now = getCurrentDateTime();
    
    // 🆕 v1.0.103.271 - Gerar Short ID (6 caracteres)
    const tenantId = organizationId || 'default';
    const shortId = await generateShortId('PROPERTY', tenantId);

    const property: Property = {
      id,
      shortId, // 🆕 v1.0.103.271 - ID curto para exibição
      name: sanitizeString(normalized.name || dataToValidate.name),
      code: (normalized.code || dataToValidate.code).toUpperCase(),
      type: normalized.type || dataToValidate.type,
      status: 'active',
      propertyType: body.propertyType || 'individual', // 🆕 v1.0.103.262
      locationId: body.locationId, // 🆕 v1.0.103.262
      
      address: normalized.address || {
        street: body.address?.street || '',
        number: body.address?.number || '',
        complement: body.address?.complement,
        neighborhood: body.address?.neighborhood || '',
        city: body.address?.city || dataToValidate.address?.city || '',
        state: body.address?.state || dataToValidate.address?.state || '',
        stateCode: body.address?.stateCode || dataToValidate.address?.stateCode, // 🆕 v1.0.103.262
        zipCode: body.address?.zipCode || '',
        country: body.address?.country || 'BR',
        coordinates: body.address?.coordinates || dataToValidate.address?.coordinates, // 🆕 v1.0.103.262
      },
      
      maxGuests: body.maxGuests,
      bedrooms: body.bedrooms || 1,
      beds: body.beds || 1,
      bathrooms: body.bathrooms || 1,
      area: body.area,
      
      pricing: {
        basePrice: body.basePrice,
        currency: body.currency || 'BRL',
        weeklyDiscount: 10,      // 10% padrão
        biweeklyDiscount: 15,    // 15% padrão
        monthlyDiscount: 20,     // 20% padrão
      },
      
      restrictions: {
        minNights: body.minNights || 1,
        maxNights: 365,
        advanceBooking: 0,
        preparationTime: 0,
      },
      
      // 🆕 v1.0.103.315 - Amenidades normalizadas
      locationAmenities: normalized.locationAmenities || [],
      listingAmenities: normalized.listingAmenities || [],
      amenities: normalized.amenities || [],
      
      tags: body.tags || [],
      folder: undefined,
      color: getRandomPropertyColor(),
      
      // 🆕 v1.0.103.315 - Fotos normalizadas
      photos: normalized.photos || [],
      coverPhoto: normalized.coverPhoto || undefined,
      
      description: normalized.description || body.description,
      
      // 🆕 v1.0.103.315 - Salvar estrutura wizard (compatibilidade)
      contentType: normalized.contentType,
      contentLocation: normalized.contentLocation,
      contentRooms: normalized.contentRooms,
      contentLocationAmenities: normalized.contentLocationAmenities,
      contentPropertyAmenities: normalized.contentPropertyAmenities,
      contentPhotos: normalized.contentPhotos,
      contentDescription: normalized.contentDescription,
      settingsRules: normalized.settingsRules,
      completedSteps: normalized.completedSteps,
      shortDescription: undefined,
      
      platforms: {
        airbnb: undefined,
        booking: undefined,
        decolar: undefined,
        direct: true,
      },
      
      // 🆕 v1.0.103.262 - Novos campos de Step 1
      accommodationType: body.accommodationType,
      subtype: body.subtype,
      modalities: body.modalities,
      registrationNumber: body.registrationNumber,
      
      // 🆕 v1.0.103.262 - Dados Financeiros
      financialInfo: body.financialInfo,
      
      // 🆕 v1.0.103.262 - Configurações de Exibição
      displaySettings: body.displaySettings,
      
      // 🆕 v1.0.103.262 - Características do Local
      locationFeatures: body.locationFeatures,
      
      // 🆕 v1.0.103.262 - Contrato e Taxas
      contract: body.contract,
      
      // 🆕 v1.0.103.264 - Cômodos Detalhados
      rooms: body.rooms,
      
      // 🆕 v1.0.103.264 - Descrição Estendida
      highlights: body.highlights,
      houseRules: body.houseRules,
      customFields: body.customFields,
      
      // 🆕 v1.0.103.264 - Configurações de Venda
      saleSettings: body.saleSettings,
      
      // 🆕 v1.0.103.264 - Configurações Sazonais
      seasonalPricing: body.seasonalPricing,
      
      // 🆕 v1.0.103.264 - Precificação Avançada
      advancedPricing: body.advancedPricing,
      
      // 🆕 v1.0.103.264 - Preços Derivados
      derivedPricing: body.derivedPricing,
      
      // 🆕 v1.0.103.264 - Regras de Hospedagem
      rules: body.rules,
      
      // 🆕 v1.0.103.264 - Configurações de Reserva
      bookingSettings: body.bookingSettings,
      
      // 🆕 v1.0.103.264 - Configurações iCal
      icalSettings: body.icalSettings,
      
      createdAt: now,
      updatedAt: now,
      ownerId: tenant.userId || 'system', // ✅ Usar userId do tenant
      isActive: true,
    };

    // ✅ MIGRAÇÃO: Salvar no SQL ao invés de KV Store
    // Garantir que organizationId sempre tenha um valor válido
    const finalOrganizationId = organizationId || '00000000-0000-0000-0000-000000000001';
    console.log('🔍 [createProperty] Usando organization_id:', finalOrganizationId);
    const sqlData = propertyToSql(property, finalOrganizationId);
    
    // 🔍 DEBUG: Log dos dados antes de inserir
    console.log('🔍 [createProperty] SQL Data antes de inserir:', {
      id: sqlData.id,
      organization_id: sqlData.organization_id,
      owner_id: sqlData.owner_id,
      location_id: sqlData.location_id,
      name: sqlData.name,
      code: sqlData.code
    });
    
    const { data: insertedRow, error } = await client
      .from('properties')
      .insert(sqlData)
      .select(PROPERTY_SELECT_FIELDS)
      .single();
    
    if (error) {
      console.error('❌ [createProperty] SQL error:', error);
      console.error('❌ [createProperty] SQL Data que causou erro:', JSON.stringify(sqlData, null, 2));
      return c.json(errorResponse('Erro ao criar propriedade', { details: error.message }), 500);
    }
    
    // ✅ Converter resultado SQL para Property (TypeScript)
    const createdProperty = sqlToProperty(insertedRow);
    
    // 🆕 v1.0.103.271 - Atualizar mapeamento de Short ID (ainda no KV Store por enquanto)
    await updateShortIdMapping(shortId, tenantId, id);

    logInfo(`Property created: ${id} (Short ID: ${shortId}) in organization ${organizationId}`);

    return c.json(successResponse(createdProperty, 'Property created successfully'), 201);
  } catch (error) {
    logError('Error creating property', error);
    return c.json(errorResponse('Failed to create property'), 500);
  }
}

// ============================================================================
// NORMALIZAÇÃO DE DADOS DO WIZARD (v1.0.103.315)
// ============================================================================

/**
 * Converte estrutura aninhada do Wizard para estrutura plana do banco
 * 
 * ANTES (Wizard):
 * {
 *   contentType: { internalName: "Casa" },
 *   contentPhotos: { photos: [...] },
 *   contentLocationAmenities: { amenities: [...] },
 *   contentPropertyAmenities: { listingAmenities: [...] }
 * }
 * 
 * DEPOIS (Banco):
 * {
 *   name: "Casa",
 *   photos: [...],
 *   locationAmenities: [...],
 *   listingAmenities: [...],
 *   // + mantém estrutura wizard para compatibilidade
 * }
 */
function normalizeWizardData(wizardData: any, existing?: Property): any {
  console.log('🔄 [NORMALIZAÇÃO] Convertendo dados do Wizard...');
  console.log('📊 [NORMALIZAÇÃO] Dados brutos:', wizardData);
  
  // Extrair campos do wizard (estrutura aninhada)
  let name = wizardData.contentType?.internalName || 
             wizardData.name || 
             existing?.name || 
             null;
  
  let code = wizardData.contentType?.code || 
             wizardData.code || 
             existing?.code || 
             null;
  
  let type = wizardData.contentType?.propertyTypeId || 
             wizardData.contentType?.accommodationTypeId || // Fallback para accommodationTypeId
             wizardData.type || 
             existing?.type || 
             null;
  
  // ✅ BOAS PRÁTICAS v1.0.103.1000 - Gerar name e code se não existirem
  // Gerar nome a partir do tipo de acomodação se não existir
  if (!name && wizardData.contentType?.accommodationTypeId) {
    const accommodationTypeId = wizardData.contentType.accommodationTypeId;
    // Mapear IDs para nomes (baseado nos tipos do sistema)
    const accommodationTypeNames: Record<string, string> = {
      'acc_casa': 'Casa',
      'acc_apartamento': 'Apartamento',
      'acc_chale': 'Chalé',
      'acc_bangalo': 'Bangalô',
      'acc_estudio': 'Estúdio',
      'acc_loft': 'Loft',
      'acc_suite': 'Suíte',
      'acc_villa': 'Villa',
      'acc_quarto_inteiro': 'Quarto Inteiro',
      'acc_quarto_privado': 'Quarto Privado',
      'acc_quarto_compartilhado': 'Quarto Compartilhado',
    };
    name = accommodationTypeNames[accommodationTypeId] || accommodationTypeId.replace('acc_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log('✅ [NORMALIZAÇÃO] Nome gerado a partir do accommodationTypeId:', name);
  }
  
  // Gerar código único se não existir
  if (!code) {
    const timestamp = Date.now().toString(36).slice(-6).toUpperCase();
    const typePrefix = type ? type.replace('loc_', '').replace('acc_', '').substring(0, 3).toUpperCase() : 'PRP';
    code = `${typePrefix}${timestamp}`;
    console.log('✅ [NORMALIZAÇÃO] Código gerado automaticamente:', code);
  }
  
  // Fotos: converter de contentPhotos.photos para photos (raiz)
  let photos = wizardData.photos || existing?.photos || [];
  if (wizardData.contentPhotos?.photos && Array.isArray(wizardData.contentPhotos.photos)) {
    photos = wizardData.contentPhotos.photos.map((p: any) => {
      // Se for objeto com url, manter estrutura
      if (typeof p === 'object' && p.url) {
        return {
          url: p.url,
          isCover: p.isCover || false,
          category: p.category || 'other',
          order: p.order || 0,
        };
      }
      // Se for string, converter para objeto
      return { url: p, isCover: false, category: 'other', order: 0 };
    });
  }
  
  // Foto de capa: primeira foto marcada como isCover
  let coverPhoto = existing?.coverPhoto || null;
  if (photos.length > 0) {
    const cover = photos.find((p: any) => p.isCover);
    if (cover) {
      coverPhoto = typeof cover === 'string' ? cover : cover.url;
    } else if (photos[0]) {
      coverPhoto = typeof photos[0] === 'string' ? photos[0] : photos[0].url;
    }
  }
  
  // Amenidades: extrair de estruturas aninhadas
  const locationAmenities = wizardData.contentLocationAmenities?.amenities || 
                           wizardData.locationAmenities || 
                           existing?.locationAmenities || 
                           [];
  
  const listingAmenities = wizardData.contentPropertyAmenities?.listingAmenities || 
                          wizardData.listingAmenities || 
                          existing?.listingAmenities || 
                          [];
  
  // Combinar todas amenidades para campo legado
  const allAmenities = [...new Set([...locationAmenities, ...listingAmenities])];
  
  // Endereço: extrair de contentLocation
  let address = wizardData.address || existing?.address || {};
  if (wizardData.contentLocation?.address) {
    address = {
      ...address,
      ...wizardData.contentLocation.address,
    };
  }
  
  // Descrição: extrair de contentDescription
  let description = wizardData.description || existing?.description || null;
  if (wizardData.contentDescription?.fixedFields?.description) {
    description = wizardData.contentDescription.fixedFields.description;
  }
  
  // Cômodos: extrair de contentRooms
  let rooms = wizardData.rooms || existing?.rooms || [];
  if (wizardData.contentRooms?.rooms) {
    rooms = wizardData.contentRooms.rooms;
  }
  
  // Dados financeiros: extrair de contentType.financialData
  let financialInfo = wizardData.financialInfo || existing?.financialInfo || {};
  if (wizardData.contentType?.financialData) {
    financialInfo = {
      ...financialInfo,
      ...wizardData.contentType.financialData,
    };
  }
  
  console.log('✅ [NORMALIZAÇÃO] Dados normalizados:');
  console.log('   - name:', name);
  console.log('   - photos:', photos.length, 'fotos');
  console.log('   - coverPhoto:', coverPhoto);
  console.log('   - locationAmenities:', locationAmenities.length);
  console.log('   - listingAmenities:', listingAmenities.length);
  
  // Retornar objeto normalizado
  return {
    // ✅ CAMPOS RAIZ (para leitura simples nos cards)
    name,
    code,
    type,
    photos,
    coverPhoto,
    locationAmenities,
    listingAmenities,
    amenities: allAmenities, // Campo legado compatível
    address,
    description,
    rooms,
    financialInfo,
    
    // ✅ MANTER ESTRUTURA WIZARD (para edição futura)
    contentType: wizardData.contentType,
    contentLocation: wizardData.contentLocation,
    contentRooms: wizardData.contentRooms,
    contentLocationAmenities: wizardData.contentLocationAmenities,
    contentPropertyAmenities: wizardData.contentPropertyAmenities,
    contentPhotos: wizardData.contentPhotos,
    contentDescription: wizardData.contentDescription,
    
    // ✅ OUTROS CAMPOS DO WIZARD
    settingsRules: wizardData.settingsRules,
    completedSteps: wizardData.completedSteps,
    
    // ✅ PRESERVAR OUTROS CAMPOS ENVIADOS
    ...wizardData,
  };
}

// ============================================================================
// ATUALIZAR PROPRIEDADE
// ============================================================================

export async function updateProperty(c: Context) {
  try {
    // ✅ MIGRAÇÃO v1.0.103.400 - SQL + RLS + Multi-tenant
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json<UpdatePropertyDTO>();
    logInfo(`Updating property: ${id}`, body);

    // ✅ MIGRAÇÃO: Buscar propriedade existente do SQL (com filtro multi-tenant)
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT_FIELDS)
      .eq('id', id);
    
    // ✅ FILTRO MULTI-TENANT: Se for imobiliária, garantir que property pertence à organização
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      query = query.eq('organization_id', organizationId);
    }
    
    const { data: existingRow, error: fetchError } = await query.maybeSingle();
    
    if (fetchError) {
      console.error('❌ [updateProperty] SQL error fetching:', fetchError);
      return c.json(errorResponse('Erro ao buscar propriedade', { details: fetchError.message }), 500);
    }
    
    if (!existingRow) {
      return c.json(notFoundResponse('Property'), 404);
    }
    
    // ✅ Converter resultado SQL para Property (TypeScript)
    const existing = sqlToProperty(existingRow);
    
    // 🆕 v1.0.103.315 - NORMALIZAR DADOS DO WIZARD
    const normalized = normalizeWizardData(body, existing);
    
    console.log('📝 [UPDATE] Dados normalizados prontos para salvar:', {
      id,
      name: normalized.name,
      photos: normalized.photos?.length || 0,
      locationAmenities: normalized.locationAmenities?.length || 0,
      listingAmenities: normalized.listingAmenities?.length || 0,
    });
    
    // Extrair nome normalizado
    const extractedName = normalized.name;
    
    // Extrair code normalizado
    const extractedCode = normalized.code;
    
    // Extrair tipo normalizado
    const extractedType = normalized.type;
    
    // Extrair fotos normalizadas
    const extractedPhotos = normalized.photos;
    
    // Extrair coverPhoto normalizado
    let extractedCoverPhoto = normalized.coverPhoto;
    if (extractedPhotos && Array.isArray(extractedPhotos) && extractedPhotos.length > 0) {
      const coverPhoto = extractedPhotos.find((p: any) => p.isCover);
      if (coverPhoto) {
        extractedCoverPhoto = coverPhoto.url;
      } else if (extractedPhotos[0]) {
        extractedCoverPhoto = extractedPhotos[0].url || extractedPhotos[0];
      }
    }
    
    logInfo(`🔍 Extracted data - Name: ${extractedName}, Code: ${extractedCode}, Photos: ${extractedPhotos?.length || 0}`);

    // ✅ MIGRAÇÃO: Se mudando o código, verificar se já existe no SQL
    if (extractedCode && extractedCode !== existing.code) {
      let codeQuery = client
        .from('properties')
        .select('id')
        .eq('code', extractedCode)
        .neq('id', id);
      
      // ✅ FILTRO MULTI-TENANT: Verificar código apenas dentro da organização
      if (tenant.type === 'imobiliaria') {
        // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
        const organizationId = await getOrganizationIdOrThrow(c);
        codeQuery = codeQuery.eq('organization_id', organizationId);
      }
      
      const { data: codeCheck, error: codeError } = await codeQuery.maybeSingle();
      
      if (codeError && codeError.code !== 'PGRST116') {
        console.error('❌ [updateProperty] SQL error checking code:', codeError);
        return c.json(errorResponse('Erro ao verificar código', { details: codeError.message }), 500);
      }
      
      if (codeCheck) {
        return c.json(
          validationErrorResponse(`Property code '${extractedCode}' already exists`),
          400
        );
      }
    }

    // Atualizar propriedade
    const updated: Property = {
      ...existing,
      // 🆕 v1.0.103.313 - Usar dados extraídos do wizard
      ...(extractedName && { name: sanitizeString(extractedName) }),
      ...(extractedCode && { code: extractedCode.toUpperCase() }),
      ...(extractedType && { type: extractedType }),
      ...(body.status && { status: body.status }),
      ...(body.propertyType && { propertyType: body.propertyType }), // 🆕 v1.0.103.262
      ...(body.locationId !== undefined && { locationId: body.locationId }), // 🆕 v1.0.103.262
      ...(normalized.address && { address: { ...existing.address, ...normalized.address } }),
      ...(body.maxGuests && { maxGuests: body.maxGuests }),
      ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
      ...(body.beds !== undefined && { beds: body.beds }),
      ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
      ...(body.basePrice !== undefined && {
        pricing: {
          ...existing.pricing,
          basePrice: body.basePrice,
        },
      }),
      ...(body.minNights !== undefined && {
        restrictions: {
          ...existing.restrictions,
          minNights: body.minNights,
        },
      }),
      // 🆕 v1.0.103.315 - Amenidades normalizadas (dos campos raiz)
      ...(normalized.locationAmenities && { locationAmenities: normalized.locationAmenities }),
      ...(normalized.listingAmenities && { listingAmenities: normalized.listingAmenities }),
      ...(normalized.amenities && { amenities: normalized.amenities }),
      ...(body.tags && { tags: body.tags }),
      ...(body.color && { color: body.color }),
      // 🆕 v1.0.103.315 - Usar fotos normalizadas
      ...(extractedPhotos && { photos: extractedPhotos }),
      ...(extractedCoverPhoto && { coverPhoto: extractedCoverPhoto }),
      ...(normalized.description !== undefined && { description: normalized.description }),
      
      // 🆕 v1.0.103.315 - Salvar TAMBÉM estrutura wizard (compatibilidade)
      ...(normalized.contentType && { contentType: normalized.contentType }),
      ...(normalized.contentLocation && { contentLocation: normalized.contentLocation }),
      ...(normalized.contentRooms && { contentRooms: normalized.contentRooms }),
      ...(normalized.contentLocationAmenities && { contentLocationAmenities: normalized.contentLocationAmenities }),
      ...(normalized.contentPropertyAmenities && { contentPropertyAmenities: normalized.contentPropertyAmenities }),
      ...(normalized.contentPhotos && { contentPhotos: normalized.contentPhotos }),
      ...(normalized.contentDescription && { contentDescription: normalized.contentDescription }),
      ...(normalized.settingsRules && { settingsRules: normalized.settingsRules }),
      ...(normalized.completedSteps && { completedSteps: normalized.completedSteps }),
      
      // 🆕 v1.0.103.262 - Novos campos de Step 1
      ...(body.accommodationType !== undefined && { accommodationType: body.accommodationType }),
      ...(body.subtype !== undefined && { subtype: body.subtype }),
      ...(body.modalities !== undefined && { modalities: body.modalities }),
      ...(body.registrationNumber !== undefined && { registrationNumber: body.registrationNumber }),
      
      // 🆕 v1.0.103.262 - Dados Financeiros (merge parcial)
      ...(body.financialInfo !== undefined && {
        financialInfo: {
          ...existing.financialInfo,
          ...body.financialInfo,
        },
      }),
      
      // 🆕 v1.0.103.262 - Configurações de Exibição (merge parcial)
      ...(body.displaySettings !== undefined && {
        displaySettings: {
          ...existing.displaySettings,
          ...body.displaySettings,
        },
      }),
      
      // 🆕 v1.0.103.262 - Características do Local (merge parcial)
      ...(body.locationFeatures !== undefined && {
        locationFeatures: {
          ...existing.locationFeatures,
          ...body.locationFeatures,
        },
      }),
      
      // 🆕 v1.0.103.262 - Contrato (merge profundo)
      ...(body.contract !== undefined && {
        contract: {
          ...existing.contract,
          ...body.contract,
          ...(body.contract?.commission && {
            commission: {
              ...existing.contract?.commission,
              ...body.contract.commission,
            },
          }),
          ...(body.contract?.charges && {
            charges: {
              ...existing.contract?.charges,
              ...body.contract.charges,
            },
          }),
          ...(body.contract?.notifications && {
            notifications: {
              ...existing.contract?.notifications,
              ...body.contract.notifications,
            },
          }),
        },
      }),
      
      // 🆕 v1.0.103.264 - Cômodos Detalhados
      ...(body.rooms !== undefined && { rooms: body.rooms }),
      
      // 🆕 v1.0.103.264 - Descrição Estendida
      ...(body.highlights !== undefined && { highlights: body.highlights }),
      ...(body.houseRules !== undefined && { houseRules: body.houseRules }),
      ...(body.customFields !== undefined && { customFields: body.customFields }),
      
      // 🆕 v1.0.103.264 - Configurações de Venda
      ...(body.saleSettings !== undefined && {
        saleSettings: {
          ...existing.saleSettings,
          ...body.saleSettings,
        },
      }),
      
      // 🆕 v1.0.103.264 - Configurações Sazonais (merge profundo)
      ...(body.seasonalPricing !== undefined && {
        seasonalPricing: {
          ...existing.seasonalPricing,
          ...body.seasonalPricing,
          ...(body.seasonalPricing?.deposit && {
            deposit: {
              ...existing.seasonalPricing?.deposit,
              ...body.seasonalPricing.deposit,
            },
          }),
          ...(body.seasonalPricing?.dynamicPricing && {
            dynamicPricing: {
              ...existing.seasonalPricing?.dynamicPricing,
              ...body.seasonalPricing.dynamicPricing,
            },
          }),
          ...(body.seasonalPricing?.fees && {
            fees: {
              ...existing.seasonalPricing?.fees,
              ...body.seasonalPricing.fees,
              ...(body.seasonalPricing.fees?.cleaning && {
                cleaning: {
                  ...existing.seasonalPricing?.fees?.cleaning,
                  ...body.seasonalPricing.fees.cleaning,
                },
              }),
              ...(body.seasonalPricing.fees?.pet && {
                pet: {
                  ...existing.seasonalPricing?.fees?.pet,
                  ...body.seasonalPricing.fees.pet,
                },
              }),
              ...(body.seasonalPricing.fees?.extraServices && {
                extraServices: {
                  ...existing.seasonalPricing?.fees?.extraServices,
                  ...body.seasonalPricing.fees.extraServices,
                },
              }),
            },
          }),
        },
      }),
      
      // 🆕 v1.0.103.264 - Precificação Avançada (merge profundo)
      ...(body.advancedPricing !== undefined && {
        advancedPricing: {
          ...existing.advancedPricing,
          ...body.advancedPricing,
          ...(body.advancedPricing?.stayDiscounts && {
            stayDiscounts: {
              ...existing.advancedPricing?.stayDiscounts,
              ...body.advancedPricing.stayDiscounts,
            },
          }),
          ...(body.advancedPricing?.seasonalPeriods && {
            seasonalPeriods: {
              ...existing.advancedPricing?.seasonalPeriods,
              ...body.advancedPricing.seasonalPeriods,
            },
          }),
          ...(body.advancedPricing?.weekdayPricing && {
            weekdayPricing: {
              ...existing.advancedPricing?.weekdayPricing,
              ...body.advancedPricing.weekdayPricing,
            },
          }),
          ...(body.advancedPricing?.specialDates && {
            specialDates: {
              ...existing.advancedPricing?.specialDates,
              ...body.advancedPricing.specialDates,
            },
          }),
        },
      }),
      
      // 🆕 v1.0.103.264 - Preços Derivados (merge profundo)
      ...(body.derivedPricing !== undefined && {
        derivedPricing: {
          ...existing.derivedPricing,
          ...body.derivedPricing,
          ...(body.derivedPricing?.guestPricing && {
            guestPricing: {
              ...existing.derivedPricing?.guestPricing,
              ...body.derivedPricing.guestPricing,
            },
          }),
          ...(body.derivedPricing?.childrenPricing && {
            childrenPricing: {
              ...existing.derivedPricing?.childrenPricing,
              ...body.derivedPricing.childrenPricing,
            },
          }),
        },
      }),
      
      // 🆕 v1.0.103.264 - Regras de Hospedagem (merge profundo)
      ...(body.rules !== undefined && {
        rules: {
          ...existing.rules,
          ...body.rules,
          ...(body.rules?.checkIn && {
            checkIn: {
              ...existing.rules?.checkIn,
              ...body.rules.checkIn,
            },
          }),
          ...(body.rules?.checkOut && {
            checkOut: {
              ...existing.rules?.checkOut,
              ...body.rules.checkOut,
            },
          }),
          ...(body.rules?.policies && {
            policies: {
              ...existing.rules?.policies,
              ...body.rules.policies,
            },
          }),
          ...(body.rules?.quietHours && {
            quietHours: {
              ...existing.rules?.quietHours,
              ...body.rules.quietHours,
            },
          }),
          ...(body.rules?.restrictions && {
            restrictions: {
              ...existing.rules?.restrictions,
              ...body.rules.restrictions,
            },
          }),
        },
      }),
      
      // 🆕 v1.0.103.264 - Configurações de Reserva
      ...(body.bookingSettings !== undefined && {
        bookingSettings: {
          ...existing.bookingSettings,
          ...body.bookingSettings,
        },
      }),
      
      // 🆕 v1.0.103.264 - Configurações iCal
      ...(body.icalSettings !== undefined && {
        icalSettings: {
          ...existing.icalSettings,
          ...body.icalSettings,
        },
      }),
      
      updatedAt: getCurrentDateTime(),
    };

    // ✅ MIGRAÇÃO: Salvar no SQL ao invés de KV Store
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido para obter organization_id (UUID)
    let organizationId = existingRow.organization_id; // Usar da propriedade existente como padrão
    if (tenant.type === 'imobiliaria') {
      organizationId = await getOrganizationIdOrThrow(c);
    }
    
    // Converter para formato SQL
    const sqlData = propertyToSql(updated, organizationId);
    
    // Remover campos que não devem ser atualizados (id, organization_id, created_at)
    delete sqlData.id;
    delete sqlData.organization_id;
    delete sqlData.created_at;
    
    // ✅ Fazer UPDATE no SQL (com filtro multi-tenant)
    let updateQuery = client
      .from('properties')
      .update(sqlData)
      .eq('id', id);
    
    // ✅ FILTRO MULTI-TENANT: Se for imobiliária, garantir que property pertence à organização
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      updateQuery = updateQuery.eq('organization_id', organizationId);
    }
    
    const { data: updatedRow, error: updateError } = await updateQuery
      .select(PROPERTY_SELECT_FIELDS)
      .single();
    
    if (updateError) {
      console.error('❌ [updateProperty] SQL error updating:', updateError);
      return c.json(errorResponse('Erro ao atualizar propriedade', { details: updateError.message }), 500);
    }
    
    // ✅ Converter resultado SQL para Property (TypeScript)
    const updatedProperty = sqlToProperty(updatedRow);

    logInfo(`Property updated: ${id} in organization ${organizationId}`);

    return c.json(successResponse(updatedProperty, 'Property updated successfully'));
  } catch (error) {
    logError('Error updating property', error);
    return c.json(errorResponse('Failed to update property'), 500);
  }
}

// ============================================================================
// DELETAR PROPRIEDADE
// ============================================================================

export async function deleteProperty(c: Context) {
  try {
    // ✅ MIGRAÇÃO v1.0.103.400 - SQL + RLS + Multi-tenant
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const id = c.req.param('id');
    
    // Verificar tipo de exclusão via query parameter
    const permanent = c.req.query('permanent') === 'true';
    const force = c.req.query('force') === 'true';
    
    logInfo(`Deleting property: ${id} (permanent: ${permanent}, force: ${force})`);

    // ✅ MIGRAÇÃO: Buscar propriedade do SQL (com filtro multi-tenant)
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT_FIELDS)
      .eq('id', id);
    
    // ✅ FILTRO MULTI-TENANT: Se for imobiliária, garantir que property pertence à organização
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      query = query.eq('organization_id', organizationId);
    }
    
    const { data: existingRow, error: fetchError } = await query.maybeSingle();
    
    if (fetchError) {
      console.error('❌ [deleteProperty] SQL error fetching:', fetchError);
      return c.json(errorResponse('Erro ao buscar propriedade', { details: fetchError.message }), 500);
    }
    
    if (!existingRow) {
      return c.json(notFoundResponse('Property'), 404);
    }
    
    // ✅ Converter resultado SQL para Property (TypeScript)
    const existing = sqlToProperty(existingRow);

    // Se for SOFT DELETE (desativar)
    if (!permanent && !force) {
      logInfo(`Soft deleting property: ${id}`);
      
      // ✅ MIGRAÇÃO: Marcar como inativa no SQL
      let updateQuery = client
        .from('properties')
        .update({ 
          status: 'inactive',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      // ✅ FILTRO MULTI-TENANT
      if (tenant.type === 'imobiliaria') {
        // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
        const organizationId = await getOrganizationIdOrThrow(c);
        updateQuery = updateQuery.eq('organization_id', organizationId);
      }
      
      const { data: updatedRow, error: updateError } = await updateQuery
        .select(PROPERTY_SELECT_FIELDS)
        .single();
      
      if (updateError) {
        console.error('❌ [deleteProperty] SQL error soft deleting:', updateError);
        return c.json(errorResponse('Erro ao desativar propriedade', { details: updateError.message }), 500);
      }
      
      const updated = sqlToProperty(updatedRow);
      
      return c.json(successResponse(updated, 'Property deactivated successfully'));
    }

    // Se for HARD DELETE (exclusão permanente)
    logInfo(`Hard deleting property: ${id} (permanent deletion)`);
    
    // 🎯 v1.0.103.273 - REGRA CRÍTICA: Verificar reservas ativas
    // Uma reserva NUNCA pode ficar órfã sem imóvel atrelado!
    // ✅ MIGRAÇÃO: Verificar no SQL (ainda usa KV Store por enquanto, mas pode migrar depois)
    // TODO: Migrar para SQL quando reservations estiver migrado
    const allReservations = await kv.getByPrefix(`reservation:`);
    const activeReservations = allReservations.filter((r: any) => 
      r.propertyId === id && 
      ['pending', 'confirmed', 'checked_in'].includes(r.status)
    );

    if (activeReservations.length > 0 && !force) {
      // Retornar erro com informações das reservas
      return c.json(
        {
          success: false,
          error: 'INTEGRITY_ERROR',
          message: `Cannot delete property with ${activeReservations.length} active reservation(s). Transfer or cancel them first.`,
          data: {
            activeReservationsCount: activeReservations.length,
            reservations: activeReservations.map((r: any) => ({
              id: r.id,
              code: r.code,
              guestName: r.guestName,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              status: r.status,
            })),
          },
          timestamp: getCurrentDateTime(),
        },
        400
      );
    }

    // ========================================================================
    // EXCLUSÃO PERMANENTE - Deletar TUDO relacionado à propriedade
    // ========================================================================
    
    let deletedItems = {
      property: 0,
      reservations: 0,
      photos: 0,
      rooms: 0,
      listings: 0,
      blocks: 0,
      shortId: 0,
    };
    
    // ✅ MIGRAÇÃO: 1. Deletar a propriedade do SQL (com filtro multi-tenant)
    let deleteQuery = client
      .from('properties')
      .delete()
      .eq('id', id);
    
    // ✅ FILTRO MULTI-TENANT: Se for imobiliária, garantir que property pertence à organização
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      deleteQuery = deleteQuery.eq('organization_id', organizationId);
    }
    
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      console.error('❌ [deleteProperty] SQL error deleting:', deleteError);
      return c.json(errorResponse('Erro ao deletar propriedade', { details: deleteError.message }), 500);
    }
    
    deletedItems.property = 1;
    logInfo(`  ✅ Property deleted from SQL: ${id}`);
    
    // 2. Deletar todas as reservas associadas
    const propertyReservations = allReservations.filter((r: any) => r.propertyId === id);
    
    for (const reservation of propertyReservations) {
      await kv.del(`reservation:${reservation.id}`);
      deletedItems.reservations++;
    }
    
    if (deletedItems.reservations > 0) {
      logInfo(`  ✅ Deleted ${deletedItems.reservations} reservations`);
    }
    
    // 3. Deletar todas as fotos associadas
    const allPhotos = await kv.getByPrefix(`photo:`);
    const propertyPhotos = allPhotos.filter((p: any) => p.propertyId === id);
    
    for (const photo of propertyPhotos) {
      await kv.del(`photo:${photo.id}`);
      deletedItems.photos++;
    }
    
    if (deletedItems.photos > 0) {
      logInfo(`  ✅ Deleted ${deletedItems.photos} photos`);
    }
    
    // 4. Deletar todos os rooms associados
    const allRooms = await kv.getByPrefix(`room:`);
    const propertyRooms = allRooms.filter((r: any) => r.propertyId === id);
    
    for (const room of propertyRooms) {
      await kv.del(`room:${room.id}`);
      deletedItems.rooms++;
    }
    
    if (deletedItems.rooms > 0) {
      logInfo(`  ✅ Deleted ${deletedItems.rooms} rooms`);
    }
    
    // 5. Deletar todos os listings associados
    const allListings = await kv.getByPrefix(`listing:`);
    const propertyListings = allListings.filter((l: any) => l.propertyId === id);
    
    for (const listing of propertyListings) {
      await kv.del(`listing:${listing.id}`);
      deletedItems.listings++;
    }
    
    if (deletedItems.listings > 0) {
      logInfo(`  ✅ Deleted ${deletedItems.listings} listings`);
    }
    
    // 6. Deletar todos os blocks associados
    const allBlocks = await kv.getByPrefix(`block:`);
    const propertyBlocks = allBlocks.filter((b: any) => b.propertyId === id);
    
    for (const block of propertyBlocks) {
      await kv.del(`block:${block.id}`);
      deletedItems.blocks++;
    }
    
    if (deletedItems.blocks > 0) {
      logInfo(`  ✅ Deleted ${deletedItems.blocks} blocks`);
    }
    
    // 7. Deletar Short ID associado (se existir)
    if (existing.shortId) {
      const tenantId = existing.tenantId || 'default';
      
      // Deletar mapeamento shortId -> longId
      await kv.del(`short_id:${tenantId}:${existing.shortId}`);
      
      // Deletar mapeamento reverso longId -> shortId
      await kv.del(`short_id_reverse:${tenantId}:${id}`);
      
      deletedItems.shortId = 1;
      logInfo(`  ✅ Deleted short ID: ${existing.shortId}`);
    }

    const totalDeleted = Object.values(deletedItems).reduce((a, b) => a + b, 0);
    
    logInfo(`✅ Property PERMANENTLY deleted: ${id} (${totalDeleted} items deleted)`);

    return c.json(successResponse({
      id,
      deletedItems,
      totalDeleted,
    }, 'Property permanently deleted successfully'));
  } catch (error) {
    logError('Error deleting property', error);
    return c.json(errorResponse('Failed to delete property'), 500);
  }
}

// ============================================================================
// ESTATÍSTICAS DA PROPRIEDADE
// ============================================================================

// ============================================================================
// BUSCAR LISTINGS DE UMA PROPRIEDADE
// ✅ MELHORIA v1.0.103.400 - Listings separados de Properties
// ============================================================================

export async function getPropertyListings(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const propertyId = c.req.param('id');
    
    logInfo(`Getting listings for property: ${propertyId} for tenant: ${tenant.username}`);

    // Verificar se property existe e pertence à organização
    let propertyQuery = client
      .from('properties')
      .select('id, organization_id')
      .eq('id', propertyId)
      .maybeSingle();

    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      propertyQuery = propertyQuery.eq('organization_id', organizationId);
    }

    const { data: property, error: propertyError } = await propertyQuery;

    if (propertyError) {
      console.error('❌ [getPropertyListings] Error checking property:', propertyError);
      return c.json(errorResponse('Erro ao verificar propriedade', { details: propertyError.message }), 500);
    }

    if (!property) {
      return c.json(notFoundResponse('Property'), 404);
    }

    // Buscar listings da propriedade
    let listingsQuery = client
      .from('listings')
      .select(LISTING_SELECT_FIELDS)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    // ✅ FILTRO MULTI-TENANT: Garantir que listings pertencem à mesma organização da property
    if (tenant.type === 'imobiliaria') {
      // ✅ REFATORADO: Usar helper híbrido para obter organization_id (UUID)
      const organizationId = await getOrganizationIdOrThrow(c);
      listingsQuery = listingsQuery.eq('organization_id', organizationId);
    }

    const { data: rows, error } = await listingsQuery;

    if (error) {
      console.error('❌ [getPropertyListings] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar listings', { details: error.message }), 500);
    }

    // Converter SQL rows para Listing (TypeScript)
    const listings: Listing[] = (rows || []).map(sqlToListing);

    logInfo(`Found ${listings.length} listings for property ${propertyId}`);

    return c.json(successResponse(listings));
  } catch (error) {
    logError('Error getting property listings', error);
    return c.json(errorResponse('Failed to get property listings'), 500);
  }
}

// ============================================================================
// PROPERTY STATS
// ============================================================================

export async function getPropertyStats(c: Context) {
  try {
    const id = c.req.param('id');
    logInfo(`Getting stats for property: ${id}`);

    // Verificar se existe
    const property = await kv.get<Property>(`property:${id}`);
    if (!property) {
      return c.json(notFoundResponse('Property'), 404);
    }

    // Buscar todas as reservas da propriedade
    const allReservations = await kv.getByPrefix(`reservation:`);
    const reservations = allReservations.filter((r: any) => r.propertyId === id);

    // Calcular estatísticas
    const completedReservations = reservations.filter(
      (r: any) => r.status === 'completed'
    );

    const totalNights = completedReservations.reduce(
      (sum: number, r: any) => sum + r.nights,
      0
    );

    const totalRevenue = completedReservations.reduce(
      (sum: number, r: any) => sum + r.pricing.total,
      0
    );

    const upcomingReservations = reservations.filter(
      (r: any) => ['pending', 'confirmed'].includes(r.status)
    ).length;

    const today = new Date().toISOString().split('T')[0];
    const currentlyOccupied = reservations.some((r: any) => 
      r.status === 'checked_in' &&
      r.checkIn <= today &&
      r.checkOut > today
    );

    const stats: PropertyStats = {
      totalReservations: completedReservations.length,
      totalNights,
      totalRevenue,
      occupancyRate: 0, // TODO: Calculate based on date range
      averageDailyRate: totalNights > 0 ? totalRevenue / totalNights : 0,
      averageNightsPerBooking: completedReservations.length > 0 
        ? totalNights / completedReservations.length 
        : 0,
      upcomingReservations,
      currentlyOccupied,
    };

    return c.json(successResponse(stats));
  } catch (error) {
    logError('Error getting property stats', error);
    return c.json(errorResponse('Failed to get property stats'), 500);
  }
}
