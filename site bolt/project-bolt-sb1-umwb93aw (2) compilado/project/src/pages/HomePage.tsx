import { Heart, Shield, Home as HomeIcon, Clock } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { propertyService } from '../services/api';
import { useState, useEffect } from 'react';
import type { Property } from '../types';

interface HomePageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    const loadProperties = async () => {
      setLoading(true);
      const data = await propertyService.getAll();
      setProperties(data.slice(0, 3));
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

  const handleSearch = (filters: any) => {
    onNavigate('properties');
  };

  const features = [
    {
      icon: Heart,
      title: 'Atendimento Humanizado',
      description: 'Ambiente acolhedor que considera o momento de fragilidade do paciente e familiares'
    },
    {
      icon: HomeIcon,
      title: 'Infraestrutura Adaptada',
      description: 'Colchões terapêuticos, climatização e tudo preparado para seu conforto'
    },
    {
      icon: Shield,
      title: 'Higiene Especializada',
      description: 'Limpeza profissional e materiais esterilizados para sua segurança'
    },
    {
      icon: Clock,
      title: 'Localização Privilegiada',
      description: 'Próximo aos principais centros médicos e hospitais de referência'
    }
  ];

  return (
    <div>
      <section className="relative bg-gradient-to-br from-[#5DBEBD] via-[#4a9d9c] to-[#3d8584] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Acomodações Humanizadas
              <br />
              <span className="text-[#FF8B94]">Para Quem Mais Precisa</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4">
              Hospedagem confortável e próxima aos centros de tratamento
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Especializada em pacientes oncológicos e transplantados. Porque cuidar vai além do tratamento.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} className="max-w-5xl mx-auto" />
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por Que Escolher a MedHome?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oferecemos muito mais que um lugar para ficar. Proporcionamos cuidado, conforto e proximidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5DBEBD] to-[#4a9d9c] rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Acomodações em Destaque
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Confira algumas de nossas opções disponíveis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">Carregando acomodações...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">Nenhuma acomodação disponível no momento.</p>
              </div>
            ) : (
              properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavoriteToggle={toggleFavorite}
                isFavorite={favorites.includes(property.id)}
                onClick={() => onNavigate('property', property.id)}
              />
            ))
            )}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('properties')}
              className="bg-[#5DBEBD] hover:bg-[#4a9d9c] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Ver Todas as Acomodações
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Precisa de Ajuda?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudá-lo a encontrar a acomodação ideal para suas necessidades.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="bg-white text-[#5DBEBD] hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Entre em Contato
          </button>
        </div>
      </section>
    </div>
  );
}
