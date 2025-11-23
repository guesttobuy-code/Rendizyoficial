import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

// Import route handlers
import authApp from './routes-auth.ts';
import * as locationsRoutes from './routes-locations.ts';
import * as propertiesRoutes from './routes-properties.ts';
import * as reservationsRoutes from './routes-reservations.ts';
import * as guestsRoutes from './routes-guests.ts';
import * as calendarRoutes from './routes-calendar.ts';
import * as photosRoutes from './routes-photos.ts';
import organizationsApp from './routes-organizations.ts';
import usersApp from './routes-users.ts';
import clientsApp from './routes-clients.ts';
import ownersApp from './routes-owners.ts';
import { bookingcomRoutes } from './routes-bookingcom.ts';
import listingsApp from './routes-listings.ts';
import roomsApp from './routes-rooms.ts';
import rulesApp from './routes-rules.ts';
import pricingSettingsApp from './routes-pricing-settings.ts';
import seasonalPricingApp from './routes-seasonal-pricing.ts';
import icalApp from './routes-ical.ts';
import settingsApp from './routes-settings.ts';
import bulkPricingApp from './routes-bulk-pricing.ts';
import chatApp from './routes-chat.ts';
import quotationsApp from './routes-quotations.ts';
import blocksApp from './routes-blocks.ts';
import propertyTypesApp from './routes-property-types.ts';
import propertyWizardApp from './routes-property-wizard.ts';
import * as locationAmenitiesRoutes from './routes-location-amenities.ts';
import * as staysnetRoutes from './routes-staysnet.ts';
import * as amenitiesRoutes from './routes-amenities.ts';
// v1.0.103.319: WhatsApp Evolution API COMPLETA (40/40 rotas)
import { whatsappEvolutionRoutes } from './routes-whatsapp-evolution.ts';
import { whatsappDataRoutes } from './routes-whatsapp-data.ts';
import clientSitesApp from './routes-client-sites.ts';
import shortIdsApp from './routes-short-ids.ts';
import adminCleanupApp from './routes-admin-cleanup.ts';
import resetRoutes from './reset-database.ts';
import { seedDatabase } from './seed-data.ts';
import { seedDatabaseNew } from './seed-data-new.ts';
import { seedTestProperties } from './seed-data-test.ts';
import { seedCompleteTest } from './seed-complete-test.ts';
import { migrateNormalizeProperties } from './migrate-normalize-properties.ts';
// ✅ MELHORIA v1.0.103.400 - Migração Property.platforms → Listings
import { migratePropertiesToListingsRoute } from './migrate-properties-to-listings.ts';
// ✅ MELHORIA v1.0.103.400 - Tenancy Middleware (Passo 2)
import { tenancyMiddleware } from './utils-tenancy.ts';
// ✅ MELHORIA v1.0.103.400 - Tenants Routes (Passo 3)
import tenantsApp from './routes-tenants.ts';

const app = new Hono();

// ============================================================================
// CORS CONFIGURATION - DEVE VIR ANTES DE TUDO
// ============================================================================
// ✅ SOLUÇÃO SIMPLES - Como estava funcionando ontem
// origin: "*" funciona quando NÃO usa credentials: true
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "apikey", "X-Auth-Token"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  }),
);

// Enable logger (DEPOIS do CORS)
app.use('*', logger(console.log));

// ✅ DEBUG GLOBAL: Capturar TODAS as requisições para /make-server-67caf26a/auth/me
app.use('*', async (c, next) => {
  const path = c.req.path;
  if (path.includes('/auth/me') || path.includes('make-server-67caf26a/auth/me')) {
    console.log('🚨 [DEBUG GLOBAL] Requisição capturada para:', path);
    console.log('🚨 [DEBUG GLOBAL] URL completa:', c.req.url);
    console.log('🚨 [DEBUG GLOBAL] Method:', c.req.method);
    console.log('🚨 [DEBUG GLOBAL] Headers:', {
      'X-Auth-Token': c.req.header('X-Auth-Token') ? 'present (' + (c.req.header('X-Auth-Token')?.substring(0, 20) || '') + '...)' : 'missing',
      'Authorization': c.req.header('Authorization') ? 'present' : 'missing',
      'apikey': c.req.header('apikey') ? 'present' : 'missing'
    });
  }
  await next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/rendizy-server/make-server-67caf26a/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Rendizy Backend API"
  });
});

