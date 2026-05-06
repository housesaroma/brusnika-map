import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Star, MapPin, Check } from 'lucide-react';
import PropertyCard from './PropertyCard';

export default function PolygonSidebar({
  flats,
  isOpen,
  onClose,
  onFlatClick,
  selectedFlatId,
  onSaveToFavorites,
}) {
  const [polygonName, setPolygonName] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const name = polygonName.trim() || `Полигон ${new Date().toLocaleDateString('ru')}`;
    onSaveToFavorites(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="absolute top-0 left-0 h-full w-[380px] bg-card/95 backdrop-blur-md z-10 border-r border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">Объекты в полигоне</h2>
            <p className="text-sm text-muted-foreground">{flats.length} квартир найдено</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-2">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Save to favorites */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Сохранить полигон в избранное:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Название полигона..."
            value={polygonName}
            onChange={(e) => setPolygonName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            size="sm"
            variant={saved ? 'secondary' : 'default'}
            className="shrink-0 gap-1.5"
            onClick={handleSave}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
            {saved ? 'Сохранено' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Flats list */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3 pb-4">
          {flats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Нет объектов в выбранной области
            </p>
          ) : (
            flats.map((flat) => (
              <PropertyCard
                key={flat.id}
                flat={flat}
                isSelected={flat.id === selectedFlatId}
                onClick={() => onFlatClick(flat)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
