import React, { useRef } from 'react';
import { formatPrice, RENOVATIONS, MATERIALS } from '@/lib/demoData';
import { ChevronLeft, ChevronRight, MapPin, Layers, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AnalogSlider({ analogs }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' });
    }
  };

  if (!analogs || analogs.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-foreground">Аналоги ({analogs.length})</h4>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scroll(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {analogs.map((flat, idx) => (
          <div
            key={flat.id || idx}
            className="min-w-[240px] max-w-[240px] border border-border rounded-xl p-3 bg-muted/30 hover:bg-muted/60 transition-colors shrink-0"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-sm">{flat.rooms}-комн. · {flat.area} м²</p>
              {flat.similarity && (
                <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                  {Math.round(flat.similarity * 100)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{flat.address}</span>
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" />{flat.floor}/{flat.total_floors}</span>
              <span>·</span>
              <span>{MATERIALS[flat.material] || flat.material}</span>
            </div>
            <p className="font-bold text-primary text-sm">{formatPrice(flat.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Intl.NumberFormat('ru-RU').format(flat.price_per_sqm)} ₽/м²
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}