// ============================================================================
// AUTHENTICATION ROUTES (v1.0.103.259)
// Sistema de Login Multi-Tenant: SuperAdmin + Imobiliárias
// ============================================================================

// ✅ SOLUÇÃO DEFINITIVA: Rota /auth/me usando o mesmo padrão das outras rotas (com make-server-67caf26a)
// ✅ IMPORTANTE: Registrar ANTES do middleware genérico para garantir que seja capturada primeiro
// Isso garante que funcione igual às outras rotas que já estão funcionando
app.get('/rendizy-server/make-server-67caf26a/auth/me', async (c) => {
  console.log('🚀 [index.ts] ROTA /make-server-67caf26a/auth/me CHAMADA DIRETAMENTE!');
  console.log('🔍 [index.ts] Headers recebidos:', {
    'X-Auth-Token': c.req.header('X-Auth-Token') ? 'present (' + (c.req.header('X-Auth-Token')?.substring(0, 20) || '') + '...)' : 'missing',
    'Authorization': c.req.header('Authorization') ? 'present' : 'missing',
    'apikey': c.req.header('apikey') ? 'present' : 'missing'
  });
  
  // Importar função diretamente para evitar problemas de roteamento
  const { getSessionFromToken } = await import('./utils-session.ts');
  const { getSupabaseClient } = await import('./kv_store.tsx');
  
  try {
    let token = c.req.header('X-Auth-Token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      token = authHeader?.split(' ')[1];
    }
    
    console.log('🔍 [index.ts] Token extraído:', token ? token.substring(0, 20) + '...' : 'NONE');
    console.log('🔍 [index.ts] Token completo (primeiros 50 chars):', token ? token.substring(0, 50) : 'NONE');
    console.log('🔍 [index.ts] Token length:', token ? token.length : 0);
    
    if (!token) {
      console.log('❌ [index.ts] Token não fornecido - retornando 401');
      return c.json({
        success: false,
        error: 'Token não fornecido'
      }, 401);
    }
    
    console.log('🔍 [index.ts] Buscando sessão com token:', token?.substring(0, 20) + '...');
    console.log('🔍 [index.ts] Chamando getSessionFromToken...');
    const session = await getSessionFromToken(token);
    
    console.log('🔍 [index.ts] Resultado de getSessionFromToken:', session ? `Sessão encontrada: ${session.userId}` : 'Sessão NÃO encontrada');
    
    if (!session) {
      console.log('❌ [index.ts] Sessão não encontrada ou inválida');
      console.log('❌ [index.ts] Token usado na busca:', token.substring(0, 30) + '...');
      
      // ✅ DEBUG: Verificar se há alguma sessão na tabela (mesmo que não seja a correta)
      try {
        const { getSupabaseClient } = await import('./kv_store.tsx');
        const supabase = getSupabaseClient();
        const { data: allSessions, error: checkError } = await supabase
          .from('sessions')
          .select('token, user_id, created_at, expires_at')
          .limit(5)
          .order('created_at', { ascending: false });
        
        console.log('🔍 [index.ts] DEBUG: Últimas 5 sessões na tabela:', {
          count: allSessions?.length || 0,
          sessions: allSessions?.map(s => ({
            token: s.token?.substring(0, 20) + '...',
            userId: s.user_id,
            createdAt: s.created_at
          })) || [],
          error: checkError?.message
        });
      } catch (debugError) {
        console.error('❌ [index.ts] Erro ao verificar sessões na tabela:', debugError);
      }
      
      return c.json({
        success: false,
        error: 'Sessão inválida ou expirada',
        code: 'SESSION_NOT_FOUND'
      }, 401);
    }
    
    console.log('✅ [index.ts] Sessão encontrada:', session.userId);
    
    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();
    
    if (userError || !user) {
      console.error('❌ [index.ts] Usuário não encontrado:', userError);
      return c.json({
        success: false,
        error: 'Usuário não encontrado'
      }, 404);
    }
    
    let organization = null;
    if (user.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', user.organization_id)
        .single();
      
      if (org) {
        organization = org;
      }
    }
    
    console.log('✅ [index.ts] Retornando dados do usuário:', user.username);
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status,
        organizationId: user.organization_id || undefined,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        } : null
      },
      session: {
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('❌ [index.ts] Erro ao verificar sessão:', error);
    return c.json({
      success: false,
      error: 'Erro ao verificar sessão'
    }, 500);
  }
});

