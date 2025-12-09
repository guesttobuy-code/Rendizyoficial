/**
 * STEP 15 - Tags e Grupos
 * Categorização, tags personalizadas e grupos de propriedades
 * COM VALIDAÇÃO
 */

import { useState, useEffect } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { TagsGroupsValidator } from '../../../../domain/properties/validatorsV3';

interface PropertyStep15Props {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep15TagsGroups({ data, onChange, onSave, isSaving, errors = {} }: PropertyStep15Props) {
  const [newTag, setNewTag] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validar quando dados mudam
  useEffect(() => {
    const result = TagsGroupsValidator.validate(data);
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

  const handleAddTag = () => {
    if (newTag.trim()) {
      const tags = data?.tags || [];
      onChange('tags', [...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const tags = data?.tags || [];
    onChange('tags', tags.filter((t: string) => t !== tag));
  };

  const suggestedTags = [
    'Pet-friendly', 'WiFi', 'Piscina', 'Varanda', 'Cozinha',
    'Ar-condicionado', 'Estacionamento', 'Vista Panorâmica',
    'Próximo ao mar', 'Centro da cidade'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-6 w-6 text-pink-600" />
          <h2 className="text-2xl font-bold text-gray-900">Tags e Grupos</h2>
        </div>
        <p className="text-gray-600">Categorize sua propriedade com tags e grupos de propriedades</p>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* Tags Customizadas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags Personalizadas</h3>

          <div className="space-y-3">
            {/* Input de Nova Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Digite uma tag e pressione Enter"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>

            {/* Tags Adicionadas */}
            {data?.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
                {data.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70"
                      title="Remover tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tags Sugeridas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags Sugeridas</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (!data?.tags?.includes(tag)) {
                    onChange('tags', [...(data?.tags || []), tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-all ${
                  data?.tags?.includes(tag)
                    ? 'bg-black text-white border-black'
                    : 'bg-gray-100 text-gray-900 border-gray-300 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grupo de Propriedades */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grupo de Propriedades</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecione um grupo (opcional)
              </label>
              <select
                value={data?.propertyGroup || ''}
                onChange={(e) => onChange('propertyGroup', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum grupo</option>
                <option value="portfolio">Portfólio</option>
                <option value="premium">Premium</option>
                <option value="budget">Econômico</option>
                <option value="seasonal">Sazonal</option>
                <option value="corporate">Corporativo</option>
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Agrupe propriedades para gerenciamento em lote
              </p>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.shareRules || false}
                onChange={(e) => onChange('shareRules', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Compartilhar regras com o grupo</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data?.syncPrices || false}
                onChange={(e) => onChange('syncPrices', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Sincronizar preços com o grupo</span>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            💡 Tags ajudam hóspedes a encontrar sua propriedade. Grupos facilitam gerenciar várias propriedades.
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
