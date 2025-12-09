/**
 * STEP 13 - Regras de Hospedagem
 * Configure as regras e restrições da propriedade
 */

interface PropertyStep13RulesProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep13Rules({
  data,
  onChange,
  onSave,
  isSaving
}: PropertyStep13RulesProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Regras de Hospedagem</h2>
        <p className="text-gray-600 mt-1">Configure as regras e políticas da sua propriedade</p>
      </div>

      {/* Rules grid */}
      <div className="space-y-4">
        {/* Min night stay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mínimo de noites
          </label>
          <input
            type="number"
            min="1"
            value={data?.minNights || 1}
            onChange={(e) => onChange('minNights', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max night stay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Máximo de noites
          </label>
          <input
            type="number"
            min="1"
            value={data?.maxNights || 365}
            onChange={(e) => onChange('maxNights', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Allow pets */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.allowPets || false}
              onChange={(e) => onChange('allowPets', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Animais de estimação permitidos</span>
          </label>
        </div>

        {/* Allow smoking */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.allowSmoking || false}
              onChange={(e) => onChange('allowSmoking', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Fumo permitido</span>
          </label>
        </div>

        {/* Allow events */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data?.allowEvents || false}
              onChange={(e) => onChange('allowEvents', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Eventos/Festas permitidas</span>
          </label>
        </div>
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