// ✅ ARQUITETURA SQL: Rota de autenticação sem make-server-67caf26a
// ✅ DEBUG: Log antes de registrar rota
app.use('/rendizy-server/auth/*', async (c, next) => {
  console.log('🔍 [index.ts] Interceptando requisição para:', c.req.path);
  console.log('🔍 [index.ts] URL completa:', c.req.url);
  console.log('🔍 [index.ts] Method:', c.req.method);
  console.log('🔍 [index.ts] Headers:', {
    'X-Auth-Token': c.req.header('X-Auth-Token') ? 'present (' + (c.req.header('X-Auth-Token')?.substring(0, 20) || '') + '...)' : 'missing',
    'Authorization': c.req.header('Authorization') ? 'present' : 'missing',
    'apikey': c.req.header('apikey') ? 'present' : 'missing'
  });
  await next();
});
app.route('/rendizy-server/auth', authApp);

// ============================================================================
// LOCATIONS ROUTES
// ============================================================================

app.get("/rendizy-server/make-server-67caf26a/locations", locationsRoutes.listLocations);
app.get("/rendizy-server/make-server-67caf26a/locations/:id", locationsRoutes.getLocation);
app.post("/rendizy-server/make-server-67caf26a/locations", locationsRoutes.createLocation);
app.put("/rendizy-server/make-server-67caf26a/locations/:id", locationsRoutes.updateLocation);
app.delete("/rendizy-server/make-server-67caf26a/locations/:id", locationsRoutes.deleteLocation);
app.get("/rendizy-server/make-server-67caf26a/locations/:id/accommodations", locationsRoutes.getLocationAccommodations);

// ============================================================================
// PROPERTIES/ACCOMMODATIONS ROUTES
// ✅ MELHORIA v1.0.103.400 - Aplicado tenancyMiddleware (Passo 2)
// ============================================================================

// ✅ Middleware de autenticação para todas as rotas de properties
app.use('/rendizy-server/make-server-67caf26a/properties/*', tenancyMiddleware);

app.get("/rendizy-server/make-server-67caf26a/properties", propertiesRoutes.listProperties);
app.get("/rendizy-server/make-server-67caf26a/properties/:id", propertiesRoutes.getProperty);
app.post("/rendizy-server/make-server-67caf26a/properties", propertiesRoutes.createProperty);
app.put("/rendizy-server/make-server-67caf26a/properties/:id", propertiesRoutes.updateProperty);
app.delete("/rendizy-server/make-server-67caf26a/properties/:id", propertiesRoutes.deleteProperty);
app.get("/rendizy-server/make-server-67caf26a/properties/:id/stats", propertiesRoutes.getPropertyStats);
// ✅ MELHORIA v1.0.103.400 - Listings separados de Properties
app.get("/rendizy-server/make-server-67caf26a/properties/:id/listings", propertiesRoutes.getPropertyListings);

// ============================================================================
// AMENITIES ROUTES (v1.0.103.80)
// Gerenciamento de Location Amenities vs Listing Amenities
// ============================================================================

app.get("/rendizy-server/make-server-67caf26a/properties/:id/amenities", amenitiesRoutes.getPropertyAmenities);
app.put("/rendizy-server/make-server-67caf26a/properties/:id/location-amenities", amenitiesRoutes.updateLocationAmenities);
app.put("/rendizy-server/make-server-67caf26a/properties/:id/listing-amenities", amenitiesRoutes.updateListingAmenities);

// ============================================================================
// RESERVATIONS ROUTES
// ✅ MELHORIA v1.0.103.400 - Aplicado tenancyMiddleware (Prompt 4)
// ============================================================================

