/**
 * STEP 17 - Integrações OTAs
 * Conexão com plataformas de hospedagem (Airbnb, Booking, Decolar, etc)
 * COM VALIDAÇÃO
 */

import { useEffect, useState } from 'react';
import { Share2, AlertCircle } from 'lucide-react';
import { OTAIntegrationsValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep17Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep17OTAIntegrations({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep17Props) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = OTAIntegrationsValidator.validate(data);
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

  const otas = [
    {
      id: 'airbnb',
      name: 'Airbnb',
      description: 'Hospedagem de curta duração',
      icon: '🏠'
    },
    {
      id: 'booking',
      name: 'Booking.com',
      description: 'Hospedagem e hotéis',
      icon: '🏨'
    },
    {
      id: 'decolar',
      name: 'Decolar',
      description: 'Viagens e hospedagem',
      icon: '✈️'
    },
    {
      id: 'vrbo',
      name: 'VRBO',
      description: 'Aluguel de férias',
      icon: '🏖️'
    },
    {
      id: 'expedia',
      name: 'Expedia',
      description: 'Viagens e hospedagem',
      icon: '🌍'
    },
    {
      id: 'trivago',
      name: 'Trivago',
      description: 'Comparador de hotéis',
      icon: '🔍'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Share2 className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900">Integrações OTAs</h2>
        </div>
        <p className="text-gray-600">Conecte sua propriedade com plataformas de hospedagem online</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* OTAs Disponíveis */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plataformas Disponíveis</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otas.map((ota) => (
              <div
                key={ota.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  data?.[`ota_${ota.id}`]
                    ? 'border-black bg-black bg-opacity-5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => onChange(`ota_${ota.id}`, !data?.[`ota_${ota.id}`])}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-2xl mb-1">{ota.icon}</div>
                    <p className="font-semibold text-gray-900">{ota.name}</p>
                    <p className="text-xs text-gray-600">{ota.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data?.[`ota_${ota.id}`] || false}
                    onChange={() => {}}
                    className="mt-1"
                  />
                </div>

                {data?.[`ota_${ota.id}`] && (
                  <div className="mt-3 pt-3 border-t border-gray-300 text-green-600 text-sm">
                    ✓ Conectado
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dados OTA */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações OTA</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Propriedade (ID remoto)
              </label>
              <input
                type="text"
                value={data?.otaPropertyCode || ''}
                onChange={(e) => onChange('otaPropertyCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: ABD1234567"
              />
              <p className="text-gray-500 text-xs mt-1">
                Identificador único da propriedade nas plataformas OTA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave de API (opcional)
              </label>
              <input
                type="password"
                value={data?.otaApiKey || ''}
                onChange={(e) => onChange('otaApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Cole apenas se solicitado"
              />
              <p className="text-gray-500 text-xs mt-1">
                Necessária apenas para sincronizações avançadas
              </p>
            </div>
          </div>
        </div>

        {/* Configurações de Sincronização */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Sincronização</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.syncAvailabilityToOTA || false}
                onChange={(e) => onChange('syncAvailabilityToOTA', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Sincronizar disponibilidade automaticamente</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.syncPricesToOTA || false}
                onChange={(e) => onChange('syncPricesToOTA', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Sincronizar preços para OTAs</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.importBookingsFromOTA || false}
                onChange={(e) => onChange('importBookingsFromOTA', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Importar reservas de OTAs automaticamente</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequência de sincronização
              </label>
              <select
                value={data?.syncFrequency || 'hourly'}
                onChange={(e) => onChange('syncFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="realtime">Tempo real</option>
                <option value="hourly">A cada hora</option>
                <option value="daily">Uma vez por dia</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status de Conexão */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 As integrações OTA são geralmente configuradas após publicar a propriedade.
            Você terá acesso a ferramentas de sincronização avançadas em breve.
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
