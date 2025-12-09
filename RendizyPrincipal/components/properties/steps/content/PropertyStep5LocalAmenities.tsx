/**
 * STEP 5 - Amenidades do Local
 * Características e infraestrutura da localização
 */

import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

interface PropertyStep5LocalAmenitiesProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep5LocalAmenities({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep5LocalAmenitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Externas': true,
    'Localização': true
  });

  const amenities = {
    'Externas': [
      { id: 'parking', label: 'Estacionamento', selected: data?.parking || false },
      { id: 'garden', label: 'Jardim', selected: data?.garden || false },
      { id: 'patio', label: 'Pátio', selected: data?.patio || false },
      { id: 'pool', label: 'Piscina', selected: data?.pool || false },
    ],
    'Localização': [
      { id: 'beachAccess', label: 'Acesso à Praia', selected: data?.beachAccess || false },
      { id: 'beachfront', label: 'Na Praia', selected: data?.beachfront || false },
      { id: 'mountain', label: 'Perto de Montanha', selected: data?.mountain || false },
      { id: 'downtown', label: 'Centro', selected: data?.downtown || false },
    ]
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Amenidades do Local</h2>
        <p className="text-gray-600 mt-1">Características da localização da propriedade</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar amenidades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(amenities).map(([category, items]) => (
          <div key={category} className="border rounded-lg">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {items.filter(i => i.selected).length}/{items.length}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedCategories[category] ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {expandedCategories[category] && (
              <div className="px-4 py-3 bg-gray-50 border-t grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        onChange(item.id, e.target.checked);
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
        </button>
      </div>
    </div>
  );
}
