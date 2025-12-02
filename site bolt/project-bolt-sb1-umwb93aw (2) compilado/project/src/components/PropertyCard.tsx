import { Heart, MapPin, BedDouble, Bath, Users } from 'lucide-react';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
}

export default function PropertyCard({ property, onFavoriteToggle, isFavorite, onClick }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.photos[0]}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(property.id);
          }}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
        <div className="absolute top-4 left-4 bg-[#5DBEBD] text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.availability === 'available' ? 'Disponível' : 'Ocupado'}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{property.name}</h3>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">
            {property.address.street}, {property.address.number} - {property.address.city}/{property.address.state}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <BedDouble className="w-4 h-4 text-[#5DBEBD]" />
            <span>{property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-[#5DBEBD]" />
            <span>{property.bathrooms} banheiro{property.bathrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-[#5DBEBD]" />
            <span>{property.maxGuests} pessoas</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-2xl font-bold text-[#5DBEBD]">
              {formatPrice(property.pricing.dailyRate)}
            </p>
            <p className="text-xs text-gray-500">por diária</p>
          </div>
          <button className="bg-[#FF8B94] hover:bg-[#ff7783] text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
