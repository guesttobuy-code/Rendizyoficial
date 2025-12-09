/**
 * STEP 7 - Descrição
 * Título e descrição detalhada da propriedade
 */

import { Globe } from 'lucide-react';
import { useState } from 'react';

interface PropertyStep7DescriptionProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep7Description({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep7DescriptionProps) {
  const [activeLanguage, setActiveLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [autoTranslate, setAutoTranslate] = useState(true);

  const languages = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Descrição</h2>
        <p className="text-gray-600 mt-1">Descreva sua propriedade em detalhes</p>
      </div>

      {/* Title field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título da Propriedade
        </label>
        <div className="relative">
          <input
            type="text"
            maxLength={50}
            value={data?.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Ex: Apto com vista para o mar na Barra"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-12"
          />
          <span className="absolute right-3 top-2.5 text-xs text-gray-500">
            {(data?.title || '').length}/50
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Máximo 50 caracteres</p>
      </div>

      {/* Language tabs */}
      <div>
        <div className="flex gap-2 border-b mb-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code as 'pt' | 'en' | 'es')}
              className={`px-4 py-2 font-medium ${
                activeLanguage === lang.code
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>

        {/* Description fields */}
        {languages.map((lang) => (
          activeLanguage === lang.code && (
            <div key={lang.code} className="space-y-4">
              {/* Overview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visão Geral
                </label>
                <textarea
                  value={data?.[`overview_${lang.code}`] || ''}
                  onChange={(e) => onChange(`overview_${lang.code}`, e.target.value)}
                  placeholder={`Descrição breve da propriedade em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* About the property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobre a Propriedade
                </label>
                <textarea
                  value={data?.[`about_${lang.code}`] || ''}
                  onChange={(e) => onChange(`about_${lang.code}`, e.target.value)}
                  placeholder={`Detalhes da propriedade em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* About the area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobre a Área
                </label>
                <textarea
                  value={data?.[`area_${lang.code}`] || ''}
                  onChange={(e) => onChange(`area_${lang.code}`, e.target.value)}
                  placeholder={`Informações sobre a localização em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Instructions for guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instruções para Hóspedes
                </label>
                <textarea
                  value={data?.[`guestInstructions_${lang.code}`] || ''}
                  onChange={(e) => onChange(`guestInstructions_${lang.code}`, e.target.value)}
                  placeholder={`Instruções de check-in e dicas em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Other rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outras Regras
                </label>
                <textarea
                  value={data?.[`otherRules_${lang.code}`] || ''}
                  onChange={(e) => onChange(`otherRules_${lang.code}`, e.target.value)}
                  placeholder={`Regras adicionais em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* House rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regras da Casa
                </label>
                <textarea
                  value={data?.[`houseRules_${lang.code}`] || ''}
                  onChange={(e) => onChange(`houseRules_${lang.code}`, e.target.value)}
                  placeholder={`Regras gerais da propriedade em ${lang.label}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )
        ))}
      </div>

      {/* Auto-translate option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoTranslate}
            onChange={(e) => setAutoTranslate(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          <span className="text-sm text-blue-900">
            Traduzir automaticamente para inglês e espanhol
          </span>
        </label>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
        </button>
      </div>
    </div>
  );
}
