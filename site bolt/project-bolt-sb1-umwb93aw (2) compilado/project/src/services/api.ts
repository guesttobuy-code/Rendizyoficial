import { createClient } from '@supabase/supabase-js';
import type { Property, CalendarAvailability, ReservationRequest, CalendarResponse } from '../types';
import { API_CONFIG } from '../config/site';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USE_RENDIZY_API = import.meta.env.VITE_USE_RENDIZY_API === 'true';

interface DatabaseProperty {
  id: string;
  name: string;
  code?: string;
  description: string;
  type: string;
  status?: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  area: number;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city: string;
  address_state: string;
  address_zip_code: string;
  address_country?: string;
  amenities: string[];
  photos: string[];
  cover_photo?: string;
  pricing_base_price?: number;
  pricing_currency?: string; // Backend usually stores as string 'BRL' but interface can be string
  pricing_weekly_discount?: number;
  pricing_monthly_discount?: number;
  restrictions_min_nights?: number;
  restrictions_max_nights?: number;
  restrictions_advance_booking?: number;

  // Flattened features
  short_description?: string;

  location_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;

  // Additional fields for compatibility
  pricing_daily_rate?: number; // Check if this exists, logically mapped to base_price usually
}

function transformDatabaseProperty(dbProperty: DatabaseProperty): Property {
  return {
    id: dbProperty.id,
    name: dbProperty.name,
    code: dbProperty.code || dbProperty.id,
    description: dbProperty.description,
    type: dbProperty.type,
    status: (dbProperty.status as 'active' | 'inactive' | 'maintenance') || 'active',
    bedrooms: dbProperty.bedrooms,
    bathrooms: dbProperty.bathrooms,
    maxGuests: dbProperty.max_guests,
    area: dbProperty.area,
    address: {
      street: dbProperty.address_street,
      number: dbProperty.address_number,
      complement: dbProperty.address_complement,
      neighborhood: dbProperty.address_neighborhood || '',
      city: dbProperty.address_city,
      state: dbProperty.address_state,
      zipCode: dbProperty.address_zip_code,
      country: dbProperty.address_country || 'Brasil'
    },
    amenities: dbProperty.amenities || [],
    photos: dbProperty.photos || [],
    coverPhoto: dbProperty.cover_photo || (dbProperty.photos && dbProperty.photos[0]),
    pricing: {
      basePrice: dbProperty.pricing_base_price,
      currency: 'BRL',
      dailyRate: dbProperty.pricing_base_price, // Assuming daily rate equals base price
      weeklyRate: undefined,
      monthlyRate: undefined,
      salePrice: undefined,
      weeklyDiscount: dbProperty.pricing_weekly_discount,
      monthlyDiscount: dbProperty.pricing_monthly_discount
    },
    restrictions: {
      minNights: dbProperty.restrictions_min_nights,
      maxNights: dbProperty.restrictions_max_nights,
      advanceBooking: dbProperty.restrictions_advance_booking
    },
    features: {
      shortTerm: true, // Defaults based on typical usage as columns missing
      longTerm: true,
      sale: false
    },
    locationId: dbProperty.location_id,
    organizationId: dbProperty.organization_id || API_CONFIG.organizationId,
    createdAt: dbProperty.created_at || new Date().toISOString(),
    updatedAt: dbProperty.updated_at || new Date().toISOString()
  };
}