// ✅ Middleware de autenticação para todas as rotas de reservations
app.use('/rendizy-server/make-server-67caf26a/reservations/*', tenancyMiddleware);

app.get("/rendizy-server/make-server-67caf26a/reservations", reservationsRoutes.listReservations);
app.get("/rendizy-server/make-server-67caf26a/reservations/:id", reservationsRoutes.getReservation);
app.post("/rendizy-server/make-server-67caf26a/reservations", reservationsRoutes.createReservation);
app.put("/rendizy-server/make-server-67caf26a/reservations/:id", reservationsRoutes.updateReservation);
app.delete("/rendizy-server/make-server-67caf26a/reservations/:id", reservationsRoutes.deleteReservation);
app.post("/rendizy-server/make-server-67caf26a/reservations/:id/cancel", reservationsRoutes.cancelReservation);
app.post("/rendizy-server/make-server-67caf26a/reservations/check-availability", reservationsRoutes.checkAvailability);
app.get("/rendizy-server/make-server-67caf26a/reservations/detect-conflicts", reservationsRoutes.detectConflicts);

// ============================================================================
// GUESTS ROUTES
// ✅ MELHORIA v1.0.103.400 - Aplicado tenancyMiddleware (Prompt 4)
// ============================================================================

// ✅ Middleware de autenticação para todas as rotas de guests
app.use('/rendizy-server/make-server-67caf26a/guests/*', tenancyMiddleware);

app.get("/rendizy-server/make-server-67caf26a/guests", guestsRoutes.listGuests);
app.get("/rendizy-server/make-server-67caf26a/guests/:id", guestsRoutes.getGuest);
app.post("/rendizy-server/make-server-67caf26a/guests", guestsRoutes.createGuest);
app.put("/rendizy-server/make-server-67caf26a/guests/:id", guestsRoutes.updateGuest);
app.delete("/rendizy-server/make-server-67caf26a/guests/:id", guestsRoutes.deleteGuest);
app.get("/rendizy-server/make-server-67caf26a/guests/:id/history", guestsRoutes.getGuestHistory);
app.post("/rendizy-server/make-server-67caf26a/guests/:id/blacklist", guestsRoutes.toggleBlacklist);

// ============================================================================
// CALENDAR ROUTES
// ✅ MELHORIA v1.0.103.400 - Aplicado tenancyMiddleware (Prompt 4)
// ============================================================================

// ✅ Middleware de autenticação para todas as rotas de calendar
app.use('/rendizy-server/make-server-67caf26a/calendar/*', tenancyMiddleware);

app.get("/rendizy-server/make-server-67caf26a/calendar", calendarRoutes.getCalendarData);
app.get("/rendizy-server/make-server-67caf26a/calendar/stats", calendarRoutes.getCalendarStats);
app.post("/rendizy-server/make-server-67caf26a/calendar/blocks", calendarRoutes.createBlock);
app.delete("/rendizy-server/make-server-67caf26a/calendar/blocks/:id", calendarRoutes.deleteBlock);
app.post("/rendizy-server/make-server-67caf26a/calendar/bulk-update-prices", calendarRoutes.bulkUpdatePrices);
app.post("/rendizy-server/make-server-67caf26a/calendar/bulk-update-min-nights", calendarRoutes.bulkUpdateMinNights);
app.post("/rendizy-server/make-server-67caf26a/calendar/delete-custom-prices", calendarRoutes.deleteCustomPrices);

// ============================================================================
// PHOTOS ROUTES
// ============================================================================

app.post("/rendizy-server/make-server-67caf26a/photos", photosRoutes.uploadPhotoBase64); // Base64 upload (for FigmaTestPropertyCreator)
app.post("/rendizy-server/make-server-67caf26a/photos/upload", photosRoutes.uploadPhoto); // FormData upload (for PhotoManager)
app.put("/rendizy-server/make-server-67caf26a/photos/:photoId", photosRoutes.updatePhoto); // Update photo metadata
app.delete("/rendizy-server/make-server-67caf26a/photos/:path", photosRoutes.deletePhoto);
app.get("/rendizy-server/make-server-67caf26a/photos/property/:propertyId", photosRoutes.listPropertyPhotos);

