import { Heart, Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { siteConfig } from '../config/site';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={siteConfig.logoIcon}
                alt={siteConfig.siteName}
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold text-[#5DBEBD]">
                {siteConfig.siteName}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {siteConfig.siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-[#5DBEBD] transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#5DBEBD] transition-colors">
                  Acomodações
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#5DBEBD] transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#5DBEBD] transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-[#5DBEBD] mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${siteConfig.siteConfig.contactEmail}`}
                  className="text-gray-400 hover:text-[#5DBEBD] transition-colors text-sm"
                >
                  {siteConfig.siteConfig.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-[#5DBEBD] mt-0.5 flex-shrink-0" />
                <a
                  href={`tel:${siteConfig.siteConfig.contactPhone}`}
                  className="text-gray-400 hover:text-[#5DBEBD] transition-colors text-sm"
                >
                  {siteConfig.siteConfig.contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#5DBEBD] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  São Paulo, SP
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
            <div className="flex gap-4">
              <a
                href={siteConfig.siteConfig.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-lg hover:bg-[#5DBEBD] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={siteConfig.siteConfig.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-lg hover:bg-[#FF8B94] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Siga-nos para novidades e atualizações sobre nossas acomodações.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
            Feito com <Heart className="w-4 h-4 text-[#FF8B94] fill-current" /> para cuidar de quem mais precisa
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © {new Date().getFullYear()} {siteConfig.siteName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
