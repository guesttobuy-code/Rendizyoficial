/**
 * STEP 16 - iCal e Sincronização
 * Integração com calendários externos (Airbnb, Booking, Google Calendar)
 * COM VALIDAÇÃO
 */

import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { ICalSyncValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep16Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep16ICalSync({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep16Props) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = ICalSyncValidator.validate(data);
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
          <Calendar className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">iCal e Sincronização</h2>
        </div>
        <p className="text-gray-600">Sincronize sua disponibilidade com calendários externos</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* URL de Exportação */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Calendário</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Calendário iCal (leitura)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data?.iCalExportUrl || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                  placeholder="Será gerada após salvar"
                />
                <button
                  className="absolute right-2 top-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  onClick={() => {
                    if (data?.iCalExportUrl) {
                      navigator.clipboard.writeText(data.iCalExportUrl);
                    }
                  }}
                >
                  Copiar
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Compartilhe esta URL com plataformas externas para sincronizar disponibilidade
              </p>
            </div>
          </div>
        </div>

        {/* Importação de Calendários */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Importar Calendários Externos</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do iCal externo (importação)
              </label>
              <input
                type="text"
                value={data?.iCalImportUrl || ''}
                onChange={(e) => onChange('iCalImportUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Cole a URL de um calendário externo"
              />
              <p className="text-gray-500 text-xs mt-1">
                Insira URLs de calendários (Airbnb, Booking, etc) para sincronizar bloqueios
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data?.autoSyncCalendar || false}
                  onChange={(e) => onChange('autoSyncCalendar', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Sincronização automática a cada hora</span>
              </label>
            </div>
          </div>
        </div>

        {/* Integrações Conhecidas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrações Disponíveis</h3>

          <div className="space-y-2">
            {[
              { name: 'Airbnb', status: 'active', url: '#' },
              { name: 'Booking.com', status: 'active', url: '#' },
              { name: 'Google Calendar', status: 'inactive', url: '#' },
              { name: 'Outlook Calendar', status: 'inactive', url: '#' }
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{integration.name}</span>
                {integration.status === 'active' ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Conectado</span>
                ) : (
                  <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Conectar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configurações de Sincronização */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.syncBlockedDates || false}
                onChange={(e) => onChange('syncBlockedDates', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Sincronizar datas bloqueadas manualmente</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.syncMaintenanceBlocks || false}
                onChange={(e) => onChange('syncMaintenanceBlocks', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Incluir períodos de manutenção</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.preventOverbooking || false}
                onChange={(e) => onChange('preventOverbooking', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Prevenir overbooking (bloquear conflitos)</span>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 A sincronização de calendários evita duplas reservas entre diferentes plataformas.
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
