import { MessageCircle } from 'lucide-react';
import { siteConfig } from '../config/site';

export default function WhatsAppButton() {
  const handleClick = () => {
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre as acomodações da MedHome.');
    window.open(`https://wa.me/${siteConfig.siteConfig.socialMedia.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 flex items-center gap-2 group"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden group-hover:inline-block text-sm font-medium pr-2">
        Fale Conosco
      </span>
    </button>
  );
}
