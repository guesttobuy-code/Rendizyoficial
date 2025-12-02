import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '../config/site';
import { contactService } from '../services/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await contactService.create(formData);
      alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefone',
      content: siteConfig.siteConfig.contactPhone,
      link: `tel:${siteConfig.siteConfig.contactPhone}`
    },
    {
      icon: Mail,
      title: 'E-mail',
      content: siteConfig.siteConfig.contactEmail,
      link: `mailto:${siteConfig.siteConfig.contactEmail}`
    },
    {
      icon: MapPin,
      title: 'Localização',
      content: 'São Paulo, SP',
      link: null
    },
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      content: 'Segunda a Sexta: 8h às 18h',
      link: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Estamos aqui para ajudar você a encontrar a acomodação ideal
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5DBEBD] to-[#4a9d9c] rounded-full mb-6 group-hover:scale-110 transition-transform">
                <info.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {info.title}
              </h3>
              {info.link ? (
                <a
                  href={info.link}
                  className="text-[#5DBEBD] hover:text-[#4a9d9c] font-medium transition-colors"
                >
                  {info.content}
                </a>
              ) : (
                <p className="text-gray-600">{info.content}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Envie uma Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto *
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="reservation">Solicitar Reserva</option>
                  <option value="information">Solicitar Informações</option>
                  <option value="partnership">Parcerias</option>
                  <option value="donation">Doações</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DBEBD] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Como podemos ajudar você?"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] hover:from-[#4a9d9c] hover:to-[#5DBEBD] text-white py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Perguntas Frequentes
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Quais hospitais estão próximos às acomodações?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Trabalhamos próximos aos principais centros médicos de São Paulo, incluindo Hospital Sírio-Libanês, ICESP, Hospital das Clínicas, entre outros.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    É possível visitar a acomodação antes de reservar?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Sim! Agende uma visita conosco para conhecer pessoalmente as instalações e tirar todas as suas dúvidas.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Vocês aceitam convênios ou parceiros?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Trabalhamos com diversos parceiros e grupos de apoio. Entre em contato para saber mais sobre as opções disponíveis.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Qual é o período mínimo de hospedagem?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Oferecemos flexibilidade de acordo com suas necessidades, desde diárias até períodos mensais.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Atendimento Urgente?
              </h3>
              <p className="mb-6 text-white/90">
                Para situações urgentes ou dúvidas imediatas, entre em contato diretamente pelo WhatsApp.
              </p>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-[#5DBEBD] hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
