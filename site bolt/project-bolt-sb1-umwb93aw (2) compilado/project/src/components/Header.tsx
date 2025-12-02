import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '../config/site';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Início' },
    { id: 'properties', label: 'Acomodações' },
    { id: 'about', label: 'Sobre Nós' },
    { id: 'contact', label: 'Contato' }
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer flex items-center gap-3"
          >
            <img
              src={siteConfig.logoIcon}
              alt={siteConfig.siteName}
              className="h-12 w-12"
            />
            <span className="text-2xl font-bold text-[#5DBEBD]">
              {siteConfig.siteName}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`font-medium transition-colors ${
                  currentPage === item.id
                    ? 'text-[#5DBEBD] border-b-2 border-[#5DBEBD]'
                    : 'text-gray-700 hover:text-[#5DBEBD]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => onNavigate('favorites')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            >
              <Heart className="w-6 h-6 text-gray-700" />
            </button>
            <button className="bg-[#FF8B94] hover:bg-[#ff7783] text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Entre em Contato
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left font-medium py-2 px-4 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-[#5DBEBD] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button className="bg-[#FF8B94] hover:bg-[#ff7783] text-white px-6 py-2 rounded-lg font-medium transition-colors mt-2">
                Entre em Contato
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
