import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPrice, RENOVATIONS, SOURCES } from '@/lib/demoData';
import { MapPin, Maximize2, Layers } from 'lucide-react';

export default function PropertyCard({ flat, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'border-primary bg-accent shadow-md'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-base text-foreground">
            {flat.rooms}-комн. · {flat.area} м²
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {flat.address}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {SOURCES[flat.source] || flat.source}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {flat.floor}/{flat.total_floors} эт.
        </span>
        <span className="flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          Кухня {flat.kitchen_area} м²
        </span>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-lg font-bold text-primary">{formatPrice(flat.price)}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('ru-RU').format(flat.price_per_sqm)} ₽/м²
          </p>
        </div>
        {flat.renovation && flat.renovation !== 'none' && (
          <Badge variant="outline" className="text-xs">
            {RENOVATIONS[flat.renovation]}
          </Badge>
        )}
      </div>
    </div>
  );
}
