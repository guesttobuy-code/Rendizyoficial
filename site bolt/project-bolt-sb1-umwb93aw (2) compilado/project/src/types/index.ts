export interface Property {
  id: string;
  name: string;
  code: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  area: number;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  photos: string[];
  coverPhoto?: string;
  pricing: {
    basePrice?: number;
    currency?: string;
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
    salePrice?: number;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  restrictions?: {
    minNights?: number;
    maxNights?: number;
    advanceBooking?: number;
  };
  features: {
    shortTerm: boolean;
    longTerm: boolean;
    sale: boolean;
  };
  locationId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  price?: number;
  minNights?: number;
  propertyId: string;
}

export interface CalendarResponse {
  days: CalendarDay[];
  properties: Property[];
}

export interface CalendarAvailability {
  propertyId: string;
  date: string;
  status: 'available' | 'booked' | 'blocked';
  price?: number;
  minNights?: number;
}

export interface ReservationRequest {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
}

export interface SearchFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
}
