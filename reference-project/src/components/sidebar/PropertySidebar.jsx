import React from 'react';
import PropertyCard from './PropertyCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PropertySidebar({ 
  building, 
  flats, 
  selectedFlatId, 
  onFlatClick, 
  onClose,
  isOpen 
}) {
  if (!isOpen || !building) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-[380px] bg-card/95 backdrop-blur-md z-10 border-r border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground truncate">{building.address}</h2>
            <p className="text-sm text-muted-foreground">
              {building.district} · {building.floors} этажей · {building.year_built} г.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-2">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Flat count */}
      <div className="px-5 py-3 bg-muted/50 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Квартир в продаже: <span className="font-semibold text-foreground">{flats.length}</span>
        </p>
      </div>

      {/* Flats list */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3 pb-4">
          {flats.map(flat => (
            <PropertyCard
              key={flat.id}
              flat={flat}
              isSelected={flat.id === selectedFlatId}
              onClick={() => onFlatClick(flat)}
            />
          ))}
          {flats.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Нет квартир для отображения</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}