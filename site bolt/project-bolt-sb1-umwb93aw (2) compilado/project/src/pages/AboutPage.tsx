import { Heart, Users, Home, Shield } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Humanização',
      description: 'Tratamos cada hóspede com empatia, cuidado e respeito, entendendo o momento delicado que estão vivendo.'
    },
    {
      icon: Users,
      title: 'Acolhimento',
      description: 'Criamos um ambiente familiar que transmite segurança e conforto para pacientes e familiares.'
    },
    {
      icon: Home,
      title: 'Conforto',
      description: 'Proporcionamos infraestrutura completa e adaptada às necessidades especiais de cada hóspede.'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Mantemos os mais altos padrões de higiene e cuidado, com materiais esterilizados e limpeza especializada.'
    }
  ];

  const team = [
    {
      name: 'Equipe de Suporte',
      role: 'Disponível 24/7',
      description: 'Nossa equipe está sempre pronta para auxiliar em qualquer necessidade.'
    },
    {
      name: 'Parceiros Médicos',
      role: 'Rede de Apoio',
      description: 'Trabalhamos próximos aos principais centros médicos para melhor atender você.'
    },
    {
      name: 'Voluntários',
      role: 'Suporte Emocional',
      description: 'Rede de apoio que oferece conforto emocional e assistência prática.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sobre a MedHome
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Mais que hospedagem, oferecemos acolhimento e cuidado para quem mais precisa
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Nossa História
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                A <span className="font-semibold text-[#5DBEBD]">MedHome</span> nasceu da necessidade de oferecer uma
                solução de hospedagem humanizada para pacientes oncológicos e transplantados que necessitam
                de alojamento próximo a centros de tratamento.
              </p>
              <p>
                Entendemos que o tratamento médico vai além dos procedimentos clínicos. O ambiente onde o
                paciente se recupera e descansa é fundamental para o sucesso do tratamento e bem-estar
                emocional.
              </p>
              <p>
                Por isso, criamos espaços adaptados que combinam todo o conforto necessário com a proximidade
                aos principais hospitais de referência, facilitando o acesso ao tratamento e reduzindo o
                estresse de deslocamentos longos.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Acomodação confortável"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-[#FF8B94] text-white p-6 rounded-xl shadow-xl">
              <p className="text-4xl font-bold">100+</p>
              <p className="text-sm">Famílias Atendidas</p>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Nossos Valores
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Princípios que guiam cada decisão e ação da MedHome
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5DBEBD] to-[#4a9d9c] rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Nossa Proposta
          </h2>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-[#5DBEBD] mb-4">
                  Modelo Flexível
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Oferecemos diferentes níveis de acomodação para atender diversas necessidades e
                  capacidades financeiras:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#5DBEBD] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      <strong>Simples:</strong> Focado em baixo custo para garantir acessibilidade
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#5DBEBD] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      <strong>Sofisticado:</strong> Infraestrutura completa e maior conforto
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#FF8B94] mb-4">
                  Infraestrutura Especial
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF8B94] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      Colchões especiais tipo casca de ovo
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF8B94] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      Ambientes climatizados
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF8B94] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      Cozinhas equipadas para dietas específicas
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF8B94] rounded-full mt-2"></div>
                    <span className="text-gray-700">
                      Limpeza especializada e materiais esterilizados
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Nossa Equipe
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Profissionais dedicados a oferecer o melhor suporte
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-[#5DBEBD] font-semibold mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#5DBEBD] to-[#4a9d9c] rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Faça Parte da Nossa Missão
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Se você acredita no poder do acolhimento e quer apoiar pacientes em tratamento,
            entre em contato conosco.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#5DBEBD] hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg">
              Seja um Parceiro
            </button>
            <button className="bg-[#FF8B94] hover:bg-[#ff7783] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg">
              Faça uma Doação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
