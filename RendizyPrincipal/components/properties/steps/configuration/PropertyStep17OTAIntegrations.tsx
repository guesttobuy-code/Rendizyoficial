/**
 * STEP 17 - Integrações OTA
 * Configure conexões com plataformas de hospedagem (Airbnb, Booking, etc)
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Link2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
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

  useEffect(() => {
    const result = OTAIntegrationsValidator.validate(data);
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

  const otas = [
    {
      id: 'airbnb',
      name: 'Airbnb',
      icon: '🏠',
      enabled: data?.airbnbEnabled || false,
      listingId: data?.airbnbListingId || '',
      status: data?.airbnbStatus || 'disconnected'
    },
    {
      id: 'booking',
      name: 'Booking.com',
      icon: '🔖',
      enabled: data?.bookingEnabled || false,
      listingId: data?.bookingListingId || '',
      status: data?.bookingStatus || 'disconnected'
    },
    {
      id: 'vrbo',
      name: 'VRBO (HomeAway)',
      icon: '🌍',
      enabled: data?.vrboEnabled || false,
      listingId: data?.vrboListingId || '',
      status: data?.vrboStatus || 'disconnected'
    },
    {
      id: 'airbnbplc',
      name: 'Airbnb PLC',
      icon: '👥',
      enabled: data?.airbnbplcEnabled || false,
      listingId: data?.airbnbplcListingId || '',
      status: data?.airbnbplcStatus || 'disconnected'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Integrações com Plataformas OTA</h2>
        </div>
        <p className="text-gray-600">Conecte sua propriedade com as principais plataformas de hospedagem</p>
      </div>

      {/* OTA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otas.map((ota) => (
          <div key={ota.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ota.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{ota.name}</h3>
                  <p className={`text-xs font-medium ${
                    ota.status === 'connected'
                      ? 'text-green-600'
                      : ota.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}>
                    {ota.status === 'connected' ? '✓ Conectado' : ota.status === 'pending' ? '⏳ Pendente' : 'Desconectado'}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ota.enabled}
                  onChange={(e) => {
                    onChange(`${ota.id}Enabled`, e.target.checked);
                    if (!e.target.checked) {
                      onChange(`${ota.id}Status`, 'disconnected');
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </label>
            </div>

            {ota.enabled && (
              <div className="space-y-3 pt-3 border-t">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID ou Código do Anúncio
                  </label>
                  <input
                    type="text"
                    value={ota.listingId}
                    onChange={(e) => onChange(`${ota.id}ListingId`, e.target.value)}
                    placeholder={`${ota.name} ID`}
                    className={`w-full px-2 py-1.5 border rounded text-sm ${
                      showValidation && displayErrors[`${ota.id}ListingId`]
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  {showValidation && displayErrors[`${ota.id}ListingId`] && (
                    <p className="text-red-600 text-xs mt-1">{displayErrors[`${ota.id}ListingId`]}</p>
                  )}
                </div>

                <button className="w-full px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  Conectar Agora
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sincronização de Dados */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Sincronização</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.syncPrices || true}
              onChange={(e) => onChange('syncPrices', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Sincronizar preços automaticamente</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.syncCalendar || true}
              onChange={(e) => onChange('syncCalendar', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Sincronizar calendário de disponibilidade</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.syncPhotos || false}
              onChange={(e) => onChange('syncPhotos', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Sincronizar fotos quando houver atualizações</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.autoPublish || false}
              onChange={(e) => onChange('autoPublish', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Publicar automaticamente quando conectar</span>
          </label>
        </div>
      </div>

      {/* Notificações */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.notifyNewBookings || true}
              onChange={(e) => onChange('notifyNewBookings', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Notificar novas reservas de plataformas externas</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data?.notifySyncErrors || true}
              onChange={(e) => onChange('notifySyncErrors', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Notificar erros de sincronização</span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          💡 As integrações OTA sincronizam calendário e preços automaticamente, maximizando suas ocupações.
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
