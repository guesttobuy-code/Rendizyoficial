/**
 * STEP 11 - Precificação Individual de Temporada
 * Preços específicos por acomodação em períodos de temporada
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { IndividualPricingValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep11Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep11IndividualPricing({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep11Props) {
  const [selectedAccommodation, setSelectedAccommodation] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = IndividualPricingValidator.validate(data);
    const errorMap: Record<string, string> = {};
    result.errors.forEach(err => {
      errorMap[err.field] = err.message;
    });
    setValidationErrors(errorMap);
  }, [data]);

  const displayErrors = { ...validationErrors, ...errors };
  const hasErrors = Object.keys(displayErrors).length > 0;

  const handleSave = async () => {
    setShowValidation(true);
    if (!hasErrors) {
      await onSave();
    }
  };

  // Mock accommodations - em produção viriam do property.details.rooms
  const accommodations: Array<{id: number; name: string}> = data?.accommodations || [
    { id: 1, name: 'Suíte Master' },
    { id: 2, name: 'Quarto 1' },
    { id: 3, name: 'Quarto 2' }
  ];

  const seasons = [
    { id: 'high', label: 'Alta', color: 'bg-red-100' },
    { id: 'medium', label: 'Média', color: 'bg-yellow-100' },
    { id: 'low', label: 'Baixa', color: 'bg-blue-100' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Precificação Individual de Temporada</h2>
        </div>
        <p className="text-gray-600">Configure preços específicos por acomodação em cada temporada</p>
      </div>

      {/* Accommodation Selector */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecione uma acomodação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {accommodations.map((acc: any, idx: number) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccommodation(idx)}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                selectedAccommodation === idx
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <p className="font-medium">{acc.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Table */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preços - {accommodations[selectedAccommodation]?.name}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Temporada</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Preço por Noite</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Preço por Semana</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {seasons.map((season) => (
                <tr key={season.id} className={season.color}>
                  <td className="px-4 py-3 font-medium text-gray-900">{season.label}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-1 top-2.5 text-gray-500 text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data?.[`acc${selectedAccommodation}_${season.id}_night`] || ''}
                        onChange={(e) => onChange(`acc${selectedAccommodation}_${season.id}_night`, parseFloat(e.target.value))}
                        className="w-full pl-6 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0,00"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-1 top-2.5 text-gray-500 text-xs">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data?.[`acc${selectedAccommodation}_${season.id}_week`] || ''}
                        onChange={(e) => onChange(`acc${selectedAccommodation}_${season.id}_week`, parseFloat(e.target.value))}
                        className="w-full pl-6 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0,00"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          💡 Deixe em branco para usar o preço padrão da acomodação. Valores preenchidos substituirão o preço base.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
        </button>
      </div>
    </div>
  );
}
