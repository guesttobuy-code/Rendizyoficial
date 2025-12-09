/**
 * STEP 16 - Sincronização iCal
 * Integração com calendários externos para sincronizar disponibilidade
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Calendar, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const result = ICalSyncValidator.validate(data);
    const errorMap: Record<string, string> = {};
    result.errors.forEach(err => {
      errorMap[err.field] = err.message;
    });
    setValidationErrors(errorMap);
  }, [data]);

  const displayErrors = { ...validationErrors, ...errors };

  const handleSave = async () => {
    setShowValidation(true);
    await onSave();
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iCalUrl = `https://api.rendizy.com/ical/${data?.propertyId || 'xxx'}`;
  const externalICalUrl = data?.externalICalUrl || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Sincronização iCal</h2>
        </div>
        <p className="text-gray-600">Sincronize sua disponibilidade com plataformas externas</p>
      </div>

      {/* Exportar para Externo */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar para Plataformas Externas</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Use a URL abaixo para sincronizar a disponibilidade do seu calendário com outras plataformas (Airbnb, Booking.com, etc).
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL do Calendário iCal
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={iCalUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-gray-600"
              />
              <button
                onClick={() => handleCopyUrl(iCalUrl)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Copie este link e adicione em suas contas de plataformas externas</p>
          </div>
        </div>
      </div>

      {/* Importar de Externo */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Importar de Plataformas Externas</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Adicione a URL do calendário iCal de uma plataforma externa para sincronizar bloqueios e indisponibilidades.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL iCal da Plataforma Externa (opcional)
            </label>
            <input
              type="url"
              value={externalICalUrl}
              onChange={(e) => onChange('externalICalUrl', e.target.value)}
              placeholder="https://icalendar.airbnb.com/..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors ${
                showValidation && displayErrors.externalICalUrl
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {showValidation && displayErrors.externalICalUrl && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {displayErrors.externalICalUrl}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">Cole aqui a URL iCal da sua conta Airbnb, Booking, etc</p>
          </div>
        </div>
      </div>

      {/* Configurações de Sincronização */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Sincronização</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.autoSyncEnabled || true}
              onChange={(e) => onChange('autoSyncEnabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Sincronização automática ativa</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequência de sincronização
            </label>
            <select
              value={data?.syncFrequency || 'hourly'}
              onChange={(e) => onChange('syncFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="realtime">Em tempo real</option>
              <option value="every15min">A cada 15 minutos</option>
              <option value="hourly">A cada hora</option>
              <option value="daily">Diariamente</option>
            </select>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.syncOnlyAvailable || false}
              onChange={(e) => onChange('syncOnlyAvailable', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Sincronizar apenas dias disponíveis</span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          💡 A sincronização iCal garante que sua disponibilidade esteja sempre atualizada em todas as plataformas.
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
