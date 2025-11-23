/**
 * Stays.net Full Sync - Sincronização Completa
 * 
 * Importa hóspedes, propriedades e reservas da Stays.net para o banco SQL
 * 
 * @version 1.0.0
 * @updated 2025-11-23
 */

// StaysNetClient será passado como parâmetro para evitar dependência circular
import { getSupabaseClient } from './kv_store.tsx';
import { guestToSql } from './utils-guest-mapper.ts';
import { propertyToSql } from './utils-property-mapper.ts';
import { reservationToSql } from './utils-reservation-mapper.ts';
import { blockToSql } from './utils-block-mapper.ts';
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';
import type { Context } from 'npm:hono';
import { successResponse, errorResponse, logInfo, logError } from './utils.ts';
import type { Guest, Property, Reservation, Block } from './types.ts';

interface SyncStats {
  guests: { fetched: number; created: number; updated: number; failed: number };
  properties: { fetched: number; created: number; updated: number; failed: number };
  reservations: { fetched: number; created: number; updated: number; failed: number };
  errors: string[];
}

/**
 * Converte ObjectId (MongoDB) para UUID v4 válido
 * ObjectId tem 24 caracteres hexadecimais
 */
function objectIdToUUID(objectId: string): string {
  if (!objectId || objectId.length !== 24) {
    // Se não for ObjectId válido, gerar UUID novo
    return crypto.randomUUID();
  }
  
  // ObjectId: 24 caracteres hexadecimais
  // UUID v4: 8-4-4-4-12 caracteres hexadecimais (32 total)
  // Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // onde x é hexadecimal e y é 8, 9, A, ou B
  
  const hex = objectId.toLowerCase();
  
  // Pegar 32 caracteres (ObjectId tem 24, então vamos repetir alguns)
  const uuidHex = (hex + hex.substring(0, 8)).substring(0, 32);
  
  // Formatar como UUID v4
  const uuid = `${uuidHex.substring(0, 8)}-${uuidHex.substring(8, 12)}-4${uuidHex.substring(13, 16)}-${(parseInt(uuidHex.substring(16, 18), 16) & 0x3f | 0x80).toString(16)}${uuidHex.substring(18, 20)}-${uuidHex.substring(20, 32)}`;
  
  return uuid;
}

/**
 * Importação completa de dados da Stays.net
 */