// ============================================================================
// ORGANIZATIONS ROUTES
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/organizations", organizationsApp);

// ============================================================================
// USERS ROUTES
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/users", usersApp);

// ============================================================================
// BOOKING.COM INTEGRATION ROUTES
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/bookingcom", bookingcomRoutes);

// ============================================================================
// LISTINGS ROUTES
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/listings", listingsApp);

// ============================================================================
// ROOMS ROUTES (v1.0.79)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", roomsApp);

// ============================================================================
// ACCOMMODATION RULES ROUTES (v1.0.80)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", rulesApp);

// ============================================================================
// PRICING SETTINGS ROUTES (v1.0.81)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", pricingSettingsApp);

// ============================================================================
// SEASONAL PRICING ROUTES (v1.0.103.88)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", seasonalPricingApp);

// ============================================================================
// ICAL SYNCHRONIZATION ROUTES (v1.0.83)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", icalApp);

// ============================================================================
// SETTINGS ROUTES (Global vs Individual) (v1.0.84)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", settingsApp);

// ============================================================================
// BULK PRICING ROUTES (v1.0.85)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a", bulkPricingApp);

// ============================================================================
// CHAT ROUTES (v1.0.93)
// ✅ REABILITADO v1.0.103.87 - Necessário para canais de comunicação
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/chat", chatApp);

// ============================================================================
// WHATSAPP EVOLUTION API ROUTES (v1.0.103.84)
// Integração Evolution API com proxy seguro
// ============================================================================

whatsappEvolutionRoutes(app);

// ============================================================================
// WHATSAPP DATA MANAGEMENT ROUTES (v1.0.103.265)
// Gerenciamento de dados WhatsApp no KV Store
// ============================================================================

whatsappDataRoutes(app);

// ============================================================================
// QUOTATIONS ROUTES (v1.0.90)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/quotations", quotationsApp);

// ============================================================================
// BLOCKS ROUTES (v1.0.90)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/blocks", blocksApp);

// ============================================================================
// PROPERTY TYPES ROUTES (v1.0.103.8)
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/property-types", propertyTypesApp);

// ============================================================================
// PROPERTY WIZARD ROUTES (v1.0.103.111)
// Backend completo para os 7 passos do wizard de edição
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/properties/wizard", propertyWizardApp);

// ============================================================================
// LOCATION AMENITIES ROUTES (v1.0.103.11)
// ============================================================================

app.get("/rendizy-server/make-server-67caf26a/settings/location-amenities", locationAmenitiesRoutes.getLocationAmenitiesConfig);
app.put("/rendizy-server/make-server-67caf26a/settings/location-amenities", locationAmenitiesRoutes.updateLocationAmenitiesConfig);
app.post("/rendizy-server/make-server-67caf26a/settings/location-amenities/reset", locationAmenitiesRoutes.resetLocationAmenitiesConfig);
app.get("/rendizy-server/make-server-67caf26a/settings/location-amenities/enabled", locationAmenitiesRoutes.getEnabledAmenitiesForLocation);

// ============================================================================
// STAYS.NET PMS INTEGRATION ROUTES (v1.0.103.17)
// ============================================================================

app.get("/rendizy-server/make-server-67caf26a/settings/staysnet", staysnetRoutes.getStaysNetConfig);
app.post("/rendizy-server/make-server-67caf26a/settings/staysnet", staysnetRoutes.saveStaysNetConfig);
app.post("/rendizy-server/make-server-67caf26a/staysnet/test", staysnetRoutes.testStaysNetConnection);
app.post("/rendizy-server/make-server-67caf26a/staysnet/test-endpoint", staysnetRoutes.testStaysNetEndpoint);
app.post("/rendizy-server/make-server-67caf26a/staysnet/sync/properties", staysnetRoutes.syncStaysNetProperties);
app.post("/rendizy-server/make-server-67caf26a/staysnet/sync/reservations", staysnetRoutes.syncStaysNetReservations);
app.get("/rendizy-server/make-server-67caf26a/staysnet/reservations/preview", staysnetRoutes.previewStaysNetReservations);
app.post("/rendizy-server/make-server-67caf26a/staysnet/import/full", staysnetRoutes.importFullStaysNet);

