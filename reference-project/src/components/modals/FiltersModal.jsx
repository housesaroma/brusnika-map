import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DISTRICTS, MATERIALS, RENOVATIONS } from '@/lib/demoData';
import { Filter, Search, Save, RotateCcw } from 'lucide-react';

const defaultFilters = {
  rooms_min: '',
  rooms_max: '',
  area_min: '',
  area_max: '',
  price_min: '',
  price_max: '',
  floor_min: '',
  floor_max: '',
  district: 'all',
  material: 'all',
  renovation: 'all',
};

export default function FiltersModal({ open, onClose, onApply, onSave, currentFilters }) {
  const [filters, setFilters] = useState(currentFilters || defaultFilters);

  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => setFilters(defaultFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleSave = () => {
    if (onSave) onSave(filters);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Фильтры
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Комнат от</Label>
              <Input
                type="number"
                placeholder="1"
                value={filters.rooms_min}
                onChange={(e) => update('rooms_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Комнат до</Label>
              <Input
                type="number"
                placeholder="5"
                value={filters.rooms_max}
                onChange={(e) => update('rooms_max', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Площадь от (м²)</Label>
              <Input
                type="number"
                placeholder="20"
                value={filters.area_min}
                onChange={(e) => update('area_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Площадь до (м²)</Label>
              <Input
                type="number"
                placeholder="200"
                value={filters.area_max}
                onChange={(e) => update('area_max', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Цена от (₽)</Label>
              <Input
                type="number"
                placeholder="1 000 000"
                value={filters.price_min}
                onChange={(e) => update('price_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Цена до (₽)</Label>
              <Input
                type="number"
                placeholder="20 000 000"
                value={filters.price_max}
                onChange={(e) => update('price_max', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Этаж от</Label>
              <Input
                type="number"
                placeholder="1"
                value={filters.floor_min}
                onChange={(e) => update('floor_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Этаж до</Label>
              <Input
                type="number"
                placeholder="25"
                value={filters.floor_max}
                onChange={(e) => update('floor_max', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Район</Label>
            <Select value={filters.district} onValueChange={(v) => update('district', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все районы</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Материал</Label>
              <Select value={filters.material} onValueChange={(v) => update('material', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любой</SelectItem>
                  {Object.entries(MATERIALS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ремонт</Label>
              <Select value={filters.renovation} onValueChange={(v) => update('renovation', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любой</SelectItem>
                  {Object.entries(RENOVATIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 mt-4 pt-4 border-t border-border flex gap-2">
          <Button variant="ghost" onClick={handleReset} className="mr-auto">
            <RotateCcw className="w-4 h-4 mr-1" /> Сбросить
          </Button>
          {onSave && (
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Сохранить
            </Button>
          )}
          <Button onClick={handleApply} className="bg-primary hover:bg-primary/90">
            <Search className="w-4 h-4 mr-1" /> Поиск
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