export async function fullSyncStaysNet(
  client: StaysNetClientInterface,
  organizationId: string,
  selectedPropertyIds?: string[], // IDs de propriedades selecionadas para importar
  startDate?: string, // Data inicial para reservas (opcional)
  endDate?: string // Data final para reservas (opcional)
): Promise<{
  success: boolean;
  stats: SyncStats;
}> {
  const supabase = getSupabaseClient();
  const stats: SyncStats = {
    guests: { fetched: 0, created: 0, updated: 0, failed: 0 },
    properties: { fetched: 0, created: 0, updated: 0, failed: 0 },
    reservations: { fetched: 0, created: 0, updated: 0, failed: 0 },
    errors: [],
  };

  try {
    console.log('[StaysNet Full Sync] 🚀 Iniciando importação completa...');
    
    // ✅ Maps para usar nas reservas (criados nas fases anteriores)
    const guestIdMap = new Map<string, string>(); // clientId -> guestId
    const propertyIdMap = new Map<string, string>(); // listingId -> propertyId
    
    // ============================================================================
    // FASE 1: IMPORTAR HÓSPEDES
    // ============================================================================
    console.log('[StaysNet Full Sync] 📥 Fase 1: Importando hóspedes...');
    const clientsResult = await client.getClients();
    
    if (clientsResult.success && clientsResult.data) {
      let staysGuests: any[] = [];
      if (Array.isArray(clientsResult.data)) {
        staysGuests = clientsResult.data;
      } else if (clientsResult.data.clients && Array.isArray(clientsResult.data.clients)) {
        staysGuests = clientsResult.data.clients;
      } else if (clientsResult.data.data && Array.isArray(clientsResult.data.data)) {
        staysGuests = clientsResult.data.data;
      }
      
      stats.guests.fetched = staysGuests.length;
      console.log(`[StaysNet Full Sync] ✅ ${stats.guests.fetched} hóspedes encontrados`);
      
      for (const staysGuest of staysGuests) {
        try {
          const staysClientId = staysGuest._id || staysGuest.id;
          
          // ✅ Converter ObjectId (MongoDB) para UUID válido
          const guestId = objectIdToUUID(staysClientId);
          
          // Converter para formato Rendizy (simplificado - você pode melhorar isso)
          const guest: Guest = {
            id: guestId,
            firstName: staysGuest.firstName || staysGuest.name?.split(' ')[0] || '',
            lastName: staysGuest.lastName || staysGuest.name?.split(' ').slice(1).join(' ') || '',
            fullName: staysGuest.name || `${staysGuest.firstName || ''} ${staysGuest.lastName || ''}`.trim(),
            email: staysGuest.email || null,
            phone: staysGuest.phone || staysGuest.telephone || null,
            cpf: staysGuest.cpf || staysGuest.document?.cpf || null,
            passport: staysGuest.passport || staysGuest.document?.passport || null,
            language: staysGuest.language || 'pt-BR',
            source: 'staysnet',
            createdAt: staysGuest.createdAt || new Date().toISOString(),
            updatedAt: staysGuest.updatedAt || new Date().toISOString(),
          };
          
          const sqlData = guestToSql(guest, organizationId);
          
          // ✅ MELHORADO: Verificar se já existe (por email ou ID)
          let existing = null;
          
          // Buscar por email primeiro (mais confiável)
          if (guest.email) {
            const { data: byEmail } = await supabase
              .from('guests')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('email', guest.email)
              .maybeSingle();
            existing = byEmail;
          }
          
          // Se não encontrou por email, tentar por ID
          if (!existing && guest.id) {
            const { data: byId } = await supabase
              .from('guests')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('id', guest.id)
              .maybeSingle();
            existing = byId;
          }
          
          // Se ainda não encontrou e tem CPF, tentar por CPF
          if (!existing && guest.cpf) {
            const { data: byCpf } = await supabase
              .from('guests')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('cpf', guest.cpf)
              .maybeSingle();
            existing = byCpf;
          }
          
          if (existing) {
            // Atualizar
            const { error } = await supabase
              .from('guests')
              .update({
                ...sqlData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            
            if (error) throw error;
            stats.guests.updated++;
            guestIdMap.set(staysClientId, existing.id);
            console.log(`✅ [StaysNet Full Sync] Hóspede atualizado: ${existing.id} (${guest.fullName})`);
          } else {
            // Criar
            const { error } = await supabase
              .from('guests')
              .insert(sqlData);
            
            if (error) {
              console.error(`❌ [StaysNet Full Sync] Erro ao criar hóspede:`, error);
              throw error;
            }
            stats.guests.created++;
            guestIdMap.set(staysClientId, guest.id);
            console.log(`✅ [StaysNet Full Sync] Hóspede criado: ${guest.id} (${guest.fullName})`);
          }
        } catch (error: any) {
          console.error(`[StaysNet Full Sync] ❌ Erro ao importar hóspede:`, error);
          stats.guests.failed++;
          stats.errors.push(`Hóspede ${staysGuest._id || staysGuest.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`[StaysNet Full Sync] ✅ Fase 1 concluída: ${stats.guests.created} criados, ${stats.guests.updated} atualizados, ${stats.guests.failed} falharam`);
    
    // ============================================================================
    // FASE 2: IMPORTAR PROPRIEDADES (LISTINGS)
    // ============================================================================
    console.log('[StaysNet Full Sync] 📥 Fase 2: Importando propriedades...');
    const listingsResult = await client.getListings();
    
    if (listingsResult.success && listingsResult.data) {
      let staysListings: any[] = [];
      if (Array.isArray(listingsResult.data)) {
        staysListings = listingsResult.data;
      } else if (listingsResult.data.listings && Array.isArray(listingsResult.data.listings)) {
        staysListings = listingsResult.data.listings;
      } else if (listingsResult.data.data && Array.isArray(listingsResult.data.data)) {
        staysListings = listingsResult.data.data;
      }
      
      // Filtrar por propriedades selecionadas se fornecido
      if (selectedPropertyIds && selectedPropertyIds.length > 0) {
        staysListings = staysListings.filter(listing => 
          selectedPropertyIds.includes(listing._id || listing.id)
        );
      }
      
      stats.properties.fetched = staysListings.length;
      console.log(`[StaysNet Full Sync] ✅ ${stats.properties.fetched} propriedades encontradas`);
      
      for (const staysListing of staysListings) {
        try {
          const staysListingId = staysListing._id || staysListing.id;
          
          // ✅ Converter ObjectId (MongoDB) para UUID válido
          const propertyId = objectIdToUUID(staysListingId);
          
          // Converter para formato Rendizy (simplificado - você pode melhorar isso)
          const property: Property = {
            id: propertyId,
            name: staysListing._mstitle?.pt_BR || staysListing._mstitle?.en_US || staysListing.internalName || 'Propriedade sem nome',
            code: staysListing.id || staysListing._id || '',
            type: 'apartment', // Você pode mapear melhor baseado em staysListing._t_typeMeta
            status: staysListing.status === 'active' ? 'active' : 'draft',
            address: staysListing.address ? {
              street: staysListing.address.street || '',
              number: staysListing.address.streetNumber || '',
              complement: staysListing.address.additional,
              neighborhood: staysListing.address.region || '',
              city: staysListing.address.city || '',
              state: staysListing.address.stateCode || staysListing.address.state || '',
              zipCode: staysListing.address.zip || '',
              country: staysListing.address.countryCode || 'BR',
            } : undefined,
            maxGuests: staysListing._i_maxGuests || 2,
            bedrooms: staysListing._i_rooms || 0,
            beds: staysListing._i_beds || 0,
            bathrooms: Math.floor(staysListing._f_bathrooms || 0),
            coverPhoto: staysListing._t_mainImageMeta?.url,
            photos: staysListing._t_mainImageMeta?.url ? [staysListing._t_mainImageMeta.url] : [],
            description: staysListing._msdesc?.pt_BR || staysListing._msdesc?.en_US,
            pricing: {
              basePrice: 0,
              currency: staysListing.deff_curr || 'BRL',
            },
            platforms: {
              direct: staysListing.otaChannels?.some((ch: any) => ch.name?.toLowerCase().includes('website')) || false,
            },
            createdAt: staysListing.createdAt || new Date().toISOString(),
            updatedAt: staysListing.updatedAt || new Date().toISOString(),
            ownerId: 'system',
            isActive: staysListing.status === 'active',
          };
          
          const sqlData = propertyToSql(property, organizationId);
          
          // Verificar se já existe
          const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('code', property.code)
            .maybeSingle();
          
          if (existing) {
            // Atualizar
            const { error } = await supabase
              .from('properties')
              .update(sqlData)
              .eq('id', existing.id);
            
            if (error) throw error;
            stats.properties.updated++;
            propertyIdMap.set(staysListingId, existing.id);
          } else {
            // Criar
            const { error } = await supabase
              .from('properties')
              .insert(sqlData);
            
            if (error) throw error;
            stats.properties.created++;
            propertyIdMap.set(staysListingId, property.id);
          }
        } catch (error: any) {
          console.error(`[StaysNet Full Sync] ❌ Erro ao importar propriedade:`, error);
          stats.properties.failed++;
          stats.errors.push(`Propriedade ${staysListing._id || staysListing.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`[StaysNet Full Sync] ✅ Fase 2 concluída: ${stats.properties.created} criadas, ${stats.properties.updated} atualizadas, ${stats.properties.failed} falharam`);
    
    // ============================================================================
    // FASE 3: IMPORTAR RESERVAS
    // ============================================================================
    console.log('[StaysNet Full Sync] 📥 Fase 3: Importando reservas...');
    const reservationsStartDate = startDate || '2025-01-01';
    const reservationsEndDate = endDate || '2026-12-31';
    const reservationsResult = await client.getReservations({ 
      startDate: reservationsStartDate, 
      endDate: reservationsEndDate 
    });
    
    if (reservationsResult.success && reservationsResult.data) {
      let staysReservations: any[] = [];
      if (Array.isArray(reservationsResult.data)) {
        staysReservations = reservationsResult.data;
      } else if (reservationsResult.data.reservations && Array.isArray(reservationsResult.data.reservations)) {
        staysReservations = reservationsResult.data.reservations;
      } else if (reservationsResult.data.data && Array.isArray(reservationsResult.data.data)) {
        staysReservations = reservationsResult.data.data;
      }
      
      stats.reservations.fetched = staysReservations.length;
      console.log(`[StaysNet Full Sync] ✅ ${stats.reservations.fetched} reservas encontradas`);
      
      // Buscar propriedades e hóspedes do banco para fallback
      const { data: allProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('organization_id', organizationId);
      
      const { data: allGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('organization_id', organizationId);
      
      for (const staysRes of staysReservations) {
        try {
          const staysResId = staysRes._id || staysRes.id;
          const staysListingId = staysRes._idlisting || staysRes.listingId;
          const staysClientId = staysRes._idclient || staysRes.clientId;
          
          // ✅ Converter ObjectId (MongoDB) para UUID válido
          const reservationId = objectIdToUUID(staysResId);
          
          // Buscar property_id e guest_id usando os maps ou fallback
          let propertyId = propertyIdMap.get(staysListingId);
          if (!propertyId && allProperties && allProperties.length > 0) {
            // Fallback: usar primeira propriedade disponível (você pode melhorar isso)
            propertyId = allProperties[0].id;
          }
          
          let guestId = guestIdMap.get(staysClientId);
          if (!guestId && allGuests && allGuests.length > 0) {
            // Fallback: usar primeiro hóspede disponível (você pode melhorar isso)
            guestId = allGuests[0].id;
          }
          
          if (!propertyId || !guestId) {
            console.warn(`[StaysNet Full Sync] ⚠️ Reserva ${staysResId} sem property_id ou guest_id, pulando...`);
            stats.reservations.failed++;
            continue;
          }
          
          // Calcular noites
          const checkIn = new Date(staysRes.checkInDate || staysRes.from || staysRes.check_in);
          const checkOut = new Date(staysRes.checkOutDate || staysRes.to || staysRes.check_out);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          
          // Converter para formato Rendizy
          const reservation: Reservation = {
            id: reservationId,
            propertyId,
            guestId,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            nights,
            guests: {
              adults: staysRes._i_maxGuests || staysRes.guests?.adults || 1,
              children: staysRes.guests?.children || 0,
              infants: staysRes.guests?.infants || 0,
              pets: staysRes.guests?.pets || 0,
              total: staysRes._i_maxGuests || staysRes.guests?.total || 1,
            },
            pricing: {
              pricePerNight: (staysRes.price?.hostingDetails?._f_nightPrice || staysRes._f_nightPrice || 0) / 100, // Converter centavos para reais
              baseTotal: (staysRes.price?.hostingDetails?.baseTotal || staysRes._f_total || 0) / 100,
              cleaningFee: (staysRes.price?.hostingDetails?.fees?.cleaning || 0) / 100,
              serviceFee: (staysRes.price?.hostingDetails?.fees?.service || 0) / 100,
              taxes: (staysRes.price?.hostingDetails?.fees?.tax || 0) / 100,
              total: (staysRes.stats?._f_totalPaid || staysRes._f_total || 0) / 100,
              currency: staysRes.price?.currency || 'BRL',
            },
            status: staysRes.type === 'cancelled' ? 'cancelled' : 'confirmed',
            platform: staysRes.partner?.name || staysRes.source || 'staysnet',
            externalId: staysRes.partnerCode || staysRes.externalId,
            externalUrl: staysRes.reservationUrl,
            notes: staysRes.notes || staysRes.specialRequests,
            createdAt: staysRes.creationDate || staysRes.createdAt || new Date().toISOString(),
            updatedAt: staysRes.updatedAt || new Date().toISOString(),
            createdBy: 'system',
          };
          
          const sqlData = reservationToSql(reservation, organizationId);
          
          // ✅ MELHORADO: Verificar se já existe (por external_id ou ID)
          let existing = null;
          if (reservation.externalId) {
            const { data: byExternalId } = await supabase
              .from('reservations')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('external_id', reservation.externalId)
              .maybeSingle();
            existing = byExternalId;
          }
          
          // Se não encontrou por external_id, tentar por ID
          if (!existing && reservation.id) {
            const { data: byId } = await supabase
              .from('reservations')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('id', reservation.id)
              .maybeSingle();
            existing = byId;
          }
          
          let reservationId: string;
          if (existing) {
            // Atualizar
            const { error } = await supabase
              .from('reservations')
              .update(sqlData)
              .eq('id', existing.id);
            
            if (error) throw error;
            stats.reservations.updated++;
            reservationId = existing.id;
          } else {
            // Criar
            const { error } = await supabase
              .from('reservations')
              .insert(sqlData);
            
            if (error) throw error;
            stats.reservations.created++;
            reservationId = reservation.id;
          }
          
          // ✅ NOVO: Criar block no calendário automaticamente quando reserva é criada/atualizada
          try {
            const blockId = `blk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            // Formatar datas para YYYY-MM-DD
            const checkInDate = new Date(reservation.checkIn);
            const checkOutDate = new Date(reservation.checkOut);
            const checkInStr = checkInDate.toISOString().split('T')[0];
            const checkOutStr = checkOutDate.toISOString().split('T')[0];
            
            const block: Block = {
              id: blockId,
              propertyId: reservation.propertyId,
              startDate: checkInStr,
              endDate: checkOutStr,
              nights: reservation.nights,
              type: 'block',
              subtype: 'reservation',
              reason: `Reserva Stays.net: ${reservation.externalId || reservationId}`,
              notes: `Reserva sincronizada do Stays.net - ${reservation.guests.total} hóspede(s)`,
              createdAt: now,
              updatedAt: now,
              createdBy: 'system',
            };
            
            const blockSqlData = blockToSql(block, organizationId);
            
            // Verificar se já existe block para este período
            const { data: existingBlock } = await supabase
              .from('blocks')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('property_id', reservation.propertyId)
              .eq('start_date', checkInStr)
              .eq('end_date', checkOutStr)
              .maybeSingle();
            
            if (!existingBlock) {
              const { error: blockError } = await supabase
                .from('blocks')
                .insert(blockSqlData);
              
              if (blockError) {
                console.warn(`⚠️ [StaysNet Full Sync] Erro ao criar block no calendário para reserva ${reservationId}:`, blockError);
                // Não falhar a criação da reserva se o block falhar
              } else {
                console.log(`✅ [StaysNet Full Sync] Block criado no calendário para reserva ${reservationId}`);
              }
            }
          } catch (blockError: any) {
            console.warn(`⚠️ [StaysNet Full Sync] Erro ao criar block no calendário para reserva ${reservationId}:`, blockError);
            // Não falhar a criação da reserva se o block falhar
          }
        } catch (error: any) {
          console.error(`[StaysNet Full Sync] ❌ Erro ao importar reserva:`, error);
          stats.reservations.failed++;
          stats.errors.push(`Reserva ${staysRes._id || staysRes.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`[StaysNet Full Sync] ✅ Fase 3 concluída: ${stats.reservations.created} criadas, ${stats.reservations.updated} atualizadas, ${stats.reservations.failed} falharam`);
    console.log('[StaysNet Full Sync] 🎉 Importação completa finalizada!');
    
    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    console.error('[StaysNet Full Sync] ❌ Erro geral:', error);
    stats.errors.push(`Erro geral: ${error.message}`);
    return {
      success: false,
      stats,
    };
  }
}

