/**
 * STEP 10 - Configuração de Preço Temporada
 * Define períodos de temporada alta, baixa e média
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { SeasonalConfigValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep10Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep10SeasonalConfig({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep10Props) {
  const [selectedSeason, setSelectedSeason] = useState<'high' | 'low' | 'medium'>('high');
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = SeasonalConfigValidator.validate(data);
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

  const seasons = [
    { id: 'high', label: 'Temporada Alta', color: 'bg-red-50', borderColor: 'border-red-200' },
    { id: 'medium', label: 'Temporada Média', color: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { id: 'low', label: 'Temporada Baixa', color: 'bg-blue-50', borderColor: 'border-blue-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuração de Preço Temporada</h2>
        </div>
        <p className="text-gray-600">Define ajustes de preço para diferentes períodos do ano</p>
      </div>

      {/* Seasonality Settings */}
      <div className="space-y-4">
        {seasons.map((season) => (
          <div
            key={season.id}
            className={`${season.color} border ${season.borderColor} rounded-lg p-4 cursor-pointer transition-all`}
            onClick={() => setSelectedSeason(season.id as 'high' | 'low' | 'medium')}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{season.label}</h3>
              <input
                type="radio"
                checked={selectedSeason === season.id}
                onChange={() => setSelectedSeason(season.id as 'high' | 'low' | 'medium')}
                className="mt-1"
              />
            </div>

            {selectedSeason === season.id && (
              <div className="space-y-3 bg-white rounded p-3 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ajuste percentual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="-100"
                      max="200"
                      step="5"
                      value={data?.[`${season.id}Adjustment`] || 0}
                      onChange={(e) => onChange(`${season.id}Adjustment`, parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {data?.[`${season.id}Adjustment`] > 0 ? '+' : ''}{data?.[`${season.id}Adjustment`] || 0}% sobre o preço base
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Início (mês)
                    </label>
                    <select
                      value={data?.[`${season.id}Start`] || 'january'}
                      onChange={(e) => onChange(`${season.id}Start`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="january">Janeiro</option>
                      <option value="february">Fevereiro</option>
                      <option value="march">Março</option>
                      <option value="april">Abril</option>
                      <option value="may">Maio</option>
                      <option value="june">Junho</option>
                      <option value="july">Julho</option>
                      <option value="august">Agosto</option>
                      <option value="september">Setembro</option>
                      <option value="october">Outubro</option>
                      <option value="november">Novembro</option>
                      <option value="december">Dezembro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fim (mês)
                    </label>
                    <select
                      value={data?.[`${season.id}End`] || 'december'}
                      onChange={(e) => onChange(`${season.id}End`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="january">Janeiro</option>
                      <option value="february">Fevereiro</option>
                      <option value="march">Março</option>
                      <option value="april">Abril</option>
                      <option value="may">Maio</option>
                      <option value="june">Junho</option>
                      <option value="july">Julho</option>
                      <option value="august">Agosto</option>
                      <option value="september">Setembro</option>
                      <option value="october">Outubro</option>
                      <option value="november">Novembro</option>
                      <option value="december">Dezembro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          💡 Os ajustes percentuais serão aplicados automaticamente ao preço base nos períodos selecionados.
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
