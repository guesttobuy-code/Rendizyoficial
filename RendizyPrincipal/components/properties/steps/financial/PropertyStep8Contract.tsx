/**
 * STEP 8 - Configuração de Relacionamento
 * Selecione como você quer relacionar-se com a Rendizy
 */

interface PropertyStep8ContractProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep8Contract({
  data,
  onChange,
  onSave,
  isSaving
}: PropertyStep8ContractProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuração de Relacionamento</h2>
        <p className="text-gray-600 mt-1">Como você deseja relacionar-se com a Rendizy?</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="relationship"
              value="exclusive"
              checked={data?.relationship === 'exclusive'}
              onChange={(e) => onChange('relationship', e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <p className="font-medium text-gray-900">Exclusividade</p>
              <p className="text-sm text-gray-600">Apenas pela Rendizy</p>
            </div>
          </div>
        </label>

        <label className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="relationship"
              value="non-exclusive"
              checked={data?.relationship === 'non-exclusive'}
              onChange={(e) => onChange('relationship', e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <p className="font-medium text-gray-900">Não Exclusivo</p>
              <p className="text-sm text-gray-600">Com a Rendizy e outros canais</p>
            </div>
          </div>
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
