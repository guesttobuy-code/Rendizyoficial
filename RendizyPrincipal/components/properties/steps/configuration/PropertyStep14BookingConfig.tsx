/**
 * STEP 14 - Configuração de Reservas
 * Políticas de reserva, cancelamento e verificação de hóspedes
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Shield, AlertCircle, Info } from 'lucide-react';
import { BookingConfigValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep14Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep14BookingConfig({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep14Props) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const result = BookingConfigValidator.validate(data);
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

  const cancellationPolicies = [
    { id: 'flexible', label: 'Flexível', desc: 'Cancelamento gratuito até 1 dia antes da chegada' },
    { id: 'moderate', label: 'Moderada', desc: 'Reembolso parcial até 7 dias antes' },
    { id: 'strict', label: 'Rígida', desc: 'Apenas 50% de reembolso até 14 dias antes' },
    { id: 'nonrefundable', label: 'Não reembolsável', desc: 'Nenhum reembolso após confirmação' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuração de Reservas</h2>
        </div>
        <p className="text-gray-600">Defina as políticas de reserva e cancelamento</p>
      </div>

      {/* Política de Cancelamento */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Política de Cancelamento</h3>
        
        <div className="space-y-3">
          {cancellationPolicies.map((policy) => (
            <label key={policy.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="cancellationPolicy"
                value={policy.id}
                checked={data?.cancellationPolicy === policy.id}
                onChange={(e) => onChange('cancellationPolicy', e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{policy.label}</p>
                <p className="text-sm text-gray-600">{policy.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Verificação de Hóspedes */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verificação de Hóspedes</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.requirePhoneVerification || false}
              onChange={(e) => onChange('requirePhoneVerification', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Exigir verificação de telefone</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.requireEmailVerification || false}
              onChange={(e) => onChange('requireEmailVerification', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Exigir verificação de email</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.requireReviews || false}
              onChange={(e) => onChange('requireReviews', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Exigir histórico de avaliações</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.blockNewAccounts || false}
              onChange={(e) => onChange('blockNewAccounts', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Bloquear contas criadas há menos de 30 dias</span>
          </label>
        </div>
      </div>

      {/* Antecedência Mínima */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Requerimentos de Antecedência</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Antecedência mínima para reserva (dias)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              step="1"
              value={data?.minBookingDaysAhead || 0}
              onChange={(e) => onChange('minBookingDaysAhead', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-gray-500 text-xs mt-1">Número mínimo de dias para antecedência de reserva</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Antecedência máxima para reserva (dias)
            </label>
            <input
              type="number"
              min="30"
              max="730"
              step="1"
              value={data?.maxBookingDaysAhead || 365}
              onChange={(e) => onChange('maxBookingDaysAhead', parseInt(e.target.value) || 365)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="365"
            />
            <p className="text-gray-500 text-xs mt-1">Número máximo de dias para antecedência de reserva</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          💡 Essas configurações ajudam a manter a qualidade das reservas e protegem sua propriedade.
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