async function fetchFromRendizy(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${API_CONFIG.publicAnonKey}`,
    'Content-Type': 'application/json',
    ...options?.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
}

export const propertyService = {
  async getAll(organizationId?: string): Promise<Property[]> {
    try {
      if (USE_RENDIZY_API) {
        const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
        const response = await fetchFromRendizy(`/properties${queryParams}`);

        if (!response.ok) {
          throw new Error('Failed to fetch properties from RENDIZY');
        }

        const data = await response.json();
        return data.data || data;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching properties:', error);
          return [];
        }

        return (data || []).map(transformDatabaseProperty);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Property | null> {
    try {
      if (USE_RENDIZY_API) {
        const response = await fetchFromRendizy(`/properties/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch property from RENDIZY');
        }

        const data = await response.json();
        return data.data || data;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching property:', error);
          return null;
        }

        return data ? transformDatabaseProperty(data) : null;
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  },

  async getAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
    includeBlocks = true,
    includePrices = true
  ): Promise<CalendarAvailability[]> {
    try {
      if (USE_RENDIZY_API) {
        const params = new URLSearchParams({
          propertyId,
          startDate,
          endDate,
          includeBlocks: includeBlocks.toString(),
          includePrices: includePrices.toString()
        });

        const response = await fetchFromRendizy(`/calendar?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch availability from RENDIZY');
        }

        const calendarResponse: CalendarResponse = await response.json();
        return calendarResponse.days.map(day => ({
          propertyId: day.propertyId,
          date: day.date,
          status: day.status,
          price: day.price,
          minNights: day.minNights
        }));
      } else {
        const { data, error } = await supabase
          .from('calendar_availability')
          .select('*')
          .eq('property_id', propertyId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching availability:', error);
          return [];
        }

        return (data || []).map((item: any) => ({
          propertyId: item.property_id,
          date: item.date,
          status: item.status,
          price: item.price,
          minNights: item.min_nights
        }));
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  },

  async createReservation(reservation: ReservationRequest): Promise<any> {
    try {
      if (USE_RENDIZY_API) {
        const response = await fetchFromRendizy('/reservations', {
          method: 'POST',
          body: JSON.stringify(reservation)
        });

        if (!response.ok) {
          throw new Error('Failed to create reservation in RENDIZY');
        }

        return await response.json();
      } else {
        // 1. Create or Get Guest (Simple version: always try to create, if fail by unique email, search)
        // Note: For public sites, we might not have permission to search by email due to RLS.
        // We will try to INSERT directly. If email exists, we catch error (if unique constraint) 
        // OR we just rely on the fact that guest table allows inserts.

        const guestId = crypto.randomUUID();
        const [firstName, ...lastNameParts] = reservation.guestName.split(' ');
        const lastName = lastNameParts.join(' ') || 'Guest';

        // Try to create guest
        const { error: guestError } = await supabase
          .from('guests')
          .insert([{
            id: guestId,
            organization_id: API_CONFIG.organizationId,
            first_name: firstName,
            last_name: lastName,
            full_name: reservation.guestName,
            email: reservation.guestEmail,
            phone: reservation.guestPhone,
            source: 'website',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        let finalGuestId = guestId;

        if (guestError) {
          console.warn('Guest creation failed (likely exists), trying to find by email if possible or proceed with existing...', guestError);
          // If RLS allows reading own guest, we might find it. 
          // If not, we are stuck unless we use a backend function. 
          // For now, assuming "public insert" is allowed or we fail.
          // RETRY: Check if allow select
          const { data: existingGuest } = await supabase
            .from('guests')
            .select('id')
            .eq('email', reservation.guestEmail)
            .maybeSingle();

          if (existingGuest) {
            finalGuestId = existingGuest.id;
          } else {
            // If we can't create AND can't find, we can't book.
            // EXCEPT if the error was something else.
            console.error('CRITICAL: Could not create or find guest.');
            throw new Error('Could not process guest information.');
          }
        }

        // 2. Create Reservation
        const { data, error } = await supabase
          .from('reservations')
          .insert([
            {
              property_id: reservation.propertyId,
              organization_id: API_CONFIG.organizationId,
              guest_id: finalGuestId,
              check_in: reservation.checkIn,
              check_out: reservation.checkOut,
              guests_total: reservation.guests,
              guests_adults: reservation.guests, // Defaulting adults to total
              pricing_total: reservation.totalPrice * 100, // Convert to cents if backend expects integer? 
              // Wait, backend utils-reservation-mapper says `pricing_total: row.pricing_total || 0`.
              // SQL usually stores money as integer (cents) OR numeric. 
              // `routes-reservations.ts` line 664: `price: r.pricing.total / 100`. So it IS integer/cents.
              // `api.ts` `totalPrice` usually comes as float from UI? 
              // Let's assume UI sends Reais (float). Convert to cents.
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating reservation:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }
};

export const contactService = {
  async create(contact: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) {
        console.error('Error creating contact:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }
};
