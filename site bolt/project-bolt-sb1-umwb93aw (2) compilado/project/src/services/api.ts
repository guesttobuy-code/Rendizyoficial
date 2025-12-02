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
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  amenities: string[];
  photos: string[];
  cover_photo?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  base_price?: number;
  currency?: string;
  sale_price?: number;
  weekly_discount?: number;
  monthly_discount?: number;
  min_nights?: number;
  max_nights?: number;
  advance_booking?: number;
  short_term: boolean;
  long_term: boolean;
  sale?: boolean;
  location_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
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
      street: dbProperty.street,
      number: dbProperty.number,
      complement: dbProperty.complement,
      neighborhood: dbProperty.neighborhood || '',
      city: dbProperty.city,
      state: dbProperty.state,
      zipCode: dbProperty.zip_code,
      country: dbProperty.country || 'Brasil',
      coordinates: dbProperty.coordinates
    },
    amenities: dbProperty.amenities,
    photos: dbProperty.photos,
    coverPhoto: dbProperty.cover_photo || dbProperty.photos[0],
    pricing: {
      basePrice: dbProperty.base_price,
      currency: dbProperty.currency || 'BRL',
      dailyRate: dbProperty.daily_rate,
      weeklyRate: dbProperty.weekly_rate,
      monthlyRate: dbProperty.monthly_rate,
      salePrice: dbProperty.sale_price,
      weeklyDiscount: dbProperty.weekly_discount,
      monthlyDiscount: dbProperty.monthly_discount
    },
    restrictions: {
      minNights: dbProperty.min_nights,
      maxNights: dbProperty.max_nights,
      advanceBooking: dbProperty.advance_booking
    },
    features: {
      shortTerm: dbProperty.short_term,
      longTerm: dbProperty.long_term,
      sale: dbProperty.sale || false
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
        return data;
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

        return await response.json();
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
        const { data, error } = await supabase
          .from('reservations')
          .insert([
            {
              property_id: reservation.propertyId,
              guest_name: reservation.guestName,
              guest_email: reservation.guestEmail,
              guest_phone: reservation.guestPhone,
              check_in: reservation.checkIn,
              check_out: reservation.checkOut,
              guests: reservation.guests,
              total_price: reservation.totalPrice,
              status: 'pending'
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
