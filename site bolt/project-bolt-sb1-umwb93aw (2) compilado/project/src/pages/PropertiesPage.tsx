import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertyService } from '../services/api';
import type { Property } from '../types';

interface PropertiesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

export default function PropertiesPage({ onNavigate }: PropertiesPageProps) {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: [] as string[],
    minPrice: 0,
    maxPrice: 1000,
    bedrooms: 0,
    amenities: [] as string[]
  });

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    const loadProperties = async () => {
      setLoading(true);
      const data = await propertyService.getAll();
      setAllProperties(data);
      setProperties(data);
      setLoading(false);
    };

    loadProperties();
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const allAmenities = Array.from(
    new Set(allProperties.flatMap((p) => p.amenities))
  );

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type]
    }));
  };

  const handleAmenityFilter = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const applyFilters = () => {
    let filtered = allProperties;

    if (filters.type.length > 0) {
      filtered = filtered.filter((p) => filters.type.includes(p.type));
    }

    filtered = filtered.filter(
      (p) =>
        p.pricing.dailyRate >= filters.minPrice &&
        p.pricing.dailyRate <= filters.maxPrice
    );

    if (filters.bedrooms > 0) {
      filtered = filtered.filter((p) => p.bedrooms >= filters.bedrooms);
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter((p) =>
        filters.amenities.every((a) => p.amenities.includes(a))
      );
    }

    setProperties(filtered);
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      minPrice: 0,
      maxPrice: 1000,
      bedrooms: 0,
      amenities: []
    });
    setProperties(allProperties);
  };

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const typeLabels: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    condo: 'Condomínio'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nossas Acomodações
          </h1>
          <p className="text-xl text-white/90">
            Encontre o espaço perfeito para sua estadia
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block lg:w-80 flex-shrink-0`}
          >
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#5DBEBD] hover:text-[#4a9d9c] font-medium"
                >
                  Limpar
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Tipo de Imóvel
                  </h3>
                  <div className="space-y-2">
                    {['apartment', 'house', 'condo'].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.type.includes(type)}
                          onChange={() => handleTypeFilter(type)}
                          className="w-4 h-4 text-[#5DBEBD] rounded focus:ring-[#5DBEBD]"
                        />
                        <span className="text-gray-700">{typeLabels[type]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Preço por Diária
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Mínimo</label>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="50"
                        value={filters.minPrice}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minPrice: Number(e.target.value)
                          }))
                        }
                        className="w-full"
                      />
                      <p className="text-sm font-medium text-gray-900">
                        R$ {filters.minPrice}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Máximo</label>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="50"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxPrice: Number(e.target.value)
                          }))
                        }
                        className="w-full"
                      />
                      <p className="text-sm font-medium text-gray-900">
                        R$ {filters.maxPrice}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Quartos</h3>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        bedrooms: Number(e.target.value)
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                  >
                    <option value={0}>Qualquer</option>
                    <option value={1}>1+</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Comodidades
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allAmenities.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(amenity)}
                          onChange={() => handleAmenityFilter(amenity)}
                          className="w-4 h-4 text-[#5DBEBD] rounded focus:ring-[#5DBEBD]"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {properties.length}
                </span>{' '}
                {properties.length === 1 ? 'acomodação encontrada' : 'acomodações encontradas'}
              </p>
            </div>

            {properties.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhuma acomodação encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar os filtros para ver mais opções
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#5DBEBD] hover:bg-[#4a9d9c] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onFavoriteToggle={toggleFavorite}
                    isFavorite={favorites.includes(property.id)}
                    onClick={() => onNavigate('property', property.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
