/**
 * STEP 6 - Amenidades da Acomodação
 * Equipamentos e facilidades dentro da propriedade
 */

import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

interface PropertyStep6AccommodationAmenitiesProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep6AccommodationAmenities({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep6AccommodationAmenitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Cozinha': true,
    'Banheiro': true,
    'Quarto': true,
    'Sala de Estar': false,
    'Entretenimento': false,
  });

  const amenities = {
    'Cozinha': [
      { id: 'kitchenFridge', label: 'Geladeira', selected: data?.kitchenFridge || false },
      { id: 'kitchenStove', label: 'Fogão', selected: data?.kitchenStove || false },
      { id: 'kitchenOven', label: 'Forno', selected: data?.kitchenOven || false },
      { id: 'kitchenMicrowave', label: 'Micro-ondas', selected: data?.kitchenMicrowave || false },
      { id: 'kitchenDishwasher', label: 'Lava-louças', selected: data?.kitchenDishwasher || false },
    ],
    'Banheiro': [
      { id: 'bathroomShower', label: 'Chuveiro', selected: data?.bathroomShower || false },
      { id: 'bathroomBathtub', label: 'Banheira', selected: data?.bathroomBathtub || false },
      { id: 'bathroomAirDry', label: 'Secador de cabelo', selected: data?.bathroomAirDry || false },
      { id: 'bathroomHeater', label: 'Aquecedor', selected: data?.bathroomHeater || false },
    ],
    'Quarto': [
      { id: 'bedroomAC', label: 'Ar Condicionado', selected: data?.bedroomAC || false },
      { id: 'bedroomHeater', label: 'Aquecedor', selected: data?.bedroomHeater || false },
      { id: 'bedroomFan', label: 'Ventilador', selected: data?.bedroomFan || false },
      { id: 'bedroomSafe', label: 'Cofre', selected: data?.bedroomSafe || false },
    ],
    'Sala de Estar': [
      { id: 'livingTV', label: 'TV', selected: data?.livingTV || false },
      { id: 'livingSofa', label: 'Sofá', selected: data?.livingSofa || false },
      { id: 'livingFireplace', label: 'Lareira', selected: data?.livingFireplace || false },
    ],
    'Entretenimento': [
      { id: 'entertainmentBoardGames', label: 'Jogos de Tabuleiro', selected: data?.entertainmentBoardGames || false },
      { id: 'entertainmentBookshelf', label: 'Estante de Livros', selected: data?.entertainmentBookshelf || false },
      { id: 'entertainmentMusicalInstrument', label: 'Instrumento Musical', selected: data?.entertainmentMusicalInstrument || false },
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
        <h2 className="text-2xl font-bold text-gray-900">Amenidades da Acomodação</h2>
        <p className="text-gray-600 mt-1">Equipamentos e facilidades disponíveis</p>
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
