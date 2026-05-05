import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TopBar({ totalFlats, city }) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-md rounded-2xl shadow-lg border border-border px-5 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-foreground leading-tight">Оценка квартир</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {city || 'Екатеринбург'}
          </p>
        </div>
      </div>
      <Badge variant="secondary" className="text-xs font-medium">
        {totalFlats} объектов
      </Badge>
    </div>
  );
}