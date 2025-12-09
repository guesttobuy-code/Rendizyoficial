/**
 * STEP 3 - Cômodos e Fotos
 * Adicione os cômodos e fotos da propriedade
 */

import { Plus, Trash2, Upload } from 'lucide-react';

interface PropertyStep3RoomsProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep3Rooms({
  data,
  errors,
  onChange,
  onSave,
  isSaving
}: PropertyStep3RoomsProps) {
  const rooms = data?.rooms || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cômodos e Fotos</h2>
        <p className="text-gray-600 mt-1">Adicione os cômodos e suas fotos</p>
      </div>

      {/* Rooms list */}
      <div className="space-y-4">
        {rooms.map((room: any, index: number) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{room.name || `Cômodo ${index + 1}`}</p>
                <p className="text-sm text-gray-600">{room.type || 'Tipo não especificado'}</p>
              </div>
              <button
                onClick={() => {
                  const newRooms = rooms.filter((_: any, i: number) => i !== index);
                  onChange('rooms', newRooms);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Room type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cômodo
              </label>
              <select
                value={room.type || ''}
                onChange={(e) => {
                  const newRooms = [...rooms];
                  newRooms[index].type = e.target.value;
                  onChange('rooms', newRooms);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o tipo</option>
                <option value="suite">Suíte</option>
                <option value="individual">Individual</option>
                <option value="duplo">Duplo</option>
                <option value="compartilhado">Compartilhado</option>
              </select>
            </div>

            {/* Room photos */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Fotos</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Arraste suas imagens ou clique para carregar</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new room */}
      <button
        onClick={() => {
          const newRoom = { name: `Cômodo ${rooms.length + 1}`, type: '', photos: [] };
          onChange('rooms', [...rooms, newRoom]);
        }}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Adicionar Cômodo
      </button>

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
