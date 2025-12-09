/**
 * PROPERTY STEP 1 - Tipo e Identificação (OTA-Ready)
 * Design profissional com seções colapsáveis, badges e validação
 * Com auto-save em localStorage
 */

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { BasicInfo } from '../../domain/properties/types';
import { usePersistenceAutoSave } from '../../hooks/usePersistenceAutoSave';
import { 
  LOCATION_TYPES, 
  ACCOMMODATION_TYPES, 
  MODALITY_OPTIONS
} from '../../types/property-constants';

interface PropertyStep1OTAProps {
  data: BasicInfo;
  errors: Record<string, string>;
  onChange: (field: keyof BasicInfo, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const PropertyStep1OTA = ({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep1OTAProps) => {
  const [expandedSections, setExpandedSections] = useState({
    identification: true,
    structure: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleModalityChange = (modality: 'seasonal' | 'sale' | 'residential') => {
    // Converter para Set se não for (pode vir como array do banco)
    const currentModalities = data.modalities instanceof Set 
      ? data.modalities 
      : new Set(data.modalities || []);
    
    const newModalities = new Set(currentModalities);
    if (newModalities.has(modality)) {
      newModalities.delete(modality);
    } else {
      newModalities.add(modality);
    }
    onChange('modalities', newModalities);
  };

  // Auto-save com localStorage (debounced)
  usePersistenceAutoSave(
    (data as any)?.propertyId, 
    1, 
    'BasicInfo', 
    data, 
    data && Object.keys(data).length > 0
  );

  return (
    <div className="space-y-6">
      {/* Seção: Tipo e Identificação */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header da Seção */}
        <button
          type="button"
          onClick={() => toggleSection('identification')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Tipo e Identificação</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
              Obrigatório
            </span>
          </div>
          {expandedSections.identification ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Conteúdo da Seção */}
        {expandedSections.identification && (
          <div className="p-6 pt-0 space-y-6 border-t border-gray-100">
            {/* Identificação Interna */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identificação interna
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Nome para identificar este imóvel no painel administrativo (visível apenas para equipe)
              </p>
              <input
                type="text"
                value={data.internalName}
                onChange={(e) => onChange('internalName', e.target.value)}
                placeholder="Ex: Casa de Veraneio"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.internalName ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.internalName && (
                <p className="text-sm text-red-600 mt-1">{errors.internalName}</p>
              )}
            </div>

            {/* Tipo do Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Qual é o tipo da acomodação?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Tipo do local */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo do local
                  </label>
                  <select
                    value={data.propertyType}
                    onChange={(e) => onChange('propertyType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      errors.propertyType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  >
                    <option value="">Selecione</option>
                    {LOCATION_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.propertyType && (
                    <p className="text-xs text-red-600 mt-1">{errors.propertyType}</p>
                  )}
                </div>

                {/* Tipo de acomodação */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo de acomodação
                  </label>
                  <select
                    value={data.accommodationType}
                    onChange={(e) => onChange('accommodationType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      errors.accommodationType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  >
                    <option value="">Selecione</option>
                    {ACCOMMODATION_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.accommodationType && (
                    <p className="text-xs text-red-600 mt-1">{errors.accommodationType}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Subtipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtipo
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Qual é o subtipo desta acomodação?
              </p>
              <select
                value={data.subtype || ''}
                onChange={(e) => onChange('subtype', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={isSaving}
              >
                <option value="">Selecione o subtipo</option>
                <option value="entire_place">Imóvel Inteiro</option>
                <option value="private_room">Quarto Privado</option>
                <option value="shared_room">Quarto Compartilhado</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Em quais modalidades essa unidade está ativa?
              </p>
              <div className="space-y-2">
                {MODALITY_OPTIONS.map((modality) => {
                  // Converter para Set se necessário
                  const modalities = data.modalities instanceof Set 
                    ? data.modalities 
                    : new Set(data.modalities || []);
                  
                  return (
                    <label
                      key={modality.code}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={modalities.has(modality.code)}
                        onChange={() => handleModalityChange(modality.code)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isSaving}
                      />
                      <span className="text-2xl">{modality.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{modality.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.modalities && (
                <p className="text-sm text-red-600 mt-2">{errors.modalities}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Seção: Estrutura do Anúncio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header da Seção */}
        <button
          type="button"
          onClick={() => toggleSection('structure')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Estrutura do Anúncio</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              Recomendado
            </span>
          </div>
          {expandedSections.structure ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Conteúdo da Seção */}
        {expandedSections.structure && (
          <div className="p-6 pt-0 space-y-6 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Selecione como as acomodações do local serão gerenciadas
            </p>

            {/* Tipo de Anúncio */}
            <div className="grid grid-cols-2 gap-4">
              {/* Anúncio Individual */}
              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  data.announcementType === 'individual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="announcementType"
                  value="individual"
                  checked={data.announcementType === 'individual'}
                  onChange={(e) => onChange('announcementType', e.target.value)}
                  className="sr-only"
                  disabled={isSaving}
                />
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Anúncio Individual</span>
                </div>
                <p className="text-xs text-gray-600">
                  Casa, apartamento em prédio, etc
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">✓ Anúncios do local: Hertales</p>
                  <p className="text-xs text-gray-500">✓ Quantidade de acomodações: SoMente</p>
                </div>
              </label>

              {/* Anúncio Vinculado */}
              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  data.announcementType === 'linked'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="announcementType"
                  value="linked"
                  checked={data.announcementType === 'linked'}
                  onChange={(e) => onChange('announcementType', e.target.value)}
                  className="sr-only"
                  disabled={isSaving}
                />
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Anúncio Vinculado</span>
                </div>
                <p className="text-xs text-gray-600">
                  Apartamento em prédio, quarto em hotel, etc
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">✓ Anúncios do local: Hertales</p>
                  <p className="text-xs text-gray-500">✓ Quantidade de acomodações: Edificio</p>
                </div>
              </label>
            </div>

            {/* Quantidade de Acomodações (só aparece se linked) */}
            {data.announcementType === 'linked' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de acomodações
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  value={data.totalUnits || 0}
                  onChange={(e) => onChange('totalUnits', parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Digite o número de unidades"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.totalUnits ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSaving}
                />
                {errors.totalUnits && (
                  <p className="text-sm text-red-600 mt-1">{errors.totalUnits}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão Salvar e Avançar */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Salvando...
            </>
          ) : (
            'Salvar e Avançar'
          )}
        </button>
      </div>
    </div>
  );
};
