/**
 * STEP 14 - Configurações de Reserva
 * Políticas de cancelamento, depósito, confirmação automática
 * COM VALIDAÇÃO
 */

import { useEffect, useState } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
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

  // Validar quando dados mudam
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configurações de Reserva</h2>
        </div>
        <p className="text-gray-600">Define políticas e regras para reservas da propriedade</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* Política de Cancelamento */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Política de Cancelamento</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="cancellationPolicy"
                value="flexible"
                checked={data?.cancellationPolicy === 'flexible'}
                onChange={(e) => onChange('cancellationPolicy', e.target.value)}
                className="border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-900">Flexível</p>
                <p className="text-sm text-gray-600">Cancelamento gratuito até 1 dia antes</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="cancellationPolicy"
                value="moderate"
                checked={data?.cancellationPolicy === 'moderate'}
                onChange={(e) => onChange('cancellationPolicy', e.target.value)}
                className="border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-900">Moderada</p>
                <p className="text-sm text-gray-600">Reembolso total até 7 dias antes</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="cancellationPolicy"
                value="strict"
                checked={data?.cancellationPolicy === 'strict'}
                onChange={(e) => onChange('cancellationPolicy', e.target.value)}
                className="border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-900">Rigorosa</p>
                <p className="text-sm text-gray-600">Reembolso 50% até 14 dias antes</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="cancellationPolicy"
                value="nonRefundable"
                checked={data?.cancellationPolicy === 'nonRefundable'}
                onChange={(e) => onChange('cancellationPolicy', e.target.value)}
                className="border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-900">Não Reembolsável</p>
                <p className="text-sm text-gray-600">Sem reembolso em caso de cancelamento</p>
              </div>
            </label>
          </div>
        </div>

        {/* Confirmação de Reserva */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmação de Reserva</h3>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={data?.autoConfirm || false}
                  onChange={(e) => onChange('autoConfirm', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Confirmar reservas automaticamente</span>
              </label>
              <p className="text-gray-500 text-xs ml-6">
                Reservas serão confirmadas imediatamente sem análise manual
              </p>
            </div>

            {!data?.autoConfirm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas para responder reserva (máximo)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={data?.responseHours || 24}
                  onChange={(e) => onChange('responseHours', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                />
              </div>
            )}
          </div>
        </div>

        {/* Requisitos para Hóspedes */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requisitos para Hóspedes</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.requireVerification || false}
                onChange={(e) => onChange('requireVerification', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Exigir verificação de identidade</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.requirePaymentMethod || false}
                onChange={(e) => onChange('requirePaymentMethod', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Exigir método de pagamento válido</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data?.blockNewUsers || false}
                onChange={(e) => onChange('blockNewUsers', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Bloquear usuários sem avaliações</span>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 Estas configurações ajudam a proteger sua propriedade e melhorar a experiência de ambos.
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
