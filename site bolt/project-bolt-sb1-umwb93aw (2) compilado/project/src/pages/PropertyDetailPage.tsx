import { useState, useEffect } from 'react';
import {
  MapPin,
  BedDouble,
  Bath,
  Users,
  Maximize,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Calendar
} from 'lucide-react';
import { propertyService } from '../services/api';
import type { Property } from '../types';

interface PropertyDetailPageProps {
  propertyId: string;
  onNavigate: (page: string) => void;
}

export default function PropertyDetailPage({ propertyId, onNavigate }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    message: ''
  });

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true);
      const data = await propertyService.getById(propertyId);
      setProperty(data);
      setLoading(false);
    };

    loadProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando acomodação...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acomodação não encontrada
          </h2>
          <button
            onClick={() => onNavigate('properties')}
            className="bg-[#5DBEBD] text-white px-6 py-2 rounded-lg hover:bg-[#4a9d9c] transition-colors"
          >
            Voltar para Acomodações
          </button>
        </div>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === property.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? property.photos.length - 1 : prev - 1
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Solicitação enviada com sucesso! Entraremos em contato em breve.');
    setShowContactForm(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.name,
        text: property.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('properties')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#5DBEBD] mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Acomodações
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-96 md:h-[500px] bg-gray-900">
            <img
              src={property.photos[currentPhotoIndex]}
              alt={property.name}
              className="w-full h-full object-cover"
            />

            {property.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-900" />
                </button>
              </>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
              <button className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {property.photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {property.name}
                </h1>

                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>
                    {property.address.street}, {property.address.number} -{' '}
                    {property.address.city}/{property.address.state}
                  </span>
                </div>

                <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#5DBEBD]/10 p-3 rounded-lg">
                      <BedDouble className="w-6 h-6 text-[#5DBEBD]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quartos</p>
                      <p className="font-semibold text-gray-900">
                        {property.bedrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#5DBEBD]/10 p-3 rounded-lg">
                      <Bath className="w-6 h-6 text-[#5DBEBD]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Banheiros</p>
                      <p className="font-semibold text-gray-900">
                        {property.bathrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#5DBEBD]/10 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-[#5DBEBD]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hóspedes</p>
                      <p className="font-semibold text-gray-900">
                        {property.maxGuests}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#5DBEBD]/10 p-3 rounded-lg">
                      <Maximize className="w-6 h-6 text-[#5DBEBD]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Área</p>
                      <p className="font-semibold text-gray-900">
                        {property.area}m²
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Sobre esta Acomodação
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {property.description}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Comodidades
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Check className="w-5 h-5 text-[#5DBEBD] flex-shrink-0" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-[#5DBEBD]">
                        {formatPrice(property.pricing.dailyRate)}
                      </span>
                      <span className="text-gray-600">/ diária</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Semanal:</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(property.pricing.weeklyRate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mensal:</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(property.pricing.monthlyRate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!showContactForm ? (
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] hover:from-[#4a9d9c] hover:to-[#5DBEBD] text-white py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Solicitar Reserva
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.checkIn}
                            onChange={(e) =>
                              setFormData({ ...formData, checkIn: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-out
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.checkOut}
                            min={formData.checkIn}
                            onChange={(e) =>
                              setFormData({ ...formData, checkOut: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mensagem (opcional)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowContactForm(false)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#FF8B94] hover:bg-[#ff7783] text-white py-3 rounded-lg font-medium transition-colors"
                        >
                          Enviar
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <p className="text-sm text-gray-600 text-center">
                      Dúvidas? Entre em contato conosco diretamente pelo WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
