import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  formatPrice,
  formatPriceRaw,
  RENOVATIONS,
  MATERIALS,
  SOURCES,
  findAnalogs,
  DEMO_FLATS,
} from '@/lib/demoData';
import { MapPin, Layers, Maximize2, Train, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import AnalogSlider from './AnalogSlider';

export default function PropertyDetailModal({ flat, open, onClose }) {
  if (!flat) return null;

  const analogs = findAnalogs(flat, DEMO_FLATS, 6);
  const priceDiff = flat.predicted_price - flat.price;
  const priceDiffPercent = ((priceDiff / flat.price) * 100).toFixed(1);
  const isOverpriced = priceDiff < 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold">Детализация квартиры</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* Address and badges */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {flat.address}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{flat.district}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{SOURCES[flat.source] || flat.source}</Badge>
              {flat.renovation && flat.renovation !== 'none' && (
                <Badge variant="outline">{RENOVATIONS[flat.renovation]}</Badge>
              )}
            </div>
          </div>

          {/* Price comparison block */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Текущая цена</p>
              <p className="text-2xl font-bold text-foreground">{formatPrice(flat.price)}</p>
              <p className="text-xs text-muted-foreground">
                {formatPriceRaw(flat.price_per_sqm)}/м²
              </p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Прогнозная оценка</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(flat.predicted_price)}</p>
              <div className="flex items-center gap-1 mt-1">
                {isOverpriced ? (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                )}
                <span
                  className={`text-xs font-medium ${isOverpriced ? 'text-destructive' : 'text-green-600'}`}
                >
                  {isOverpriced ? '' : '+'}
                  {priceDiffPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Parameters grid */}
          <div className="grid grid-cols-3 gap-3">
            <ParamCell
              icon={<Maximize2 className="w-4 h-4" />}
              label="Площадь"
              value={`${flat.area} м²`}
            />
            <ParamCell
              icon={<Layers className="w-4 h-4" />}
              label="Этаж"
              value={`${flat.floor} / ${flat.total_floors}`}
            />
            <ParamCell label="Комнат" value={flat.rooms} />
            <ParamCell label="Кухня" value={`${flat.kitchen_area} м²`} />
            <ParamCell
              icon={<Train className="w-4 h-4" />}
              label="Метро"
              value={`${flat.nearest_metro} (${flat.metro_distance_min} мин)`}
            />
            <ParamCell
              icon={<Calendar className="w-4 h-4" />}
              label="Год постройки"
              value={flat.year_built}
            />
            <ParamCell label="Материал" value={MATERIALS[flat.material] || flat.material} />
            <ParamCell label="Балкон" value={flat.balcony ? 'Есть' : 'Нет'} />
          </div>

          {/* Analogs — горизонтальный скролл внутри */}
          <AnalogSlider analogs={analogs} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParamCell({ icon, label, value }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
