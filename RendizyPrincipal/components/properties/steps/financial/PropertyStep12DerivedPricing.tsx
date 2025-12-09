/**
 * STEP 12 - Preços Derivados
 * Descontos por permanência longa, tarifas adicionais, e cálculos automáticos
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { DerivedPricingValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep12Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep12DerivedPricing({ data, errors = {}, onChange, onSave, isSaving }: PropertyStep12Props) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = DerivedPricingValidator.validate(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TrendingDown className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Preços Derivados</h2>
        </div>
        <p className="text-gray-600">Descontos e taxas adicionais automáticas</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* Descontos por Permanência */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Descontos por Permanência Longa</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desconto para 7+ noites (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={data?.weeklyDiscount || ''}
                onChange={(e) => onChange('weeklyDiscount', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {showValidation && errors?.weeklyDiscount && (
                <p className="text-red-600 text-sm mt-1">{errors.weeklyDiscount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desconto para 30+ noites (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={data?.monthlyDiscount || ''}
                onChange={(e) => onChange('monthlyDiscount', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {showValidation && errors?.monthlyDiscount && (
                <p className="text-red-600 text-sm mt-1">{errors.monthlyDiscount}</p>
              )}
            </div>
          </div>
        </div>

        {/* Taxas Adicionais */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxas Adicionais</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de limpeza (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data?.cleaningFee || ''}
                  onChange={(e) => onChange('cleaningFee', parseFloat(e.target.value))}
                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de serviço (% do total)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={data?.serviceFeePercent || ''}
                onChange={(e) => onChange('serviceFeePercent', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de depósito caução (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data?.securityDeposit || ''}
                  onChange={(e) => onChange('securityDeposit', parseFloat(e.target.value))}
                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Cálculo */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Configurações Automáticas</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.autoCalculateWeekly || false}
                onChange={(e) => onChange('autoCalculateWeekly', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Calcular preço semanal automaticamente (10% desconto)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.autoCalculateMonthly || false}
                onChange={(e) => onChange('autoCalculateMonthly', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Calcular preço mensal automaticamente (20% desconto)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.hidePriceDetails || false}
                onChange={(e) => onChange('hidePriceDetails', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Ocultar detalhes de preço no anúncio (mostrar apenas total)</span>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 Os descontos serão aplicados automaticamente com base na duração da reserva.
            As taxas serão adicionadas ao valor final.
          </p>
        </div>
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
