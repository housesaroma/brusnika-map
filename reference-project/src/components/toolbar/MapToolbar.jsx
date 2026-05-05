import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, Filter, Star, Pencil, Flame, X } from 'lucide-react';

export default function MapToolbar({
  onValuation,
  onFilters,
  onFavorites,
  onToggleDrawing,
  onToggleHeatmap,
  isDrawing,
  isHeatmap,
  hasActiveFilters,
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <ToolbarButton icon={<Calculator className="w-5 h-5" />} label="Оценка стоимости" onClick={onValuation} />
        <ToolbarButton
          icon={<Filter className="w-5 h-5" />}
          label="Фильтры"
          onClick={onFilters}
          active={hasActiveFilters}
        />
        <ToolbarButton icon={<Star className="w-5 h-5" />} label="Избранное" onClick={onFavorites} />
        <ToolbarButton
          icon={isDrawing ? <X className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
          label={isDrawing ? 'Отменить рисование' : 'Нарисовать полигон'}
          onClick={onToggleDrawing}
          active={isDrawing}
        />
        <ToolbarButton
          icon={<Flame className="w-5 h-5" />}
          label="Тепловая карта"
          onClick={onToggleHeatmap}
          active={isHeatmap}
        />
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({ icon, label, onClick, active }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'secondary'}
          size="icon"
          onClick={onClick}
          className={`w-11 h-11 rounded-xl shadow-lg ${
            active
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-card/90 backdrop-blur-sm hover:bg-card text-foreground'
          }`}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}