// ============================================================================
// CLIENT SITES ROUTES (v1.0.103.187)
// Sistema de gestão de sites customizados por cliente
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/client-sites", clientSitesApp);

// ============================================================================
// SHORT IDS ROUTES (v1.0.103.271)
// Sistema de IDs curtos (6 caracteres) para propriedades
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/short-ids", shortIdsApp);

// ============================================================================
// ADMIN CLEANUP ROUTES (v1.0.103.272)
// ⚠️ Rotas administrativas de limpeza - DELETE ALL PROPERTIES
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/admin/cleanup", adminCleanupApp);

// ============================================================================
// ORGANIZATIONS, USERS, CLIENTS & OWNERS ROUTES (v1.0.103.232)
// Sistema SaaS Multi-tenant - Gerenciamento completo
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/organizations", organizationsApp);
app.route("/rendizy-server/make-server-67caf26a/users", usersApp);
app.route("/rendizy-server/make-server-67caf26a/clients", clientsApp);
app.route("/rendizy-server/make-server-67caf26a/owners", ownersApp);
// ✅ MELHORIA v1.0.103.400 - Tenants Routes (Passo 3)
app.route("/rendizy-server/make-server-67caf26a/tenants", tenantsApp);

// ============================================================================
// DATABASE RESET ROUTES (v1.0.103.267)
// ⚠️ Sistema de reset do banco de dados - USAR COM CUIDADO
// ============================================================================

app.route("/rendizy-server/make-server-67caf26a/reset", resetRoutes);

// ============================================================================
// DEVELOPMENT / TESTING ROUTES
// ============================================================================

