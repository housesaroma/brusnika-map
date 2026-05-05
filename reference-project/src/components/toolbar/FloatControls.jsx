import React from 'react';
import { Star, Pencil, X, Plus, Minus } from 'lucide-react';

export function FloatControlsInner({ onFavorites, onToggleDrawing, isDrawing, onZoomIn, onZoomOut }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <button
        onClick={onFavorites}
        title="Избранное"
        className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
      >
        <Star className="w-4 h-4 text-primary" />
      </button>
      <button
        onClick={onToggleDrawing}
        title={isDrawing ? 'Отменить полигон' : 'Нарисовать полигон'}
        className={`w-10 h-10 rounded-xl shadow-lg border flex items-center justify-center transition-colors ${
          isDrawing
            ? 'bg-primary border-primary text-white'
            : 'bg-white/95 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700'
        }`}
      >
        {isDrawing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
      </button>
      <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-gray-200 mt-1">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 bg-white/95 hover:bg-gray-50 flex items-center justify-center border-b border-gray-200 transition-colors text-gray-700"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 bg-white/95 hover:bg-gray-50 flex items-center justify-center transition-colors text-gray-700"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}