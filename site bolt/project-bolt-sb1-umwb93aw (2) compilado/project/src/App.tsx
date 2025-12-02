import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleNavigate = (page: string, propertyId?: string) => {
    setCurrentPage(page);
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'properties':
        return <PropertiesPage onNavigate={handleNavigate} />;
      case 'property':
        return selectedPropertyId ? (
          <PropertyDetailPage
            propertyId={selectedPropertyId}
            onNavigate={handleNavigate}
          />
        ) : (
          <PropertiesPage onNavigate={handleNavigate} />
        );
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;