// Seed database with sample data (OLD STRUCTURE - compatibilidade)
app.post("/rendizy-server/make-server-67caf26a/dev/seed-database", async (c) => {
  try {
    console.log('🌱 Starting database seed (OLD STRUCTURE)...');
    const result = await seedDatabase();
    
    return c.json({
      success: true,
      message: 'Database seeded successfully (old structure)',
      data: {
        propertiesCount: result.properties.length,
        guestsCount: result.guests.length,
        reservationsCount: result.reservations.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return c.json({
      success: false,
      error: 'Failed to seed database',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Seed database with NEW STRUCTURE (Location → Accommodation)
app.post("/rendizy-server/make-server-67caf26a/dev/seed-database-new", async (c) => {
  try {
    console.log('🌱 Starting database seed (NEW STRUCTURE: Location → Accommodation)...');
    const result = await seedDatabaseNew();
    
    return c.json({
      success: true,
      message: 'Database seeded successfully with NEW STRUCTURE',
      structure: 'Location → Accommodation',
      data: {
        locationsCount: result.locations.length,
        accommodationsCount: result.accommodations.length,
        guestsCount: result.guests.length,
        reservationsCount: result.reservations.length,
        linkedAccommodations: result.accommodations.filter(a => a.locationId).length,
        standaloneAccommodations: result.accommodations.filter(a => !a.locationId).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return c.json({
      success: false,
      error: 'Failed to seed database',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// 🆕 v1.0.103.315 - Migração de Normalização de Propriedades
app.post("/rendizy-server/make-server-67caf26a/migrate-normalize-properties", migrateNormalizeProperties);

// ✅ MELHORIA v1.0.103.400 - Migração Property.platforms → Listings
// ⚠️ ROTA TEMPORÁRIA - Remover após migração em produção
app.post("/rendizy-server/make-server-67caf26a/migrate/properties-to-listings", migratePropertiesToListingsRoute);

// Seed database with TEST PROPERTIES (4 imóveis específicos para teste de reservas)
app.post("/rendizy-server/make-server-67caf26a/dev/seed-test-properties", async (c) => {
  try {
    console.log('🌱 Starting TEST PROPERTIES seed (4 specific properties for reservation testing)...');
    const result = await seedTestProperties();
    
    return c.json({
      success: true,
      message: 'Test properties seeded successfully',
      structure: 'Location → Accommodation',
      data: {
        locationsCount: result.locations.length,
        propertiesCount: result.properties.length,
        guestsCount: result.guests.length,
        reservationsCount: result.reservations?.length || 0,
        properties: result.properties.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          type: p.type,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding test properties:', error);
    return c.json({
      success: false,
      error: 'Failed to seed test properties',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Seed COMPLETE TEST - Location e Listing completos com todos os campos
app.post("/rendizy-server/make-server-67caf26a/dev/seed-complete-test", async (c) => {
  try {
    console.log('🌱 Starting COMPLETE TEST seed (full Location + Listing with all features)...');
    const result = await seedCompleteTest();
    
    return c.json({
      success: true,
      message: 'Complete test data seeded successfully',
      structure: 'Location → Property → Rooms → Listing + Rules + Pricing Settings',
      data: {
        location: {
          id: result.location.id,
          name: result.location.name,
          code: result.location.code,
          address: `${result.location.address.street}, ${result.location.address.number} - ${result.location.address.city}/${result.location.address.state}`,
          sharedAmenities: result.location.sharedAmenities.length,
        },
        property: {
          id: result.property.id,
          name: result.property.name,
          code: result.property.code,
          type: result.property.type,
          maxGuests: result.property.maxGuests,
          bedrooms: result.property.bedrooms,
          bathrooms: result.property.bathrooms,
          area: result.property.area,
          basePrice: result.property.pricing.basePrice,
          amenities: result.property.amenities.length,
        },
        rooms: {
          count: result.rooms.length,
          types: result.rooms.map(r => r.type),
        },
        listing: {
          id: result.listing.id,
          title: result.listing.title.pt,
          platforms: Object.entries(result.listing.platforms)
            .filter(([k, v]) => v.enabled)
            .map(([k]) => k),
          icalUrls: Object.entries(result.listing.icalUrls)
            .filter(([k, v]) => v)
            .length,
          derivedPricing: result.listing.derivedPricing.enabled,
        },
        additionalSettings: {
          pricingSettings: result.pricingSettings.id,
          accommodationRules: result.accommodationRules.id,
          pets: result.accommodationRules.pets.allowed,
          smoking: result.accommodationRules.smoking.allowed,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding complete test:', error);
    return c.json({
      success: false,
      error: 'Failed to seed complete test data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Clear all data (apenas para desenvolvimento/testes)
app.post("/rendizy-server/make-server-67caf26a/dev/clear-database", async (c) => {
  try {
    console.log('🗑️ Clearing database...');
    
    const locations = await kv.getByPrefix('location:');
    const properties = await kv.getByPrefix('property:');
    const guests = await kv.getByPrefix('guest:');
    const reservations = await kv.getByPrefix('reservation:');
    const blocks = await kv.getByPrefix('block:');
    const customPrices = await kv.getByPrefix('customprice:');
    const customMinNights = await kv.getByPrefix('customminnight:');
    const organizations = await kv.getByPrefix('org:');
    const users = await kv.getByPrefix('user:');
    
    const allKeys = [
      ...locations.map((l: any) => `location:${l.id}`),
      ...properties.map((p: any) => `property:${p.id}`),
      ...guests.map((g: any) => `guest:${g.id}`),
      ...reservations.map((r: any) => `reservation:${r.id}`),
      ...blocks.map((b: any) => `block:${b.id}`),
      ...customPrices.map((p: any) => `customprice:${p.id}`),
      ...customMinNights.map((m: any) => `customminnight:${m.id}`),
      ...organizations.map((o: any) => `org:${o.id}`),
      ...users.map((u: any) => `user:${u.id}`),
    ];
    
    if (allKeys.length > 0) {
      await kv.mdel(allKeys);
    }
    
    console.log(`✅ Cleared ${allKeys.length} records`);
    
    return c.json({
      success: true,
      message: 'Database cleared successfully',
      data: {
        deletedCount: allKeys.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return c.json({
      success: false,
      error: 'Failed to clear database',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.onError((err, c) => {
  console.error('[ERROR]', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  }, 500);
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString(),
  }, 404);
});

// ============================================================================
// START SERVER
// ============================================================================

console.log('🚀 Rendizy Backend API starting...');
console.log('📅 All routes registered successfully');

Deno.serve(app.fetch);