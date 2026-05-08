import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import {
  DISTRICTS,
  MATERIALS,
  RENOVATIONS,
  formatPrice,
  formatPriceRaw,
  findAnalogs,
  DEMO_FLATS,
} from '@/lib/demoData';
import { Calculator, TrendingUp, Check } from 'lucide-react';
import AnalogSlider from './AnalogSlider';

// Step loader component
const STEPS = [
  { label: 'Анализируем параметры квартиры', duration: 800 },
  { label: 'Ищем объявления и сделки похожих квартир', duration: 1200 },
  { label: 'Считаем и уточняем оценку', duration: 1000 },
];

function StepLoader({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    runStep(0);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  function runStep(idx) {
    if (idx >= STEPS.length) {
      onDone();
      return;
    }
    setStepIndex(idx);
    setStepProgress(0);
    const duration = STEPS[idx].duration;
    const start = Date.now();

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setStepProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        timerRef.current = setTimeout(() => runStep(idx + 1), 80);
      }
    }, 30);
  }

  return (
    <div className="py-6 px-2">
      <h3 className="text-xl font-bold text-foreground mb-6">Расcчитываем оценку</h3>
      <div className="space-y-5">
        {STEPS.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isActive = idx === stepIndex;
          const progress = isActive ? Math.round(stepProgress) : isDone ? 100 : 0;

          return (
            <div key={idx} className="flex items-center gap-4">
              {/* Circle indicator */}
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  {/* Track */}
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  {/* Progress */}
                  {(isActive || isDone) && (
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={isDone ? '#111827' : '#111827'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                    />
                  )}
                </svg>
                {/* Inner content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isDone ? (
                    <Check className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                  ) : isActive ? (
                    <span className="text-xs font-semibold text-foreground">{progress}%</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>
              {/* Label */}
              <span
                className={`text-sm ${isDone ? 'text-muted-foreground' : isActive ? 'text-foreground font-medium' : 'text-muted-foreground/40'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ValuationModal({ open, onClose }) {
  const [params, setParams] = useState({
    rooms: 2,
    area: 55,
    kitchen_area: 10,
    floor: 5,
    total_floors: 12,
    district: 'Центр',
    material: 'monolith',
    renovation: 'cosmetic',
    balcony: true,
    year_built: 2018,
    nearest_metro: 'Площадь 1905 года',
    metro_distance_min: 10,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleEvaluate = () => {
    setLoading(true);
    setResult(null);
  };

  const handleLoadingDone = () => {
    const basePricePerSqm =
      params.district === 'Центр'
        ? 130000
        : params.district === 'Верх-Исетский'
          ? 110000
          : params.district === 'ВИЗ'
            ? 105000
            : 85000;
    const adjustedPrice =
      basePricePerSqm *
      (params.renovation === 'euro'
        ? 1.15
        : params.renovation === 'designer'
          ? 1.25
          : params.renovation === 'cosmetic'
            ? 1.05
            : 0.95) *
      (params.material === 'monolith_brick'
        ? 1.1
        : params.material === 'brick'
          ? 1.05
          : params.material === 'monolith'
            ? 1.08
            : 1) *
      (1 - Math.max(0, params.metro_distance_min - 5) * 0.005);
    const predictedPrice = Math.round(params.area * adjustedPrice);
    const pricePerSqm = Math.round(adjustedPrice);

    const fakeFlat = {
      ...params,
      id: 'eval',
      price: predictedPrice,
      predicted_price: predictedPrice,
      price_per_sqm: pricePerSqm,
      address: `${params.district}, ${params.rooms}-комн.`,
      lat: 56.838,
      lng: 60.597,
      source: 'cian',
    };

    const analogs = findAnalogs(fakeFlat, DEMO_FLATS, 6);

    setResult({
      predictedPrice,
      pricePerSqm,
      analogs,
      avgAnalogPrice:
        analogs.length > 0
          ? Math.round(analogs.reduce((s, a) => s + a.price, 0) / analogs.length)
          : 0,
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Оценка стоимости
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <StepLoader onDone={handleLoadingDone} />
        ) : result ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">Прогнозная стоимость</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(result.predictedPrice)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPriceRaw(result.pricePerSqm)}/м²
                </p>
                {result.avgAnalogPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Средняя цена аналогов: {formatPrice(result.avgAnalogPrice)}
                  </p>
                )}
              </div>
              <AnalogSlider analogs={result.analogs} />
            </div>
            <div className="shrink-0 pt-3 border-t border-border mt-3">
              <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
                Изменить параметры
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Section: Required */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Обязательные поля
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                    Нужны для расчёта
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrap label="Комнат" required>
                    <Select
                      value={String(params.rooms)}
                      onValueChange={(v) => updateParam('rooms', Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Общая площадь (м²)" required>
                    <Input
                      type="number"
                      value={params.area}
                      onChange={(e) => updateParam('area', Number(e.target.value))}
                    />
                  </FieldWrap>
                  <FieldWrap label="Район" required>
                    <Select
                      value={params.district}
                      onValueChange={(v) => updateParam('district', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Этаж" required>
                    <Input
                      type="number"
                      value={params.floor}
                      onChange={(e) => updateParam('floor', Number(e.target.value))}
                    />
                  </FieldWrap>
                  <FieldWrap label="Этажность дома" required>
                    <Input
                      type="number"
                      value={params.total_floors}
                      onChange={(e) => updateParam('total_floors', Number(e.target.value))}
                    />
                  </FieldWrap>
                  <FieldWrap label="Расстояние до метро (мин)" required>
                    <Input
                      type="number"
                      value={params.metro_distance_min}
                      onChange={(e) => updateParam('metro_distance_min', Number(e.target.value))}
                    />
                  </FieldWrap>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Section: Optional */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Дополнительные поля
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                    Повышают точность
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrap label="Материал дома">
                    <Select
                      value={params.material}
                      onValueChange={(v) => updateParam('material', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MATERIALS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Ремонт">
                    <Select
                      value={params.renovation}
                      onValueChange={(v) => updateParam('renovation', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RENOVATIONS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Площадь кухни (м²)">
                    <Input
                      type="number"
                      value={params.kitchen_area}
                      onChange={(e) => updateParam('kitchen_area', Number(e.target.value))}
                    />
                  </FieldWrap>
                  <FieldWrap label="Год постройки">
                    <Input
                      type="number"
                      value={params.year_built}
                      onChange={(e) => updateParam('year_built', Number(e.target.value))}
                    />
                  </FieldWrap>
                  <div className="flex items-center gap-3 col-span-2 pt-1">
                    <Switch
                      checked={params.balcony}
                      onCheckedChange={(v) => updateParam('balcony', v)}
                    />
                    <Label className="text-sm text-muted-foreground">Балкон</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-3 border-t border-border mt-3">
              <Button
                onClick={handleEvaluate}
                className="w-full bg-primary hover:bg-primary/90 h-11 text-base font-semibold"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Рассчитать оценку
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldWrap({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Label className="text-xs">{label}</Label>
        {required && <span className="text-primary text-xs leading-none">*</span>}
      </div>
      {children}
    </div>
  );
}
