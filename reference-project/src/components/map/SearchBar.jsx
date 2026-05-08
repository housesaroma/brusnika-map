import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Екатеринбург')}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'ru' } });
      const data = await res.json();
      if (data.length > 0) {
        onSearch({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name,
        });
      } else {
        alert('Объект не найден. Уточните запрос.');
      }
    } catch {
      alert('Ошибка поиска.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 px-3 py-2 w-[420px] max-w-[90vw]">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Поиск адреса или объекта..."
        className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Показать'}
      </button>
    </div>
  );
}
