/**
 * STEP 4 - Tour Visual
 * Organize as fotos dos cômodos como tour virtual
 */

import { Upload } from 'lucide-react';

interface PropertyStep4TourProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep4Tour({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep4TourProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tour Visual</h2>
        <p className="text-gray-600 mt-1">Selecione qual será a capa do tour</p>
      </div>

      {/* Cover photo section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Foto de Capa</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Clique para selecionar a foto de capa</p>
          <p className="text-xs text-gray-500 mt-2">Recomendado: imagem em alta qualidade da fachada ou entrada</p>
        </div>
      </div>

      {/* Photos in tour */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Fotos do Tour</h3>
        <p className="text-sm text-gray-600 mb-4">
          Arraste as fotos para reordenar. A primeira foto aparecerá como capa.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-move hover:border-blue-500 transition-colors group"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1 group-hover:text-blue-500" />
                <p className="text-xs text-gray-500">Foto {i}</p>
              </div>
            </div>
          ))}
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
