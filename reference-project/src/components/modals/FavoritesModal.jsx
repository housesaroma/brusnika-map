import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Trash2, MapPin, Filter as FilterIcon, Pencil, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function FavoritesModal({ open, onClose, favorites, onSelect, onDelete, onRename }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary fill-primary" />
            Избранные настройки
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Нет сохранённых конфигураций</p>
              <p className="text-xs mt-1">Сохраните фильтры или полигон, чтобы они появились здесь</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {favorites.map(fav => (
                <FavoriteCard
                  key={fav.id}
                  fav={fav}
                  onSelect={() => { onSelect(fav); onClose(); }}
                  onDelete={() => onDelete(fav.id)}
                  onRename={(name) => onRename(fav.id, name)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FavoriteCard({ fav, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(fav.name);

  const hasPolygon = fav.geo_points && fav.geo_points.length > 0;
  const hasFilters = fav.filters && Object.values(fav.filters).some(v => v && v !== 'all');

  const handleSaveName = () => {
    onRename(name);
    setEditing(false);
  };

  return (
    <div className="border border-border rounded-xl p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        {editing ? (
          <div className="flex items-center gap-1 flex-1 mr-2">
            <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm" autoFocus />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveName}>
              <Check className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate">{fav.name}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" />
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {hasPolygon && <Badge variant="secondary" className="text-[10px]"><MapPin className="w-3 h-3 mr-0.5" />Полигон</Badge>}
        {hasFilters && <Badge variant="secondary" className="text-[10px]"><FilterIcon className="w-3 h-3 mr-0.5" />Фильтры</Badge>}
      </div>

      <Button variant="outline" size="sm" className="w-full text-xs" onClick={onSelect}>
        Применить
      </Button>
    </div>
  );
}