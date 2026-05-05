import React, { useState } from 'react';
import { Building2, Calculator, Filter, Flame, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const HEATMAP_MODES = [
  { id: 'price', label: 'По цене м²' },
  { id: 'count', label: 'По кол-ву объявлений' },
  { id: 'year', label: 'По году постройки' },
  { id: 'metro', label: 'По близости к метро' },
];

export default function LeftNavPanel({
  onValuation,
  onFilters,
  onToggleHeatmap,
  heatMode,
  hasActiveFilters,
  totalFlats,
}) {
  const [showHeatmapMenu, setShowHeatmapMenu] = useState(false);

  const handleHeatmapMode = (mode) => {
    onToggleHeatmap(mode);
    setShowHeatmapMenu(false);
  };

  const handleHeatmapClick = () => {
    if (heatMode) {
      onToggleHeatmap(null);
      setShowHeatmapMenu(false);
    } else {
      setShowHeatmapMenu(v => !v);
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-[220px] z-10 bg-card/95 backdrop-blur-md border-r border-border shadow-xl flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground leading-tight">Оценка квартир</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              Екатеринбург
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs font-medium w-full justify-center py-1">
            {totalFlats} объектов на карте
          </Badge>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem
          icon={<Calculator className="w-4 h-4" />}
          label="Оценка стоимости"
          description="Прогноз цены по параметрам"
          onClick={onValuation}
        />
        <NavItem
          icon={<Filter className="w-4 h-4" />}
          label="Фильтры"
          description="Поиск квартир на карте"
          onClick={onFilters}
          active={hasActiveFilters}
          badge={hasActiveFilters ? 'Активны' : null}
        />

        {/* Heatmap with submenu */}
        <div>
          <button
            onClick={handleHeatmapClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left group ${
              heatMode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <div className={`shrink-0 ${heatMode ? 'text-primary-foreground' : 'text-primary'}`}>
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium truncate">Тепловая карта</span>
                {!heatMode && <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${showHeatmapMenu ? 'rotate-90' : ''}`} />}
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${heatMode ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {heatMode ? HEATMAP_MODES.find(m => m.id === heatMode)?.label : 'Выберите параметр'}
              </p>
            </div>
          </button>

          {showHeatmapMenu && !heatMode && (
            <div className="mt-1 ml-2 space-y-0.5 bg-muted/50 rounded-xl p-1.5 border border-border">
              {HEATMAP_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleHeatmapMode(mode.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-card transition-colors text-foreground"
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">ООО Брусника · 2026</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, description, onClick, active, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left group ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'hover:bg-muted text-foreground'
      }`}
    >
      <div className={`shrink-0 ${active ? 'text-primary-foreground' : 'text-primary'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium truncate">{label}</span>
          {badge && (
            <span className="text-[10px] bg-primary-foreground/20 rounded-full px-1.5 py-0.5 font-medium shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </div>
    </button>
  );
}