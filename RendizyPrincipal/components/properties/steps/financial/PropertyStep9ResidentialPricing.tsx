/**
 * STEP 9 - Preços Locação e Venda
 * Configuração de preços para locação e venda da propriedade
 * COM VALIDAÇÃO E FEEDBACK + MODALIDADES CONDICIONAIS
 */

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ResidentialPricingValidator } from '../../../../domain/properties/validatorsV3';
import { toastHelpers } from '../../../../utils/toastHelpers';

type Modalidade = 'short_term_rental' | 'residential_rental' | 'buy_sell';

interface PropertyStep9Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep9ResidentialPricing({ data, errors = {}, onChange, onSave, isSaving }: PropertyStep9Props) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Inferir modalidades do data ou usar default
  const modalidades = new Set<Modalidade>(data?.modalidades || ['short_term_rental']);

  // Validar quando dados mudam
  useEffect(() => {
    const result = ResidentialPricingValidator.validate(data);
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
    
    if (hasErrors) {
      const errorMessages = Object.values(displayErrors);
      toastHelpers.validationErrors(errorMessages);
      return;
    }

    try {
      const toastId = toastHelpers.savingStep('Preços de Locação e Venda');
      await onSave();
      toastHelpers.dismiss(toastId);
      toastHelpers.stepSaved('Preços de Locação e Venda');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toastHelpers.stepSaveError('Preços de Locação e Venda', msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Preços Locação e Venda</h2>
        </div>
        <p className="text-gray-600">Configure os preços base da sua propriedade</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* Seção de Locação Residencial (residential_rental ou short_term_rental) */}
        {(modalidades.has('residential_rental') || modalidades.has('short_term_rental')) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preço de Locação {modalidades.has('residential_rental') ? 'Residencial' : 'de Curta Duração'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalidades.has('short_term_rental') ? 'Preço por noite (R$)' : 'Aluguel mensal (R$)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={modalidades.has('short_term_rental') ? data?.rentalNightlyPrice || '' : data?.rentalMonthlyPrice || ''}
                    onChange={(e) => {
                      const fieldName = modalidades.has('short_term_rental') ? 'rentalNightlyPrice' : 'rentalMonthlyPrice';
                      onChange(fieldName, parseFloat(e.target.value) || undefined);
                    }}
                    className={`w-full pl-8 px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors ${
                      showValidation && (displayErrors.rentalNightlyPrice || displayErrors.rentalMonthlyPrice)
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0,00"
                  />
                </div>
                {showValidation && (displayErrors.rentalNightlyPrice || displayErrors.rentalMonthlyPrice) && (
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {displayErrors.rentalNightlyPrice || displayErrors.rentalMonthlyPrice}
                  </div>
                )}
              </div>

              {modalidades.has('short_term_rental') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo de noites
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={data?.minRentalDays || ''}
                    onChange={(e) => onChange('minRentalDays', parseInt(e.target.value) || undefined)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors ${
                      showValidation && displayErrors.minRentalDays
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="1"
                  />
                  <p className="text-gray-500 text-xs mt-1">Mínimo de noites para uma reserva</p>
                  {showValidation && displayErrors.minRentalDays && (
                    <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {displayErrors.minRentalDays}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção de Venda (buy_sell) */}
        {modalidades.has('buy_sell') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preço de Venda</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de venda (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data?.salePrice || ''}
                    onChange={(e) => onChange('salePrice', parseFloat(e.target.value) || undefined)}
                    className={`w-full pl-8 px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors ${
                      showValidation && displayErrors.salePrice
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0,00"
                  />
                </div>
                {showValidation && displayErrors.salePrice && (
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {displayErrors.salePrice}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data?.acceptOffers || false}
                    onChange={(e) => onChange('acceptOffers', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Aceitar ofertas de compra</span>
                </label>
                <p className="text-gray-500 text-xs mt-1 ml-6">Permitir que compradores façam ofertas</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 Os preços configurados aqui serão utilizados como base para temporadas e promoções. 
            Você poderá ajustá-los nos próximos passos.
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
